import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { prisma } from '../database/prisma.js';

const router: Router = Router();

function qsString(val: any): string | undefined {
  return typeof val === 'string' ? val : undefined;
}

function buildMeta(page: number, pageSize: number, totalItems: number) {
  const totalPages = Math.ceil(totalItems / pageSize);
  return { page, pageSize, totalItems, totalPages };
}

// ---------------------------------------------------------------------------
// AGENTS
// ---------------------------------------------------------------------------

router.get('/agents', authenticateToken, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 50, 100);
  const tenantId = qsString(req.query.tenantId);
  const status = qsString(req.query.status);
  const role = qsString(req.query.role);
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (tenantId) where.tenantId = tenantId;
  if (status) where.status = status;
  if (role) where.role = role;

  const [data, totalItems] = await Promise.all([
    prisma.callCenterAgent.findMany({ where, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
    prisma.callCenterAgent.count({ where }),
  ]);

  res.json({ data, meta: buildMeta(page, pageSize, totalItems) });
}));

router.get('/agents/:id', authenticateToken, asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const agent = await prisma.callCenterAgent.findUnique({ where: { id } });

  if (!agent) {
    const error: any = new Error('Agent not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  res.json({ data: agent });
}));

router.post('/agents', authenticateToken, asyncHandler(async (req, res) => {
  const {
    tenantId,
    username,
    email,
    name,
    role = 'AGENT',
    password,
    status = 'OFFLINE',
    skills = [],
    languages = [],
    maxConcurrentCalls = 1,
    isActive = true
  } = req.body;

  if (!username || !email || !name || !password) {
    const error: any = new Error('Missing required fields: username, email, name, password');
    error.status = 400;
    error.code = 'VALIDATION_FAILED';
    throw error;
  }

  const bcrypt = await import('bcrypt');
  const passwordHash = await bcrypt.hash(password, 12);

  const agent = await prisma.callCenterAgent.create({
    data: {
      tenantId, username, email, name, role, passwordHash, status,
      skills, languages, maxConcurrentCalls, isActive,
    },
  });

  res.status(201).json({ data: agent });
}));

router.put('/agents/:id', authenticateToken, asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const { status, role, skills, languages, maxConcurrentCalls, isActive, lastLoginAt } = req.body;

  const updates: any = {};
  if (status !== undefined) updates.status = status;
  if (role !== undefined) updates.role = role;
  if (skills !== undefined) updates.skills = skills;
  if (languages !== undefined) updates.languages = languages;
  if (maxConcurrentCalls !== undefined) updates.maxConcurrentCalls = maxConcurrentCalls;
  if (isActive !== undefined) updates.isActive = isActive;
  if (lastLoginAt !== undefined) updates.lastLoginAt = lastLoginAt;

  if (Object.keys(updates).length === 0) {
    const error: any = new Error('No fields to update');
    error.status = 400;
    error.code = 'VALIDATION_FAILED';
    throw error;
  }

  const existing = await prisma.callCenterAgent.findUnique({ where: { id } });
  if (!existing) {
    const error: any = new Error('Agent not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const agent = await prisma.callCenterAgent.update({ where: { id }, data: updates });
  res.json({ data: agent });
}));

// ---------------------------------------------------------------------------
// QUEUES
// ---------------------------------------------------------------------------

router.get('/queues', authenticateToken, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 50, 100);
  const tenantId = qsString(req.query.tenantId);
  const status = qsString(req.query.status);
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (tenantId) where.tenantId = tenantId;
  if (status) where.status = status;

  const [data, totalItems] = await Promise.all([
    prisma.callQueue.findMany({ where, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
    prisma.callQueue.count({ where }),
  ]);

  res.json({ data, meta: buildMeta(page, pageSize, totalItems) });
}));

router.get('/queues/:id', authenticateToken, asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const queue = await prisma.callQueue.findUnique({ where: { id } });

  if (!queue) {
    const error: any = new Error('Queue not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  res.json({ data: queue });
}));

router.post('/queues', authenticateToken, asyncHandler(async (req, res) => {
  const { tenantId, name, code, description, priority = 0, status = 'ACTIVE', slaTimeout = 300 } = req.body;

  if (!name || !code) {
    const error: any = new Error('Missing required fields: name, code');
    error.status = 400;
    error.code = 'VALIDATION_FAILED';
    throw error;
  }

  const queue = await prisma.callQueue.create({
    data: { tenantId, name, code, description, priority, status, slaTimeout },
  });

  res.status(201).json({ data: queue });
}));

router.put('/queues/:id', authenticateToken, asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const { name, description, priority, status, slaTimeout } = req.body;

  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (priority !== undefined) updates.priority = priority;
  if (status !== undefined) updates.status = status;
  if (slaTimeout !== undefined) updates.slaTimeout = slaTimeout;

  if (Object.keys(updates).length === 0) {
    const error: any = new Error('No fields to update');
    error.status = 400;
    error.code = 'VALIDATION_FAILED';
    throw error;
  }

  const existing = await prisma.callQueue.findUnique({ where: { id } });
  if (!existing) {
    const error: any = new Error('Queue not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const queue = await prisma.callQueue.update({ where: { id }, data: updates });
  res.json({ data: queue });
}));

// ---------------------------------------------------------------------------
// CALLS
// ---------------------------------------------------------------------------

router.get('/calls', authenticateToken, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 50, 100);
  const queueId = qsString(req.query.queueId);
  const agentId = qsString(req.query.agentId);
  const status = qsString(req.query.status);
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (queueId) where.queueId = queueId;
  if (agentId) where.agentId = agentId;
  if (status) where.status = status;

  const [data, totalItems] = await Promise.all([
    prisma.call.findMany({ where, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
    prisma.call.count({ where }),
  ]);

  res.json({ data, meta: buildMeta(page, pageSize, totalItems) });
}));

router.get('/calls/:id', authenticateToken, asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const call = await prisma.call.findUnique({ where: { id } });

  if (!call) {
    const error: any = new Error('Call not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  res.json({ data: call });
}));

router.post('/calls', authenticateToken, asyncHandler(async (req, res) => {
  const {
    queueId, agentId, callId, direction = 'INBOUND', status = 'WAITING',
    callerNumber, callerName, callerEmail, duration = 0, waitTime = 0,
    talkTime = 0, startedAt, answeredAt, endedAt, recordingUrl, disposition, remarks
  } = req.body;

  if (!callId || !direction || !status) {
    const error: any = new Error('Missing required fields: callId, direction, status');
    error.status = 400;
    error.code = 'VALIDATION_FAILED';
    throw error;
  }

  const call = await prisma.call.create({
    data: {
      queueId, agentId, callId, direction, status, callerNumber, callerName, callerEmail,
      duration, waitTime, talkTime, startedAt, answeredAt, endedAt, recordingUrl, disposition, remarks,
    },
  });

  res.status(201).json({ data: call });
}));

router.put('/calls/:id', authenticateToken, asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const { queueId, agentId, status, duration, waitTime, talkTime, startedAt, answeredAt, endedAt, recordingUrl, disposition, remarks } = req.body;

  const updates: any = {};
  if (queueId !== undefined) updates.queueId = queueId;
  if (agentId !== undefined) updates.agentId = agentId;
  if (status !== undefined) updates.status = status;
  if (duration !== undefined) updates.duration = duration;
  if (waitTime !== undefined) updates.waitTime = waitTime;
  if (talkTime !== undefined) updates.talkTime = talkTime;
  if (startedAt !== undefined) updates.startedAt = startedAt;
  if (answeredAt !== undefined) updates.answeredAt = answeredAt;
  if (endedAt !== undefined) updates.endedAt = endedAt;
  if (recordingUrl !== undefined) updates.recordingUrl = recordingUrl;
  if (disposition !== undefined) updates.disposition = disposition;
  if (remarks !== undefined) updates.remarks = remarks;

  if (Object.keys(updates).length === 0) {
    const error: any = new Error('No fields to update');
    error.status = 400;
    error.code = 'VALIDATION_FAILED';
    throw error;
  }

  const existing = await prisma.call.findUnique({ where: { id } });
  if (!existing) {
    const error: any = new Error('Call not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const call = await prisma.call.update({ where: { id }, data: updates });
  res.json({ data: call });
}));

// ---------------------------------------------------------------------------
// INTERACTIONS
// ---------------------------------------------------------------------------

router.get('/interactions', authenticateToken, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 50, 100);
  const callId = qsString(req.query.callId);
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (callId) where.callId = callId;

  const [data, totalItems] = await Promise.all([
    prisma.callInteraction.findMany({ where, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
    prisma.callInteraction.count({ where }),
  ]);

  res.json({ data, meta: buildMeta(page, pageSize, totalItems) });
}));

router.get('/interactions/:id', authenticateToken, asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const interaction = await prisma.callInteraction.findUnique({ where: { id } });

  if (!interaction) {
    const error: any = new Error('Interaction not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  res.json({ data: interaction });
}));

router.post('/interactions', authenticateToken, asyncHandler(async (req, res) => {
  const { callId, agentId, type = 'NOTE', content, agentName } = req.body;

  if (!callId || !type || !content) {
    const error: any = new Error('Missing required fields: callId, type, content');
    error.status = 400;
    error.code = 'VALIDATION_FAILED';
    throw error;
  }

  const interaction = await prisma.callInteraction.create({
    data: { callId, agentId, type, content, agentName },
  });

  res.status(201).json({ data: interaction });
}));

router.put('/interactions/:id', authenticateToken, asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const { type, content, agentName } = req.body;

  const updates: any = {};
  if (type !== undefined) updates.type = type;
  if (content !== undefined) updates.content = content;
  if (agentName !== undefined) updates.agentName = agentName;

  if (Object.keys(updates).length === 0) {
    const error: any = new Error('No fields to update');
    error.status = 400;
    error.code = 'VALIDATION_FAILED';
    throw error;
  }

  const existing = await prisma.callInteraction.findUnique({ where: { id } });
  if (!existing) {
    const error: any = new Error('Interaction not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const interaction = await prisma.callInteraction.update({ where: { id }, data: updates });
  res.json({ data: interaction });
}));

// Soft Deletes

router.delete('/agents/:id', authenticateToken, asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const existing = await prisma.callCenterAgent.findUnique({ where: { id } });
  if (!existing) {
    const error: any = new Error('Agent not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }
  await prisma.callCenterAgent.update({ where: { id }, data: { isActive: false } });
  res.json({ success: true, message: 'Agent deactivated' });
}));

router.delete('/queues/:id', authenticateToken, asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const existing = await prisma.callQueue.findUnique({ where: { id } });
  if (!existing) {
    const error: any = new Error('Queue not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }
  await prisma.callQueue.update({ where: { id }, data: { status: 'INACTIVE' } });
  res.json({ success: true, message: 'Queue deactivated' });
}));

router.delete('/calls/:id', authenticateToken, asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const existing = await prisma.call.findUnique({ where: { id } });
  if (!existing) {
    const error: any = new Error('Call not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }
  await prisma.call.update({ where: { id }, data: { status: 'ABANDONED' } });
  res.json({ success: true, message: 'Call abandoned' });
}));

router.delete('/interactions/:id', authenticateToken, asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const existing = await prisma.callInteraction.findUnique({ where: { id } });
  if (!existing) {
    const error: any = new Error('Interaction not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }
  await prisma.callInteraction.delete({ where: { id } });
  res.json({ success: true, message: 'Interaction deleted' });
}));

// Nested: interactions inside a call
router.get('/calls/:callId/interactions', authenticateToken, asyncHandler(async (req, res) => {
  const callId = req.params.callId as string;
  const data = await prisma.callInteraction.findMany({ where: { callId }, orderBy: { createdAt: 'desc' } });
  res.json({ data });
}));

// Call Queue Assignments
router.get('/call-queue-assignments', authenticateToken, asyncHandler(async (req, res) => {
  const agentId = qsString(req.query.agentId);
  const queueId = qsString(req.query.queueId);
  const where: any = {};
  if (agentId) where.agentId = agentId;
  if (queueId) where.queueId = queueId;
  const data = await prisma.callQueueAssignment.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json({ data });
}));

router.get('/call-queue-assignments/:id', authenticateToken, asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const assignment = await prisma.callQueueAssignment.findUnique({ where: { id } });
  if (!assignment) {
    const error: any = new Error('Call queue assignment not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }
  res.json({ data: assignment });
}));

router.post('/call-queue-assignments', authenticateToken, asyncHandler(async (req, res) => {
  const { agentId, queueId, priority, isActive } = req.body;
  if (!agentId || !queueId) {
    const error: any = new Error('Missing required fields: agentId, queueId');
    error.status = 400;
    error.code = 'VALIDATION_FAILED';
    throw error;
  }
  const assignment = await prisma.callQueueAssignment.create({
    data: { agentId, queueId, priority: priority ?? 0, isActive: isActive ?? true },
  });
  res.status(201).json({ data: assignment });
}));

router.delete('/call-queue-assignments/:id', authenticateToken, asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const existing = await prisma.callQueueAssignment.findUnique({ where: { id } });
  if (!existing) {
    const error: any = new Error('Call queue assignment not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }
  await prisma.callQueueAssignment.delete({ where: { id } });
  res.json({ success: true, message: 'Assignment removed' });
}));

// ============================================================
// Support Tickets
// ============================================================
router.get('/support-tickets', authenticateToken, asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;
  const skip = (page - 1) * limit;
  const status = qsString(req.query.status);

  const where: any = {};
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { messages: true },
    }),
    prisma.supportTicket.count({ where }),
  ]);

  res.json({ data, total, page, limit });
}));

router.post('/support-tickets', authenticateToken, asyncHandler(async (req, res) => {
  const { subject, description, priority, tenantId, userId, assignedTo, relatedTo } = req.body;
  if (!subject || !description) {
    const error: any = new Error('Subject and description are required');
    error.status = 400;
    error.code = 'VALIDATION_FAILED';
    throw error;
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      subject,
      description,
      priority: priority ?? 'MEDIUM',
      tenantId,
      userId,
      assignedTo,
      relatedTo,
      status: 'OPEN',
    },
  });

  res.status(201).json({ data: ticket });
}));

router.put('/support-tickets/:id', authenticateToken, asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  const { subject, description, priority, status, tenantId, userId, assignedTo, relatedTo } = req.body;
  const updates: any = {};

  if (subject !== undefined) updates.subject = subject;
  if (description !== undefined) updates.description = description;
  if (priority !== undefined) updates.priority = priority;
  if (status !== undefined) updates.status = status;
  if (tenantId !== undefined) updates.tenantId = tenantId;
  if (userId !== undefined) updates.userId = userId;
  if (assignedTo !== undefined) updates.assignedTo = assignedTo;
  if (relatedTo !== undefined) updates.relatedTo = relatedTo;

  if (Object.keys(updates).length === 0) {
    const error: any = new Error('No fields to update');
    error.status = 400;
    error.code = 'VALIDATION_FAILED';
    throw error;
  }

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: updates,
  });

  res.json({ data: ticket });
}));


router.delete('/support-tickets/:id', authenticateToken, asyncHandler(async (req, res) => {
  const id = req.params.id as string;
  await prisma.supportTicket.update({
    where: { id },
    data: { status: 'ARCHIVED' },
  });
  res.json({ success: true, message: 'Ticket archived' });
}));

export default router;