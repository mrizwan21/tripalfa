import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import process from 'node:process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3004;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'healthy', service: 'user-service', timestamp: new Date().toISOString() });
});

app.post('/auth/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);

    try {
        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            console.log("User not found, auto-creating for demo login...");
            user = await prisma.user.create({
                data: {
                    email,
                    password: 'demo_password',
                    name: 'Guest User',
                    role: 'user'
                }
            });
        }

        res.json({
            data: {
                accessToken: 'mock_access_token_' + Date.now(),
                refreshToken: 'mock_refresh_token_' + Date.now(),
                user: user
            }
        });
    } catch (error: any) {
        console.error("Login failed", error);
        res.status(500).json({ error: "Login failed" });
    }
});

app.post('/auth/register', async (req: Request, res: Response) => {
    const { email, name, password } = req.body;
    console.log(`Registering user: ${email}`);

    try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: "User already exists" });
        }

        const user = await prisma.user.create({
            data: {
                email,
                password: 'demo_password', // In real app, hash password!
                name: name || 'New User',
                role: 'user'
            }
        });

        res.json({
            data: {
                accessToken: 'mock_access_token_' + Date.now(),
                refreshToken: 'mock_refresh_token_' + Date.now(),
                user
            }
        });
    } catch (error: any) {
        console.error("Registration failed", error);
        res.status(500).json({ error: "Registration failed" });
    }
});

app.post('/auth/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

app.get(['/user/profile', '/auth/profile'], async (req, res) => {
    // In real app, extract ID from token.
    // We'll search for the demo user or a random user for now if no auth context
    // BUT the frontend might expect specific data.
    // Let's return the first user found or a mock fallback structure if DB empty
    // Ideally middleware sets req.user

    // For now, let's just find the "demo" user
    const user = await prisma.user.findFirst({ where: { email: 'demo@tripalfa.com' } });
    if (!user) {
        // try finding ANY user
        const anyUser = await prisma.user.findFirst();
        if (anyUser) return res.json({ data: anyUser });
    } else {
        return res.json({ data: user });
    }

    res.status(404).json({ error: "Profile not found (Auth header missing)" });
});

// Staff Routes
app.get('/admin/staff', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const [staff, total] = await Promise.all([
            prisma.user.findMany({ skip, take: limit }),
            prisma.user.count()
        ]);

        const mappedStaff = staff.map(u => ({
            id: u.id,
            firstName: u.name?.split(' ')[0] || 'User',
            lastName: u.name?.split(' ').slice(1).join(' ') || '',
            email: u.email,
            phone: u.phone,
            role: u.role || 'AGENT',
            branch: 'Main Branch',
            branchName: 'Main Branch',
            status: u.isActive ? 'ACTIVE' : 'INACTIVE',
            isActive: u.isActive,
            bookingsCount: 0,
            salesAmount: 0,
            lastLogin: null, // lastLoginAt not in schema
            createdAt: u.createdAt
        }));

        res.json({
            data: {
                data: mappedStaff,
                pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
            }
        });
    } catch (error: any) {
        console.error('Staff fetch error:', error);
        res.status(500).json({ error: "Failed to fetch staff" });
    }
});

// All Users Route
app.get('/admin/users', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                skip,
                take: limit,
                include: { company: true },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.user.count()
        ]);
        const mappedUsers = users.map((u: any) => ({
            id: u.id,
            firstName: u.name?.split(' ')[0] || 'User',
            lastName: u.name?.split(' ').slice(1).join(' ') || '',
            email: u.email,
            phone: u.phone,
            userType: 'PARTNER_USER',
            status: u.isActive ? 'ACTIVE' : 'INACTIVE',
            company: u.company?.name || 'In-House',
            role: u.role || 'AGENT',
            lastLoginAt: null,
            createdAt: u.createdAt
        }));
        res.json({ data: { data: mappedUsers, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } } });
    } catch (error: any) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

app.get('/staff/:id', async (req, res) => {
    try {
        const s = await prisma.user.findUnique({ where: { id: req.params.id } });
        if (!s) return res.status(404).json({ message: 'Staff not found' });
        res.json({ data: s });
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

// Branch Routes
app.get('/branches', async (req: Request, res: Response) => {
    try {
        const companyId = req.query.companyId as string | undefined;
        const branches = await prisma.branch.findMany({
            where: companyId ? { companyId } : undefined,
            include: { company: true }
        });

        res.json({ data: branches });
    } catch (error: any) {
        console.error('Branches fetch error:', error);
        res.status(500).json({ error: "Failed to fetch branches" });
    }
});

app.post('/branches', async (req: Request, res: Response) => {
    try {
        const { name, code, address, phone, email, managerId, companyId } = req.body;

        let targetCompanyId = companyId;
        if (!targetCompanyId) {
            const company = await prisma.company.findFirst();
            if (!company) {
                return res.status(400).json({ error: "No company found. Create a company first." });
            }
            targetCompanyId = company.id;
        }

        const newBranch = await prisma.branch.create({
            data: {
                name,
                code: code || 'BR-' + Date.now().toString().slice(-4),
                address,
                phone,
                email,
                managerId,
                companyId: targetCompanyId,
                status: 'active'
            }
        });
        res.status(201).json({ data: newBranch });
    } catch (error: any) {
        console.error("Create branch failed", error);
        res.status(500).json({ error: "Failed to create branch" });
    }
});

// Admin - Companies
app.get('/admin/companies', async (req: Request, res: Response) => {
    try {
        const companies = await prisma.company.findMany({
            include: {
                _count: {
                    select: { users: true, branches: true, bookings: true }
                }
            }
        });

        const mappedCompanies = companies.map(c => ({
            ...c,
            usersCount: c._count.users,
            branchesCount: c._count.branches,
            bookingsCount: c._count.bookings
        }));

        res.json({ data: mappedCompanies });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/admin/companies/:id', async (req: Request, res: Response) => {
    try {
        const company = await prisma.company.findUnique({
            where: { id: req.params.id },
            include: {
                branches: true,
                departments: true,
                designations: true,
                costCenters: true,
                _count: { select: { users: true, bookings: true } }
            }
        });
        if (!company) return res.status(404).json({ error: "Company not found" });

        // Calculate stats
        const stats = {
            totalBranches: company.branches.length,
            totalEmployees: company._count.users,
            totalBookings: company._count.bookings,
            totalRevenue: 5000000 // Mock for now
        };

        res.json({ data: { ...company, stats } });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/admin/companies/:id', async (req: Request, res: Response) => {
    try {
        const updated = await prisma.company.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json({ data: updated });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Department, Designation, CostCenter Routes
app.get('/departments', async (req: Request, res: Response) => {
    try {
        const companyId = req.query.companyId as string | undefined;
        const depts = await prisma.department.findMany({
            where: companyId ? { companyId } : undefined,
            include: { parentDepartment: true }
        });
        res.json({ data: depts });
    } catch (e: any) { res.status(500).json({ error: "Failed" }); }
});

app.post('/departments', async (req: Request, res: Response) => {
    try {
        const dept = await prisma.department.create({ data: req.body });
        res.status(201).json({ data: dept });
    } catch (e: any) { res.status(500).json({ error: "Failed" }); }
});

app.get('/designations', async (req: Request, res: Response) => {
    try {
        const companyId = req.query.companyId as string | undefined;
        const items = await prisma.designation.findMany({
            where: companyId ? { companyId } : undefined
        });
        res.json({ data: items });
    } catch (e: any) { res.status(500).json({ error: "Failed" }); }
});

app.get('/cost-centers', async (req: Request, res: Response) => {
    try {
        const companyId = req.query.companyId as string | undefined;
        const items = await prisma.costCenter.findMany({
            where: companyId ? { companyId } : undefined
        });
        res.json({ data: items });
    } catch (e: any) { res.status(500).json({ error: "Failed" }); }
});

// Admin - Roles & Permissions
app.get('/admin/roles', async (req: Request, res: Response) => {
    try {
        const roles = await prisma.role.findMany({
            include: { _count: { select: { userRoles: true } } }
        });
        res.json({ data: roles });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/admin/permissions', async (req: Request, res: Response) => {
    try {
        const permissions = await prisma.permission.findMany();
        res.json({ data: permissions });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Admin - Branding
app.get('/admin/branding', async (req: Request, res: Response) => {
    try {
        res.json({
            data: {
                primaryColor: '#0ea5e9',
                secondaryColor: '#64748b',
                logoUrl: '/logo.png',
                faviconUrl: '/favicon.ico',
                companyName: 'TripAlfa'
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: "Failed to fetch branding" });
    }
});

// Admin - Reference Data (Languages, Currencies, Regions)
app.get('/admin/languages', async (req: Request, res: Response) => {
    try {
        const languages = await prisma.language.findMany();
        res.json({ data: languages });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/admin/currencies', async (req: Request, res: Response) => {
    try {
        const currencies = await prisma.currency.findMany();
        res.json({ data: currencies });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/admin/regions', async (req: Request, res: Response) => {
    try {
        const countries = await prisma.country.findMany();
        res.json({ data: countries });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/admin/ip-whitelist', async (req: Request, res: Response) => {
    try {
        const whitelist = await prisma.ipWhitelist.findMany({
            include: { company: true }
        });
        const mapped = whitelist.map(i => ({
            id: i.id,
            ip: i.ipAddress,
            type: i.companyId ? 'COMPANY' : 'GLOBAL',
            scope: i.company?.name || 'All Platform',
            description: i.description || 'Access Restriction',
            status: i.isActive ? 'ACTIVE' : 'INACTIVE',
            createdAt: i.createdAt
        }));
        res.json({ data: mapped });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/admin/regions/countries', async (req: Request, res: Response) => {
    try {
        const countries = await prisma.country.findMany();
        res.json({ data: countries });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// AUDIT LOGS ENDPOINTS - Login Audit Trail
// ============================================================================

// Audit Logs
app.get('/admin/audit-logs', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;
        const take = limit;

        const { search, status, userType, deviceType, isSuspicious, dateFrom, dateTo } = req.query as any;

        const where: any = {};

        if (search) {
            where.OR = [
                { userName: { contains: search, mode: 'insensitive' } },
                { userEmail: { contains: search, mode: 'insensitive' } },
                { ipAddress: { contains: search } },
                { locationCity: { contains: search, mode: 'insensitive' } },
                { locationCountry: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (status) where.loginStatus = status;
        if (userType) where.userType = userType;
        if (deviceType) where.deviceType = deviceType;
        if (isSuspicious !== undefined) where.isSuspicious = isSuspicious === 'true';

        if (dateFrom || dateTo) {
            where.timestamp = {};
            if (dateFrom) where.timestamp.gte = new Date(dateFrom as string);
            if (dateTo) {
                const toDate = new Date(dateTo as string);
                toDate.setHours(23, 59, 59, 999);
                where.timestamp.lte = toDate;
            }
        }

        // Mock data for now
        const mockLogs = generateMockAuditLogs(50);
        const filteredLogs = mockLogs.slice(skip, skip + take);

        res.json({
            data: filteredLogs,
            pagination: {
                page,
                limit: take,
                total: mockLogs.length,
                totalPages: Math.ceil(mockLogs.length / take)
            }
        });
    } catch (error: any) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get audit log statistics
app.get('/admin/audit-logs/stats', async (req: Request, res: Response) => {
    try {
        // Mock statistics
        const stats = {
            totalLogins: 1547,
            successfulLogins: 1423,
            failedLogins: 124,
            uniqueUsers: 342,
            suspiciousActivities: 18,
            averageSessionDuration: 245,
            loginTrends: [
                { date: '2024-01-09', successful: 185, failed: 12 },
                { date: '2024-01-10', successful: 198, failed: 18 },
                { date: '2024-01-11', successful: 176, failed: 15 },
                { date: '2024-01-12', successful: 142, failed: 8 },
                { date: '2024-01-13', successful: 134, failed: 11 },
                { date: '2024-01-14', successful: 201, failed: 22 },
                { date: '2024-01-15', successful: 187, failed: 16 },
            ],
            geoDistribution: [
                { country: 'United Arab Emirates', countryCode: 'AE', count: 456, percentage: 29.5 },
                { country: 'United Kingdom', countryCode: 'GB', count: 312, percentage: 20.2 },
                { country: 'Saudi Arabia', countryCode: 'SA', count: 245, percentage: 15.8 },
                { country: 'United States', countryCode: 'US', count: 198, percentage: 12.8 },
                { country: 'Singapore', countryCode: 'SG', count: 156, percentage: 10.1 },
                { country: 'Others', countryCode: 'XX', count: 180, percentage: 11.6 },
            ],
            deviceDistribution: [
                { deviceType: 'Desktop', count: 892, percentage: 57.7 },
                { deviceType: 'Mobile', count: 498, percentage: 32.2 },
                { deviceType: 'Tablet', count: 157, percentage: 10.1 },
            ],
            browserDistribution: [
                { browser: 'Chrome', count: 756, percentage: 48.9 },
                { browser: 'Safari', count: 389, percentage: 25.1 },
                { browser: 'Firefox', count: 198, percentage: 12.8 },
                { browser: 'Edge', count: 145, percentage: 9.4 },
                { browser: 'Others', count: 59, percentage: 3.8 },
            ]
        };

        res.json({ data: stats });
    } catch (error: any) {
        console.error('Error fetching audit stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get single audit log by ID
app.get('/admin/audit-logs/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const log = {
            id,
            userId: 'usr_001',
            userName: 'John Smith',
            userEmail: 'john.smith@globaltravel.com',
            userType: 'ADMIN_USER',
            companyId: 'comp_001',
            companyName: 'Global Travel Corp',
            timestamp: new Date().toISOString(),
            ipAddress: '192.168.1.100',
            location: { city: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE' },
            deviceType: 'DESKTOP',
            browser: 'Chrome',
            browserVersion: '120.0.6099',
            operatingSystem: 'Windows',
            osVersion: '11',
            sessionId: 'sess_abc123',
            loginStatus: 'SUCCESS',
            sessionDuration: 494,
            isSuspicious: false,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };
        res.json({ data: log });
    } catch (error: any) {
        console.error('Error fetching audit log:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get audit logs for specific user
app.get('/admin/audit-logs/user/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const mockLogs = generateMockAuditLogs(15).map(log => ({
            ...log,
            userId,
            userName: 'User ' + userId,
        }));

        res.json({
            data: mockLogs,
            pagination: { page, limit, total: mockLogs.length, totalPages: 1 }
        });
    } catch (error: any) {
        console.error('Error fetching user audit logs:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get suspicious login activities
app.get('/admin/audit-logs/suspicious', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const suspiciousLogs = generateMockAuditLogs(10).map(log => ({
            ...log,
            isSuspicious: true,
            suspiciousReasons: ['Unusual location', 'Multiple failed attempts', 'VPN/Proxy detected'].slice(0, Math.floor(Math.random() * 3) + 1),
            loginStatus: Math.random() > 0.5 ? 'SUCCESS' : 'FAILED'
        }));

        res.json({
            data: suspiciousLogs,
            pagination: { page, limit, total: suspiciousLogs.length, totalPages: 1 }
        });
    } catch (error: any) {
        console.error('Error fetching suspicious logs:', error);
        res.status(500).json({ error: error.message });
    }
});

// Export audit logs (CSV/Excel)
app.get('/admin/audit-logs/export', async (req, res) => {
    try {
        const { format = 'csv', dateFrom, dateTo } = req.query;

        // In production, this would generate actual CSV/Excel file
        // For now, return mock data as JSON with download headers
        const logs = generateMockAuditLogs(100);

        if (format === 'csv') {
            const csvHeader = 'ID,User,Email,Status,IP Address,Location,Device,Browser,Timestamp\n';
            const csvRows = logs.map(l =>
                `${l.id},${l.userName},${l.userEmail},${l.loginStatus},${l.ipAddress},"${l.location.city}, ${l.location.country}",${l.deviceType},${l.browser},${l.timestamp}`
            ).join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
            res.send(csvHeader + csvRows);
        } else {
            res.json({ data: logs, format });
        }
    } catch (error) {
        console.error('Error exporting audit logs:', error);
        res.status(500).json({ error: error.message });
    }
});

// Block IP address (from audit log)
app.post('/admin/audit-logs/block-ip', async (req, res) => {
    try {
        const { ipAddress, reason } = req.body;

        if (!ipAddress) {
            return res.status(400).json({ error: 'IP address is required' });
        }

        // In production, this would add the IP to blocked list
        console.log(`Blocking IP: ${ipAddress}, Reason: ${reason}`);

        res.json({
            success: true,
            message: `IP address ${ipAddress} has been blocked`,
            data: { ipAddress, blockedAt: new Date().toISOString(), reason }
        });
    } catch (error) {
        console.error('Error blocking IP:', error);
        res.status(500).json({ error: error.message });
    }
});

// Helper function to generate mock audit log data
function generateMockAuditLogs(count: number): any[] {
    const users = [
        { id: 'usr_001', name: 'John Smith', email: 'john.smith@globaltravel.com', type: 'ADMIN_USER', company: 'Global Travel Corp' },
        { id: 'usr_002', name: 'Sarah Johnson', email: 'sarah.j@skyhightours.com', type: 'AGENT', company: 'Sky High Tours' },
        { id: 'usr_003', name: 'Admin Super', email: 'admin@tripalfa.com', type: 'SUPER_ADMIN', company: null },
        { id: 'usr_004', name: 'Michael Chen', email: 'michael@adventureseekers.com', type: 'AGENT', company: 'Adventure Seekers' },
        { id: 'usr_005', name: 'Emma Williams', email: 'emma@dreamvacations.com', type: 'ADMIN_USER', company: 'Dream Vacations' },
    ];

    const locations = [
        { city: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE' },
        { city: 'London', country: 'United Kingdom', countryCode: 'GB' },
        { city: 'Riyadh', country: 'Saudi Arabia', countryCode: 'SA' },
        { city: 'Singapore', country: 'Singapore', countryCode: 'SG' },
        { city: 'Sydney', country: 'Australia', countryCode: 'AU' },
    ];

    const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
    const devices = ['DESKTOP', 'MOBILE', 'TABLET'];
    const oses = ['Windows 11', 'macOS Sonoma', 'iOS 17', 'Android 14', 'Ubuntu 22.04'];

    const logs: any[] = [];
    const now = new Date().getTime();

    for (let i = 0; i < count; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const location = locations[Math.floor(Math.random() * locations.length)];
        const isSuccess = Math.random() > 0.15;
        const isSuspicious = Math.random() < 0.1;

        logs.push({
            id: `log_${String(i + 1).padStart(5, '0')}`,
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            userType: user.type,
            companyId: user.company ? `comp_${String(i % 5 + 1).padStart(3, '0')}` : null,
            companyName: user.company,
            timestamp: new Date(now - i * 1800000).toISOString(), // 30 min intervals
            ipAddress: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            location,
            deviceType: devices[Math.floor(Math.random() * devices.length)],
            browser: browsers[Math.floor(Math.random() * browsers.length)],
            browserVersion: `${Math.floor(Math.random() * 20) + 100}.0.${Math.floor(Math.random() * 9999)}`,
            operatingSystem: oses[Math.floor(Math.random() * oses.length)].split(' ')[0],
            osVersion: oses[Math.floor(Math.random() * oses.length)].split(' ')[1] || '1.0',
            sessionId: `sess_${Math.random().toString(36).substring(2, 10)}`,
            loginStatus: isSuccess ? 'SUCCESS' : 'FAILED',
            failureReason: isSuccess ? null : ['Invalid credentials', 'Account locked', 'User not found', 'Session expired'][Math.floor(Math.random() * 4)],
            sessionDuration: isSuccess ? Math.floor(Math.random() * 480) + 30 : null,
            isSuspicious,
            suspiciousReasons: isSuspicious ? ['Unusual location', 'Multiple failed attempts'].slice(0, Math.floor(Math.random() * 2) + 1) : []
        });
    }

    return logs;
}

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log('user-service running on port ' + PORT);
});

export default app;
