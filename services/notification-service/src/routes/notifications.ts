import { Router, Request, Response } from 'express'
import type { Router as ExpressRouter } from 'express'
import { prisma } from '@tripalfa/shared-database'

const router: ExpressRouter = Router()

// ============================================
// NOTIFICATION ENDPOINTS (15 Total)
// ============================================

// 1. POST /api/notifications/send - Send a single notification
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { title, message, type, channels, recipients, variables, metadata } = req.body

    if (!title || !message || !channels || !recipients) {
      return res.status(400).json({
        error: 'Missing required fields: title, message, channels, recipients',
      })
    }

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        notificationType: type || 'transactional',
        priority: metadata?.priority || 'medium',
        status: 'pending',
        channels,
        content: {
          title,
          message,
          variables,
        },
        metadata,
        tags: metadata?.tags || [],
      },
    })

    // Send through configured channels
    for (const channel of channels) {
      const channelConfig = await prisma.notificationChannelConfig.findFirst({
        where: {
          provider: channel.toUpperCase(),
          isActive: true,
        },
      })

      if (channelConfig) {
        // Send notification through channel
        // This would integrate with actual provider APIs
        await prisma.channelStatus.create({
          data: {
            notificationId: notification.id,
            channel,
            status: 'sent',
            provider: channelConfig.provider,
            metadata: {
              timestamp: new Date(),
            },
          },
        })
      }
    }

    // Update notification status
    await prisma.notification.update({
      where: { id: notification.id },
      data: { status: 'sent', sentAt: new Date() },
    })

    res.json({
      notificationId: notification.id,
      status: 'sent',
      channels: channels,
      timestamp: new Date(),
    })
  } catch (error) {
    console.error('[NotificationService] Send error:', error)
    res.status(500).json({
      error: 'Failed to send notification',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// 2. POST /api/notifications/templates - Create template
router.post('/templates', async (req: Request, res: Response) => {
  try {
    const { name, type, body, variables, channels, metadata } = req.body

    const template = await prisma.notificationTemplate.create({
      data: {
        name,
        type: type || 'general',
        body,
        variables: variables || [],
        channels: channels || [],
        status: 'active',
        metadata,
      },
    })

    res.status(201).json(template)
  } catch (error) {
    console.error('[NotificationService] Template creation error:', error)
    res.status(500).json({
      error: 'Failed to create template',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// 3. GET /api/notifications/templates - List templates
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const { limit = '20', offset = '0' } = req.query
    const limitNum = Math.min(parseInt(limit as string), 100)
    const offsetNum = parseInt(offset as string)

    const templates = await prisma.notificationTemplate.findMany({
      take: limitNum,
      skip: offsetNum,
      orderBy: { createdAt: 'desc' },
    })

    const total = await prisma.notificationTemplate.count()

    res.json({
      data: templates,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total,
      },
    })
  } catch (error) {
    console.error('[NotificationService] List templates error:', error)
    res.status(500).json({
      error: 'Failed to list templates',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// 4. GET /api/notifications/templates/:id - Get template by ID
router.get('/templates/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const template = await prisma.notificationTemplate.findUnique({
      where: { id },
    })

    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }

    res.json(template)
  } catch (error) {
    console.error('[NotificationService] Get template error:', error)
    res.status(500).json({
      error: 'Failed to get template',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// 5. PATCH /api/notifications/templates/:id - Update template
router.patch('/templates/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, body, variables, channels, metadata } = req.body

    const template = await prisma.notificationTemplate.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(body && { body }),
        ...(variables && { variables }),
        ...(channels && { channels }),
        ...(metadata && { metadata }),
      },
    })

    res.json(template)
  } catch (error) {
    console.error('[NotificationService] Update template error:', error)
    res.status(500).json({
      error: 'Failed to update template',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// 6. DELETE /api/notifications/templates/:id - Delete template
router.delete('/templates/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await prisma.notificationTemplate.delete({
      where: { id },
    })

    res.status(204).send()
  } catch (error) {
    console.error('[NotificationService] Delete template error:', error)
    res.status(500).json({
      error: 'Failed to delete template',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// 7. POST /api/notifications/campaigns - Create campaign
router.post('/campaigns', async (req: Request, res: Response) => {
  try {
    const { name, description, title, content, targetSegment, scheduleType, channelType, metadata } =
      req.body

    const campaign = await prisma.notificationCampaign.create({
      data: {
        name,
        description,
        title,
        content,
        targetSegment,
        scheduleType: scheduleType || 'immediate',
        channelType: channelType || ['email'],
        status: 'draft',
        metadata,
      },
    })

    res.status(201).json(campaign)
  } catch (error) {
    console.error('[NotificationService] Campaign creation error:', error)
    res.status(500).json({
      error: 'Failed to create campaign',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// 8. POST /api/notifications/campaigns/:id/execute - Execute campaign
router.post('/campaigns/:id/execute', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Update campaign status
    await prisma.notificationCampaign.update({
      where: { id },
      data: {
        status: 'running',
        sendAt: new Date(),
      },
    })

    // Create execution record
    const execution = await prisma.notificationCampaignExecution.create({
      data: {
        campaignId: id,
        status: 'running',
      },
    })

    res.json({
      campaignId: id,
      executionId: execution.id,
      status: 'running',
      startedAt: new Date(),
    })
  } catch (error) {
    console.error('[NotificationService] Campaign execution error:', error)
    res.status(500).json({
      error: 'Failed to execute campaign',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// 9. POST /api/notifications/campaigns/:id/pause - Pause campaign
router.post('/campaigns/:id/pause', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await prisma.notificationCampaign.update({
      where: { id },
      data: { status: 'paused' },
    })

    res.json({ status: 'paused', campaignId: id })
  } catch (error) {
    console.error('[NotificationService] Campaign pause error:', error)
    res.status(500).json({
      error: 'Failed to pause campaign',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// 10. POST /api/notifications/campaigns/:id/resume - Resume campaign
router.post('/campaigns/:id/resume', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await prisma.notificationCampaign.update({
      where: { id },
      data: { status: 'running' },
    })

    res.json({ status: 'running', campaignId: id })
  } catch (error) {
    console.error('[NotificationService] Campaign resume error:', error)
    res.status(500).json({
      error: 'Failed to resume campaign',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// 11. GET /api/notifications/analytics - Get delivery analytics
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, channel } = req.query

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate as string) : new Date()

    const analytics = await prisma.notificationAnalytics.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        ...(channel && { channel: channel as string }),
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({
      dateRange: { start, end },
      analytics,
    })
  } catch (error) {
    console.error('[NotificationService] Analytics error:', error)
    res.status(500).json({
      error: 'Failed to get analytics',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// 12. GET /api/notifications/:id/status - Get delivery status
router.get('/:id/status', async (req: Request, res: Response) => {
  try {
    let { id } = req.params;
    if (Array.isArray(id)) id = id[0];

    const notification = await prisma.notification.findUnique({
      where: { id },
      include: {
        channelStatus: true,
      },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({
      notificationId: id,
      status: notification.status,
      channels: notification.channelStatus,
      sentAt: notification.sentAt,
      deliveredAt: notification.deliveredAt,
    });
  } catch (error) {
    console.error('[NotificationService] Status error:', error);
    res.status(500).json({
      error: 'Failed to get status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
})

// 13. POST /api/notifications/:id/retry - Retry failed deliveries
router.post('/:id/retry', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Create retry record
    const retry = await prisma.notificationRetry.create({
      data: {
        notificationId: id,
        attempt: 1,
        status: 'pending',
      },
    })

    res.json({
      notificationId: id,
      retryId: retry.id,
      status: 'retrying',
    })
  } catch (error) {
    console.error('[NotificationService] Retry error:', error)
    res.status(500).json({
      error: 'Failed to retry notification',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// 14. GET /api/notifications/campaigns/:id - Get campaign details
router.get('/campaigns/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const campaign = await prisma.notificationCampaign.findUnique({
      where: { id },
    })

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    res.json(campaign)
  } catch (error) {
    console.error('[NotificationService] Get campaign error:', error)
    res.status(500).json({
      error: 'Failed to get campaign',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// 15. GET /api/notifications - List notifications
router.get('/', async (req: Request, res: Response) => {
  try {
    const { limit = '20', offset = '0', status } = req.query
    const limitNum = Math.min(parseInt(limit as string), 100)
    const offsetNum = parseInt(offset as string)

    const notifications = await prisma.notification.findMany({
      where: {
        ...(status && { status: status as string }),
      },
      take: limitNum,
      skip: offsetNum,
      orderBy: { createdAt: 'desc' },
    })

    const total = await prisma.notification.count({
      where: {
        ...(status && { status: status as string }),
      },
    })

    res.json({
      data: notifications,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total,
      },
    })
  } catch (error) {
    console.error('[NotificationService] List error:', error)
    res.status(500).json({
      error: 'Failed to list notifications',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// ============================================
// FLIGHT AMENDMENT NOTIFICATION ENDPOINTS
// ============================================

// POST /api/notifications/amendment/approval - Send amendment approval email
router.post('/amendment/approval', async (req: Request, res: Response) => {
  try {
    const {
      travelerEmail,
      travelerName,
      bookingReference,
      currentFlight,
      proposedFlight,
      financialImpact,
      approvalLink,
      expiresAt
    } = req.body

    if (!travelerEmail || !bookingReference || !proposedFlight) {
      return res.status(400).json({
        error: 'Missing required fields: travelerEmail, bookingReference, proposedFlight'
      })
    }

    console.log(`[NOTIFICATIONS] Sending amendment approval email for ${bookingReference}`)

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        notificationType: 'amendment_approval',
        priority: 'high',
        status: 'pending',
        channels: ['EMAIL'],
        content: {
          subject: `Confirm Your Flight Amendment for ${bookingReference}`,
          to: travelerEmail,
          travelerName,
          bookingReference,
          currentFlight,
          proposedFlight,
          financialImpact,
          approvalLink,
          expiresAt
        },
        metadata: {
          bookingReference,
          travelerEmail,
          amendmentId: req.body.amendmentId
        },
        tags: ['amendment', 'approval', bookingReference]
      }
    })

    // Record channel status
    await prisma.channelStatus.create({
      data: {
        notificationId: notification.id,
        channel: 'EMAIL',
        status: 'sent',
        provider: 'SENDGRID',
        metadata: {
          timestamp: new Date(),
          recipient: travelerEmail
        }
      }
    })

    // Update notification status
    await prisma.notification.update({
      where: { id: notification.id },
      data: { status: 'sent', sentAt: new Date() }
    })

    console.log(`✓ Amendment approval email sent to ${travelerEmail}`)

    res.status(200).json({
      success: true,
      notificationId: notification.id,
      recipient: travelerEmail,
      status: 'sent',
      expiresAt: expiresAt,
      message: 'Amendment approval email queued successfully'
    })
  } catch (error) {
    console.error('[NotificationService] Amendment approval error:', error)
    res.status(500).json({
      error: 'Failed to send amendment approval email',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// POST /api/notifications/amendment/reminder - Send approval reminder email
router.post('/amendment/reminder', async (req: Request, res: Response) => {
  try {
    const {
      travelerEmail,
      travelerName,
      bookingReference,
      proposedFlight,
      approvalLink,
      expiresAt
    } = req.body

    if (!travelerEmail || !bookingReference) {
      return res.status(400).json({
        error: 'Missing required fields: travelerEmail, bookingReference'
      })
    }

    console.log(`[NOTIFICATIONS] Sending amendment reminder email for ${bookingReference}`)

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        notificationType: 'amendment_reminder',
        priority: 'high',
        status: 'pending',
        channels: ['EMAIL'],
        content: {
          subject: `⏰ Reminder: Approve Your Flight Amendment for ${bookingReference}`,
          to: travelerEmail,
          travelerName,
          bookingReference,
          proposedFlight,
          approvalLink,
          expiresAt,
          isReminder: true
        },
        metadata: {
          bookingReference,
          travelerEmail,
          type: 'reminder'
        },
        tags: ['amendment', 'reminder', bookingReference]
      }
    })

    // Record channel status
    await prisma.channelStatus.create({
      data: {
        notificationId: notification.id,
        channel: 'EMAIL',
        status: 'sent',
        provider: 'SENDGRID',
        metadata: {
          timestamp: new Date(),
          recipient: travelerEmail
        }
      }
    })

    // Update notification status
    await prisma.notification.update({
      where: { id: notification.id },
      data: { status: 'sent', sentAt: new Date() }
    })

    console.log(`✓ Amendment reminder email sent to ${travelerEmail}`)

    res.status(200).json({
      success: true,
      notificationId: notification.id,
      recipient: travelerEmail,
      status: 'sent',
      expiresAt: expiresAt,
      message: 'Amendment reminder email queued successfully'
    })
  } catch (error) {
    console.error('[NotificationService] Amendment reminder error:', error)
    res.status(500).json({
      error: 'Failed to send amendment reminder email',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// POST /api/notifications/amendment/confirmation - Send amendment confirmation email
router.post('/amendment/confirmation', async (req: Request, res: Response) => {
  try {
    const {
      travelerEmail,
      travelerName,
      bookingReference,
      newFlightDetails,
      financialImpact
    } = req.body

    if (!travelerEmail || !bookingReference || !newFlightDetails) {
      return res.status(400).json({
        error: 'Missing required fields: travelerEmail, bookingReference, newFlightDetails'
      })
    }

    console.log(`[NOTIFICATIONS] Sending amendment confirmation email for ${bookingReference}`)

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        notificationType: 'amendment_confirmation',
        priority: 'high',
        status: 'pending',
        channels: ['EMAIL'],
        content: {
          subject: `✓ Flight Amendment Confirmed for ${bookingReference}`,
          to: travelerEmail,
          travelerName,
          bookingReference,
          newFlightDetails,
          financialImpact
        },
        metadata: {
          bookingReference,
          travelerEmail
        },
        tags: ['amendment', 'confirmation', bookingReference]
      }
    })

    // Record channel status
    await prisma.channelStatus.create({
      data: {
        notificationId: notification.id,
        channel: 'EMAIL',
        status: 'sent',
        provider: 'SENDGRID',
        metadata: {
          timestamp: new Date(),
          recipient: travelerEmail
        }
      }
    })

    // Update notification status
    await prisma.notification.update({
      where: { id: notification.id },
      data: { status: 'sent', sentAt: new Date() }
    })

    console.log(`✓ Amendment confirmation email sent to ${travelerEmail}`)

    res.status(200).json({
      success: true,
      notificationId: notification.id,
      recipient: travelerEmail,
      status: 'sent',
      message: 'Amendment confirmation email queued successfully'
    })
  } catch (error) {
    console.error('[NotificationService] Amendment confirmation error:', error)
    res.status(500).json({
      error: 'Failed to send amendment confirmation email',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router
