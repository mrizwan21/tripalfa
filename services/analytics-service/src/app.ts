import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3006;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes

// Dashboard Stats
app.get('/dashboard/stats', async (req, res) => {
  try {
    const [totalBookings, totalSalesResult, activeStaff] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.aggregate({
        _sum: { totalAmount: true }
      }),
      prisma.user.count({ where: { role: 'STAFF', isActive: true } }) // Assuming role logic
    ]);

    const totalSales = totalSalesResult._sum.totalAmount || 0;

    // For wallet balance, we might aggregare all wallets?
    // Or just return a placeholder or the "Agency" wallet if we can identify it.
    // Let's sum all positive balances for now as a "System Liquidity" metric or similar.
    const walletStats = await prisma.wallet.aggregate({
      _sum: { availableBalance: true }
    });
    const walletBalance = walletStats._sum.availableBalance || 0;

    res.json({
      data: {
        totalBookings,
        totalSales: parseFloat(totalSales),
        totalProfit: parseFloat(totalSales) * 0.1, // 10% profit margin assumption
        walletBalance: parseFloat(walletBalance),
        activeStaff,
        pendingBookings: 0, // TODO: count PENDING bookings
        thisMonthBookings: totalBookings, // Simplification
        thisMonthSales: parseFloat(totalSales),
        bookingsGrowth: 0, // Need historical data for growth
        salesGrowth: 0,
        walletGrowth: 0,
        staffGrowth: 0,
        growthPercentage: 0,
        recentBookings: [],
        salesTrend: [],
        segmentDistribution: []
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Dashboard Recent Activity (Assuming API needs this)
app.get('/dashboard/recent', async (req, res) => {
  try {
    // Fetch recent bookings
    const recentBookings = await prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    });

    // Map to activity format
    // { id: 1, type: 'BOOKING', message: 'New booking from John Doe', time: '5 mins ago' }

    const activities = recentBookings.map((b: typeof recentBookings[number]) => ({
      id: b.id,
      type: 'BOOKING',
      message: `New booking ${b.bookingRef} by ${b.user ? (b.user.firstName + ' ' + b.user.lastName) : 'Unknown'}`,
      time: b.createdAt
    }));

    res.json(activities);

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

// Dashboard Chart Data
app.get('/dashboard/chart', (req, res) => {
  const period = req.query.period || 'month';
  // Mock data based on period - Querying timeseries is complex, keeping mock for UI
  const data = [
    { label: 'Jan', value: 4000 },
    { label: 'Feb', value: 3000 },
    { label: 'Mar', value: 2000 },
    { label: 'Apr', value: 2780 },
    { label: 'May', value: 1890 },
    { label: 'Jun', value: 2390 },
  ];
  res.json(data);
});

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'analytics-service', db: 'postgres' });
});

app.listen(PORT, () => {
  console.log(`Analytics Service running on port ${PORT}`);
});