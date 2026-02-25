import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import companiesRoutes from './routes/companies.js';
import usersRoutes from './routes/users.js';
import bookingsRoutes from './routes/bookings.js';
import financeRoutes from './routes/finance.js';
import suppliersRoutes from './routes/suppliers.js';
import rulesRoutes from './routes/rules.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.B2B_ADMIN_SERVICE_PORT || process.env.PORT || 3020;

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
        service: 'b2b-admin-service',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});

// API version info
app.get('/api', (req: Request, res: Response) => {
    res.json({
        name: 'TripAlfa B2B Admin API',
        version: '1.0.0',
        endpoints: {
            companies: '/api/companies',
            users: '/api/users',
            bookings: '/api/bookings',
            finance: '/api/finance',
            suppliers: '/api/suppliers',
            rules: '/api/rules',
        },
    });
});

// API Routes
app.use('/api/companies', companiesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/rules', rulesRoutes);

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
    console.error('[B2BAdminService] Error:', err);

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
    console.log(`🚀 B2B Admin Service running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`📍 API info: http://localhost:${PORT}/api`);
});

export default app;
