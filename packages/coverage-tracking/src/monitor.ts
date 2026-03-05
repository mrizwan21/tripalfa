import * as fs from 'fs';
import * as path from 'path';
import {
  CoverageConfig,
  CoverageReport,
  RegressionDetected,
  ServiceCoverage,
  CoverageMetric,
} from './types.js';

/**
 * Coverage Monitoring Utilities
 * Tracks coverage changes and detects regressions
 */

export class CoverageMonitor {
  private config: CoverageConfig;
  private baselineFile: string;

  constructor(config: CoverageConfig) {
    this.config = config;
    this.baselineFile = path.join(config.outputDir, 'baseline-coverage.json');
  }

  /**
   * Load baseline coverage data
   */
  async loadBaseline(): Promise<ServiceCoverage[]> {
    try {
      const data = await fs.promises.readFile(this.baselineFile, 'utf-8');
      const parsed = JSON.parse(data);
      return parsed.map((sc: ServiceCoverage) => ({
        ...sc,
        timestamp: new Date(sc.timestamp),
      }));
    } catch {
      console.warn('⚠️  No baseline coverage found, creating new one');
      return [];
    }
  }

  /**
   * Save current coverage as baseline
   */
  async saveBaseline(coverage: ServiceCoverage[]): Promise<void> {
    await fs.promises.mkdir(this.config.outputDir, { recursive: true });
    await fs.promises.writeFile(
      this.baselineFile,
      JSON.stringify(coverage, null, 2),
    );
  }

  /**
   * Calculate coverage metrics with baseline comparison
   */
  calculateMetric(
    current: number,
    baseline: number | undefined,
  ): CoverageMetric {
    const difference = baseline !== undefined ? current - baseline : 0;
    let trend: 'improved' | 'degraded' | 'stable';

    if (difference > 0.5) {
      trend = 'improved';
    } else if (difference < -0.5) {
      trend = 'degraded';
    } else {
      trend = 'stable';
    }

    return {
      current,
      baseline: baseline || current,
      difference,
      trend,
    };
  }

  /**
   * Detect coverage regressions
   */
  detectRegressions(
    current: ServiceCoverage[],
    baseline: ServiceCoverage[],
  ): RegressionDetected[] {
    const regressions: RegressionDetected[] = [];

    for (const currentService of current) {
      const baselineService = baseline.find((b) => b.serviceName === currentService.serviceName);
      if (!baselineService) continue;

      const metrics = ['statements', 'branches', 'functions', 'lines'] as const;

      for (const metric of metrics) {
        const baselineValue = baselineService.summary[metric];
        const currentValue = currentService.summary[metric];
        const difference = currentValue - baselineValue;

        // Check if regression exceeds threshold
        if (Math.abs(difference) > (this.config.regressionThreshold || 0)) {
          if (difference < 0) {
            const severity = Math.abs(difference) > 5 ? 'critical' : Math.abs(difference) > 3 ? 'high' : 'medium';

            regressions.push({
              service: currentService.serviceName,
              file: 'summary',
              metric,
              baseline: baselineValue,
              current: currentValue,
              difference,
              severity: severity as 'critical' | 'high' | 'medium' | 'low',
            });
          }
        }
      }

      // Check file-level regressions
      for (const currentFile of currentService.files) {
        const baselineFile = baselineService.files.find((f) => f.file === currentFile.file);
        if (!baselineFile) continue;

        const metrics = ['statements', 'branches', 'functions', 'lines'] as const;

        for (const metric of metrics) {
          const difference = currentFile[metric].current - baselineFile[metric].current;

          if (Math.abs(difference) > 5) {
            // 5% threshold for individual files
            const severity = Math.abs(difference) > 20 ? 'critical' : Math.abs(difference) > 10 ? 'high' : 'medium';

            regressions.push({
              service: currentService.serviceName,
              file: currentFile.file,
              metric,
              baseline: baselineFile[metric].current,
              current: currentFile[metric].current,
              difference,
              severity: severity as 'critical' | 'high' | 'medium' | 'low',
            });
          }
        }
      }
    }

    return regressions;
  }

  /**
   * Validate against thresholds
   */
  validateThresholds(coverage: ServiceCoverage[]): string[] {
    const recommendations: string[] = [];

    for (const service of coverage) {
      const threshold = this.config.thresholds[service.serviceName];
      if (!threshold) continue;

      const metrics = ['statements', 'branches', 'functions', 'lines'] as const;

      for (const metric of metrics) {
        const current = service.summary[metric];
        const required = threshold[metric];
        const allowed = threshold.allowedDegradation || 0;

        if (current < required - allowed) {
          const icon = current < required - 5 ? '🔴' : current < required - 2 ? '🟠' : '🟡';
          recommendations.push(
            `${icon} ${service.serviceName}: ${metric} coverage is ${current.toFixed(1)}% (threshold: ${required}%)`,
          );
        }
      }
    }

    return recommendations;
  }

  /**
   * Generate comprehensive coverage report
   */
  async generateReport(
    current: ServiceCoverage[],
    baseline: ServiceCoverage[] = [],
  ): Promise<CoverageReport> {
    const regressions = this.detectRegressions(current, baseline);
    const recommendations = this.validateThresholds(current);

    const hasCritical = regressions.some((r) => r.severity === 'critical');
    const hasHigh = regressions.some((r) => r.severity === 'high');

    const status: 'passing' | 'warning' | 'critical' = hasCritical
      ? 'critical'
      : hasHigh || recommendations.length > 3
        ? 'warning'
        : 'passing';

    const report: CoverageReport = {
      timestamp: new Date(),
      services: current,
      regressions,
      recommendations,
      status,
    };

    return report;
  }

  /**
   * Format report for display
   */
  formatReport(report: CoverageReport): string {
    let output = '\n📊 COVERAGE TRACKING REPORT\n';
    output += `📅 ${report.timestamp.toISOString()}\n`;
    output += `Status: ${report.status === 'passing' ? '✅ PASSING' : report.status === 'warning' ? '⚠️  WARNING' : '🔴 CRITICAL'}\n\n`;

    output += '📈 SERVICE COVERAGE SUMMARY\n';
    output += '─'.repeat(80) + '\n';

    for (const service of report.services) {
      output += `\n${service.serviceName}\n`;
      output += `  Statements: ${service.summary.statements.toFixed(1)}%\n`;
      output += `  Branches:   ${service.summary.branches.toFixed(1)}%\n`;
      output += `  Functions:  ${service.summary.functions.toFixed(1)}%\n`;
      output += `  Lines:      ${service.summary.lines.toFixed(1)}%\n`;
    }

    if (report.regressions.length > 0) {
      output += '\n⚠️  REGRESSIONS DETECTED\n';
      output += '─'.repeat(80) + '\n';

      const byService: Record<string, RegressionDetected[]> = {};
      for (const reg of report.regressions) {
        if (!byService[reg.service]) byService[reg.service] = [];
        byService[reg.service].push(reg);
      }

      for (const [service, regs] of Object.entries(byService)) {
        output += `\n${service}\n`;
        for (const reg of regs) {
          const icon =
            reg.severity === 'critical' ? '🔴' : reg.severity === 'high' ? '🟠' : '🟡';
          output += `  ${icon} ${reg.metric}: ${reg.baseline.toFixed(1)}% → ${reg.current.toFixed(1)}% (${reg.difference > 0 ? '+' : ''}${reg.difference.toFixed(1)}%)\n`;
        }
      }
    } else {
      output += '\n✨ No regressions detected!\n\n';
    }

    if (report.recommendations.length > 0) {
      output += '💡 RECOMMENDATIONS\n';
      output += '─'.repeat(80) + '\n';
      for (const rec of report.recommendations) {
        output += `${rec}\n`;
      }
      output += '\n';
    }

    return output;
  }
}

/**
 * Coverage statistics utilities
 */
export class CoverageStats {
  static calculateAverage(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  static getLowest(coverage: ServiceCoverage[], metric: 'statements' | 'branches' | 'functions' | 'lines'): {
    service: string;
    value: number;
  } {
    let lowest = { service: '', value: 100 };

    for (const service of coverage) {
      if (service.summary[metric] < lowest.value) {
        lowest = { service: service.serviceName, value: service.summary[metric] };
      }
    }

    return lowest;
  }

  static getHighest(coverage: ServiceCoverage[], metric: 'statements' | 'branches' | 'functions' | 'lines'): {
    service: string;
    value: number;
  } {
    let highest = { service: '', value: 0 };

    for (const service of coverage) {
      if (service.summary[metric] > highest.value) {
        highest = { service: service.serviceName, value: service.summary[metric] };
      }
    }

    return highest;
  }

  static getOverallCoverage(coverage: ServiceCoverage[], metric: 'statements' | 'branches' | 'functions' | 'lines'): number {
    const values = coverage.map((s) => s.summary[metric]);
    return this.calculateAverage(values);
  }
}
