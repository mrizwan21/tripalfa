#!/usr/bin/env node

/**
 * Performance Analysis Script for E2E Testing
 * Analyzes test execution times and performance metrics
 */

import fs from 'fs';
import path from 'path';

// Configuration
const RESULTS_DIR = 'apps/booking-engine/test-results';
const REPORT_FILE = 'performance-analysis.json';

interface TestResult {
  duration: number;
  status: string;
  retry?: string;
  startTime?: string;
  endTime?: string;
}

interface Spec {
  title: string;
  results: TestResult[];
}

interface Suite {
  title: string;
  specs: Spec[];
}

interface PerformanceAnalysis {
  timestamp: string;
  summary: {
    totalTests: number;
    totalDuration: number;
    averageDuration: number;
    slowestTest: TestDetail | null;
    fastestTest: TestDetail | null;
    browserResults: Record<string, any>;
  };
  browserBreakdown: Record<string, BrowserStats>;
  testDetails: TestDetail[];
  performanceMetrics: {
    testsUnder5s: number;
    tests5To15s: number;
    tests15To30s: number;
    testsOver30s: number;
    averageExecutionTime: number;
  };
  recommendations: Recommendation[];
}

interface TestDetail {
  suite: string;
  test: string;
  browser: string;
  duration: number;
  status: string;
  startTime?: string;
  endTime?: string;
}

interface BrowserStats {
  totalTests: number;
  totalDuration: number;
  averageDuration: number;
  passed: number;
  failed: number;
  skipped: number;
}

interface Recommendation {
  type: string;
  priority: 'high' | 'medium' | 'low';
  message: string;
  action: string;
}

function analyzePerformance(): void {
  console.log('Analyzing E2E Test Performance...');
  
  // Check if results directory exists
  if (!fs.existsSync(RESULTS_DIR)) {
    console.log('Test results directory not found. Run tests first.');
    return;
  }

  // Read JSON results
  const jsonFile = path.join(RESULTS_DIR, 'results.json');
  if (!fs.existsSync(jsonFile)) {
    console.log('JSON results file not found.');
    return;
  }

  try {
    const results = JSON.parse(fs.readFileSync(jsonFile, 'utf8')) as { suites: Suite[] };
    
    // Analyze performance metrics
    const analysis: PerformanceAnalysis = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: results.suites.reduce((acc, suite) => acc + suite.specs.length, 0),
        totalDuration: 0,
        averageDuration: 0,
        slowestTest: null,
        fastestTest: null,
        browserResults: {}
      },
      browserBreakdown: {},
      testDetails: [],
      performanceMetrics: {
        testsUnder5s: 0,
        tests5To15s: 0,
        tests15To30s: 0,
        testsOver30s: 0,
        averageExecutionTime: 0
      },
      recommendations: []
    };

    // Process each suite
    results.suites.forEach(suite => {
      suite.specs.forEach(spec => {
        spec.results.forEach(result => {
          const testDetail: TestDetail = {
            suite: suite.title,
            test: spec.title,
            browser: result.retry ? `${result.retry} (retry)` : 'chromium',
            duration: result.duration,
            status: result.status,
            startTime: result.startTime,
            endTime: result.endTime
          };

          analysis.testDetails.push(testDetail);
          analysis.summary.totalDuration += result.duration;

          // Track slowest and fastest tests
          if (!analysis.summary.slowestTest || result.duration > analysis.summary.slowestTest.duration) {
            analysis.summary.slowestTest = testDetail;
          }
          if (!analysis.summary.fastestTest || result.duration < analysis.summary.fastestTest.duration) {
            analysis.summary.fastestTest = testDetail;
          }

          // Categorize by execution time
          if (result.duration < 5000) {
            analysis.performanceMetrics.testsUnder5s++;
          } else if (result.duration < 15000) {
            analysis.performanceMetrics.tests5To15s++;
          } else if (result.duration < 30000) {
            analysis.performanceMetrics.tests15To30s++;
          } else {
            analysis.performanceMetrics.testsOver30s++;
          }

          // Browser breakdown
          const browserKey = result.retry || 'chromium';
          if (!analysis.browserBreakdown[browserKey]) {
            analysis.browserBreakdown[browserKey] = {
              totalTests: 0,
              totalDuration: 0,
              averageDuration: 0,
              passed: 0,
              failed: 0,
              skipped: 0
            };
          }

          const browserStats = analysis.browserBreakdown[browserKey];
          browserStats.totalTests++;
          browserStats.totalDuration += result.duration;
          browserStats[result.status as keyof BrowserStats]++;
        });
      });
    });

    // Calculate averages
    analysis.summary.averageDuration = analysis.summary.totalDuration / analysis.summary.totalTests;
    analysis.performanceMetrics.averageExecutionTime = analysis.summary.totalDuration / analysis.summary.totalTests;

    // Calculate browser averages
    Object.keys(analysis.browserBreakdown).forEach(browser => {
      const stats = analysis.browserBreakdown[browser];
      stats.averageDuration = stats.totalDuration / stats.totalTests;
    });

    // Generate recommendations
    analysis.recommendations = generateRecommendations(analysis);

    // Save analysis
    fs.writeFileSync(REPORT_FILE, JSON.stringify(analysis, null, 2));
    
    // Display summary
    displaySummary(analysis);

    console.log(`Performance analysis complete. Report saved to ${REPORT_FILE}`);
    
  } catch (error) {
    console.error('Error analyzing performance:', error instanceof Error ? error.message : error);
  }
}

function generateRecommendations(analysis: PerformanceAnalysis): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const totalTests = analysis.summary.totalTests;

  // Check for slow tests
  if (analysis.summary.slowestTest && analysis.summary.slowestTest.duration > 30000) {
    recommendations.push({
      type: 'performance',
      priority: 'high',
      message: `Slowest test (${analysis.summary.slowestTest.test}) takes ${Math.round(analysis.summary.slowestTest.duration / 1000)}s. Consider optimizing or increasing timeout.`,
      action: 'Review test implementation and consider breaking into smaller tests'
    });
  }

  // Check for high failure rate
  const failedTests = Object.values(analysis.browserBreakdown).reduce((acc, stats) => acc + stats.failed, 0);
  const failureRate = (failedTests / totalTests) * 100;

  if (failureRate > 10) {
    recommendations.push({
      type: 'reliability',
      priority: 'high',
      message: `High failure rate: ${failureRate.toFixed(1)}%. Consider improving test stability.`,
      action: 'Add retry logic, improve wait conditions, or fix flaky tests'
    });
  }

  // Check for long average execution time
  if (analysis.performanceMetrics.averageExecutionTime > 15000) {
    recommendations.push({
      type: 'performance',
      priority: 'medium',
      message: `Average test execution time is ${Math.round(analysis.performanceMetrics.averageExecutionTime / 1000)}s. Consider optimization.`,
      action: 'Review test setup/teardown and consider parallel execution'
    });
  }

  // Check for too many slow tests
  const slowTestPercentage = (analysis.performanceMetrics.testsOver30s / totalTests) * 100;
  if (slowTestPercentage > 20) {
    recommendations.push({
      type: 'performance',
      priority: 'medium',
      message: `${slowTestPercentage.toFixed(1)}% of tests take over 30s. Consider optimization.`,
      action: 'Review test implementation and consider breaking complex tests'
    });
  }

  return recommendations;
}

function displaySummary(analysis: PerformanceAnalysis): void {
  console.log('\nPerformance Analysis Summary');
  console.log('================================');
  console.log(`Total Tests: ${analysis.summary.totalTests}`);
  console.log(`Total Duration: ${Math.round(analysis.summary.totalDuration / 1000)}s`);
  console.log(`Average Duration: ${Math.round(analysis.summary.averageDuration / 1000)}s`);
  console.log(`Slowest Test: ${analysis.summary.slowestTest?.test || 'N/A'} (${analysis.summary.slowestTest ? Math.round(analysis.summary.slowestTest.duration / 1000) : 'N/A'}s)`);
  console.log(`Fastest Test: ${analysis.summary.fastestTest?.test || 'N/A'} (${analysis.summary.fastestTest ? Math.round(analysis.summary.fastestTest.duration / 1000) : 'N/A'}s)`);
  
  console.log('\nExecution Time Distribution:');
  console.log(`  Under 5s: ${analysis.performanceMetrics.testsUnder5s}`);
  console.log(`  5-15s: ${analysis.performanceMetrics.tests5To15s}`);
  console.log(`  15-30s: ${analysis.performanceMetrics.tests15To30s}`);
  console.log(`  Over 30s: ${analysis.performanceMetrics.testsOver30s}`);

  console.log('\nBrowser Breakdown:');
  Object.entries(analysis.browserBreakdown).forEach(([browser, stats]) => {
    console.log(`  ${browser}:`);
    console.log(`    Total: ${stats.totalTests}, Passed: ${stats.passed}, Failed: ${stats.failed}, Skipped: ${stats.skipped}`);
    console.log(`    Average Duration: ${Math.round(stats.averageDuration / 1000)}s`);
  });

  if (analysis.recommendations.length > 0) {
    console.log('\nRecommendations:');
    analysis.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
      console.log(`     Action: ${rec.action}`);
    });
  }
}

// Run analysis if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzePerformance();
}

export { analyzePerformance };
