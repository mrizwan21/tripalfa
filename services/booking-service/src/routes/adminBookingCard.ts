import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { AdminBookingCardController } from "../controllers/adminBookingCardController.js";

const router: ExpressRouter = Router();
const controller = new AdminBookingCardController();

// GET /api/admin-bookings/permissions - Get all permissions
router.get("/permissions", (req, res) => controller.getPermissions(req, res));

// GET /api/admin-bookings/cards - Get booking cards for admin
router.get("/cards", (req, res) => controller.getBookingCards(req, res));

// GET /api/admin-bookings/cards/:id - Get specific booking card
router.get("/cards/:id", (req, res) => controller.getBookingCard(req, res));

// POST /api/admin-bookings/cards - Create booking card
router.post("/cards", (req, res) => controller.createBookingCard(req, res));

// PUT /api/admin-bookings/cards/:id - Update booking card
router.put("/cards/:id", (req, res) => controller.updateBookingCard(req, res));

// DELETE /api/admin-bookings/cards/:id - Delete booking card
router.delete("/cards/:id", (req, res) =>
  controller.deleteBookingCard(req, res),
);

export default router;
