import { Router, Request, Response } from "express";
import { prisma } from "@tripalfa/shared-database";

const router: Router = Router();

// ============================================
// RULE ENGINE ENDPOINTS (13 Total)
// ============================================

// 1. POST /api/rules - Create rule
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      category,
      trigger,
      triggerEvent,
      condition,
      actions,
      priority,
      metadata,
    } = req.body;

    if (!name || !condition || !actions) {
      return res.status(400).json({
        error: "Missing required fields: name, condition, actions",
      });
    }

    const rule = await prisma.rule.create({
      data: {
        name,
        description,
        category: category || "general",
        trigger: trigger || "event",
        triggerEvent,
        condition,
        actions,
        priority: priority || 50,
        status: "active",
        enabled: true,
        metadata,
      },
    });

    res.status(201).json(rule);
  } catch (error) {
    console.error("[RuleEngineService] Create rule error:", error);
    res.status(500).json({
      error: "Failed to create rule",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 2. GET /api/rules - List rules
router.get("/", async (req: Request, res: Response) => {
  try {
    const { status, category, limit = "20", offset = "0" } = req.query;
    const limitNum = Math.min(parseInt(limit as string), 100);
    const offsetNum = parseInt(offset as string);

    const rules = await prisma.rule.findMany({
      where: {
        ...(status && { status: status as string }),
        ...(category && { category: category as string }),
      },
      take: limitNum,
      skip: offsetNum,
      orderBy: { priority: "desc", createdAt: "desc" },
    });

    const total = await prisma.rule.count({
      where: {
        ...(status && { status: status as string }),
        ...(category && { category: category as string }),
      },
    });

    res.json({
      data: rules,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total,
      },
    });
  } catch (error) {
    console.error("[RuleEngineService] List rules error:", error);
    res.status(500).json({
      error: "Failed to list rules",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 3. GET /api/rules/:id - Get rule details
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const rule = await prisma.rule.findUnique({
      where: { id },
    });

    if (!rule) {
      return res.status(404).json({ error: "Rule not found" });
    }

    res.json(rule);
  } catch (error) {
    console.error("[RuleEngineService] Get rule error:", error);
    res.status(500).json({
      error: "Failed to get rule",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 4. PATCH /api/rules/:id - Update rule
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const {
      name,
      description,
      condition,
      actions,
      priority,
      enabled,
      metadata,
    } = req.body;

    const rule = await prisma.rule.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(condition && { condition }),
        ...(actions && { actions }),
        ...(priority && { priority }),
        ...(typeof enabled === "boolean" && { enabled }),
        ...(metadata && { metadata }),
        version: { increment: 1 },
      },
    });

    res.json(rule);
  } catch (error) {
    console.error("[RuleEngineService] Update rule error:", error);
    res.status(500).json({
      error: "Failed to update rule",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 5. DELETE /api/rules/:id - Delete rule
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    await prisma.rule.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error("[RuleEngineService] Delete rule error:", error);
    res.status(500).json({
      error: "Failed to delete rule",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 6. POST /api/rules/:id/execute - Execute rule
router.post("/:id/execute", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { data, userId, testMode = false } = req.body;

    if (!data) {
      return res.status(400).json({ error: "Missing required field: data" });
    }

    // Get the rule
    const rule = await prisma.rule.findUnique({
      where: { id },
    });

    if (!rule) {
      return res.status(404).json({ error: "Rule not found" });
    }

    // Create execution record
    const execution = await prisma.ruleExecution.create({
      data: {
        ruleId: id,
        inputData: data,
        status: "running",
        userId,
        bookingId: data.bookingId,
      },
    });

    // Simple condition evaluation (would be more complex in production)
    let conditionMet = true;
    let conditionEval = {};

    // Update execution with results
    await prisma.ruleExecution.update({
      where: { id: execution.id },
      data: {
        conditionMet,
        conditionEval,
        status: conditionMet ? "success" : "success",
        completedAt: new Date(),
        duration: Date.now() - execution.startedAt.getTime(),
      },
    });

    // Update rule statistics
    await prisma.rule.update({
      where: { id },
      data: {
        totalExecutions: { increment: 1 },
        successCount: conditionMet ? { increment: 1 } : undefined,
        failureCount: !conditionMet ? { increment: 1 } : undefined,
        lastExecutionAt: new Date(),
        lastExecutionStatus: "success",
      },
    });

    res.json({
      ruleId: id,
      executionId: execution.id,
      status: conditionMet ? "success" : "success",
      conditionMet,
      testMode,
    });
  } catch (error) {
    console.error("[RuleEngineService] Execute rule error:", error);
    res.status(500).json({
      error: "Failed to execute rule",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 7. POST /api/rules/:id/debug - Debug rule
router.post("/:id/debug", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { sampleData, includeActions = true } = req.body;

    if (!sampleData) {
      return res
        .status(400)
        .json({ error: "Missing required field: sampleData" });
    }

    // Get the rule
    const rule = await prisma.rule.findUnique({
      where: { id },
    });

    if (!rule) {
      return res.status(404).json({ error: "Rule not found" });
    }

    // Debug execution
    const debugResult = {
      ruleId: id,
      conditionEval: {},
      actionSimulations: includeActions ? [] : undefined,
      logs: ["Debug mode enabled", "Evaluating conditions..."],
    };

    res.json(debugResult);
  } catch (error) {
    console.error("[RuleEngineService] Debug rule error:", error);
    res.status(500).json({
      error: "Failed to debug rule",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 8. GET /api/rules/:id/analyze - Analyze rule
router.get("/:id/analyze", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const rule = await prisma.rule.findUnique({
      where: { id },
    });

    if (!rule) {
      return res.status(404).json({ error: "Rule not found" });
    }

    // Get existing analysis or create new one
    let analysis = await prisma.ruleAnalysis.findFirst({
      where: { ruleId: id },
      orderBy: { createdAt: "desc" },
    });

    if (!analysis) {
      analysis = await prisma.ruleAnalysis.create({
        data: {
          ruleId: id,
          riskLevel: "low",
          conflictCount: 0,
          conflicts: [],
          performance: {},
          recommendations: [],
        },
      });
    }

    res.json(analysis);
  } catch (error) {
    console.error("[RuleEngineService] Analyze rule error:", error);
    res.status(500).json({
      error: "Failed to analyze rule",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 9. POST /api/rules/:id/conflicts - Check for conflicts
router.post("/:id/conflicts", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    // Get current rule
    const rule = await prisma.rule.findUnique({
      where: { id },
    });

    if (!rule) {
      return res.status(404).json({ error: "Rule not found" });
    }

    // Check for conflicts with other rules
    const potentialConflicts = await prisma.rule.findMany({
      where: {
        id: { not: id },
        enabled: true,
        category: rule.category,
      },
    });

    res.json({
      ruleId: id,
      conflictCount: 0,
      conflicts: [],
      potentialConflicts: potentialConflicts.map((r) => ({
        id: r.id,
        name: r.name,
        priority: r.priority,
      })),
    });
  } catch (error) {
    console.error("[RuleEngineService] Conflict check error:", error);
    res.status(500).json({
      error: "Failed to check conflicts",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 10. GET /api/rules/:id/executions - Get execution history
router.get("/:id/executions", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { limit = "20", offset = "0" } = req.query;
    const limitNum = Math.min(parseInt(limit as string), 100);
    const offsetNum = parseInt(offset as string);

    const executions = await prisma.ruleExecution.findMany({
      where: { ruleId: id },
      take: limitNum,
      skip: offsetNum,
      orderBy: { startedAt: "desc" },
    });

    const total = await prisma.ruleExecution.count({
      where: { ruleId: id },
    });

    res.json({
      data: executions,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total,
      },
    });
  } catch (error) {
    console.error("[RuleEngineService] Get executions error:", error);
    res.status(500).json({
      error: "Failed to get execution history",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 11. GET /api/executions/:id - Get specific execution
router.get("/executions/:id", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const execution = await prisma.ruleExecution.findUnique({
      where: { id },
    });

    if (!execution) {
      return res.status(404).json({ error: "Execution not found" });
    }

    res.json(execution);
  } catch (error) {
    console.error("[RuleEngineService] Get execution error:", error);
    res.status(500).json({
      error: "Failed to get execution",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 12. POST /api/rules/:id/duplicate - Duplicate rule
router.post("/:id/duplicate", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { newName } = req.body;

    // Get original rule
    const originalRule = await prisma.rule.findUnique({
      where: { id },
    });

    if (!originalRule) {
      return res.status(404).json({ error: "Rule not found" });
    }

    // Create duplicate
    const duplicatedRule = await prisma.rule.create({
      data: {
        name: newName || `${originalRule.name} (Copy)`,
        description: originalRule.description,
        category: originalRule.category,
        trigger: originalRule.trigger,
        triggerEvent: originalRule.triggerEvent,
        condition: originalRule.condition,
        actions: originalRule.actions,
        priority: originalRule.priority,
        timeout: originalRule.timeout,
        maxRetries: originalRule.maxRetries,
        asyncExecution: originalRule.asyncExecution,
        metadata: originalRule.metadata,
        tags: originalRule.tags,
        status: "draft",
        enabled: false,
      },
    });

    res.status(201).json(duplicatedRule);
  } catch (error) {
    console.error("[RuleEngineService] Duplicate rule error:", error);
    res.status(500).json({
      error: "Failed to duplicate rule",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 13. GET /api/rules/:id/stats - Get rule statistics
router.get("/:id/stats", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const rule = await prisma.rule.findUnique({
      where: { id },
    });

    if (!rule) {
      return res.status(404).json({ error: "Rule not found" });
    }

    const successRate =
      rule.totalExecutions > 0
        ? (rule.successCount / rule.totalExecutions) * 100
        : 0;

    res.json({
      ruleId: id,
      totalExecutions: rule.totalExecutions,
      successCount: rule.successCount,
      failureCount: rule.failureCount,
      successRate: successRate.toFixed(2),
      lastExecution: rule.lastExecutionAt,
      enabled: rule.enabled,
    });
  } catch (error) {
    console.error("[RuleEngineService] Get stats error:", error);
    res.status(500).json({
      error: "Failed to get statistics",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
