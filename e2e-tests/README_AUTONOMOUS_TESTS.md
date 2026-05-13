# 🤖 Autonomous Test Suite - Index

**Quick Access:** [Deployment Complete](AUTONOMOUS_DEPLOYMENT_COMPLETE.md) | [Summary](AUTONOMOUS_TEST_SUMMARY.md)

---

## 🚀 Start Here

All autonomous test agents have been deployed. To execute:

```bash
# Run all tests autonomously
./deploy-agents.sh

# Or run specific agent
npx playwright test e2e-tests/agents/agent-booking.ts --config=e2e-tests/playwright.config.ts --headed
```

---

## 📁 Documentation Files

| File | Description |
|------|-------------|
| **[AUTONOMOUS_DEPLOYMENT_COMPLETE.md](AUTONOMOUS_DEPLOYMENT_COMPLETE.md)** | Complete deployment guide |
| **[AUTONOMOUS_TEST_SUMMARY.md](AUTONOMOUS_TEST_SUMMARY.md)** | Quick reference |
| **[e2e-tests/AGENT_STATUS.md](e2e-tests/AGENT_STATUS.md)** | Live status |
| **[e2e-tests/playwright.config.ts](e2e-tests/playwright.config.ts)** | Test configuration |

---

## 📊 Agent Status

| Agent | Module | Tests | Status |
|-------|--------|-------|--------|
| agent-booking | Booking Engine | 7 | ✅ Deployed |
| agent-b2b | B2B Portal | 7 | ✅ Deployed |
| agent-callcenter | Call Center | 6 | ✅ Deployed |
| agent-admin | Super Admin | 4 | ✅ Deployed |

---

## 🎯 Quick Commands

```bash
# All tests
./deploy-agents.sh

# View reports
open e2e-tests/test-results/index.html

# Monitor
node e2e-tests/monitor-agents.ts
```

---

**Status:** ✅ Operational | **Mode:** YOLO | **Manual:** Not Required
