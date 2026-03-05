import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

interface CoverageMetrics {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

interface CoverageDashboardData {
  timestamp: string;
  baseline: CoverageMetrics;
  current: CoverageMetrics;
  change: CoverageMetrics;
  serviceBreakdown: Record<string, CoverageMetrics>;
}

/**
 * Extract total coverage metrics from coverage-final.json
 */
export function extractMetrics(
  coverageFilePath: string
): CoverageMetrics {
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
 * Extract per-service coverage metrics
 */
export function extractServiceMetrics(
  coverageFilePath: string
): Record<string, CoverageMetrics> {
  try {
    const data = JSON.parse(readFileSync(coverageFilePath, 'utf-8'));
    const services: Record<string, CoverageMetrics> = {};

    // Map service paths to names
    const serviceMap: Record<string, string> = {
      'services/payment-service': 'Payment Service',
      'services/booking-service': 'Booking Service',
      'services/wallet-service': 'Wallet Service',
      'services/kyc-service': 'KYC Service',
      'services/notification-service': 'Notification Service',
      'apps/booking-engine': 'Booking Engine',
      'apps/b2b-admin': 'B2B Admin',
    };

    Object.entries(serviceMap).forEach(([servicePath, serviceName]) => {
      const metrics: CoverageMetrics = {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0,
      };

      Object.entries(data).forEach(([filePath, coverage]: [string, any]) => {
        if (filePath.includes(servicePath)) {
          if (coverage.s) {
            const covered = Object.values(coverage.s).filter((c: any) => c > 0).length;
            const total = Object.keys(coverage.s).length;
            metrics.statements = Math.max(
              metrics.statements,
              Math.round((covered / total) * 100)
            );
          }
        }
      });

      if (metrics.statements > 0) {
        services[serviceName] = metrics;
      }
    });

    return services;
  } catch {
    return {};
  }
}

/**
 * Calculate changes between baseline and current metrics
 */
export function calculateChanges(
  baseline: CoverageMetrics,
  current: CoverageMetrics
): CoverageMetrics {
  return {
    statements: current.statements - baseline.statements,
    branches: current.branches - baseline.branches,
    functions: current.functions - baseline.functions,
    lines: current.lines - baseline.lines,
  };
}

/**
 * Get color based on change percentage
 */
export function getChangeColor(change: number): string {
  if (change >= 0) {
    return '#4CAF50'; // green - coverage improved
  }
  if (change >= -2) {
    return '#FFC107'; // yellow - minor regression
  }
  return '#F44336'; // red - significant regression
}

/**
 * Generate HTML dashboard
 */
export function generateDashboardHTML(
  data: CoverageDashboardData
): string {
  const getChangeIndicator = (change: number) => {
    if (change > 0) return `<span style="color: #4CAF50">↑ +${change}%</span>`;
    if (change < 0) return `<span style="color: #F44336">↓ ${change}%</span>`;
    return '<span style="color: #999">→ 0%</span>';
  };

  const getMetricColor = (value: number) => {
    if (value >= 80) return '#4CAF50'; // green
    if (value >= 70) return '#FFC107'; // yellow
    return '#F44336'; // red
  };

  const serviceRows = Object.entries(data.serviceBreakdown)
    .map(
      ([service, metrics]) =>
        `<tr>
       <td style="padding: 10px; border-bottom: 1px solid #eee;">${service}</td>
       <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
         <span style="color: ${getMetricColor(metrics.statements)}; font-weight: bold;">${metrics.statements}%</span>
       </td>
       <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
         <span style="color: ${getMetricColor(metrics.branches)}; font-weight: bold;">${metrics.branches}%</span>
       </td>
       <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
         <span style="color: ${getMetricColor(metrics.functions)}; font-weight: bold;">${metrics.functions}%</span>
       </td>
       <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
         <span style="color: ${getMetricColor(metrics.lines)}; font-weight: bold;">${metrics.lines}%</span>
       </td>
     </tr>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Coverage Dashboard</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 40px 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      color: white;
      margin-bottom: 40px;
    }
    
    .header h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
    }
    
    .header p {
      font-size: 1rem;
      opacity: 0.9;
    }
    
    .timestamp {
      text-align: center;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 20px;
      font-size: 0.9rem;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    
    .metric-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .metric-card h2 {
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .metric-value {
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .metric-change {
      font-size: 1rem;
      padding-top: 10px;
      border-top: 1px solid #eee;
    }
    
    .services-table {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      margin-bottom: 40px;
    }
    
    .services-table h2 {
      background: #f5f5f5;
      padding: 20px;
      margin: 0;
      font-size: 1.2rem;
      border-bottom: 1px solid #eee;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
    }
    
    th {
      background: #f5f5f5;
      padding: 15px;
      text-align: left;
      font-weight: 600;
      color: #333;
      border-bottom: 2px solid #ddd;
    }
    
    td {
      padding: 12px 15px;
      border-bottom: 1px solid #eee;
    }
    
    tr:last-child td {
      border-bottom: none;
    }
    
    .alert {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      border-left: 4px solid #F44336;
    }
    
    .alert.success {
      border-left-color: #4CAF50;
    }
    
    .alert.warning {
      border-left-color: #FFC107;
    }
    
    .alert h3 {
      margin-bottom: 10px;
      color: #333;
    }
    
    .alert p {
      color: #666;
      font-size: 0.95rem;
    }
    
    .footer {
      text-align: center;
      color: rgba(255, 255, 255, 0.8);
      margin-top: 40px;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Coverage Dashboard</h1>
      <p>Test coverage monitoring and health checking</p>
    </div>
    
    <div class="timestamp">
      <strong>Last Updated:</strong> ${data.timestamp}
    </div>
    
    <div class="metrics-grid">
      <div class="metric-card">
        <h2>Statements</h2>
        <div class="metric-value" style="color: ${getMetricColor(data.current.statements)}">
          ${data.current.statements}%
        </div>
        <div class="metric-change">
          ${getChangeIndicator(data.change.statements)}<br>
          Baseline: ${data.baseline.statements}%
        </div>
      </div>
      
      <div class="metric-card">
        <h2>Branches</h2>
        <div class="metric-value" style="color: ${getMetricColor(data.current.branches)}">
          ${data.current.branches}%
        </div>
        <div class="metric-change">
          ${getChangeIndicator(data.change.branches)}<br>
          Baseline: ${data.baseline.branches}%
        </div>
      </div>
      
      <div class="metric-card">
        <h2>Functions</h2>
        <div class="metric-value" style="color: ${getMetricColor(data.current.functions)}">
          ${data.current.functions}%
        </div>
        <div class="metric-change">
          ${getChangeIndicator(data.change.functions)}<br>
          Baseline: ${data.baseline.functions}%
        </div>
      </div>
      
      <div class="metric-card">
        <h2>Lines</h2>
        <div class="metric-value" style="color: ${getMetricColor(data.current.lines)}">
          ${data.current.lines}%
        </div>
        <div class="metric-change">
          ${getChangeIndicator(data.change.lines)}<br>
          Baseline: ${data.baseline.lines}%
        </div>
      </div>
    </div>
    
    ${
      Object.keys(data.serviceBreakdown).length > 0
        ? `<div class="services-table">
      <h2>Service Coverage Details</h2>
      <table>
        <thead>
          <tr>
            <th>Service</th>
            <th>Statements</th>
            <th>Branches</th>
            <th>Functions</th>
            <th>Lines</th>
          </tr>
        </thead>
        <tbody>
          ${serviceRows}
        </tbody>
      </table>
    </div>`
        : ''
    }
    
    ${
      data.change.statements < -5 || data.change.branches < -5
        ? `<div class="alert">
      <h3>⚠️ Significant Coverage Regression Detected</h3>
      <p>Coverage has dropped more than 5% in one or more metrics. Review the coverage report and address the regression.</p>
    </div>`
        : data.change.statements < 0 || data.change.branches < 0
          ? `<div class="alert warning">
      <h3>⚠️ Minor Coverage Regression</h3>
      <p>Coverage has dropped slightly. Consider adding tests for new code.</p>
    </div>`
          : `<div class="alert success">
      <h3>✅ Coverage Maintained or Improved</h3>
      <p>Test coverage is stable or improving. Keep up the great work!</p>
    </div>`
    }
    
    <div class="footer">
      <p>Coverage Dashboard | Generated with TripAlfa Quality Assurance Platform</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Create and save dashboard
 */
export async function createDashboard(
  coverageFile: string = '../../coverage/coverage-final.json',
  baselineFile: string = '../../coverage-results/baseline-coverage.json',
  outputFile: string = '../../coverage-dashboard.html'
): Promise<void> {
  try {
    const current = extractMetrics(coverageFile);
    const baseline = existsSync(baselineFile)
      ? extractMetrics(baselineFile)
      : { statements: 0, branches: 0, functions: 0, lines: 0 };

    const change = calculateChanges(baseline, current);
    const serviceBreakdown = extractServiceMetrics(coverageFile);

    const dashboardData: CoverageDashboardData = {
      timestamp: new Date().toISOString(),
      baseline,
      current,
      change,
      serviceBreakdown,
    };

    const html = generateDashboardHTML(dashboardData);
    writeFileSync(outputFile, html);

    console.log('✅ Dashboard generated:', outputFile);
    console.log('📈 Coverage Summary:');
    console.log(`   Statements: ${current.statements}% (${change.statements > 0 ? '+' : ''}${change.statements}%)`);
    console.log(`   Branches:   ${current.branches}% (${change.branches > 0 ? '+' : ''}${change.branches}%)`);
    console.log(`   Functions:  ${current.functions}% (${change.functions > 0 ? '+' : ''}${change.functions}%)`);
    console.log(`   Lines:      ${current.lines}% (${change.lines > 0 ? '+' : ''}${change.lines}%)`);
  } catch (error) {
    console.error('❌ Error creating dashboard:', error);
    process.exit(1);
  }
}

if (process.argv[1] === __filename) {
  createDashboard();
}
