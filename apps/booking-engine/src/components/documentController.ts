import { Request, Response, NextFunction } from 'express';

/**
 * Document Controller
 * Handles document generation, listing, and download for bookings.
 */

import {
    DocumentGenerationService,
    DocumentCompanyInfo,
    DocumentCustomerInfo,
    FlightBooking,
    HotelBooking,
    PaymentBreakdown,
    RefundDetails,
    DebitNoteDetails,
    FlightSegment,
    HotelRoom,
    DocumentPassenger,
    generateFlightItinerary,
    generateHotelItinerary,
    generateFlightETicket,
    generateHotelVoucher,
    generateFlightInvoice,
    generateHotelInvoice,
    generateFlightReceipt,
    generateHotelReceipt,
    generateRefundNote,
    generateDebitNote
} from './documentGenerationService';

// Supported document types
type DocumentType = 'itinerary' | 'invoice' | 'ticket' | 'voucher' | 'receipt' | 'credit_note' | 'debit_note';

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
        const { bookingType } = req.query;

        if (!bookingId) {
            return res.status(400).json({ success: false, error: 'Booking ID is required' });
        }

        const isHotel = bookingType === 'hotel';

        // Generate document list based on booking type
        const documents: BookingDocument[] = isHotel ? [
            {
                id: `doc-itin-${bookingId}`,
                bookingId,
                type: 'itinerary',
                name: 'Hotel Itinerary',
                format: 'PDF',
                generatedAt: new Date().toISOString(),
                url: `/api/bookings/${bookingId}/documents/itinerary/download?bookingType=hotel`,
                available: true,
            },
            {
                id: `doc-inv-${bookingId}`,
                bookingId,
                type: 'invoice',
                name: 'Hotel Invoice',
                format: 'PDF',
                generatedAt: new Date().toISOString(),
                url: `/api/bookings/${bookingId}/documents/invoice/download?bookingType=hotel`,
                available: true,
            },
            {
                id: `doc-vch-${bookingId}`,
                bookingId,
                type: 'voucher',
                name: 'Hotel Voucher',
                format: 'PDF',
                generatedAt: new Date().toISOString(),
                url: `/api/bookings/${bookingId}/documents/voucher/download?bookingType=hotel`,
                available: true,
            },
            {
                id: `doc-rct-${bookingId}`,
                bookingId,
                type: 'receipt',
                name: 'Payment Receipt',
                format: 'PDF',
                generatedAt: new Date().toISOString(),
                url: `/api/bookings/${bookingId}/documents/receipt/download?bookingType=hotel`,
                available: true,
            },
            {
                id: `doc-cn-${bookingId}`,
                bookingId,
                type: 'credit_note',
                name: 'Refund Note',
                format: 'PDF',
                generatedAt: new Date().toISOString(),
                url: `/api/bookings/${bookingId}/documents/credit_note/download?bookingType=hotel`,
                available: true,
            },
            {
                id: `doc-dn-${bookingId}`,
                bookingId,
                type: 'debit_note',
                name: 'Debit Note',
                format: 'PDF',
                generatedAt: new Date().toISOString(),
                url: `/api/bookings/${bookingId}/documents/debit_note/download?bookingType=hotel`,
                available: true,
            },
        ] : [
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
                name: 'Refund Note',
                format: 'PDF',
                generatedAt: new Date().toISOString(),
                url: `/api/bookings/${bookingId}/documents/credit_note/download`,
                available: false,
            },
            {
                id: `doc-dn-${bookingId}`,
                bookingId,
                type: 'debit_note',
                name: 'Debit Note',
                format: 'PDF',
                generatedAt: new Date().toISOString(),
                url: `/api/bookings/${bookingId}/documents/debit_note/download`,
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
 * Generate sample data for document generation
 * In production, this would be fetched from database
 */
function generateSampleFlightBooking(bookingId: string): { booking: FlightBooking; customer: DocumentCustomerInfo; payment: PaymentBreakdown } {
    const customer: DocumentCustomerInfo = {
        id: 'cust-001',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+971 50 123 4567',
        address: 'Dubai, UAE',
        nationality: 'UAE',
        passportNumber: 'A12345678',
    };

    const segments: FlightSegment[] = [
        {
            id: 'seg-001',
            flightNumber: 'EK2',
            airline: 'Emirates',
            airlineIata: 'EK',
            aircraftType: 'Boeing 777-300ER',
            departureAirport: 'Dubai International',
            departureAirportCode: 'DXB',
            departureCity: 'Dubai',
            departureTerminal: '3',
            departureTime: '08:30',
            departureDate: '2026-03-15',
            arrivalAirport: 'London Heathrow',
            arrivalAirportCode: 'LHR',
            arrivalCity: 'London',
            arrivalTerminal: '3',
            arrivalTime: '12:45',
            duration: '7h 15m',
            cabinClass: 'Economy',
            baggagAllowance: '30kg + 7kg',
            mealType: 'Meal Included',
        },
    ];

    const passengers: DocumentPassenger[] = [
        {
            id: 'pax-001',
            firstName: 'John',
            lastName: 'Doe',
            type: 'adult',
            nationality: 'UAE',
            passportNumber: 'A12345678',
        },
    ];

    const booking: FlightBooking = {
        id: bookingId,
        bookingReference: bookingId,
        pnr: 'ABC123',
        ticketNumber: '176-2345678901',
        passengers,
        segments,
        totalAmount: 1250.00,
        baseFare: 1000.00,
        taxes: 250.00,
        currency: 'USD',
    };

    const payment: PaymentBreakdown = {
        baseFare: 1000.00,
        taxes: 250.00,
        fees: 0,
        total: 1250.00,
        currency: 'USD',
        paymentMethod: 'credit_card',
        paidAmount: 1250.00,
    };

    return { booking, customer, payment };
}

function generateSampleHotelBooking(bookingId: string): { booking: HotelBooking; customer: DocumentCustomerInfo; payment: PaymentBreakdown } {
    const customer: DocumentCustomerInfo = {
        id: 'cust-002',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+971 50 987 6543',
        address: 'Abu Dhabi, UAE',
        nationality: 'UAE',
    };

    const rooms: HotelRoom[] = [
        {
            id: 'room-001',
            roomType: 'Deluxe King',
            roomName: 'Deluxe King Room',
            adults: 2,
            children: 0,
            checkIn: '2026-03-15',
            checkOut: '2026-03-18',
            numberOfNights: 3,
            ratePerNight: 200.00,
            totalRate: 600.00,
            inclusions: ['Breakfast', 'Free WiFi', 'Pool Access'],
        },
    ];

    const booking: HotelBooking = {
        id: bookingId,
        hotelName: 'Grand Plaza Hotel',
        hotelAddress: 'Sheikh Zayed Road',
        hotelCity: 'Dubai',
        hotelCountry: 'UAE',
        hotelPhone: '+971 4 123 4567',
        hotelEmail: 'reservations@grandplaza.com',
        checkInDate: '2026-03-15',
        checkOutDate: '2026-03-18',
        numberOfNights: 3,
        rooms,
        guestName: 'Jane Smith',
        totalGuests: 2,
        voucherNumber: `VCH-${bookingId}`,
        confirmationNumber: bookingId,
    };

    const payment: PaymentBreakdown = {
        baseFare: 600.00,
        taxes: 60.00,
        fees: 0,
        total: 660.00,
        currency: 'USD',
        paymentMethod: 'credit_card',
        paidAmount: 660.00,
    };

    return { booking, customer, payment };
}

/**
 * Download a specific document
 * GET /bookings/:bookingId/documents/:documentType/download
 */
export const downloadDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { bookingId: rawBookingId, documentType: rawDocumentType } = req.params;
        const bookingId = Array.isArray(rawBookingId) ? rawBookingId[0] : rawBookingId;
        const documentType = Array.isArray(rawDocumentType) ? rawDocumentType[0] : rawDocumentType;
        const { bookingType } = req.query;

        if (!bookingId || !documentType) {
            return res.status(400).json({ success: false, error: 'Booking ID and document type are required' });
        }

        const validTypes: DocumentType[] = ['itinerary', 'invoice', 'ticket', 'voucher', 'receipt', 'credit_note', 'debit_note'];
        if (!validTypes.includes(documentType as DocumentType)) {
            return res.status(400).json({ success: false, error: `Invalid document type: ${documentType}` });
        }

        // Determine if this is a flight or hotel booking
        const isHotel = bookingType === 'hotel';

        // Generate sample data (in production, fetch from database)
        const { booking, customer, payment } = isHotel
            ? generateSampleHotelBooking(bookingId)
            : generateSampleFlightBooking(bookingId);

        // Generate HTML content based on document type
        let htmlContent = '';
        let documentName = '';

        switch (documentType) {
            case 'itinerary':
                documentName = isHotel ? 'Hotel Itinerary' : 'Flight Itinerary';
                htmlContent = isHotel
                    ? generateHotelItinerary(booking as HotelBooking, customer)
                    : generateFlightItinerary(booking as FlightBooking, customer);
                break;
            case 'invoice':
                documentName = isHotel ? 'Hotel Invoice' : 'Flight Invoice';
                htmlContent = isHotel
                    ? generateHotelInvoice(booking as HotelBooking, customer, payment)
                    : generateFlightInvoice(booking as FlightBooking, customer, payment);
                break;
            case 'ticket':
                documentName = 'E-Ticket';
                htmlContent = generateFlightETicket(booking as FlightBooking, customer);
                break;
            case 'voucher':
                documentName = 'Hotel Voucher';
                htmlContent = generateHotelVoucher(booking as HotelBooking, customer);
                break;
            case 'receipt':
                documentName = 'Payment Receipt';
                htmlContent = isHotel
                    ? generateHotelReceipt(booking as HotelBooking, customer, payment)
                    : generateFlightReceipt(booking as FlightBooking, customer, payment);
                break;
            case 'credit_note':
                // Sample refund note
                const refund: RefundDetails = {
                    id: 'refund-001',
                    refundNumber: `RFN-${bookingId}`,
                    amount: 500.00,
                    currency: 'USD',
                    reason: 'Booking cancellation due to flight schedule change',
                    type: 'partial',
                    status: 'completed',
                    requestedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    processedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                    refundedTo: 'original_payment',
                    originalPaymentAmount: 1250.00,
                    cancellationFees: 250.00,
                    taxRefund: 500.00,
                };
                documentName = 'Refund Note';
                htmlContent = generateRefundNote(refund, booking as (FlightBooking | HotelBooking), customer);
                break;
            case 'debit_note':
                // Sample debit note
                const debitNote: DebitNoteDetails = {
                    id: 'debit-001',
                    debitNoteNumber: `DBT-${bookingId}`,
                    referenceNumber: bookingId as string,
                    reason: 'Price adjustment',
                    description: 'Additional charges applied due to date change request',
                    amount: 150.00,
                    currency: 'USD',
                    issuedAt: new Date().toISOString(),
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    originalBookingAmount: 1250.00,
                    adjustmentAmount: 150.00,
                    adjustedAmount: 1400.00,
                };
                documentName = 'Debit Note';
                htmlContent = generateDebitNote(debitNote, customer);
                break;
            default:
                htmlContent = '<html><body><h1>Document not found</h1></body></html>';
        }

        // Return HTML content (in production, would convert to PDF)
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="${documentName.replace(/\s+/g, '_')}_${bookingId}.html"`);
        
        res.json({
            success: true,
            data: {
                bookingId,
                documentType,
                documentName,
                content: htmlContent,
                generatedAt: new Date().toISOString(),
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
