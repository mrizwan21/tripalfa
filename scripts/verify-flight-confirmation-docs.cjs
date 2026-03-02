#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

async function resolveApiBase() {
  if (process.env.BOOKING_SERVICE_URL) {
    return process.env.BOOKING_SERVICE_URL;
  }

  const candidates = ["http://localhost:3001", "http://localhost:3101"];

  for (const base of candidates) {
    try {
      const response = await fetch(`${base}/health`);
      if (response.ok) {
        return base;
      }
    } catch {
      // Try next candidate
    }
  }

  return candidates[0];
}

function fail(message, details) {
  console.error(`✗ ${message}`);
  if (details) {
    console.error(JSON.stringify(details, null, 2));
  }
  process.exit(1);
}

function assert(condition, message, details) {
  if (!condition) {
    fail(message, details);
  }
}

function buildToken() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    fail(
      "JWT_SECRET is required in .env to call authenticated workflow routes",
    );
  }

  return jwt.sign(
    {
      id: "qa-user-1",
      email: "qa@tripalfa.test",
      role: "super_admin",
      permissions: ["bookings:write", "bookings:read"],
    },
    secret,
    { expiresIn: "1h" },
  );
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const json = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, json };
}

async function postJson(url, token, body) {
  return requestJson(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

async function getJson(url, token) {
  return requestJson(url, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
}

function hasText(source, text) {
  return source.includes(text);
}

async function main() {
  const API_BASE = await resolveApiBase();
  const ROUTE_BASE = `${API_BASE}/api/flight-booking`;
  const token = buildToken();

  const holdPayload = {
    offerId: "offer_test_001",
    passengers: [{ given_name: "John", family_name: "Doe", type: "adult" }],
    customerId: "cust_qa_1",
    customerEmail: "john.doe@tripalfa.test",
    customerPhone: "+971500000001",
    totalAmount: 1234.56,
    currency: "USD",
  };

  const hold = await postJson(`${ROUTE_BASE}/hold`, token, holdPayload);
  assert(hold.ok, "Hold step failed", { status: hold.status, body: hold.json });

  const workflowId = hold.json.workflowId;
  const orderId = hold.json.orderId;
  assert(
    workflowId && orderId,
    "Hold response missing workflow/order IDs",
    hold.json,
  );

  const payment = await postJson(`${ROUTE_BASE}/payment`, token, {
    workflowId,
    orderId,
    amount: holdPayload.totalAmount,
    currency: holdPayload.currency,
    paymentMethod: "balance",
  });
  assert(payment.ok, "Payment step failed", {
    status: payment.status,
    body: payment.json,
  });

  const ticket = await postJson(`${ROUTE_BASE}/ticket`, token, {
    workflowId,
    orderId,
    passengers: [{ ticketNumber: "176TEST000001" }],
  });
  assert(ticket.ok, "Ticket step failed", {
    status: ticket.status,
    body: ticket.json,
  });

  const workflow = await getJson(`${ROUTE_BASE}/workflow/${workflowId}`, token);
  assert(workflow.ok, "Workflow retrieval failed", {
    status: workflow.status,
    body: workflow.json,
  });

  const holdDocs = hold.json.documents || {};
  const paymentDocs = payment.json.documents || {};
  const ticketDocs = ticket.json.documents || {};
  const finalDocs = workflow.json?.data?.documents || {};

  assert(!!holdDocs.itinerary, "Hold documents missing itinerary", holdDocs);
  assert(!!holdDocs.invoice, "Hold documents missing invoice", holdDocs);
  assert(!holdDocs.ticket, "Hold step should not include ticket", holdDocs);
  assert(!holdDocs.receipt, "Hold step should not include receipt", holdDocs);

  assert(
    !!paymentDocs.receipt,
    "Payment step should generate receipt",
    paymentDocs,
  );
  assert(
    !!ticketDocs.ticket,
    "Ticket step should generate e-ticket",
    ticketDocs,
  );

  assert(!!finalDocs.itinerary, "Final workflow missing itinerary", finalDocs);
  assert(!!finalDocs.invoice, "Final workflow missing invoice", finalDocs);
  assert(!!finalDocs.receipt, "Final workflow missing receipt", finalDocs);
  assert(!!finalDocs.ticket, "Final workflow missing e-ticket", finalDocs);

  const confirmationPath = path.resolve(
    process.cwd(),
    "apps/booking-engine/src/pages/BookingConfirmation.tsx",
  );
  const confirmationSource = fs.readFileSync(confirmationPath, "utf8");

  assert(
    hasText(
      confirmationSource,
      '{isHold ? "Booking Held." : "Journey Secured."}',
    ),
    "Missing hold vs paid confirmation header branch",
  );
  assert(
    hasText(confirmationSource, "Pay for Booking"),
    "Missing hold primary CTA text",
  );
  assert(
    hasText(confirmationSource, "E-Ticket"),
    "Missing paid primary CTA text",
  );
  assert(
    hasText(confirmationSource, "Your booking is currently on hold."),
    "Missing hold body copy",
  );
  assert(
    hasText(confirmationSource, "Your premium itinerary has been dispatched"),
    "Missing paid body copy",
  );

  console.log(
    JSON.stringify(
      {
        success: true,
        scenario: "flight-hold-then-wallet-paid",
        refs: {
          workflowId,
          orderId,
          bookingReference: hold.json.bookingReference,
        },
        checks: {
          holdDocuments: {
            hasItinerary: !!holdDocs.itinerary,
            hasInvoice: !!holdDocs.invoice,
            hasTicket: !!holdDocs.ticket,
            hasReceipt: !!holdDocs.receipt,
          },
          paidStepDocuments: {
            paymentHasReceipt: !!paymentDocs.receipt,
            ticketingHasTicket: !!ticketDocs.ticket,
          },
          finalWorkflowDocuments: {
            hasItinerary: !!finalDocs.itinerary,
            hasInvoice: !!finalDocs.invoice,
            hasTicket: !!finalDocs.ticket,
            hasReceipt: !!finalDocs.receipt,
          },
          templateChecks: {
            hasHoldHeaderBranch: true,
            hasHoldPrimaryCTA: true,
            hasPaidPrimaryCTA: true,
            hasHoldBodyCopy: true,
            hasPaidBodyCopy: true,
          },
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  fail("Verification script crashed", {
    error: error instanceof Error ? error.message : String(error),
  });
});
