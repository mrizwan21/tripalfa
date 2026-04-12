import { BenchmarkResult, PerformanceReport, RegressionDetected, PerformanceConfig } from '../types.js';

/**
 * Performance Monitoring Utilities
 * Tracks, compares, and detects regressions
 */

export class PerformanceMonitor {
  private baselineFile: string;
  private config: PerformanceConfig;

  constructor(config: PerformanceConfig) {
    this.config = config;
    this.baselineFile = `${config.outputDir}/baseline.json`;
  }

  /**
   * Load baseline results from file
   */
  async loadBaseline(): Promise<BenchmarkResult[]> {
    try {
      const fs = await import('fs').then((m) => m.promises);
      const data = await fs.readFile(this.baselineFile, 'utf-8');
      return JSON.parse(data);
    } catch {
      console.warn('No baseline found, creating new one');
      return [];
    }
  }

  /**
   * Save current results as baseline
   */
  async saveBaseline(results: BenchmarkResult[]): Promise<void> {
    const fs = await import('fs').then((m) => m.promises);
    const path = await import('path');

    const dir = path.dirname(this.baselineFile);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.baselineFile, JSON.stringify(results, null, 2));
  }

  /**
   * Detect performance regressions
   */
  detectRegressions(baseline: BenchmarkResult[], current: BenchmarkResult[]): RegressionDetected[] {
    const regressions: RegressionDetected[] = [];

    for (const currentBench of current) {
      const baseBench = baseline.find((b: BenchmarkResult) => b.name === currentBench.name);
      if (!baseBench) {
        continue;
      }

      const percentageChange = ((baseBench.mean - currentBench.mean) / baseBench.mean) * 100;

      // Negative percentage means current is slower (regression)
      if (percentageChange < -this.config.regressionThreshold) {
        const severity =
          Math.abs(percentageChange) > 30 ? 'critical' : Math.abs(percentageChange) > 20 ? 'high' : 'medium';

        const regression: RegressionDetected = {
          benchmark: currentBench.name,
          metric: 'mean_time',
          baseline: baseBench.mean,
          current: currentBench.mean,
          percentageChange,
          severity: severity as 'critical' | 'high' | 'medium',
        };

        regressions.push(regression);
      }
    }

    return regressions;
  }

  /**
   * Compare benchmarks with thresholds
   */
  validateThresholds(results: BenchmarkResult[]): string[] {
    const recommendations: string[] = [];

    for (const result of results) {
      const threshold = this.config.thresholds[result.name];
      if (!threshold) continue;

      if (threshold.maxMs && result.mean > threshold.maxMs) {
        recommendations.push(
          `⚠️ ${result.name}: avg ${result.mean.toFixed(2)}ms exceeds threshold ${threshold.maxMs}ms`,
        );
      }

      if (threshold.expectedMs && Math.abs(result.mean - threshold.expectedMs) > (threshold.allowedDeviation || 5)) {
        recommendations.push(
          `⚠️ ${result.name}: avg ${result.mean.toFixed(2)}ms deviates from expected ${threshold.expectedMs}ms (±${threshold.allowedDeviation || 5}%)`,
        );
      }

      if (result.stdDev > result.mean * 0.5) {
        recommendations.push(
          `⚠️ ${result.name}: high variance detected (stdDev ${result.stdDev.toFixed(2)}ms). Consider investigating or increasing sample size.`,
        );
      }
    }

    return recommendations;
  }

  /**
   * Generate comprehensive report
   */
  async generateReport(
    results: BenchmarkResult[],
    baseline: BenchmarkResult[] = [],
  ): Promise<PerformanceReport> {
    const regressions = this.detectRegressions(baseline, results);
    const recommendations = this.validateThresholds(results);

    const report: PerformanceReport = {
      timestamp: new Date(),
      duration: results.reduce((sum, r) => sum + (r.mean * r.samples) / 1000, 0), // rough duration
      benchmarks: results,
      regressions,
      recommendations,
    };

    return report;
  }

  /**
   * Format report for display
   */
  formatReport(report: PerformanceReport): string {
    let output = '\n📊 PERFORMANCE BENCHMARK REPORT\n';
    output += `📅 ${report.timestamp.toISOString()}\n`;
    output += `⏱️  Total Duration: ${report.duration.toFixed(2)}s\n\n`;

    output += '✅ BENCHMARK RESULTS\n';
    output += '─'.repeat(60) + '\n';

    for (const bench of report.benchmarks) {
      output += `${bench.name}\n`;
      output += `  Mean:      ${bench.mean.toFixed(2)}ms\n`;
      output += `  Median:    ${bench.median.toFixed(2)}ms\n`;
      output += `  Min/Max:   ${bench.min.toFixed(2)}ms / ${bench.max.toFixed(2)}ms\n`;
      output += `  StdDev:    ${bench.stdDev.toFixed(2)}ms\n`;
      output += `  Ops/sec:   ${bench.hz.toFixed(0)}\n`;
      output += `  Samples:   ${bench.samples}\n\n`;
    }

    if (report.regressions.length > 0) {
      output += '⚠️  REGRESSIONS DETECTED\n';
      output += '─'.repeat(60) + '\n';

      for (const regression of report.regressions) {
        const icon = regression.severity === 'critical' ? '🔴' : regression.severity === 'high' ? '🟠' : '🟡';
        output += `${icon} ${regression.benchmark}\n`;
        output += `  Baseline: ${regression.baseline.toFixed(2)}ms\n`;
        output += `  Current:  ${regression.current.toFixed(2)}ms\n`;
        output += `  Change:   ${regression.percentageChange > 0 ? '+' : ''}${regression.percentageChange.toFixed(2)}%\n\n`;
      }
    } else {
      output += '✨ No regressions detected!\n\n';
    }

    if (report.recommendations.length > 0) {
      output += '💡 RECOMMENDATIONS\n';
      output += '─'.repeat(60) + '\n';
      for (const rec of report.recommendations) {
        output += `${rec}\n`;
      }
      output += '\n';
    }

    return output;
  }
}

/**
 * Statistical utilities for benchmark analysis
 */
class BenchmarkStats {
  static calculateMean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  static calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  static calculateStdDev(values: number[], mean: number): number {
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  static calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
}
