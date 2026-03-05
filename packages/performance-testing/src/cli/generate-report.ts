import * as fs from 'fs';
import * as path from 'path';
import { PerformanceMonitor } from '../monitoring/monitor.js';
import { PerformanceConfig, BenchmarkResult, PerformanceReport, DEFAULT_PERF_CONFIG } from '../types.js';

/**
 * CLI for generating performance reports
 * Usage: npx ts-node src/cli/generate-report.ts [options]
 */

const DEFAULT_CONFIG: PerformanceConfig = {
  ...DEFAULT_PERF_CONFIG,
  outputDir: './benchmark-results',
};

interface CliOptions {
  baseline?: string;
  current?: string;
  output?: string;
  format?: 'json' | 'markdown' | 'console';
  compare?: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    format: 'console',
    compare: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--baseline':
        options.baseline = args[++i];
        break;
      case '--current':
        options.current = args[++i];
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--format':
        options.format = (args[++i] as 'json' | 'markdown' | 'console') || 'console';
        break;
      case '--compare':
        options.compare = true;
        break;
    }
  }

  return options;
}

/**
 * Load benchmark results from file
 */
function loadResults(filePath: string): BenchmarkResult[] {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Failed to load results from ${filePath}:`, error);
    process.exit(1);
  }
}

/**
 * Save report to file
 */
function saveReport(report: PerformanceReport, filePath: string, format: 'json' | 'markdown'): void {
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
function generateMarkdownReport(report: PerformanceReport): string {
  let md = '# Performance Benchmark Report\n\n';
  md += `**Generated:** ${report.timestamp.toISOString()}\n\n`;

  md += '## Summary\n\n';
  md += `- **Total Runtime:** ${report.duration.toFixed(2)}s\n`;
  md += `- **Benchmarks Run:** ${report.benchmarks.length}\n`;
  md += `- **Regressions:** ${report.regressions.length}\n`;
  md += `- **Issues:** ${report.recommendations.length}\n\n`;

  md += '## Benchmark Results\n\n';
  md += '| Benchmark | Mean (ms) | Median (ms) | Min/Max (ms) | Ops/sec | Samples |\n';
  md += '|-----------|-----------|-------------|--------------|---------|----------|\n';

  for (const bench of report.benchmarks) {
    md += `| ${bench.name} | ${bench.mean.toFixed(2)} | ${bench.median.toFixed(2)} | ${bench.min.toFixed(2)}/${bench.max.toFixed(2)} | ${bench.hz.toFixed(0)} | ${bench.samples} |\n`;
  }
  md += '\n';

  if (report.regressions.length > 0) {
    md += '## Regressions Detected\n\n';
    for (const regression of report.regressions) {
      const icon = regression.severity === 'critical' ? '🔴' : regression.severity === 'high' ? '🟠' : '🟡';
      md += `### ${icon} ${regression.benchmark}\n\n`;
      md += `- **Severity:** ${regression.severity.toUpperCase()}\n`;
      md += `- **Baseline:** ${regression.baseline.toFixed(2)}ms\n`;
      md += `- **Current:** ${regression.current.toFixed(2)}ms\n`;
      md += `- **Change:** ${regression.percentageChange > 0 ? '+' : ''}${regression.percentageChange.toFixed(2)}%\n\n`;
    }
  } else {
    md += '## Status: ✨ No regressions detected!\n\n';
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
  const monitor = new PerformanceMonitor(DEFAULT_CONFIG);

  console.log('📊 Performance Report Generator\n');

  // Load current results
  const currentFile = options.current || path.join(DEFAULT_CONFIG.outputDir, 'latest.json');
  if (!fs.existsSync(currentFile)) {
    console.error(`❌ No results file found at ${currentFile}`);
    console.log('Run benchmarks first using: npm run bench');
    process.exit(1);
  }

  const currentResults = loadResults(currentFile);
  console.log(`✅ Loaded ${currentResults.length} current benchmark results`);

  // Load baseline if comparing
  let baselineResults: BenchmarkResult[] = [];
  if (options.compare || options.baseline) {
    const baselineFile =
      options.baseline || path.join(DEFAULT_CONFIG.outputDir, 'baseline.json');
    if (fs.existsSync(baselineFile)) {
      baselineResults = loadResults(baselineFile);
      console.log(`✅ Loaded ${baselineResults.length} baseline benchmark results`);
    } else {
      console.log('ℹ️  No baseline found, creating baseline from current results');
      await monitor.saveBaseline(currentResults);
    }
  }

  // Generate report
  const report = await monitor.generateReport(currentResults, baselineResults);

  // Output based on format
  const outputFile = options.output || path.join(DEFAULT_CONFIG.outputDir, 'report');

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

  // Exit with error if critical regressions
  const criticalRegressions = report.regressions.filter((r) => r.severity === 'critical');
  if (criticalRegressions.length > 0) {
    console.error(`\n🔴 ${criticalRegressions.length} critical regression(s) detected!`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
