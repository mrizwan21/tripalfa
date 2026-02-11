import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import * as documentController from '../controllers/documentController';

const router: ExpressRouter = Router();

/**
 * Get Documents for a Booking
 * GET /bookings/:bookingId/documents
 * List all available documents for a booking
 */
router.get('/:bookingId/documents', async (req: Request, res: Response) => {
    await documentController.getDocuments(req, res, (err: any) => {
        return res.status(err?.statusCode || 500).json({
            success: false,
            error: err?.message || 'Internal server error'
        });
    });
});

/**
 * Download a specific document
 * GET /bookings/:bookingId/documents/:documentType/download
 * Generate and download a document (itinerary, invoice, ticket, voucher, receipt, credit_note)
 */
router.get('/:bookingId/documents/:documentType/download', async (req: Request, res: Response) => {
    await documentController.downloadDocument(req, res, (err: any) => {
        return res.status(err?.statusCode || 500).json({
            success: false,
            error: err?.message || 'Internal server error'
        });
    });
});

/**
 * Issue Ticket
 * POST /bookings/:bookingId/issue-ticket
 * Finalize booking: deduct wallet, issue ticket/voucher, generate documents
 */
router.post('/:bookingId/issue-ticket', async (req: Request, res: Response) => {
    await documentController.issueTicket(req, res, (err: any) => {
        return res.status(err?.statusCode || 500).json({
            success: false,
            error: err?.message || 'Internal server error'
        });
    });
});

/**
 * Send Offline Request
 * POST /bookings/:bookingId/offline-request
 * Submit a post-issuance change request
 */
router.post('/:bookingId/offline-request', async (req: Request, res: Response) => {
    await documentController.sendOfflineRequest(req, res, (err: any) => {
        return res.status(err?.statusCode || 500).json({
            success: false,
            error: err?.message || 'Internal server error'
        });
    });
});

/**
 * Email a Document
 * POST /bookings/:bookingId/documents/:documentType/email
 * Email a specific document to a recipient
 */
router.post('/:bookingId/documents/:documentType/email', async (req: Request, res: Response) => {
    await documentController.emailDocument(req, res, (err: any) => {
        return res.status(err?.statusCode || 500).json({
            success: false,
            error: err?.message || 'Internal server error'
        });
    });
});

export default router;
