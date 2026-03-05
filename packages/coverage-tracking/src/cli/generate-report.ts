import * as fs from 'fs';
import * as path from 'path';
import { CoverageMonitor, CoverageStats } from '../monitor.js';
import {
  DEFAULT_COVERAGE_CONFIG,
  ServiceCoverage,
  CoverageReport,
} from '../types.js';

/**
 * CLI for generating coverage reports
 * Usage: tsx src/cli/generate-report.ts [options]
 */

interface CliOptions {
  baseline?: boolean;
  compare?: boolean;
  strict?: boolean;
  format?: 'json' | 'markdown' | 'console';
  output?: string;
}

/**
 * Parse command-line arguments
 */
function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = { format: 'console' };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--baseline':
        options.baseline = true;
        break;
      case '--compare':
        options.compare = true;
        break;
      case '--strict':
        options.strict = true;
        break;
      case '--format':
        options.format = (args[++i] as any) || 'console';
        break;
      case '--output':
        options.output = args[++i];
        break;
    }
  }

  return options;
}

/**
 * Load coverage data from reports
 */
function loadCoverageData(filePath: string): ServiceCoverage[] | null {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed)
      ? parsed.map((sc: any) => ({
          ...sc,
          timestamp: new Date(sc.timestamp),
        }))
      : parsed.services
        ? parsed.services.map((sc: any) => ({
            ...sc,
            timestamp: new Date(sc.timestamp),
          }))
        : null;
  } catch {
    return null;
  }
}

/**
 * Save coverage report to file
 */
function saveReport(report: CoverageReport, filePath: string, format: 'json' | 'markdown'): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (format === 'json') {
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
  } else if (format === 'markdown') {
    const markdown = generateMarkdownReport(report);
    fs.writeFileSync(filePath, markdown);
  }

  console.log(`✅ Report saved to ${filePath}`);
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(report: CoverageReport): string {
  let md = '# Coverage Tracking Report\n\n';
  md += `**Generated:** ${report.timestamp.toISOString()}\n`;
  md += `**Status:** ${report.status.toUpperCase()}\n\n`;

  md += '## Summary\n\n';
  md += `- **Services:** ${report.services.length}\n`;
  md += `- **Regressions:** ${report.regressions.length}\n`;
  md += `- **Recommendations:** ${report.recommendations.length}\n\n`;

  md += '## Coverage by Service\n\n';
  md += '| Service | Statements | Branches | Functions | Lines |\n';
  md += '|---------|------------|----------|-----------|-------|\n';

  for (const service of report.services) {
    md += `| ${service.serviceName} | ${service.summary.statements.toFixed(1)}% | ${service.summary.branches.toFixed(1)}% | ${service.summary.functions.toFixed(1)}% | ${service.summary.lines.toFixed(1)}% |\n`;
  }
  md += '\n';

  if (report.regressions.length > 0) {
    md += '## Regressions Detected\n\n';
    for (const reg of report.regressions) {
      const icon =
        reg.severity === 'critical' ? '🔴' : reg.severity === 'high' ? '🟠' : '🟡';
      md += `### ${icon} ${reg.service} - ${reg.metric}\n\n`;
      md += `- **Baseline:** ${reg.baseline.toFixed(1)}%\n`;
      md += `- **Current:** ${reg.current.toFixed(1)}%\n`;
      md += `- **Change:** ${reg.difference > 0 ? '+' : ''}${reg.difference.toFixed(1)}%\n\n`;
    }
  } else {
    md += '## Status\n\n✨ **No regressions detected!**\n\n';
  }

  if (report.recommendations.length > 0) {
    md += '## Recommendations\n\n';
    for (const rec of report.recommendations) {
      md += `- ${rec}\n`;
    }
    md += '\n';
  }

  return md;
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const options = parseArgs();
  const config = DEFAULT_COVERAGE_CONFIG;
  const monitor = new CoverageMonitor(config);

  console.log('📊 Coverage Report Generator\n');

  // Create output directory
  try {
    await fs.promises.mkdir(config.outputDir, { recursive: true });
  } catch {
    // Directory may already exist
  }

  // Try to load current coverage report
  const currentReportPath = path.join(config.outputDir, 'current-coverage.json');
  const currentCoverage = loadCoverageData(currentReportPath);

  if (!currentCoverage || currentCoverage.length === 0) {
    console.error(
      '❌ No coverage data found. Run tests with coverage first:',
    );
    console.error('   npm run coverage');
    process.exit(1);
  }

  console.log(`✅ Loaded coverage data from ${currentReportPath}`);

  // Load baseline if comparing
  let baselineCoverage: ServiceCoverage[] = [];
  if (options.compare || options.baseline) {
    baselineCoverage = await monitor.loadBaseline();
    if (baselineCoverage.length > 0) {
      console.log('✅ Loaded baseline coverage');
    } else if (!options.baseline) {
      console.log(
        'ℹ️  No baseline found, creating baseline from current coverage',
      );
      await monitor.saveBaseline(currentCoverage);
    }
  }

  // Generate report
  const report = await monitor.generateReport(
    currentCoverage,
    baselineCoverage,
  );

  // Output based on format
  const outputFile = options.output || path.join(config.outputDir, 'report');

  if (options.format === 'json') {
    saveReport(report, `${outputFile}.json`, 'json');
  } else if (options.format === 'markdown') {
    saveReport(report, `${outputFile}.md`, 'markdown');
  } else {
    // Console output
    const formatted = monitor.formatReport(report);
    console.log(formatted);

    // Also save markdown version
    saveReport(report, `${outputFile}.md`, 'markdown');
  }

  // If baseline option, save as baseline
  if (options.baseline) {
    await monitor.saveBaseline(currentCoverage);
    console.log('✅ Baseline updated');
  }

  // Print statistics
  console.log('📈 COVERAGE STATISTICS\n');
  const metrics =
    ['statements', 'branches', 'functions', 'lines'] as const;
  for (const metric of metrics) {
    const overall = CoverageStats.getOverallCoverage(currentCoverage, metric);
    const lowest = CoverageStats.getLowest(currentCoverage, metric);
    const highest = CoverageStats.getHighest(currentCoverage, metric);

    console.log(`${metric.toUpperCase()}`);
    console.log(`  Overall: ${overall.toFixed(1)}%`);
    console.log(
      `  Lowest:  ${lowest.service} (${lowest.value.toFixed(1)}%)`,
    );
    console.log(
      `  Highest: ${highest.service} (${highest.value.toFixed(1)}%)\n`,
    );
  }

  // Exit with error if critical regressions
  const criticalRegressions = report.regressions.filter(
    (r) => r.severity === 'critical',
  );
  if ((options.strict || process.env.CI === 'true') && criticalRegressions.length > 0) {
    console.error(`\n🔴 ${criticalRegressions.length} critical regression(s) detected!`);
    process.exit(1);
  }

  if (report.status === 'critical') {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
