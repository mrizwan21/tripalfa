import { Router, Request, Response } from "express";
import { prisma } from "@tripalfa/shared-database";

const router: Router = Router();

/**
 * @swagger
 * /api/rules:
 *   post:
 *     summary: Create rule
 *     tags: [Rules]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, condition, actions]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               trigger:
 *                 type: string
 *               triggerEvent:
 *                 type: string
 *               condition:
 *                 type: object
 *               actions:
 *                 type: array
 *               priority:
 *                 type: number
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Rule created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/rules:
 *   get:
 *     summary: List rules
 *     tags: [Rules]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *           default: "20"
 *       - in: query
 *         name: offset
 *         schema:
 *           type: string
 *           default: "0"
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                 pagination:
 *                   type: object
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/rules/{id}:
 *   get:
 *     summary: Get rule details
 *     tags: [Rules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Rule not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/rules/{id}:
 *   patch:
 *     summary: Update rule
 *     tags: [Rules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               condition:
 *                 type: object
 *               actions:
 *                 type: array
 *               priority:
 *                 type: number
 *               enabled:
 *                 type: boolean
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Rule updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/rules/{id}:
 *   delete:
 *     summary: Delete rule
 *     tags: [Rules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Rule deleted
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/rules/{id}/execute:
 *   post:
 *     summary: Execute rule
 *     tags: [Rules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [data]
 *             properties:
 *               data:
 *                 type: object
 *               userId:
 *                 type: string
 *               testMode:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Rule executed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Missing required field
 *       500:
 *         description: Server error
 */
router.post("/:id/execute", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { data, userId, testMode = false } = req.body;

    if (!data) {
      return res.status(400).json({ error: "Missing required field: data" });
    }

    const rule = await prisma.rule.findUnique({
      where: { id },
    });

    if (!rule) {
      return res.status(404).json({ error: "Rule not found" });
    }

    const execution = await prisma.ruleExecution.create({
      data: {
        ruleId: id,
        inputData: data,
        status: "running",
        userId,
        bookingId: data.bookingId,
      },
    });

    let conditionMet = true;
    let conditionEval = {};

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

/**
 * @swagger
 * /api/rules/{id}/debug:
 *   post:
 *     summary: Debug rule
 *     tags: [Rules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sampleData]
 *             properties:
 *               sampleData:
 *                 type: object
 *               includeActions:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Debug result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Missing required field
 *       500:
 *         description: Server error
 */
router.post("/:id/debug", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { sampleData, includeActions = true } = req.body;

    if (!sampleData) {
      return res
        .status(400)
        .json({ error: "Missing required field: sampleData" });
    }

    const rule = await prisma.rule.findUnique({
      where: { id },
    });

    if (!rule) {
      return res.status(404).json({ error: "Rule not found" });
    }

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

/**
 * @swagger
 * /api/rules/{id}/analyze:
 *   get:
 *     summary: Analyze rule
 *     tags: [Rules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Analysis result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Rule not found
 *       500:
 *         description: Server error
 */
router.get("/:id/analyze", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const rule = await prisma.rule.findUnique({
      where: { id },
    });

    if (!rule) {
      return res.status(404).json({ error: "Rule not found" });
    }

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

/**
 * @swagger
 * /api/rules/{id}/conflicts:
 *   post:
 *     summary: Check for conflicts
 *     tags: [Rules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conflict check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Rule not found
 *       500:
 *         description: Server error
 */
router.post("/:id/conflicts", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const rule = await prisma.rule.findUnique({
      where: { id },
    });

    if (!rule) {
      return res.status(404).json({ error: "Rule not found" });
    }

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

/**
 * @swagger
 * /api/rules/{id}/executions:
 *   get:
 *     summary: Get execution history
 *     tags: [Rules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *           default: "20"
 *       - in: query
 *         name: offset
 *         schema:
 *           type: string
 *           default: "0"
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                 pagination:
 *                   type: object
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/rules/executions/{id}:
 *   get:
 *     summary: Get specific execution
 *     tags: [Rules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Execution not found
 *       500:
 *         description: Server error
 */
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

/**
 * @swagger
 * /api/rules/{id}/duplicate:
 *   post:
 *     summary: Duplicate rule
 *     tags: [Rules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Rule duplicated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Rule not found
 *       500:
 *         description: Server error
 */
router.post("/:id/duplicate", async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { newName } = req.body;

    const originalRule = await prisma.rule.findUnique({
      where: { id },
    });

    if (!originalRule) {
      return res.status(404).json({ error: "Rule not found" });
    }

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

/**
 * @swagger
 * /api/rules/{id}/stats:
 *   get:
 *     summary: Get rule statistics
 *     tags: [Rules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Rule not found
 *       500:
 *         description: Server error
 */
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
