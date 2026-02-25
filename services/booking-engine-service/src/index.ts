import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import flightsRoutes from './routes/flights.js';
import hotelsRoutes from './routes/hotels.js';
import offlineRequestsRoutes from './routes/offline-requests.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.BOOKING_ENGINE_SERVICE_PORT || process.env.PORT || 3021;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        service: 'booking-engine-service',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});

// API version info
app.get('/api', (req: Request, res: Response) => {
    res.json({
        name: 'TripAlfa Booking Engine API',
        version: '1.0.0',
        endpoints: {
            flights: '/api/flights',
            hotels: '/api/hotels',
            offlineRequests: '/api/offline-requests',
        },
    });
});

// API Routes
app.use('/api/flights', flightsRoutes);
app.use('/api/hotels', hotelsRoutes);
app.use('/api/offline-requests', offlineRequestsRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Not Found',
        path: req.path,
    });
});

// Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('[BookingEngineService] Error:', err);

    // Handle specific error types
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired token',
        });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Validation error',
            details: err.message,
        });
    }

    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Booking Engine Service running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`📍 API info: http://localhost:${PORT}/api`);
});

export default app;
