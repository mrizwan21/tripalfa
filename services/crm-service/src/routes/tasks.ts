import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router: Router = Router();

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedTo?: string;
  dueDate?: string;
  relatedTo?: { type: 'CONTACT' | 'BOOKING'; id: string };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Mock database
const tasks: Map<string, Task> = new Map();

/**
 * @swagger
 * /api/crm/tasks:
 *   get:
 *     summary: List all tasks
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *       - in: query
 *         name: assignedTo
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
 *                   type: array
 *                 count:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { status, priority, assignedTo } = req.query;
    let filtered = Array.from(tasks.values());

    if (status) filtered = filtered.filter(t => t.status === status);
    if (priority) filtered = filtered.filter(t => t.priority === priority);
    if (assignedTo) filtered = filtered.filter(t => t.assignedTo === assignedTo);

    res.status(200).json({
      success: true,
      data: filtered,
      count: filtered.length,
    });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
  }
});

/**
 * @swagger
 * /api/crm/tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     tags: [Tasks]
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
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const task = tasks.get(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    res.status(200).json({ success: true, data: task });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to fetch task' });
  }
});

/**
 * @swagger
 * /api/crm/tasks:
 *   post:
 *     summary: Create task
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *               dueDate:
 *                 type: string
 *               relatedTo:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [CONTACT, BOOKING]
 *                   id:
 *                     type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Title required
 *       500:
 *         description: Server error
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const { title, description, priority = 'MEDIUM', dueDate, relatedTo, tags = [] } = req.body;

    if (!title) return res.status(400).json({ success: false, error: 'Title required' });

    const task: Task = {
      id: uuidv4(),
      title,
      description,
      status: 'TODO',
      priority,
      dueDate,
      relatedTo,
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    tasks.set(task.id, task);

    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully',
    });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to create task' });
  }
});

/**
 * @swagger
 * /api/crm/tasks/{id}:
 *   put:
 *     summary: Update task
 *     tags: [Tasks]
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
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, COMPLETED, CANCELLED]
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *               assignedTo:
 *                 type: string
 *               dueDate:
 *                 type: string
 *               relatedTo:
 *                 type: object
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.put('/:id', (req: Request, res: Response) => {
  try {
    const task = tasks.get(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });

    const updated: Task = {
      ...task,
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    tasks.set(req.params.id, updated);

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Task updated successfully',
    });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to update task' });
  }
});

/**
 * @swagger
 * /api/crm/tasks/{id}/status:
 *   patch:
 *     summary: Update task status
 *     tags: [Tasks]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: Task status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/status', (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const task = tasks.get(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });

    task.status = status;
    task.updatedAt = new Date().toISOString();

    res.status(200).json({
      success: true,
      data: task,
      message: 'Task status updated',
    });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to update task status' });
  }
});

/**
 * @swagger
 * /api/crm/tasks/{id}:
 *   delete:
 *     summary: Delete task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    if (!tasks.has(req.params.id)) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    tasks.delete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to delete task' });
  }
});

export default router;
