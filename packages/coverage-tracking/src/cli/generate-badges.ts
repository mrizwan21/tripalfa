import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

interface CoverageSummary {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

/**
 * Generate SVG badge for coverage metrics
 * Based on shields.io format
 */
export function generateCoverageBadge(
  metric: string,
  value: number,
  threshold: number = 70
): string {
  const color =
    value >= threshold
      ? '#4CAF50' // green
      : value >= threshold - 10
        ? '#FFC107' // yellow
        : '#F44336'; // red

  const encodedMetric = encodeURIComponent(metric);
  const encodedValue = encodeURIComponent(`${value}%`);

  // SVG badge (shields.io style)
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="140" height="20" role="img" aria-label="${metric}: ${value}%">
    <title>${metric}: ${value}%</title>
    <linearGradient id="s" x2="0" y2="100%">
      <stop offset="0" stop-color="#bbb"/>
      <stop offset="1" stop-color="#999"/>
    </linearGradient>
    <clipPath id="r">
      <rect width="140" height="20" rx="3" fill="#fff"/>
    </clipPath>
    <g clip-path="url(#r)">
      <rect width="93" height="20" fill="#555"/>
      <rect x="93" width="47" height="20" fill="${color}"/>
      <rect width="140" height="20" fill="url(#s)"/>
    </g>
    <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
      <text aria-hidden="true" x="475" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="830">${metric}</text>
      <text x="475" y="140" transform="scale(.1)" fill="#fff" textLength="830">${metric}</text>
      <text aria-hidden="true" x="1155" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="370">${value}%</text>
      <text x="1155" y="140" transform="scale(.1)" fill="#fff" textLength="370">${value}%</text>
    </g>
  </svg>`;
}

/**
 * Generate markdown badge link
 */
export function generateMarkdownBadge(
  metric: string,
  value: number,
  badgeUrl: string,
  altText: string = ''
): string {
  return `[![${altText || metric}: ${value}%](${badgeUrl})](./coverage)`;
}

/**
 * Create coverage badges for all metrics
 */
export function createCoverageBadges(
  coverage: CoverageSummary,
  outputDir: string = './coverage-badges'
): Record<string, string> {
  mkdirSync(outputDir, { recursive: true });

  const badges: Record<string, string> = {};
  const metrics = ['statements', 'branches', 'functions', 'lines'] as const;

  for (const metric of metrics) {
    const value = coverage[metric];
    const svg = generateCoverageBadge(
      metric.charAt(0).toUpperCase() + metric.slice(1),
      value
    );

    const filename = `${metric}-badge.svg`;
    const filepath = join(outputDir, filename);
    writeFileSync(filepath, svg);
    badges[metric] = filepath;
  }

  return badges;
}

/**
 * Generate markdown badge section for README
 */
export function generateBadgeMarkdown(
  coverage: CoverageSummary,
  baseUrl: string = './coverage-badges'
): string {
  const lines = [
    '## Coverage Status',
    '',
    `![Statements: ${coverage.statements}%](${baseUrl}/statements-badge.svg)`,
    `![Branches: ${coverage.branches}%](${baseUrl}/branches-badge.svg)`,
    `![Functions: ${coverage.functions}%](${baseUrl}/functions-badge.svg)`,
    `![Lines: ${coverage.lines}%](${baseUrl}/lines-badge.svg)`,
    '',
  ];

  return lines.join('\n');
}

/**
 * Extract coverage summary from coverage-final.json
 */
export function extractCoverageSummary(
  coverageFilePath: string
): CoverageSummary {
  const coverageData = JSON.parse(readFileSync(coverageFilePath, 'utf-8'));

  const summary = (coverageData.total || {}) as {
    statements?: { pct?: number };
    branches?: { pct?: number };
    functions?: { pct?: number };
    lines?: { pct?: number };
  };

  return {
    statements: summary.statements?.pct || 0,
    branches: summary.branches?.pct || 0,
    functions: summary.functions?.pct || 0,
    lines: summary.lines?.pct || 0,
  };
}

/**
 * Main: Generate all badges
 */
export async function generateAllBadges(
  coverageFile: string = '../../coverage/coverage-final.json',
  outputDir: string = '../../coverage-badges'
): Promise<void> {
  try {
    const coverage = extractCoverageSummary(coverageFile);
    const badges = createCoverageBadges(coverage, outputDir);
    const markdown = generateBadgeMarkdown(coverage);

    console.log('✅ Coverage badges generated:');
    Object.entries(badges).forEach(([metric, path]) => {
      console.log(`   ${metric}: ${path}`);
    });

    console.log('\n📋 Add this to your README.md:');
    console.log(markdown);

    console.log('✅ Badge generation complete!');
  } catch (error) {
    console.error('❌ Error generating badges:', error);
    process.exit(1);
  }
}

if (process.argv[1] === __filename) {
  generateAllBadges();
}
