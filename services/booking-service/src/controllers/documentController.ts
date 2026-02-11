import { Request, Response, NextFunction } from 'express';

/**
 * Document Controller
 * Handles document generation, listing, and download for bookings.
 */

// Supported document types
type DocumentType = 'itinerary' | 'invoice' | 'ticket' | 'voucher' | 'receipt' | 'credit_note';

interface BookingDocument {
    id: string;
    bookingId: string;
    type: DocumentType;
    name: string;
    format: 'PDF';
    generatedAt: string;
    url: string;
    available: boolean;
}

/**
 * Get Documents for a Booking
 * GET /bookings/:bookingId/documents
 */
export const getDocuments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { bookingId: rawBookingId } = req.params;
        const bookingId = Array.isArray(rawBookingId) ? rawBookingId[0] : rawBookingId;

        if (!bookingId) {
            return res.status(400).json({ success: false, error: 'Booking ID is required' });
        }

        // In production, fetch from database/document service
        // For now, return mock data based on booking status
        const documents: BookingDocument[] = [
            {
                id: `doc-itin-${bookingId}`,
                bookingId,
                type: 'itinerary',
                name: 'Flight Itinerary',
                format: 'PDF',
                generatedAt: new Date().toISOString(),
                url: `/api/bookings/${bookingId}/documents/itinerary/download`,
                available: true,
            },
            {
                id: `doc-inv-${bookingId}`,
                bookingId,
                type: 'invoice',
                name: 'Commercial Invoice',
                format: 'PDF',
                generatedAt: new Date().toISOString(),
                url: `/api/bookings/${bookingId}/documents/invoice/download`,
                available: true,
            },
            {
                id: `doc-tkt-${bookingId}`,
                bookingId,
                type: 'ticket',
                name: 'E-Ticket',
                format: 'PDF',
                generatedAt: new Date().toISOString(),
                url: `/api/bookings/${bookingId}/documents/ticket/download`,
                available: false, // Would be true after issuance
            },
            {
                id: `doc-vch-${bookingId}`,
                bookingId,
                type: 'voucher',
                name: 'Hotel Voucher',
                format: 'PDF',
                generatedAt: new Date().toISOString(),
                url: `/api/bookings/${bookingId}/documents/voucher/download`,
                available: false,
            },
            {
                id: `doc-rct-${bookingId}`,
                bookingId,
                type: 'receipt',
                name: 'Payment Receipt',
                format: 'PDF',
                generatedAt: new Date().toISOString(),
                url: `/api/bookings/${bookingId}/documents/receipt/download`,
                available: false,
            },
            {
                id: `doc-cn-${bookingId}`,
                bookingId,
                type: 'credit_note',
                name: 'Credit Note',
                format: 'PDF',
                generatedAt: new Date().toISOString(),
                url: `/api/bookings/${bookingId}/documents/credit_note/download`,
                available: false,
            },
        ];

        res.json({
            success: true,
            data: { documents },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Download a specific document
 * GET /bookings/:bookingId/documents/:documentType/download
 */
export const downloadDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { bookingId, documentType } = req.params;

        if (!bookingId || !documentType) {
            return res.status(400).json({ success: false, error: 'Booking ID and document type are required' });
        }

        const validTypes: DocumentType[] = ['itinerary', 'invoice', 'ticket', 'voucher', 'receipt', 'credit_note'];
        if (!validTypes.includes(documentType as DocumentType)) {
            return res.status(400).json({ success: false, error: `Invalid document type: ${documentType}` });
        }

        // In production, generate PDF on-the-fly or fetch pre-generated from S3/storage
        // For now, return a mock response
        res.json({
            success: true,
            data: {
                bookingId,
                documentType,
                downloadUrl: `https://storage.tripalfa.com/documents/${bookingId}/${documentType}.pdf`,
                expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Issue Ticket (finalize booking and generate ticket/voucher)
 * POST /bookings/:bookingId/issue-ticket
 */
export const issueTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { bookingId: rawBookingId } = req.params;
        const bookingId = Array.isArray(rawBookingId) ? rawBookingId[0] : rawBookingId;
        const { walletId, amount, currency, acceptedTerms } = req.body;

        if (!bookingId) {
            return res.status(400).json({ success: false, error: 'Booking ID is required' });
        }

        if (!acceptedTerms) {
            return res.status(400).json({ success: false, error: 'Terms and conditions must be accepted' });
        }

        if (!walletId || !amount || !currency) {
            return res.status(400).json({ success: false, error: 'walletId, amount, and currency are required' });
        }

        // In production:
        // 1. Verify wallet balance
        // 2. Deduct amount from wallet
        // 3. Call airline/hotel API to issue ticket/voucher
        // 4. Update booking status to 'Issued'/'Ticketed'
        // 5. Generate ticket/voucher PDF
        // 6. Send confirmation notification

        res.json({
            success: true,
            data: {
                bookingId,
                status: 'Issued',
                ticketNumber: `TKT-${Date.now()}`,
                issuedAt: new Date().toISOString(),
                walletDeduction: { amount, currency },
                documents: [
                    { type: 'ticket', name: 'E-Ticket', available: true },
                    { type: 'receipt', name: 'Payment Receipt', available: true },
                ],
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Send Offline Request (post-issuance changes)
 * POST /bookings/:bookingId/offline-request
 */
export const sendOfflineRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { bookingId: rawBookingId } = req.params;
        const bookingId = Array.isArray(rawBookingId) ? rawBookingId[0] : rawBookingId;
        const { requestType, passengers, services, notes } = req.body;

        if (!bookingId) {
            return res.status(400).json({ success: false, error: 'Booking ID is required' });
        }

        // In production:
        // 1. Create offline request record
        // 2. Notify operations team
        // 3. Send confirmation to customer

        res.json({
            success: true,
            data: {
                requestId: `REQ-${Date.now()}`,
                bookingId,
                requestType: requestType || 'special_service',
                status: 'pending',
                submittedAt: new Date().toISOString(),
                estimatedResponseTime: '24-48 hours',
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Email a document to a recipient
 * POST /bookings/:bookingId/documents/:documentType/email
 */
export const emailDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { bookingId, documentType } = req.params;
        const { recipientEmail } = req.body;

        if (!bookingId || !documentType) {
            return res.status(400).json({ success: false, error: 'Booking ID and document type are required' });
        }

        if (!recipientEmail) {
            return res.status(400).json({ success: false, error: 'Recipient email is required' });
        }

        // In production: queue email with generated PDF attachment
        res.json({
            success: true,
            data: {
                bookingId,
                documentType,
                recipientEmail,
                status: 'queued',
                sentAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        next(error);
    }
};
