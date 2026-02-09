import express, { Request, Response } from 'express';
import liteApiClient from '../services/LiteAPIClient.js';

const router = express.Router();

/**
 * Fetch all guests
 */
router.get('/guests', async (req: Request, res: Response) => {
    try {
        const guests = await liteApiClient.getGuests();
        res.json(guests);
    } catch (error) {
        console.error('Get Guests Error:', error);
        res.status(500).json({ error: 'Failed to fetch guests' });
    }
});

/**
 * Fetch a specific guest
 */
router.get('/guests/:guestId', async (req: Request, res: Response) => {
    try {
        const { guestId } = req.params;
        const guest = await liteApiClient.getGuest(guestId);
        if (!guest) return res.status(404).json({ error: 'Guest not found' });
        res.json(guest);
    } catch (error) {
        console.error('Get Guest Error:', error);
        res.status(500).json({ error: 'Failed to fetch guest' });
    }
});

/**
 * Fetch all guest's bookings
 */
router.get('/guests/:guestId/bookings', async (req: Request, res: Response) => {
    try {
        const { guestId } = req.params;
        const bookings = await liteApiClient.getGuestBookings(guestId);
        res.json(bookings);
    } catch (error) {
        console.error('Get Guest Bookings Error:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

/**
 * Post/Update loyalty settings
 */
router.post('/loyalties', async (req: Request, res: Response) => {
    try {
        const { cashback } = req.body;
        const result = await liteApiClient.enableLoyalty(cashback);
        res.json(result);
    } catch (error) {
        console.error('Enable Loyalty Error:', error);
        res.status(500).json({ error: 'Failed to enable loyalty' });
    }
});

router.put('/loyalties', async (req: Request, res: Response) => {
    try {
        const result = await liteApiClient.updateLoyalty(req.body);
        res.json(result);
    } catch (error) {
        console.error('Update Loyalty Error:', error);
        res.status(500).json({ error: 'Failed to update loyalty' });
    }
});

router.get('/loyalties', async (req: Request, res: Response) => {
    try {
        const settings = await liteApiClient.getLoyaltySettings();
        res.json(settings);
    } catch (error) {
        console.error('Get Loyalty Settings Error:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

export default router;
