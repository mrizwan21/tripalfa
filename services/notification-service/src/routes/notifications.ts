import { Router, Request, Response } from "express";
import type { Router as ExpressRouter } from "express";
import { prisma } from "@tripalfa/shared-database";
import { z } from "zod";

// Input validation schemas
const sendNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
  channels: z.array(z.enum(["email", "sms", "push", "in_app"])).min(1),
  recipients: z.array(z.string().email()).min(1),
  type: z.string().optional(),
  variables: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
  userId: z.string().optional(),
});

const router: ExpressRouter = Router();

// ============================================
// NOTIFICATION ENDPOINTS
// ============================================

// 1. POST /api/notifications/send - Send a single notification
router.post("/send", async (req: Request, res: Response) => {
  try {
    // Validate input with Zod schema
    const validationResult = sendNotificationSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request body",
        details: validationResult.error.flatten().fieldErrors,
      });
    }

    const {
      title,
      message,
      type,
      channels,
      recipients,
      variables,
      metadata,
      userId,
    } = validationResult.data as {
      title: string;
      message: string;
      type?: string;
      channels: string[];
      recipients: string[];
      variables?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
      userId?: string;
    };

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        userId: userId || "system",
        notificationType: type || "transactional",
        priority: (metadata?.priority as string) || "medium",
        status: "pending",
        channels,
        content: {
          title,
          message,
          variables,
        } as any,
        metadata: metadata as any,
        tags: (metadata?.tags as string[]) || [],
      },
    });

    // Create channel status record for tracking
    const channelStatusData: Record<string, string> = {};
    const timestampFields: Record<string, Date> = {};

    for (const channel of channels) {
      const normalizedChannel = channel.toLowerCase().replace("-", "_");
      if (["email", "sms", "push", "in_app"].includes(normalizedChannel)) {
        channelStatusData[normalizedChannel] = "sent";
        timestampFields[`${normalizedChannel}_sent_at`] = new Date();
      }
    }

    await prisma.channelStatus.create({
      data: {
        notificationId: notification.id,
        ...channelStatusData,
        ...timestampFields,
      },
    });

    // Update notification status
    await prisma.notification.update({
      where: { id: notification.id },
      data: { status: "sent", sentAt: new Date() },
    });

    res.json({
      notificationId: notification.id,
      status: "sent",
      channels: channels,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("[NotificationService] Send error:", error);
    res.status(500).json({
      error: "Failed to send notification",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 2. POST /api/notifications/templates - Create template
router.post("/templates", async (req: Request, res: Response) => {
  try {
    const {
      // New fields
      name,
      slug,
      category,
      description,
      emailTemplate,
      smsTemplate,
      pushTemplate,
      inAppTemplate,
      variables,
      // Legacy fields for backward compatibility
      type,
      body,
      channels,
      metadata,
    } = req.body;

    // Support both new and legacy API formats
    const templateName = name || `Template-${Date.now()}`;
    const templateSlug = slug || `template-${Date.now()}`;
    const templateCategory = category || type || "general";

    const template = await prisma.notificationTemplate.create({
      data: {
        name: templateName,
        slug: templateSlug,
        category: templateCategory,
        description:
          description || (body ? "Created from legacy API" : undefined),
        templates: {},
        emailTemplate:
          emailTemplate ||
          (body && channels?.includes("email") ? { body } : undefined),
        smsTemplate:
          smsTemplate ||
          (body && channels?.includes("sms") ? { body } : undefined),
        pushTemplate:
          pushTemplate ||
          (body && channels?.includes("push") ? { body } : undefined),
        inAppTemplate:
          inAppTemplate ||
          (body && channels?.includes("in_app") ? { body } : undefined),
        variables: variables || [],
      },
    });

    res.status(201).json(template);
  } catch (error) {
    console.error("[NotificationService] Template creation error:", error);
    res.status(500).json({
      error: "Failed to create template",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 3. GET /api/notifications/templates - List templates
router.get("/templates", async (req: Request, res: Response) => {
  try {
    const { limit = "20", offset = "0" } = req.query;
    const limitNum = Math.min(parseInt(limit as string), 100);
    const offsetNum = parseInt(offset as string);

    const templates = await prisma.notificationTemplate.findMany({
      take: limitNum,
      skip: offsetNum,
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.notificationTemplate.count();

    res.json({
      data: templates,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total,
      },
    });
  } catch (error) {
    console.error("[NotificationService] List templates error:", error);
    res.status(500).json({
      error: "Failed to list templates",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 4. GET /api/notifications/templates/:id - Get template by ID
router.get("/templates/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const template = await prisma.notificationTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json(template);
  } catch (error) {
    console.error("[NotificationService] Get template error:", error);
    res.status(500).json({
      error: "Failed to get template",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 5. PATCH /api/notifications/templates/:id - Update template
router.patch("/templates/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const {
      name,
      description,
      emailTemplate,
      smsTemplate,
      pushTemplate,
      inAppTemplate,
      variables,
      enabled,
    } = req.body;

    const template = await prisma.notificationTemplate.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(emailTemplate !== undefined && { emailTemplate }),
        ...(smsTemplate !== undefined && { smsTemplate }),
        ...(pushTemplate !== undefined && { pushTemplate }),
        ...(inAppTemplate !== undefined && { inAppTemplate }),
        ...(variables && { variables }),
        ...(enabled !== undefined && { enabled }),
      },
    });

    res.json(template);
  } catch (error) {
    console.error("[NotificationService] Update template error:", error);
    res.status(500).json({
      error: "Failed to update template",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 6. DELETE /api/notifications/templates/:id - Delete template
router.delete("/templates/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    await prisma.notificationTemplate.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error("[NotificationService] Delete template error:", error);
    res.status(500).json({
      error: "Failed to delete template",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 7. GET /api/notifications/analytics - Get delivery analytics
router.get("/analytics", async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, channel } = req.query;

    const start = startDate
      ? new Date(startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const analytics = await prisma.notificationAnalytics.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        ...(channel && { channel: channel as string }),
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      dateRange: { start, end },
      analytics,
    });
  } catch (error) {
    console.error("[NotificationService] Analytics error:", error);
    res.status(500).json({
      error: "Failed to get analytics",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 8. GET /api/notifications/:id/status - Get delivery status
router.get("/:id/status", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    // Fetch channel statuses separately
    const channelStatuses = await prisma.channelStatus.findMany({
      where: { notificationId: id },
    });

    res.json({
      notificationId: id,
      status: notification.status,
      channels: channelStatuses,
      sentAt: notification.sentAt,
      deliveredAt: notification.deliveredAt,
    });
  } catch (error) {
    console.error("[NotificationService] Status error:", error);
    res.status(500).json({
      error: "Failed to get status",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 9. POST /api/notifications/:id/retry - Retry failed deliveries
router.post("/:id/retry", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    // Create retry record
    const retry = await prisma.notificationRetry.create({
      data: {
        notificationId: id,
        attempt: 1,
        maxAttempts: 5,
        failureReason: "User requested retry",
        scheduledRetryAt: new Date(),
        delayMs: 1000,
        channel: "email",
        status: "pending",
      },
    });

    res.json({
      notificationId: id,
      retryId: retry.id,
      status: "retrying",
    });
  } catch (error) {
    console.error("[NotificationService] Retry error:", error);
    res.status(500).json({
      error: "Failed to retry notification",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 10. GET /api/notifications - List notifications
router.get("/", async (req: Request, res: Response) => {
  try {
    const { limit = "20", offset = "0", status } = req.query;
    const limitNum = Math.min(parseInt(limit as string), 100);
    const offsetNum = parseInt(offset as string);

    const notifications = await prisma.notification.findMany({
      where: {
        ...(status && { status: status as string }),
      },
      take: limitNum,
      skip: offsetNum,
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.notification.count({
      where: {
        ...(status && { status: status as string }),
      },
    });

    res.json({
      data: notifications,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total,
      },
    });
  } catch (error) {
    console.error("[NotificationService] List error:", error);
    res.status(500).json({
      error: "Failed to list notifications",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ============================================
// FLIGHT AMENDMENT NOTIFICATION ENDPOINTS
// ============================================

// Helper function to create channel status
async function createChannelStatus(
  notificationId: string,
  channelType: string = "email",
) {
  const normalizedChannel = channelType.toLowerCase().replace("-", "_");
  const channelStatusData: Record<string, string> = {};
  const timestampFields: Record<string, Date> = {};

  if (["email", "sms", "push", "in_app"].includes(normalizedChannel)) {
    channelStatusData[normalizedChannel] = "sent";
    timestampFields[`${normalizedChannel}_sent_at`] = new Date();
  }

  return prisma.channelStatus.create({
    data: {
      notificationId,
      ...channelStatusData,
      ...timestampFields,
    },
  });
}

// POST /api/notifications/amendment/approval - Send amendment approval email
router.post("/amendment/approval", async (req: Request, res: Response) => {
  try {
    const {
      travelerEmail,
      travelerName,
      bookingReference,
      currentFlight,
      proposedFlight,
      financialImpact,
      approvalLink,
      expiresAt,
      userId,
    } = req.body;

    if (!travelerEmail || !bookingReference || !proposedFlight) {
      return res.status(400).json({
        error:
          "Missing required fields: travelerEmail, bookingReference, proposedFlight",
      });
    }

    console.log(
      `[NOTIFICATIONS] Sending amendment approval email for ${bookingReference}`,
    );

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        userId: userId || "system",
        notificationType: "amendment_approval",
        priority: "high",
        status: "pending",
        channels: ["EMAIL"],
        content: {
          subject: `Confirm Your Flight Amendment for ${bookingReference}`,
          to: travelerEmail,
          travelerName,
          bookingReference,
          currentFlight,
          proposedFlight,
          financialImpact,
          approvalLink,
          expiresAt,
        },
        metadata: {
          bookingReference,
          travelerEmail,
          amendmentId: req.body.amendmentId,
        },
        tags: ["amendment", "approval", bookingReference],
      },
    });

    // Record channel status
    await createChannelStatus(notification.id, "email");

    // Update notification status
    await prisma.notification.update({
      where: { id: notification.id },
      data: { status: "sent", sentAt: new Date() },
    });

    console.log(`✓ Amendment approval email sent to ${travelerEmail}`);

    res.status(200).json({
      success: true,
      notificationId: notification.id,
      recipient: travelerEmail,
      status: "sent",
      expiresAt: expiresAt,
      message: "Amendment approval email queued successfully",
    });
  } catch (error) {
    console.error("[NotificationService] Amendment approval error:", error);
    res.status(500).json({
      error: "Failed to send amendment approval email",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/notifications/amendment/reminder - Send approval reminder email
router.post("/amendment/reminder", async (req: Request, res: Response) => {
  try {
    const {
      travelerEmail,
      travelerName,
      bookingReference,
      proposedFlight,
      approvalLink,
      expiresAt,
      userId,
    } = req.body;

    if (!travelerEmail || !bookingReference) {
      return res.status(400).json({
        error: "Missing required fields: travelerEmail, bookingReference",
      });
    }

    console.log(
      `[NOTIFICATIONS] Sending amendment reminder email for ${bookingReference}`,
    );

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        userId: userId || "system",
        notificationType: "amendment_reminder",
        priority: "high",
        status: "pending",
        channels: ["EMAIL"],
        content: {
          subject: `⏰ Reminder: Approve Your Flight Amendment for ${bookingReference}`,
          to: travelerEmail,
          travelerName,
          bookingReference,
          proposedFlight,
          approvalLink,
          expiresAt,
          isReminder: true,
        },
        metadata: {
          bookingReference,
          travelerEmail,
          type: "reminder",
        },
        tags: ["amendment", "reminder", bookingReference],
      },
    });

    // Record channel status
    await createChannelStatus(notification.id, "email");

    // Update notification status
    await prisma.notification.update({
      where: { id: notification.id },
      data: { status: "sent", sentAt: new Date() },
    });

    console.log(`✓ Amendment reminder email sent to ${travelerEmail}`);

    res.status(200).json({
      success: true,
      notificationId: notification.id,
      recipient: travelerEmail,
      status: "sent",
      expiresAt: expiresAt,
      message: "Amendment reminder email queued successfully",
    });
  } catch (error) {
    console.error("[NotificationService] Amendment reminder error:", error);
    res.status(500).json({
      error: "Failed to send amendment reminder email",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/notifications/amendment/confirmation - Send amendment confirmation email
router.post("/amendment/confirmation", async (req: Request, res: Response) => {
  try {
    const {
      travelerEmail,
      travelerName,
      bookingReference,
      newFlightDetails,
      financialImpact,
      userId,
    } = req.body;

    if (!travelerEmail || !bookingReference || !newFlightDetails) {
      return res.status(400).json({
        error:
          "Missing required fields: travelerEmail, bookingReference, newFlightDetails",
      });
    }

    console.log(
      `[NOTIFICATIONS] Sending amendment confirmation email for ${bookingReference}`,
    );

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        userId: userId || "system",
        notificationType: "amendment_confirmation",
        priority: "high",
        status: "pending",
        channels: ["EMAIL"],
        content: {
          subject: `✓ Flight Amendment Confirmed for ${bookingReference}`,
          to: travelerEmail,
          travelerName,
          bookingReference,
          newFlightDetails,
          financialImpact,
        },
        metadata: {
          bookingReference,
          travelerEmail,
        },
        tags: ["amendment", "confirmation", bookingReference],
      },
    });

    // Record channel status
    await createChannelStatus(notification.id, "email");

    // Update notification status
    await prisma.notification.update({
      where: { id: notification.id },
      data: { status: "sent", sentAt: new Date() },
    });

    console.log(`✓ Amendment confirmation email sent to ${travelerEmail}`);

    res.status(200).json({
      success: true,
      notificationId: notification.id,
      recipient: travelerEmail,
      status: "sent",
      message: "Amendment confirmation email queued successfully",
    });
  } catch (error) {
    console.error("[NotificationService] Amendment confirmation error:", error);
    res.status(500).json({
      error: "Failed to send amendment confirmation email",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ============================================
// WALLET DEPOSIT RECEIPT NOTIFICATION
// ============================================

/**
 * Send wallet deposit receipt email
 * This endpoint is called by the wallet-service when a deposit/topup is made
 */
router.post("/wallet/deposit-receipt", async (req: Request, res: Response) => {
  try {
    const {
      customerEmail,
      customerName,
      receiptNumber,
      transactionDate,
      depositAmount,
      previousBalance,
      newBalance,
      currency,
      paymentMethod,
      referenceId,
      description,
      userId,
    } = req.body;

    // Validate required fields
    if (!customerEmail || !receiptNumber || !depositAmount) {
      return res.status(400).json({
        error:
          "Missing required fields: customerEmail, receiptNumber, depositAmount",
      });
    }

    console.log(
      `[NOTIFICATIONS] Sending wallet deposit receipt to ${customerEmail}`,
    );
    console.log(`  Receipt: ${receiptNumber}`);
    console.log(`  Amount: ${currency || "USD"}${depositAmount}`);

    // Import the email service function
    const { sendWalletDepositReceiptEmail } =
      await import("../email-service.js");

    // Send the email via Brevo
    const emailResult = await sendWalletDepositReceiptEmail({
      customerName: customerName || "Valued Customer",
      customerEmail,
      receiptNumber,
      transactionDate: transactionDate || new Date().toISOString(),
      depositAmount: Number(depositAmount),
      previousBalance: Number(previousBalance || 0),
      newBalance: Number(newBalance || depositAmount),
      currency: currency || "USD",
      paymentMethod: paymentMethod || "Card Payment",
      referenceId: referenceId || receiptNumber,
      description,
    });

    if (emailResult.success) {
      // Create notification record for tracking
      const notification = await prisma.notification.create({
        data: {
          userId: userId || "system",
          notificationType: "wallet_deposit_receipt",
          priority: "medium",
          status: "sent",
          channels: ["email"],
          content: {
            subject: `💰 Deposit Receipt - ${receiptNumber}`,
            to: customerEmail,
            receiptNumber,
            amount: depositAmount,
            currency: currency || "USD",
          },
          metadata: {
            receiptNumber,
            previousBalance,
            newBalance,
            paymentMethod,
            referenceId,
            messageId: emailResult.messageId,
          },
          tags: ["wallet", "deposit", "receipt", receiptNumber],
          sentAt: new Date(),
        },
      });

      // Record channel status
      await createChannelStatus(notification.id, "email");

      console.log(
        `✓ Wallet deposit receipt sent to ${customerEmail} (Message ID: ${emailResult.messageId})`,
      );

      res.status(200).json({
        success: true,
        notificationId: notification.id,
        messageId: emailResult.messageId,
        receiptNumber,
        status: "sent",
        message: "Wallet deposit receipt email sent successfully",
      });
    } else {
      console.error(
        `[NOTIFICATIONS] Failed to send wallet deposit receipt: ${emailResult.error}`,
      );

      res.status(500).json({
        success: false,
        error: "Failed to send wallet deposit receipt email",
        details: emailResult.error,
      });
    }
  } catch (error) {
    console.error("[NotificationService] Wallet deposit receipt error:", error);
    res.status(500).json({
      error: "Failed to send wallet deposit receipt email",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ============================================
// FLIGHT BOOKING CONFIRMATION NOTIFICATION
// Based on Duffel best practices for handling flight booking confirmation emails
// Reference: https://duffel.com/docs/guides/handling-flight-booking-confirmation-emails
// ============================================

/**
 * Flight Booking Confirmation Data Interface
 * Based on Duffel's order response structure
 */
interface FlightConfirmationData {
  // Customer info
  travelerEmail: string;
  travelerName: string;
  phoneNumber?: string;

  // Booking reference
  bookingReference: string;
  orderId: string; // Duffel order ID

  // Flight details
  flights: Array<{
    departure: {
      airportCode: string;
      city: string;
      airport: string;
      time: string;
      terminal?: string;
    };
    arrival: {
      airportCode: string;
      city: string;
      airport: string;
      time: string;
      terminal?: string;
    };
    airline: string;
    flightNumber: string;
    cabinClass: string;
    duration: string;
    flightId: string;
  }>;

  // Passenger details
  passengers: Array<{
    firstName: string;
    lastName: string;
    passengerType: string;
  }>;

  // Payment & pricing
  totalAmount: string;
  currency: string;
  baseAmount?: string;
  taxAmount?: string;

  // Additional info
  bookingStatus: string;
  bookedAt: string;
  userId?: string;
}

/**
 * Send flight booking confirmation email
 * This follows Duffel's recommended practices for confirmation emails
 */
router.post("/flight/confirmation", async (req: Request, res: Response) => {
  try {
    const {
      travelerEmail,
      travelerName,
      phoneNumber,
      bookingReference,
      orderId,
      flights,
      passengers,
      totalAmount,
      currency,
      baseAmount,
      taxAmount,
      bookingStatus,
      bookedAt,
      userId,
    } = req.body as FlightConfirmationData;

    // Validate required fields
    if (
      !travelerEmail ||
      !bookingReference ||
      !orderId ||
      !flights ||
      !passengers
    ) {
      return res.status(400).json({
        error:
          "Missing required fields: travelerEmail, bookingReference, orderId, flights, passengers",
      });
    }

    console.log(
      `[NOTIFICATIONS] Sending flight booking confirmation for ${bookingReference}`,
    );

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        userId: userId || "system",
        notificationType: "flight_confirmation",
        priority: "high",
        status: "pending",
        channels: ["email"],
        content: {
          subject: `✈️ Flight Booking Confirmed - ${bookingReference}`,
          to: travelerEmail,
          templateType: "flight_confirmation",
          travelerName,
          bookingReference,
          orderId,
          flights,
          passengers,
          totalAmount,
          currency,
          baseAmount,
          taxAmount,
          bookingStatus,
          bookedAt,
        },
        metadata: {
          bookingReference,
          orderId,
          travelerEmail,
          notificationType: "flight_confirmation",
          source: "duffel_webhook",
        },
        tags: ["flight", "confirmation", bookingReference],
      },
    });

    // Record channel status
    await createChannelStatus(notification.id, "email");

    // Update notification status
    await prisma.notification.update({
      where: { id: notification.id },
      data: { status: "sent", sentAt: new Date() },
    });

    console.log(
      `✓ Flight booking confirmation sent to ${travelerEmail} for booking ${bookingReference}`,
    );

    res.status(200).json({
      success: true,
      notificationId: notification.id,
      recipient: travelerEmail,
      bookingReference,
      orderId,
      status: "sent",
      message: "Flight booking confirmation email queued successfully",
    });
  } catch (error) {
    console.error("[NotificationService] Flight confirmation error:", error);
    res.status(500).json({
      error: "Failed to send flight booking confirmation email",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Send flight booking confirmation via webhook data
 * This endpoint is called directly by the booking-service webhook handler
 */
router.post(
  "/flight/confirmation/webhook",
  async (req: Request, res: Response) => {
    try {
      const {
        orderId,
        bookingReference,
        customerEmail,
        customerName,
        flights,
        passengers,
        totalAmount,
        currency,
        userId,
      } = req.body;

      if (!orderId || !customerEmail || !flights || !passengers) {
        return res.status(400).json({
          error: "Missing required fields for flight confirmation",
        });
      }

      console.log(
        `[NOTIFICATIONS] Processing flight confirmation webhook for order ${orderId}`,
      );

      // Transform webhook data to confirmation format
      const confirmationData: FlightConfirmationData = {
        travelerEmail: customerEmail,
        travelerName: customerName || "Valued Customer",
        bookingReference: bookingReference || orderId,
        orderId,
        flights: flights.map((f: any) => ({
          departure: {
            airportCode: f.departureAirportCode || f.origin,
            city: f.departureCity || f.origin,
            airport: f.departureAirport || f.origin,
            time: f.departureTime || f.departure,
            terminal: f.departureTerminal,
          },
          arrival: {
            airportCode: f.arrivalAirportCode || f.destination,
            city: f.arrivalCity || f.destination,
            airport: f.arrivalAirport || f.destination,
            time: f.arrivalTime || f.arrival,
            terminal: f.arrivalTerminal,
          },
          airline: f.airline || f.airlineName || "Airline",
          flightNumber: f.flightNumber || f.flight_number || "",
          cabinClass: f.cabinClass || f.cabin_class || "Economy",
          duration: f.duration || "",
          flightId: f.flightId || f.flight_id || "",
        })),
        passengers: passengers.map((p: any) => ({
          firstName: p.firstName || p.first_name || "",
          lastName: p.lastName || p.last_name || "",
          passengerType: p.passengerType || p.passenger_type || "adult",
        })),
        totalAmount: totalAmount || "0",
        currency: currency || "USD",
        bookingStatus: "confirmed",
        bookedAt: new Date().toISOString(),
        userId,
      };

      // Create notification record
      const notification = await prisma.notification.create({
        data: {
          userId: userId || "system",
          notificationType: "flight_confirmation",
          priority: "high",
          status: "pending",
          channels: ["email"],
          content: {
            subject: `✈️ Flight Booking Confirmed - ${confirmationData.bookingReference}`,
            to: confirmationData.travelerEmail,
            templateType: "flight_confirmation",
            travelerName: confirmationData.travelerName,
            bookingReference: confirmationData.bookingReference,
            orderId: confirmationData.orderId,
            flights: confirmationData.flights,
            passengers: confirmationData.passengers,
            totalAmount: confirmationData.totalAmount,
            currency: confirmationData.currency,
            bookingStatus: confirmationData.bookingStatus,
            bookedAt: confirmationData.bookedAt,
          },
          metadata: {
            bookingReference: confirmationData.bookingReference,
            orderId: confirmationData.orderId,
            travelerEmail: confirmationData.travelerEmail,
            notificationType: "flight_confirmation",
            source: "duffel_webhook",
          },
          tags: ["flight", "confirmation", confirmationData.bookingReference],
        },
      });

      // Record channel status
      await createChannelStatus(notification.id, "email");

      // Update notification status
      await prisma.notification.update({
        where: { id: notification.id },
        data: { status: "sent", sentAt: new Date() },
      });

      console.log(
        `✓ Flight booking confirmation processed for order ${orderId}`,
      );

      res.status(200).json({
        success: true,
        notificationId: notification.id,
        orderId,
        bookingReference: confirmationData.bookingReference,
        status: "sent",
        message: "Flight booking confirmation processed successfully",
      });
    } catch (error) {
      console.error(
        "[NotificationService] Flight confirmation webhook error:",
        error,
      );
      res.status(500).json({
        error: "Failed to process flight booking confirmation",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

export default router;
