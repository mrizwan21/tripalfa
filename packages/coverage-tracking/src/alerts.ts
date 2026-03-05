import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

interface RegressionAlert {
  metric: string;
  baseline: number;
  current: number;
  change: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  threshold: number;
}

const REGRESSION_THRESHOLDS = {
  CRITICAL: 5, // >= 5% drop
  HIGH: 3, // 3-5% drop
  MEDIUM: 1, // 1-3% drop
  LOW: 0, // < 1% drop
};

/**
 * Extract metrics from coverage file
 */
function extractMetrics(
  coverageFilePath: string
): Record<string, number> {
  try {
    const data = JSON.parse(readFileSync(coverageFilePath, 'utf-8'));
    const summary = data.total || {};

    return {
      statements: Math.round(summary.statements?.pct || 0),
      branches: Math.round(summary.branches?.pct || 0),
      functions: Math.round(summary.functions?.pct || 0),
      lines: Math.round(summary.lines?.pct || 0),
    };
  } catch {
    return {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
    };
  }
}

/**
 * Determine alert severity
 */
function getSeverity(change: number): RegressionAlert['severity'] {
  if (change <= -5) return 'CRITICAL';
  if (change <= -3) return 'HIGH';
  if (change <= -1) return 'MEDIUM';
  if (change < 0) return 'LOW';
  return 'NONE';
}

/**
 * Detect coverage regressions
 */
export function detectRegressions(
  baselineFile: string,
  currentFile: string
): RegressionAlert[] {
  const baseline = extractMetrics(baselineFile);
  const current = extractMetrics(currentFile);

  const alerts: RegressionAlert[] = [];

  Object.keys(baseline).forEach((metric) => {
    const baselineValue = baseline[metric];
    const currentValue = current[metric];
    const change = currentValue - baselineValue;

    const severity = getSeverity(change);

    if (severity !== 'NONE') {
      const thresholdValues = Object.values(REGRESSION_THRESHOLDS);
      const threshold = thresholdValues.find((t) => Math.abs(change) >= t) || 0;

      alerts.push({
        metric,
        baseline: baselineValue,
        current: currentValue,
        change,
        severity,
        threshold,
      });
    }
  });

  return alerts;
}

/**
 * Format alert message for console
 */
export function formatConsoleAlert(alert: RegressionAlert): string {
  const icon =
    alert.severity === 'CRITICAL'
      ? '🚨'
      : alert.severity === 'HIGH'
        ? '⚠️'
        : '📊';

  const metricName =
    alert.metric.charAt(0).toUpperCase() + alert.metric.slice(1);

  return `${icon} [${alert.severity}] ${metricName}: ${alert.baseline}% → ${alert.current}% (${alert.change > 0 ? '+' : ''}${alert.change}%)`;
}

/**
 * Generate console alert output
 */
export function generateConsoleAlerts(
  alerts: RegressionAlert[]
): string {
  if (alerts.length === 0) {
    return '✅ No coverage regressions detected!';
  }

  const lines = ['⚠️  COVERAGE REGRESSION ALERTS:\n'];

  // Group by severity
  const bySeverity = {
    CRITICAL: alerts.filter((a) => a.severity === 'CRITICAL'),
    HIGH: alerts.filter((a) => a.severity === 'HIGH'),
    MEDIUM: alerts.filter((a) => a.severity === 'MEDIUM'),
    LOW: alerts.filter((a) => a.severity === 'LOW'),
  };

  Object.entries(bySeverity).forEach(([severity, severityAlerts]) => {
    if (severityAlerts.length > 0) {
      lines.push(`\n${severity}:`);
      severityAlerts.forEach((alert) => {
        lines.push(`  ${formatConsoleAlert(alert)}`);
      });
    }
  });

  lines.push(
    '\n💡 Tip: Add tests to restore coverage or update baselines if intentional.'
  );

  return lines.join('\n');
}

/**
 * Generate GitHub markdown for alerts
 */
export function generateGitHubAlert(
  alerts: RegressionAlert[]
): string | null {
  if (alerts.length === 0) {
    return null;
  }

  const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICAL');
  const highAlerts = alerts.filter((a) => a.severity === 'HIGH');
  const mediumAlerts = alerts.filter((a) => a.severity === 'MEDIUM');

  const lines = [];

  if (criticalAlerts.length > 0) {
    lines.push('## 🚨 CRITICAL: Coverage Regression Detected\n');
    lines.push(
      'The following metrics have dropped more than 5% since the last baseline:\n'
    );
    criticalAlerts.forEach((alert) => {
      lines.push(
        `- **${alert.metric}**: ${alert.baseline}% → ${alert.current}% (${alert.change}%)`
      );
    });
    lines.push(
      '\nPlease address these regressions before merging.\n'
    );
  }

  if (highAlerts.length > 0) {
    lines.push('## ⚠️  Coverage Regression\n');
    lines.push(
      'The following metrics have dropped 3-5% since the last baseline:\n'
    );
    highAlerts.forEach((alert) => {
      lines.push(
        `- **${alert.metric}**: ${alert.baseline}% → ${alert.current}% (${alert.change}%)`
      );
    });
    lines.push(
      '\nConsider adding tests to restore coverage.\n'
    );
  }

  if (mediumAlerts.length > 0) {
    lines.push('## 📊 Minor Coverage Change\n');
    lines.push(
      'The following metrics have minor changes (1-3%) since the last baseline:\n'
    );
    mediumAlerts.forEach((alert) => {
      lines.push(
        `- ${alert.metric}: ${alert.baseline}% → ${alert.current}% (${alert.change}%)`
      );
    });
  }

  return lines.join('\n');
}

/**
 * Generate JSON alert format
 */
export function generateJsonAlerts(alerts: RegressionAlert[]): string {
  return JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      totalAlerts: alerts.length,
      criticalCount: alerts.filter((a) => a.severity === 'CRITICAL').length,
      highCount: alerts.filter((a) => a.severity === 'HIGH').length,
      mediumCount: alerts.filter((a) => a.severity === 'MEDIUM').length,
      lowCount: alerts.filter((a) => a.severity === 'LOW').length,
      alerts: alerts.map((a) => ({
        metric: a.metric,
        baseline: a.baseline,
        current: a.current,
        change: a.change,
        severity: a.severity,
      })),
    },
    null,
    2
  );
}

/**
 * Main: Detect and report regressions
 */
export async function checkAndAlertRegressions(
  baselineFile: string = '../../coverage-results/baseline-coverage.json',
  currentFile: string = '../../coverage/coverage-final.json',
  outputFormat: 'console' | 'github' | 'json' = 'console'
): Promise<void> {
  try {
    const alerts = detectRegressions(baselineFile, currentFile);

    if (outputFormat === 'console') {
      const message = generateConsoleAlerts(alerts);
      console.log(message);

      // Exit with error code if critical alerts
      const criticalCount = alerts.filter(
        (a) => a.severity === 'CRITICAL'
      ).length;
      if (criticalCount > 0) {
        process.exit(1);
      }
    } else if (outputFormat === 'github') {
      const message = generateGitHubAlert(alerts);
      if (message) {
        console.log(message);
      } else {
        console.log('✅ No coverage regressions detected!');
      }
    } else if (outputFormat === 'json') {
      const json = generateJsonAlerts(alerts);
      console.log(json);
    }
  } catch (error) {
    console.error('❌ Error checking regressions:', error);
    process.exit(1);
  }
}

// Slack-style notification format
export function generateSlackMessage(alerts: RegressionAlert[]): {
  text: string;
  attachments: Array<{
    color: string;
    title: string;
    fields: Array<{ title: string; value: string; short: boolean }>;
  }>;
} {
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;

  const color =
    criticalCount > 0 ? '#FF0000' : alerts.length > 0 ? '#FFA500' : '#00DD00';

  const fields = alerts.map((a) => ({
    title: `${a.metric} (${a.severity})`,
    value: `${a.baseline}% → ${a.current}% (${a.change > 0 ? '+' : ''}${a.change}%)`,
    short: true,
  }));

  return {
    text: `Coverage Report: ${alerts.length} regression(s) detected`,
    attachments: [
      {
        color,
        title: 'Coverage Status',
        fields: fields.length > 0 ? fields : [{ title: 'Status', value: 'All green! ✅', short: false }],
      },
    ],
  };
}

if (process.argv[1] === __filename) {
  checkAndAlertRegressions();
}
