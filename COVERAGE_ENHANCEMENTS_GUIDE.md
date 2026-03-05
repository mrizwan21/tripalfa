# 🎯 Coverage Enhancements Guide

**Badge Support, Dashboard Analytics, and Smart Alerts**

---

## 📊 Three New Capabilities

### 1. Coverage Badges ✨
Display coverage metrics as visual badges in your README

### 2. Interactive Dashboard 📈
HTML dashboard showing coverage trends and service breakdowns

### 3. Smart Alerts 🚨
Automatic regression detection with severity levels

---

## 🏷️ Coverage Badges

### What Are They?

SVG badges that show coverage percentages with color coding:
- **Green** (≥80%): Excellent coverage
- **Yellow** (70-79%): Good coverage
- **Red** (<70%): Coverage needs improvement

### Generate Badges

```bash
# Generate all badges
pnpm coverage:badges --workspace=@tripalfa/coverage-tracking

# Output:
# ✅ Coverage badges generated:
#    statements: ./coverage-badges/statements-badge.svg
#    branches: ./coverage-badges/branches-badge.svg
#    functions: ./coverage-badges/functions-badge.svg
#    lines: ./coverage-badges/lines-badge.svg
```

### Use in README

The command outputs markdown for you to copy:

```markdown
## Coverage Status

![Statements: 85%](./coverage-badges/statements-badge.svg)
![Branches: 80%](./coverage-badges/branches-badge.svg)
![Functions: 85%](./coverage-badges/functions-badge.svg)
![Lines: 85%](./coverage-badges/lines-badge.svg)
```

### Supports External Services

Works with shields.io format for dynamic badges:

```markdown
![Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/your-org/repo/main/coverage-badges/statements.json)
```

---

## 📊 Interactive Dashboard

### What It Provides

A beautiful HTML dashboard showing:
- **Overall Metrics**: Statements, Branches, Functions, Lines
- **Change Indicators**: Trend arrows and percentage changes
- **Service Breakdown**: Per-service coverage details
- **Regression Alerts**: Visual alerts for coverage drops
- **Real-time Status**: Always up-to-date metrics

### Generate Dashboard

```bash
# Create/update dashboard
pnpm coverage:dashboard --workspace=@tripalfa/coverage-tracking

# Output:
# ✅ Dashboard generated: ./coverage-dashboard.html
# 📈 Coverage Summary:
#    Statements: 85% (+2%)
#    Branches:   80% (+1%)
#    Functions:  85% (+0%)
#    Lines:      85% (+2%)
```

### View Dashboard

```bash
# Open in browser
open coverage-dashboard.html

# Or use http-server
npx http-server . --port 8000
# Then visit: http://localhost:8000/coverage-dashboard.html
```

### Dashboard Features

- **Color-Coded Metrics**: Red/Yellow/Green based on coverage
- **Change Tracking**: Compare current vs baseline
- **Service Details**: Table showing service-by-service coverage
- **Alerts**: Automatic alerts for regressions
- **Responsive Design**: Works on desktop and mobile
- **Clean UI**: Professional appearance suitable for team sharing

### Integrating into CI/CD

```yaml
# In GitHub Actions
- name: Generate dashboard
  run: pnpm coverage:dashboard

- name: Upload dashboard
  uses: actions/upload-artifact@v3
  with:
    name: coverage-dashboard
    path: coverage-dashboard.html
```

---

## 🚨 Smart Alerts

### What They Do

Automatically detect coverage regressions with:
- **Severity Levels**: CRITICAL, HIGH, MEDIUM, LOW
- **Multiple Formats**: Console, GitHub, JSON, Slack
- **Threshold Detection**: Configurable drop percentages
- **Automatic Reporting**: Integrated into CI/CD

### Severity Levels

```
CRITICAL: >= 5% drop      → 🚨 Blocks merge
HIGH:     3-5% drop       → ⚠️  Warns team
MEDIUM:   1-3% drop       → 📊 Notifies  
LOW:      < 1% drop       → ℹ️  Informational
NONE:     No drop         → ✅ All good
```

### Generate Alerts

```bash
# Check for regressions (console output)
pnpm coverage:check-regressions --workspace=@tripalfa/coverage-tracking

# Output example:
# ⚠️  COVERAGE REGRESSION ALERTS:
#
# CRITICAL:
#   🚨 [CRITICAL] Statements: 85% → 79% (-6%)
#
# HIGH:
#   ⚠️  [HIGH] Branches: 80% → 77% (-3%)
```

### Alert Formats

#### Console Output
```bash
npm run coverage:alerts --workspace=@tripalfa/coverage-tracking

# Shows color-coded alerts in terminal
⚠️  COVERAGE REGRESSION ALERTS:

CRITICAL:
  🚨 Statements: 85% → 79% (-6%)
  
HIGH:
  ⚠️  Branches: 80% → 77% (-3%)
```

#### GitHub Markdown
```bash
npm run coverage:alerts --workspace=@tripalfa/coverage-tracking -- --format github

# Outputs PR comment-friendly markdown
## 🚨 CRITICAL: Coverage Regression Detected
- **Statements**: 85% → 79% (-6%)
```

#### JSON Format
```bash
npm run coverage:alerts --workspace=@tripalfa/coverage-tracking -- --format json

# Programmatic access
{
  "timestamp": "2026-03-04T10:30:00Z",
  "totalAlerts": 2,
  "criticalCount": 1,
  "alerts": [
    {
      "metric": "statements",
      "baseline": 85,
      "current": 79,
      "change": -6,
      "severity": "CRITICAL"
    }
  ]
}
```

#### Slack Message
```typescript
import { generateSlackMessage } from '@tripalfa/coverage-tracking';

const alerts = detectRegressions(baselineFile, currentFile);
const slackMsg = generateSlackMessage(alerts);

// Post to Slack webhook
fetch(SLACK_WEBHOOK_URL, {
  method: 'POST',
  body: JSON.stringify(slackMsg)
});
```

### Integration with CI/CD

```yaml
# In GitHub Actions
- name: Check for regressions and alert
  if: always()
  run: |
    npm run coverage:check-regressions \
      --workspace=@tripalfa/coverage-tracking
  
- name: Post Slack notification on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "⚠️ Coverage regression detected in PR#${{ github.event.pull_request.number }}",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "See GitHub Actions for details"
            }
          }
        ]
      }
```

---

## 🔄 Complete CI/CD Workflow

With all enhancements integrated:

```yaml
- name: Run tests with coverage
  run: npm test -- --coverage

- name: Generate report
  run: npm run coverage:report

- name: Generate badges
  run: npm run coverage:badges
  
- name: Generate dashboard
  run: npm run coverage:dashboard

- name: Check for regressions
  run: npm run coverage:check-regressions

- name: Comment PR with results
  if: github.event_name == 'pull_request'
  uses: actions/github-script@v7
  with:
    script: |
      const fs = require('fs');
      const report = fs.readFileSync('coverage-results/report.md', 'utf-8');
      const alerts = fs.readFileSync('coverage-results/alerts.md', 'utf-8');
      
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: `${report}\n\n${alerts}`
      });
```

---

## 📋 Usage Examples

### Example 1: Add Badges to README

```bash
# Step 1: Generate badges
pnpm coverage:badges --workspace=@tripalfa/coverage-tracking

# Step 2: Copy output to README.md
# The command shows you the exact markdown to add

# Step 3: Commit changes
git add coverage-badges/
git add README.md
git commit -m "docs: add coverage badges"
```

### Example 2: Share Dashboard with Team

```bash
# Step 1: Generate dashboard (runs in CI/CD)
pnpm coverage:dashboard

# Step 2: Upload as artifact (GitHub Actions)
# Automatically done if integrated into workflow

# Step 3: Team accesses from Actions artifacts
# Everyone can view latest coverage status

# Step 4: Share link in Slack/Teams
# "Here's the latest coverage dashboard: [artifact link]"
```

### Example 3: Be Alerted on Regressions

```bash
# Step 1: Set up GitHub Actions workflow (included)
# Workflows automatically run on every PR

# Step 2: Check results
# Critical alerts block PR merge
# High alerts show as warning
# Dashboard updated automatically

# Step 3: Review dashboard to understand impact
# See which services are below threshold
# Decide whether to add tests or update baseline
```

### Example 4: Slack Notifications

```typescript
// In your Slack bot or webhook handler
import { detectRegressions, generateSlackMessage } from '@tripalfa/coverage-tracking';

const alerts = detectRegressions('./baseline.json', './current.json');

if (alerts.length > 0) {
  const message = generateSlackMessage(alerts);
  
  // Send to Slack
  await fetch(process.env.SLACK_WEBHOOK, {
    method: 'POST',
    body: JSON.stringify(message)
  });
}
```

---

## 🎨 Customization

### Badge Colors

Badges automatically color based on thresholds:
```typescript
// Edit in generate-badges.ts
const color =
  value >= threshold      ? '#4CAF50'  // green
  : value >= threshold-10 ? '#FFC107'  // yellow
  : '#F44336';                          // red
```

### Alert Thresholds

Customize severity levels:
```typescript
// Edit thresholds in alerts.ts
const REGRESSION_THRESHOLDS = {
  CRITICAL: 5,    // >= 5% drop triggers CRITICAL
  HIGH: 3,        // 3-5% drop
  MEDIUM: 1,      // 1-3% drop
  LOW: 0,         // < 1% drop
};
```

### Dashboard Styling

Modify dashboard HTML in `generate-dashboard.ts`:
```typescript
// Customize colors
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

// Add/remove sections
// Customize thresholds
// Add service filters
```

---

## 📊 Command Reference

### Quick Commands

```bash
# Generate everything
pnpm coverage:report          # Report
pnpm coverage:badges          # Badges
pnpm coverage:dashboard       # Dashboard
pnpm coverage:check-regressions # Alerts

# Compare with baseline
pnpm coverage:compare
pnpm coverage:strict

# Update baseline
pnpm coverage:baseline

# View coverage interactively
pnpm coverage:watch
pnpm coverage:ui
```

### Full Options

```bash
# Report generation
pnpm coverage:report              # Console + Markdown
pnpm coverage:report --json       # JSON format
pnpm coverage:report --baseline   # Compare to baseline

# Badge generation
pnpm coverage:badges              # Generate all badges
pnpm coverage:badges --output-dir ./badges  # Custom dir

# Dashboard
pnpm coverage:dashboard           # Generate dashboard
pnpm coverage:dashboard --no-service-table # Skip table

# Alerts
pnpm coverage:check-regressions   # Console format
pnpm coverage:check-regressions --format github  # GitHub
pnpm coverage:check-regressions --format json    # JSON
```

---

## 🚀 Getting Started with Enhancements

### Phase 1: Basic Setup (5 minutes)
1. Generate badges: `pnpm coverage:badges`
2. Add to README
3. Commit changes

### Phase 2: Dashboard (5 minutes)
1. Generate dashboard: `pnpm coverage:dashboard`
2. Open in browser
3. Share with team

### Phase 3: Alerts (5 minutes)
1. Run alerts: `pnpm coverage:check-regressions`
2. Review regression detection
3. Integrate into CI/CD

### Phase 4: Full Integration (10 minutes)
1. Update GitHub Actions workflow (already done)
2. Test on PR
3. Configure Slack notifications (optional)

---

## 🔧 Troubleshooting

### Badges Not Generating

**Issue**: Command fails or no SVG files created

**Solution**:
```bash
# Ensure coverage data exists
npm test -- --coverage

# Check file path
ls -la coverage/coverage-final.json

# Try with explicit path
pnpm coverage:badges --coverage-file ./coverage/coverage-final.json
```

### Dashboard Not Loading

**Issue**: HTML file created but won't open or looks broken

**Solution**:
```bash
# Verify file exists
ls -lh coverage-dashboard.html

# Serve locally instead of file://
npx http-server .
# Then visit http://localhost:8080/coverage-dashboard.html

# Check console for errors
# (Press F12 in browser to see errors)
```

### Alerts Not Triggering

**Issue**: Regression alerts not showing despite coverage drop

**Solution**:
```bash
# Verify baseline exists
ls coverage-results/baseline-coverage.json

# Create baseline if missing
pnpm coverage:baseline

# Test alerts manually
npm run coverage:check-regressions --workspace=@tripalfa/coverage-tracking

# Check threshold values
# Edit thresholds in src/alerts.ts if needed
```

---

## 📚 Advanced Usage

### Custom Alert Handler

```typescript
import { detectRegressions } from '@tripalfa/coverage-tracking';

async function handleCoverageRegressions() {
  const alerts = detectRegressions('./baseline.json', './current.json');
  
  // Custom logic
  if (alerts.some(a => a.severity === 'CRITICAL')) {
    // Fail the build
    console.error('Critical regressions detected!');
    process.exit(1);
  }
  
  if (alerts.some(a => a.severity === 'HIGH')) {
    // Send email notification
    await sendEmailNotification(alerts);
  }
}
```

### Dashboard Automation

```bash
# Generate dashboard on every test run
npm run coverage:dashboard \
  && npm run coverage:badges \
  && npm run coverage:check-regressions
```

### Badge in CI/CD Badge Display

```markdown
# In main README.md

[![Coverage - Statements](./coverage-badges/statements-badge.svg)](./coverage-dashboard.html)
[![Coverage - Branches](./coverage-badges/branches-badge.svg)](./coverage-dashboard.html)

*Click badges to view detailed dashboard*
```

---

## ✨ Enhancements Summary

| Feature | Time to Generate | Format Support | CI Integration |
|---------|-----------------|-----------------|-----------------|
| **Badges** | < 1 sec | SVG | GitHub Actions |
| **Dashboard** | 2-3 sec | HTML | GitHub Actions |
| **Alerts** | < 1 sec | Console, JSON, GitHub, Slack | GitHub Actions |

**Total Overhead**: ~5 seconds per test run

---

**Next Step**: Run `pnpm coverage:badges` to generate your first badge! 🎉
