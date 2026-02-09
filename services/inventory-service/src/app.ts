import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../../.env') });
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import SupplierOrchestrator from './services/SupplierOrchestrator.js';
import staticRouter from './routes/static.js';
import webhooksRouter from './routes/webhooks.js';
import hotelsRouter from './routes/hotels.js';
import loyaltyRouter from './routes/loyalty.js';

import { dynamicPrisma, staticPool } from './db.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3002', 10);

// Request body interfaces
interface SearchRequestBody {
  type?: string;
  location?: string;
  checkin?: string;
  checkout?: string;
  adults?: number;
  children?: number;
  origin?: string;
  destination?: string;
  departureDate?: string;
  context?: unknown;
}

interface ApiVendorRequestBody {
  name: string;
  code: string;
  baseUrl: string;
  authType: string;
  credentials: unknown;
  mappings?: unknown[];
}

interface SupplierRequestBody {
  name: string;
  code: string;
  category: string;
  vendorId: string;
  settings?: unknown;
  isActive?: boolean;
}

interface PricingRuleRequestBody {
  name: string;
  targetType: string;
  targetId?: string;
  serviceType: string;
  markupType: string;
  markupValue: string | number;
  status: string;
  priority?: number;
  criteria?: unknown;
}

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
// Use raw body for webhooks if signature verification needed, but JSON is fine for now
app.use(express.json());

// Mock Data for Seeding removed as it conflicts with strict schema
// TODO: Implement proper seeding script using FlightRoute/Airline models

// Seed Helper removed

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'inventory-service', timestamp: new Date().toISOString() });
});

app.use('/webhooks', webhooksRouter);

// Search Routes
app.post('/api/search', async (req: Request, res: Response) => {
  try {
    const body = req.body as SearchRequestBody;
    const { type } = body;
    if (type === 'hotel' || type === 'hotels') {
      const { location, checkin, checkout, adults, children } = body;
      const results = await SupplierOrchestrator.searchHotels({
        location: location || 'Dubai',
        checkin: checkin || '2024-10-25',
        checkout: checkout || '2024-10-26',
        adults: adults || 2,
        children: children || 0
      }, body.context || {});
      return res.json({ results });
    }

    const { origin, destination, departureDate } = body;
    const results = await SupplierOrchestrator.searchFlights({
      origin: origin || 'JFK',
      destination: destination || 'DXB',
      departureDate: departureDate || '2024-10-25',
    }, body.context || {});
    return res.json({ results });
  } catch {
    return res.status(500).json({ error: 'Search failed' });
  }
});

app.post('/search', async (req: Request, res: Response) => {
  try {
    const body = req.body as SearchRequestBody;
    const { type } = body;
    if (type === 'hotel' || type === 'hotels') {
      const { location, checkin, checkout, adults, children } = body;
      const results = await SupplierOrchestrator.searchHotels({
        location: location || 'Dubai',
        checkin: checkin || '2024-10-25',
        checkout: checkout || '2024-10-26',
        adults: adults || 2,
        children: children || 0
      }, body.context || {});
      return res.json({ results });
    }

    const { origin, destination, departureDate } = body;
    const results = await SupplierOrchestrator.searchFlights({
      origin: origin || 'JFK',
      destination: destination || 'DXB',
      departureDate: departureDate || '2024-10-25',
    }, body.context || {});
    return res.json({ results });
  } catch {
    return res.status(500).json({ error: 'Search failed' });
  }
});

app.post('/search/flights', async (req: Request, res: Response) => {
  try {
    const body = req.body as SearchRequestBody;
    const { origin, destination, departureDate } = body;
    const results = await SupplierOrchestrator.searchFlights({
      origin: origin || 'JFK',
      destination: destination || 'DXB',
      departureDate: departureDate || '2024-10-25',
    }, body.context || {});
    res.json({ results });
  } catch {
    res.status(500).json({ error: 'Search failed' });
  }
});

app.post('/search/hotels', async (req: Request, res: Response) => {
  try {
    const body = req.body as SearchRequestBody;
    const { location, checkin, checkout, adults, children } = body;
    const results = await SupplierOrchestrator.searchHotels({
      location: location || 'Dubai',
      checkin: checkin || '2024-10-25',
      checkout: checkout || '2024-10-26',
      adults: adults || 2,
      children: children || 0
    }, body.context || {});
    res.json({ results });
  } catch {
    res.status(500).json({ error: 'Search failed' });
  }
});

app.use('/hotels', hotelsRouter);

app.use('/static', staticRouter);
app.use('/loyalty', loyaltyRouter);

// ===== SUPPLIER & API VENDOR MANAGEMENT ENDPOINTS =====

// API Vendors
app.get('/api-vendors', async (req: Request, res: Response) => {
  try {
    const vendors = await dynamicPrisma.apiVendor.findMany({
      include: { mappings: true }
    });
    res.json(vendors);
  } catch {
    res.status(500).json({ error: 'Failed to fetch API vendors' });
  }
});

app.post('/api-vendors', async (req: Request, res: Response) => {
  try {
    const body = req.body as ApiVendorRequestBody;
    const { name, code, baseUrl, authType, credentials, mappings } = body;
    const vendor = await dynamicPrisma.apiVendor.create({
      data: {
        name,
        code,
        baseUrl,
        authType,
        credentials: credentials as any,
        mappings: {
          create: (mappings as any[]) || []
        }
      }
    });
    res.json(vendor);
  } catch {
    res.status(500).json({ error: 'Failed to create API vendor' });
  }
});

// Suppliers
app.get('/suppliers', async (req: Request, res: Response) => {
  try {
    const suppliers = await dynamicPrisma.supplier.findMany({
      include: {
        vendor: true,
        contracts: true
      }
    });
    res.json(suppliers);
  } catch {
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

app.post('/suppliers', async (req: Request, res: Response) => {
  try {
    const body = req.body as SupplierRequestBody;
    const { name, code, category, vendorId, settings } = body;
    const supplier = await dynamicPrisma.supplier.create({
      data: { name, code, category, vendorId, settings: settings as any }
    });
    res.json(supplier);
  } catch {
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

// Pricing Rules (Markups/Commissions)
app.get('/pricing-rules', async (req: Request, res: Response) => {
  try {
    const rules = await dynamicPrisma.pricingRule.findMany({
      orderBy: { priority: 'desc' }
    });
    res.json(rules);
  } catch {
    res.status(500).json({ error: 'Failed to fetch pricing rules' });
  }
});

app.post('/pricing-rules', async (req: Request, res: Response) => {
  try {
    const body = req.body as PricingRuleRequestBody;
    const { name, targetType, targetId, serviceType, markupType, markupValue, status, priority, criteria } = body;
    const rule = await dynamicPrisma.pricingRule.create({
      data: {
        name,
        targetType,
        targetId,
        serviceType,
        markupType,
        markupValue: parseFloat(markupValue.toString()),
        status,
        priority: priority || 0,
        criteria: criteria as any
      }
    });
    res.json(rule);
  } catch {
    res.status(500).json({ error: 'Failed to create pricing rule' });
  }
});

app.patch('/suppliers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body as Partial<SupplierRequestBody>;
    const { isActive, settings } = body;
    const supplier = await dynamicPrisma.supplier.update({
      where: { id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(settings && { settings: settings as any })
      }
    });
    res.json(supplier);
  } catch {
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

// Configuration Sync (Used by Booking Engine)
app.get('/config/active-suppliers', async (req: Request, res: Response) => {
  try {
    const activeSuppliers = await dynamicPrisma.supplier.findMany({
      where: { isActive: true },
      include: {
        vendor: {
          include: { mappings: { where: { isActive: true } } }
        },
        contracts: {
          where: { status: 'ACTIVE' }
        }
      }
    });
    res.json(activeSuppliers);
  } catch {
    res.status(500).json({ error: 'Failed to fetch active configuration' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('inventory-service running on port ' + PORT);
});

export default app;
