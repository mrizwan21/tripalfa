import { Router, Request, Response, NextFunction } from "express";
import type { Router as ExpressRouter } from "express";
import axios, { AxiosResponse } from "axios";

const router: ExpressRouter = Router();

// Base URL for booking service - configure via environment
const BOOKING_SERVICE_URL =
  process.env.BOOKING_SERVICE_URL || "http://booking-service:3001/api/bookings";

// In-memory fallback data for queues when upstream booking service is unavailable
interface MockQueueRow {
  id: number;
  bookingRef: string;
  supplierRef: string;
  product: string;
  details: string;
  customerName: string;
  issuedDate: string;
  queueStatus: string;
  updatedAt?: string;
}

const mockQueues: MockQueueRow[] = [
  {
    id: 1,
    bookingRef: "ET1234567",
    supplierRef: "S-124567",
    product: "Hotel",
    details: "Hilton Jumeirah",
    customerName: "Mohamed Rizwan",
    issuedDate: "01 Dec 24",
    queueStatus: "Req. Refund",
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    bookingRef: "ET1234568",
    supplierRef: "S-124568",
    product: "Flight",
    details: "DXB-LON",
    customerName: "Mohamed Rizwan",
    issuedDate: "01 Dec 24",
    queueStatus: "Req. Cancel",
    updatedAt: new Date().toISOString(),
  },
];

// Simple in-memory audit log for admin actions (fallback)
const mockAuditLogs: Array<{
  id: number;
  action: string;
  performedBy?: string;
  ts: string;
  details?: unknown;
}> = [];

// Define interfaces for in-memory storage
interface Invoice {
  id: number;
  bookingId: number;
  invoiceNumber: string;
  totalAmount: number;
  currency: string;
  dueDate: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Payment {
  id: number;
  invoiceId: number;
  paymentMethod: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface QueueItem {
  id: number;
  bookingId: number;
  queueType: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define in-memory storage for invoices, payments, and queues
const invoices: Invoice[] = [];
const payments: Payment[] = [];
const queues: QueueItem[] = [];

// ============================================================================
// Booking Management Routes for B2B Admin Panel
// ============================================================================
//
// IMPORTANT: Express routes are matched in order of registration.
// Static routes (e.g., /stats, /user, /queues) must be registered BEFORE
// parameterized routes (e.g., /:id) to prevent Express from interpreting
// static path segments as ID parameters.
//
// Current order: /stats/summary (line ~205), /user/:userId (line ~232),
// /:id (line ~278), /queues (line ~476)
//
// The /:id route includes a bypass check for static routes as a safety net.


// POST /api/admin/bookings - Create a manual booking
router.post("/", async (req: Request, res: Response) => {
  try {
    const bookingData = req.body;

    // In a real scenario, this would call the booking service.
    // Here we simulate it by adding to our local mock queues if it's the right format,
    // or just returning a success message for the mock flow.
    const newBooking = {
      id: Math.floor(Math.random() * 1000000),
      bookingRef: `MB${Math.floor(1000000 + Math.random() * 9000000)}`,
      supplierRef: `S-${Math.floor(100000 + Math.random() * 900000)}`,
      product: bookingData.type || "Manual",
      details: bookingData.details || "Manual Booking Entry",
      customerName: bookingData.customerName || "Walk-in Customer",
      issuedDate: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      }),
      queueStatus: "Confirmed",
      updatedAt: new Date().toISOString(),
    };

    mockQueues.unshift(newBooking);

    mockAuditLogs.push({
      id: mockAuditLogs.length + 1,
      action: "manual-booking-created",
      performedBy: "admin",
      ts: new Date().toISOString(),
      details: { bookingRef: newBooking.bookingRef },
    });

    res.status(201).json({
      success: true,
      data: newBooking,
    });
  } catch (error: unknown) {
    console.error(
      "Error creating manual booking:",
      error instanceof Error ? error.message : String(error),
    );
    res.status(500).json({
      success: false,
      error: "Failed to create manual booking",
    });
  }
});

// GET /api/admin/bookings - List all bookings with admin filters
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      search,
      fromDate,
      toDate,
      companyId,
      userId,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query parameters for booking service
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy: sortBy.toString(),
      sortOrder: sortOrder.toString(),
    });

    if (status) queryParams.append("status", status.toString());
    if (type) queryParams.append("type", type.toString());
    if (search) queryParams.append("search", search.toString());
    if (fromDate) queryParams.append("startDate", fromDate.toString());
    if (toDate) queryParams.append("endDate", toDate.toString());
    if (companyId) queryParams.append("companyId", companyId.toString());
    if (userId) queryParams.append("userId", userId.toString());

    const response = await axios.get(`${BOOKING_SERVICE_URL}?${queryParams}`, {
      headers: {
        Authorization: req.headers.authorization || "",
        "X-Admin-Request": "true",
      },
    });

    res.json(response.data);
  } catch (error: unknown) {
    console.error(
      "Error fetching bookings:",
      error instanceof Error ? error.message : String(error),
    );
    const axiosError = error as { response?: { status?: number } };
    res.status(axiosError.response?.status || 500).json({
      success: false,
      error: "Failed to fetch bookings",
    });
  }
});

 // GET /api/admin/bookings/stats/summary - Get booking statistics
router.get("/stats/summary", async (req: Request, res: Response) => {
  try {
    const { period = "30d", companyId } = req.query;

    // This could aggregate data from multiple sources
    // For now, get basic stats from booking service
    const response = await axios.get(
      `${BOOKING_SERVICE_URL}/stats/summary?period=${period}${companyId ? `&companyId=${companyId}` : ""}`,
      {
        headers: {
          Authorization: req.headers.authorization || "",
          "X-Admin-Request": "true",
        },
      },
    );

    res.json(response.data);
  } catch (error: any) {
    console.error("Error fetching booking stats:", error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: "Failed to fetch booking statistics",
    });
  }
});

 // GET /api/admin/bookings/user/:userId - Get user's bookings (admin view)
router.get("/user/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, status, fromDate, toDate } = req.query;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      userId: userId.toString(),
    });

    if (status) queryParams.append("status", status.toString());
    if (fromDate) queryParams.append("startDate", fromDate.toString());
    if (toDate) queryParams.append("endDate", toDate.toString());

    const response = await axios.get(`${BOOKING_SERVICE_URL}?${queryParams}`, {
      headers: {
        Authorization: req.headers.authorization || "",
        "X-Admin-Request": "true",
      },
    });

    res.json(response.data);
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error
        ? (error as Error).message
        : String(error);
    console.error("Error fetching user bookings:", message);
    const status =
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "status" in error.response
        ? (error.response as { status: number }).status
        : 500;
    res.status(status).json({
      success: false,
      error: "Failed to fetch user bookings",
    });
  }
});

// GET /api/admin/bookings/:id - Get booking details
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Avoid shadowing static routes like /queues
    if (id === "queues" || id === "stats" || id === "user") {
      return next();
    }

    const response = await axios.get(`${BOOKING_SERVICE_URL}/${id}`, {
      headers: {
        Authorization: req.headers.authorization || "",
        "X-Admin-Request": "true",
      },
    });

    res.json(response.data);
  } catch (error: unknown) {
    console.error(
      "Error fetching booking:",
      error instanceof Error ? error.message : String(error),
    );
    const axiosError = error as { response?: { status?: number } };
    res.status(axiosError.response?.status || 500).json({
      success: false,
      error: "Failed to fetch booking details",
    });
  }
});

// PUT /api/admin/bookings/:id/cancel - Cancel booking (admin override)
router.put("/:id/cancel", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, refundAmount, processedBy } = req.body;

    const response = await axios.put(
      `${BOOKING_SERVICE_URL}/${id}/cancel`,
      {
        reason,
        refundAmount,
        processedBy,
        adminOverride: true,
      },
      {
        headers: {
          Authorization: req.headers.authorization || "",
          "X-Admin-Request": "true",
        },
      },
    );

    res.json(response.data);
  } catch (error: unknown) {
    console.error(
      "Error cancelling booking:",
      error instanceof Error ? error.message : String(error),
    );
    const axiosError = error as { response?: { status?: number } };
    res.status(axiosError.response?.status || 500).json({
      success: false,
      error: "Failed to cancel booking",
    });
  }
});

// PUT /api/admin/bookings/:id/status - Update booking status
router.put("/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason, processedBy } = req.body;

    // For admin status updates, we might need to call booking service
    // or handle internally based on business logic
    const response = await axios.put(
      `${BOOKING_SERVICE_URL}/${id}`,
      {
        status,
        reason,
        processedBy,
        adminOverride: true,
      },
      {
        headers: {
          Authorization: req.headers.authorization || "",
          "X-Admin-Request": "true",
        },
      },
    );

    res.json(response.data);
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error
        ? (error as Error).message
        : String(error);
    console.error("Error updating booking status:", message);
    const status =
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "status" in error.response
        ? (error.response as { status: number }).status
        : 500;
    res.status(status).json({
      success: false,
      error: "Failed to update booking status",
    });
  }
});


// PUT /api/admin/bookings/:id - Update booking details
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const response = await axios.put(
      `${BOOKING_SERVICE_URL}/${id}`,
      {
        ...updateData,
        updatedByAdmin: true,
        // adminId will be extracted from JWT token by booking service
      },
      {
        headers: {
          Authorization: req.headers.authorization || "",
          "X-Admin-Request": "true",
        },
      },
    );

    res.json(response.data);
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error
        ? (error as Error).message
        : String(error);
    console.error("Error updating booking:", message);
    const status =
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "status" in error.response
        ? (error.response as { status: number }).status
        : 500;
    res.status(status).json({
      success: false,
      error: "Failed to update booking",
    });
  }
});

// DELETE /api/admin/bookings/:id - Delete booking (admin only - rare use case)
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, processedBy } = req.body;

    // Note: This might not be exposed by booking service for safety
    // Could be handled internally or through special admin procedures
    const response = await axios.delete(`${BOOKING_SERVICE_URL}/${id}`, {
      data: { reason, processedBy, adminOverride: true },
      headers: {
        Authorization: req.headers.authorization || "",
        "X-Admin-Request": "true",
      },
    });

    res.json(response.data);
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error
        ? (error as Error).message
        : String(error);
    console.error("Error deleting booking:", message);
    const status =
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "status" in error.response
        ? (error.response as { status: number }).status
        : 500;
    res.status(status).json({
      success: false,
      error: "Failed to delete booking",
    });
  }
});

// GET /api/bookings/queues - List booking queues (admin view)
router.get("/queues", async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      product,
      search,
      fromDate,
      toDate,
    } = req.query;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) queryParams.append("status", status.toString());
    if (product) queryParams.append("product", product.toString());
    if (search) queryParams.append("search", search.toString());
    if (fromDate) queryParams.append("startDate", fromDate.toString());
    if (toDate) queryParams.append("endDate", toDate.toString());

    const response = await axios.get(
      `${BOOKING_SERVICE_URL}/queues?${queryParams}`,
      {
        headers: {
          Authorization: req.headers.authorization || "",
          "X-Admin-Request": "true",
        },
      },
    );

    res.json(response.data);
  } catch (error: any) {
    console.error("Error fetching booking queues:", error.message);
    // Fallback to in-memory queues so admin UI remains functional
    return res.json({
      success: true,
      queues: mockQueues,
      total: mockQueues.length,
      fallback: true,
    });
  }
});

// POST /api/bookings/:id/queue-action - Perform queue action (refund/cancel/hold/confirm)
router.post("/:id/queue-action", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, reason, processedBy } = req.body;

    if (!action) {
      return res
        .status(400)
        .json({ success: false, error: "Action is required" });
    }

    const response = await axios.post(
      `${BOOKING_SERVICE_URL}/${id}/queue-action`,
      { action, reason, processedBy },
      {
        headers: {
          Authorization: req.headers.authorization || "",
          "X-Admin-Request": "true",
        },
      },
    );

    res.json(response.data);
  } catch (error: any) {
    console.error("Error performing queue action:", error.message);
    // Fallback: perform action against in-memory queues
    const { id } = req.params;
    const { action, processedBy } = req.body;
    const idx = mockQueues.findIndex((q) => String(q.id) === String(id));
    if (idx === -1) {
      return res
        .status(404)
        .json({ success: false, error: "Queue item not found" });
    }

    const mapping: Record<string, string> = {
      refund: "Req. Refund",
      cancel: "Req. Cancel",
      hold: "Hold",
      confirm: "Confirmed",
    };

    const newStatus = mapping[action] || action;
    mockQueues[idx].queueStatus = newStatus;
    mockQueues[idx].updatedAt = new Date().toISOString();

    mockAuditLogs.push({
      id: mockAuditLogs.length + 1,
      action: `queue-action:${action}`,
      performedBy: processedBy || "system",
      ts: new Date().toISOString(),
      details: { queueId: id },
    });

    return res.json({ success: true, queue: mockQueues[idx], fallback: true });
  }
});

// GET /api/bookings/:id/invoice - Get invoice HTML/JSON for booking
router.get("/:id/invoice", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${BOOKING_SERVICE_URL}/${id}/invoice`, {
      headers: {
        Authorization: req.headers.authorization || "",
        "X-Admin-Request": "true",
      },
    });
    // Proxy whatever the booking service returns (HTML or JSON)
    if (typeof response.data === "string") {
      res.setHeader("Content-Type", "text/html");
      res.send(response.data);
    } else {
      res.json(response.data);
    }
  } catch (error: any) {
    console.error("Error fetching invoice:", error.message);
    // Fallback: try to return a simple JSON invoice constructed from mockQueues
    const q = mockQueues.find((m) => String(m.id) === String(req.params.id));
    if (q) {
      const invoice = {
        booking: {
          id: q.id,
          bookingRef: q.bookingRef,
          invoiceNo: `CI${q.id}`,
          supplierInvoiceNo: `SI${q.id}`,
          customerName: q.customerName,
          supplierName: q.supplierRef,
          currency: "USD",
          date: q.issuedDate,
          passengers: [
            {
              name: "Sample Passenger",
              ticket: "000 0000 000 000",
              baseFare: 100,
              taxes: 10,
              discount: 0,
              netTotal: 110,
            },
          ],
        },
        fallback: true,
      };
      return res.json(invoice);
    }

    return res
      .status(error.response?.status || 500)
      .json({ success: false, error: "Failed to fetch invoice" });
  }
});

// GET /api/bookings/:id/invoice/pdf - (Stub) Return not implemented or proxy PDF if available
router.get("/:id/invoice/pdf", async (req: Request, res: Response) => {
  const { id } = req.params;

  // First try to proxy upstream PDF if available
  const pdfUrl = `${BOOKING_SERVICE_URL}/${id}/invoice/pdf`;
  try {
    const upstream = await axios.get(pdfUrl, {
      headers: {
        Authorization: req.headers.authorization || "",
        "X-Admin-Request": "true",
      },
      responseType: "arraybuffer",
      timeout: 5000,
    });
    res.setHeader("Content-Type", "application/pdf");
    return res.send(upstream.data);
  } catch (upErr) {
    // Upstream not available or doesn't support PDF - attempt server-side rendering using puppeteer
    try {
      // NOTE: In ESM, we use dynamic import() instead of require()
      // @ts-ignore
      const { default: puppeteer } = await import("puppeteer");

      // Fetch invoice HTML from upstream invoice endpoint (or use fallback)
      let html: string;
      try {
        const inv = await axios.get(`${BOOKING_SERVICE_URL}/${id}/invoice`, {
          headers: {
            Authorization: req.headers.authorization || "",
            "X-Admin-Request": "true",
          },
          timeout: 5000,
        });
        if (typeof inv.data === "string") html = inv.data;
        else
          html = `<html><body><pre>${JSON.stringify(inv.data, null, 2)}</pre></body></html>`;
      } catch (invErr) {
        // Fallback: generate a minimal invoice HTML from mock data if available
        const q = mockQueues.find((m) => String(m.id) === String(id));
        if (q) {
          html = `<html><body><h1>Invoice for ${q.bookingRef}</h1><p>Customer: ${q.customerName}</p><p>Supplier: ${q.supplierRef}</p></body></html>`;
        } else {
          return res.status(501).json({
            success: false,
            error: "Invoice HTML unavailable to generate PDF",
          });
        }
      }

      // Launch puppeteer and generate PDF buffer
      const browser = await (puppeteer as any).launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
      await browser.close();

      res.setHeader("Content-Type", "application/pdf");
      res.send(pdfBuffer);
    } catch (puppeteerErr: any) {
      console.error(
        "PDF generation failed:",
        puppeteerErr?.message || puppeteerErr,
      );
      return res.status(501).json({
        success: false,
        error: "PDF generation not available on server",
      });
    }
  }
});

// Add invoice generation for a booking
router.post("/:id/invoice", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { totalAmount, currency, dueDate, amount, note } = req.body;

    // Use provided amounts or calculate from request body
    const invoiceAmount = totalAmount || amount;
    const invoiceCurrency = currency || "USD";

    const newInvoice = {
      id: invoices.length + 1,
      bookingId: parseInt(id as string),
      invoiceNumber: `INV-${invoices.length + 1}`,
      totalAmount: invoiceAmount,
      currency: invoiceCurrency,
      dueDate:
        dueDate ||
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
      status: "unpaid",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    invoices.push(newInvoice);

    // Log audit trail for invoice generation
    mockAuditLogs.push({
      id: mockAuditLogs.length + 1,
      action: "invoice-generated",
      performedBy: "admin",
      ts: new Date().toISOString(),
      details: {
        invoiceId: newInvoice.id,
        bookingId: id,
        amount: invoiceAmount,
      },
    });

    res.status(201).json({
      success: true,
      data: newInvoice,
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate invoice",
    });
  }
});

// POST /admin/bookings/:id/pricing - Save pricing for booking
router.post("/:id/pricing", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { baseAmount, markup, tax, fees, currency, total, note } = req.body;

    // Validate pricing data
    if (baseAmount === undefined || currency === undefined) {
      return res.status(400).json({
        success: false,
        error: "baseAmount and currency are required",
      });
    }

    // Store pricing in audit log for persistence
    const pricingEntry = {
      bookingId: parseInt(id as string),
      baseAmount,
      markup: markup || 0,
      tax: tax || 0,
      fees: fees || 0,
      total: total || baseAmount + (markup || 0) + (tax || 0) + (fees || 0),
      currency,
      note: note || "",
      createdAt: new Date().toISOString(),
    };

    mockAuditLogs.push({
      id: mockAuditLogs.length + 1,
      action: "pricing-saved",
      performedBy: "admin",
      ts: new Date().toISOString(),
      details: pricingEntry,
    });

    // Update the booking in mockQueues if present
    const queueIdx = mockQueues.findIndex((q) => String(q.id) === String(id));
    if (queueIdx !== -1) {
      mockQueues[queueIdx].updatedAt = new Date().toISOString();
    }

    res.status(201).json({
      success: true,
      data: pricingEntry,
      message: "Pricing saved successfully",
    });
  } catch (error: unknown) {
    console.error(
      "Error saving pricing:",
      error instanceof Error ? error.message : String(error),
    );
    res.status(500).json({
      success: false,
      error: "Failed to save pricing",
    });
  }
});

// POST /admin/bookings/:id/pay-wallet - Process wallet payment for booking
router.post("/:id/pay-wallet", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, currency, note } = req.body;

    // Validate payment data
    if (amount === undefined || currency === undefined) {
      return res.status(400).json({
        success: false,
        error: "amount and currency are required",
      });
    }

    // Create a corresponding invoice first if not exists
    const bookingId = parseInt(id as string);
    let invoiceId: number;

    // Check if invoice exists for this booking
    const existingInvoice = invoices.find((i) => i.bookingId === bookingId);
    if (existingInvoice) {
      invoiceId = existingInvoice.id;
    } else {
      // Create a new invoice for this booking
      const newInvoice = {
        id: invoices.length + 1,
        bookingId,
        invoiceNumber: `INV-${invoices.length + 1}`,
        totalAmount: amount,
        currency,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        status: "unpaid" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      invoices.push(newInvoice);
      invoiceId = newInvoice.id;
    }

    // Create payment record
    const paymentRecord = {
      id: payments.length + 1,
      invoiceId,
      paymentMethod: "wallet",
      amount,
      currency,
      status: "processing" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    payments.push(paymentRecord);

    // Log audit trail for wallet payment
    mockAuditLogs.push({
      id: mockAuditLogs.length + 1,
      action: "wallet-payment-initiated",
      performedBy: "admin",
      ts: new Date().toISOString(),
      details: {
        paymentId: paymentRecord.id,
        bookingId: id,
        amount,
        currency,
      },
    });

    // Update booking queue status if present
    const queueIdx = mockQueues.findIndex((q) => String(q.id) === String(id));
    if (queueIdx !== -1) {
      mockQueues[queueIdx].queueStatus = "Payment In Progress";
      mockQueues[queueIdx].updatedAt = new Date().toISOString();
    }

    res.status(201).json({
      success: true,
      data: paymentRecord,
      message: "Wallet payment initiated successfully",
    });
  } catch (error: unknown) {
    console.error(
      "Error processing wallet payment:",
      error instanceof Error ? error.message : String(error),
    );
    res.status(500).json({
      success: false,
      error: "Failed to process wallet payment",
    });
  }
});

export default router;
