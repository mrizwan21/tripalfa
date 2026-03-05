# Coverage Tracking Framework - Integration Testing Guide

**Objective**: Verify coverage-tracking package is properly integrated and operational  
**Estimated Time**: 25-35 minutes  
**Difficulty**: Beginner  

---

## Phase 1: Build & TypeScript Validation (5 minutes)

### Step 1.1: Verify TypeScript Compilation

```bash
# From workspace root
npx tsc -p packages/coverage-tracking/tsconfig.json --noEmit
```

**Expected Output**:
```
✅ No errors reported
```

**If Errors Occur**:
- Check Node.js version: `node -v` (should be 18.x+)
- Re-run: `npm install`
- Check `packages/coverage-tracking/package.json` exists

---

### Step 1.2: Verify Package Structure

```bash
# List coverage-tracking directory
ls -la packages/coverage-tracking/
```

**Expected Files**:
```
✅ src/               (directory)
✅ package.json       (file)
✅ vitest.config.ts   (file)
✅ tsconfig.json      (file)
✅ README.md          (file)
✅ QUICK_REFERENCE.md (file)
```

---

## Phase 2: Dependency Installation (5 minutes)

### Step 2.1: Install Workspace Dependencies

```bash
# From workspace root
npm install
```

**Expected Output**:
```
added X packages
...
npm warn ...
```

**Verify New Dependencies**:

```bash
npm list @vitest/coverage-v8
npm list vitest
```

**Expected Output**:
```
✅ @vitest/coverage-v8@<version>
✅ vitest@<version> (should be 4.0.18+)
```

---

### Step 2.2: Verify Workspace Recognition

```bash
# List all workspaces
npm ls -p
# Should include:
# packages/coverage-tracking
```

**Expected**:
```
✅ Line contains: /packages/coverage-tracking
```

---

## Phase 3: Coverage Configuration Validation (10 minutes)

### Step 3.1: Review Vitest Configuration

```bash
# Check if coverage provider is recognized
npm test -- --help | grep -i coverage
```

**Expected Output**:
```
✅ References to --coverage flag
✅ References to --coverage-reporter
```

---

### Step 3.2: Test Coverage Collection

Run coverage on a small service first (lowest risk):

```bash
# Run coverage on shared-types (smallest service)
npm test -- --coverage packages/shared-types
```

**Expected Output**:
```
✅ Test files run successfully
✅ Coverage data generated
✅ Results show: Statements, Branches, Functions, Lines
✅ Example output:
   ✓ (numbers) test files | (numbers) passed
   Coverage report from /coverage
```

**If It Fails**:
- Check test file exists: `ls packages/shared-types/**/*.test.ts`
- Verify no syntax errors: `npx tsc -p packages/shared-types/tsconfig.json --noEmit`
- Check Vitest version: `npm list vitest`

---

### Step 3.3: Check Coverage Output Directory

```bash
# Find generated coverage files
find coverage -type f -name "*.json" | head -5
```

**Expected Output**:
```
✅ coverage/coverage-final.json exists
✅ At least one .json file generated
```

---

## Phase 4: Core Framework Testing (8 minutes)

### Step 4.1: Test Types Import

```bash
# Verify types can be imported
npx ts-node -e "
import { CoverageConfig, ServiceThresholds } from 'packages/coverage-tracking/src/types';
console.log('✅ Types imported successfully');
"
```

**Expected Output**:
```
✅ Types imported successfully
```

---

### Step 4.2: Test Monitor Class

```bash
# Create and run a simple monitor test
cat > /tmp/test-monitor.ts << 'EOF'
import { CoverageMonitor } from 'packages/coverage-tracking/src/monitor';

const monitor = new CoverageMonitor();
console.log('✅ CoverageMonitor instantiated successfully');
console.log('Config services:', Object.keys(monitor['config'].serviceThresholds).length);
EOF

npx ts-node /tmp/test-monitor.ts
```

**Expected Output**:
```
✅ CoverageMonitor instantiated successfully
✅ Config services: 9
```

---

### Step 4.3: Test Report Generation

```bash
# Run the report generation script manually
npx ts-node packages/coverage-tracking/src/cli/generate-report.ts --help
```

**Expected Output**:
```
✅ Script runs without error
✅ Shows help message or command usage
```

---

## Phase 5: Full Project Coverage Run (5 minutes)

### Step 5.1: Run Complete Coverage

```bash
# Full coverage with all services
npm test -- --coverage 2>&1 | tee /tmp/coverage-output.txt
```

**Expected Output** (excerpt):
```
✅ Tests run across multiple packages
✅ Coverage summary at end:
   ✓ Statement Coverage
   ✓ Branch Coverage
   ✓ Function Coverage
   ✓ Line Coverage
```

**Analyze Results**:

```bash
# Count total coverage files
find coverage -name "coverage-final.json" | wc -l
# Should be: > 1 (multiple services)
```

---

### Step 5.2: Verify Coverage Targets

```bash
# Check if any services fail thresholds
npm test -- --coverage 2>&1 | grep -i "fail\|error" | head -5
```

**Expected**:
- If new services: Might have failures (acceptable, thresholds can be adjusted)
- If existing services: Should pass or show controlled failures

---

## Phase 6: GitHub Actions Workflow Validation (5 minutes)

### Step 6.1: Check Workflow Syntax

```bash
# Validate workflow file
cat .github/workflows/coverage.yml | grep -E "^[a-z]|^  [a-z]|^    [a-z]"
```

**Expected Output**:
```
✅ Valid YAML structure
✅ Contains: on, jobs, steps keywords
```

---

### Step 6.2: Review Workflow Configuration

```bash
# Extract key workflow elements
grep -A 2 "^on:" .github/workflows/coverage.yml
```

**Expected Output**:
```
✅ Triggers on: pull_request
✅ Triggers on: push to main
✅ Scheduled daily (optional)
```

---

## Phase 7: Manual Baseline Creation (5 minutes)

### Step 7.1: Generate Initial Baseline

```bash
# Ensure coverage data exists
npm test -- --coverage

# Create baseline from current coverage
mkdir -p coverage-results
cp coverage/coverage-final.json coverage-results/baseline-coverage.json
```

**Expected**:
```
✅ Baseline file created at: coverage-results/baseline-coverage.json
✅ File size > 10KB
```

---

### Step 7.2: Verify Baseline Format

```bash
# Check baseline structure
node -e "
const baseline = require('./coverage-results/baseline-coverage.json');
console.log('✅ Baseline JSON is valid');
console.log('✅ Files tracked:', Object.keys(baseline).length);
"
```

**Expected Output**:
```
✅ Baseline JSON is valid
✅ Files tracked: (number > 50)
```

---

## Phase 8: Framework Validation Dashboard

### ✅ Checklist

Work through each item and verify:

```
SETUP VERIFICATION
  ☐ TypeScript compiles without errors
  ☐ package.json exists with correct scripts
  ☐ vitest.config.ts has coverage provider set to 'v8'
  ☐ All 9 service thresholds defined in types.ts

DEPENDENCIES
  ☐ @vitest/coverage-v8 installed
  ☐ vitest v4.0.18+ installed
  ☐ Node.js v18+ in use
  ☐ npm/pnpm workspaces functioning

COVERAGE COLLECTION
  ☐ Can run: npm test -- --coverage
  ☐ Coverage files generated in: ./coverage/
  ☐ coverage-final.json has valid JSON
  ☐ Multiple services have coverage data

MONITORING
  ☐ CoverageMonitor class instantiates
  ☐ Load baseline works
  ☐ Detect regressions function exists
  ☐ Generate report function works

GITHUB ACTIONS
  ☐ .github/workflows/coverage.yml exists
  ☐ Workflow syntax is valid YAML
  ☐ Triggers on: pull_request, push
  ☐ Has appropriate permissions set

BASELINE
  ☐ Initial baseline created: coverage-results/baseline-coverage.json
  ☐ Baseline JSON is valid
  ☐ Tracks > 50 files
  ☐ Ready for first comparison
```

---

## 🎯 Expected Results

When all phases pass, you should have:

### ✅ Coverage Data for 9 Services
```
payment-service        ✅ (85% target)
booking-service        ✅ (82% target)
wallet-service         ✅ (85% target)
kyc-service           ✅ (80% target)
notification-service   ✅ (80% target)
marketing-service      ✅ (78% target)
organization-service   ✅ (78% target)
api-gateway           ✅ (78% target)
booking-engine        ✅ (75% target)
b2b-admin             ✅ (72% target)
shared packages       ✅ (88% target)
```

### ✅ Operational Reports
```
📊 Can generate: Console report ✅
📊 Can generate: JSON report ✅
📊 Can generate: Markdown report ✅
📊 Can compare: Against baseline ✅
```

### ✅ GitHub Integration Ready
```
🔄 PR workflow runs automatically ✅
🔄 Comments on PRs ✅
🔄 Stores artifacts ✅
🔄 Updates baseline on merge ✅
```

---

## 🔄 What to Do If Tests Fail

### Coverage Not Collecting
**Check**:
1. Vitest installed: `npm list vitest | head -3`
2. Provider configured: Check `vitest.config.ts` has `provider: 'v8'`
3. Test files exist: `find . -name "*.test.ts" -o -name "*.spec.ts" | wc -l`

### TypeScript Errors
**Fix**:
```bash
npm install
npx tsc -p packages/coverage-tracking/tsconfig.json --noEmit
```

### GitHub Actions Issues
**Verify**:
1. YAML syntax: Use `yamllint` or VS Code YAML extension
2. Permissions: Check `permissions:` section in workflow
3. Secrets: If using tokens, verify they're configured

---

## 📊 Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| TypeScript compilation | 0 errors | ✅ |
| Coverage data collection | ✅ Runs | 🔄 Verify |
| Baseline creation | ✅ Works | 🔄 Verify |
| Report generation | Multiple formats | 🔄 Verify |
| GitHub Actions setup | ✅ Valid | ✅ |
| Documentation | ✅ Complete | ✅ |

---

## 📝 Next Steps (After Validation)

1. **Initialize Baseline** (if not done):
   ```bash
   pnpm coverage:baseline --workspace=@tripalfa/coverage-tracking
   ```

2. **Verify on PR** (create test PR):
   - Make small change
   - Submit PR
   - Check GitHub Actions runs
   - Review PR comment

3. **Team Training**:
   - Share QUICK_REFERENCE.md with team
   - Walk through coverage reports
   - Explain thresholds and regression detection

4. **Coverage Improvement** (Sprint):
   - Identify lowest coverage services
   - Plan test improvements
   - Set coverage targets

---

## 🆘 Debugging Tips

### See Full Test Output
```bash
npm test -- --coverage --reporter=verbose
```

### Debug Specific Service
```bash
npm test packages/booking-service -- --coverage
```

### View Coverage Report in HTML
```bash
npm test -- --coverage
open coverage/index.html
```

### Check Baseline Difference
```bash
node -e "
const baseline = require('./coverage-results/baseline-coverage.json');
const current = require('./coverage/coverage-final.json');
console.log('Baseline files:', Object.keys(baseline).length);
console.log('Current files:', Object.keys(current).length);
"
```

---

## ✅ Completion Criteria

This integration test is **COMPLETE** when:

1. ✅ All 8 phases pass without errors
2. ✅ Coverage data collected for 9+ services
3. ✅ Baseline created and validated
4. ✅ GitHub Actions workflow syntax verified
5. ✅ Team can generate reports manually
6. ✅ CI/CD pipeline recognizes workflow

---

**Framework Status**: Ready for continuous integration  
**Estimated Time to Complete**: 25-35 minutes  
**Critical Blockers**: None identified  

🚀 Ready to enable automated quality tracking!
