import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Load environment variables from root .env file BEFORE any other imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, "../../..");
dotenv.config({ path: resolve(rootDir, ".env") });

// Now import other modules that depend on environment variables
import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import {
  resolveEndpoint,
  checkAuth,
  rateLimit,
  forwardRequest,
} from "./middleware/api-gateway.middleware.js";

const app: Express = express();
const PORT = process.env.API_GATEWAY_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "api-gateway" });
});

// OAuth routes - Forward to user-service for authentication
// Set USE_DOCKER_NETWORK=1 for Docker deployments, leave unset for local development
app.get("/auth/oauth/google", resolveEndpoint, rateLimit, forwardRequest);
app.get("/auth/oauth/facebook", resolveEndpoint, rateLimit, forwardRequest);
app.get("/auth/oauth/apple", resolveEndpoint, rateLimit, forwardRequest);
app.post("/auth/oauth/callback", resolveEndpoint, rateLimit, forwardRequest);

// OAuth routes (authentication required)
app.get(
  "/auth/linked-accounts",
  resolveEndpoint,
  checkAuth,
  rateLimit,
  forwardRequest,
);
app.get(
  "/auth/oauth/link/:provider",
  resolveEndpoint,
  checkAuth,
  rateLimit,
  forwardRequest,
);
app.delete(
  "/auth/oauth/unlink/:provider",
  resolveEndpoint,
  checkAuth,
  rateLimit,
  forwardRequest,
);

// Gateway status endpoint
app.get("/status", (req, res) => {
  res.json({
    service: "api-gateway",
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// Mock Endpoints (Development Only)
// ============================================
// These endpoints are only available in development mode
// In production, all requests are forwarded to real backend services
if (process.env.NODE_ENV === "development") {
  console.log("[API Gateway] Development mode: Mock endpoints enabled");

  app.get("/api/admin/suppliers", (req, res) => {
    res.json({
      data: [
        {
          id: "1",
          name: "American Airlines",
          category: "flight",
          isActive: true,
          vendor: { name: "AA Vendor" },
          code: "AA",
        },
        {
          id: "2",
          name: "Marriott Hotels",
          category: "hotel",
          isActive: true,
          vendor: { name: "Marriott Corp" },
          code: "MQ",
        },
        {
          id: "3",
          name: "Delta Airlines",
          category: "flight",
          isActive: false,
          vendor: { name: "Delta Vendor" },
          code: "DL",
        },
      ],
    });
  });

  // Organization mock endpoints
  app.get("/api/organization", (req, res) => {
    res.json({
      data: [
        {
          id: "1",
          name: "TripAlfa Corp",
          domain: "tripalfa.com",
          status: "active",
          creditLimit: 100000,
          balance: 25000,
        },
        {
          id: "2",
          name: "Global Travel Solutions",
          domain: "globaltravel.com",
          status: "active",
          creditLimit: 50000,
          balance: 15000,
        },
        {
          id: "3",
          name: "SkyHigh Airlines",
          domain: "skyhigh.com",
          status: "suspended",
          creditLimit: 75000,
          balance: 5000,
        },
      ],
    });
  });

  app.get("/api/organization/:companyId/branches", (req, res) => {
    const { companyId } = req.params;
    res.json([
      {
        id: "1",
        name: "Dubai HQ",
        code: "DBX-HQ",
        address: { city: "Dubai" },
        status: "active",
      },
      {
        id: "2",
        name: "London Office",
        code: "LON-OF",
        address: { city: "London" },
        status: "active",
      },
      {
        id: "3",
        name: "Mumbai Branch",
        code: "MUM-BR",
        address: { city: "Mumbai" },
        status: "inactive",
      },
    ]);
  });

  app.get("/api/organization/departments", (req, res) => {
    res.json({
      data: [
        { id: "1", name: "Operations", code: "OPS" },
        { id: "2", name: "Finance", code: "FIN" },
        { id: "3", name: "IT", code: "IT" },
        { id: "4", name: "Sales", code: "SAL" },
        { id: "5", name: "Marketing", code: "MKT" },
      ],
    });
  });

  app.get("/api/organization/designations", (req, res) => {
    res.json({
      data: [
        { id: "1", name: "Manager", code: "MGR" },
        { id: "2", name: "Senior Manager", code: "SMGR" },
        { id: "3", name: "Director", code: "DIR" },
        { id: "4", name: "VP", code: "VP" },
        { id: "5", name: "CEO", code: "CEO" },
      ],
    });
  });

  // Users mock endpoint
  app.get("/api/users", (req, res) => {
    const pageStr = req.query.page as string | undefined;
    const limitStr = req.query.limit as string | undefined;
    const search = req.query.search as string | undefined;
    const page = pageStr ? parseInt(pageStr) : 1;
    const limit = limitStr ? parseInt(limitStr) : 10;
    const allUsers = [
      {
        id: "1",
        name: "John Doe",
        email: "john.doe@tripalfa.com",
        role: "admin",
        status: "active",
        department: "Operations",
        branch: "Dubai HQ",
        lastLogin: "2024-02-15T10:30:00Z",
      },
      {
        id: "2",
        name: "Jane Smith",
        email: "jane.smith@tripalfa.com",
        role: "manager",
        status: "active",
        department: "Finance",
        branch: "London Office",
        lastLogin: "2024-02-14T15:45:00Z",
      },
      {
        id: "3",
        name: "Bob Johnson",
        email: "bob.johnson@tripalfa.com",
        role: "user",
        status: "inactive",
        department: "IT",
        branch: "Mumbai Branch",
        lastLogin: "2024-02-10T09:15:00Z",
      },
      {
        id: "4",
        name: "Alice Brown",
        email: "alice.brown@tripalfa.com",
        role: "user",
        status: "active",
        department: "Sales",
        branch: "Dubai HQ",
        lastLogin: "2024-02-15T08:20:00Z",
      },
      {
        id: "5",
        name: "Charlie Wilson",
        email: "charlie.wilson@tripalfa.com",
        role: "manager",
        status: "active",
        department: "Marketing",
        branch: "London Office",
        lastLogin: "2024-02-13T14:10:00Z",
      },
    ];

    // Filter by search if provided
    let filteredUsers = allUsers;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = allUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower),
      );
    }

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    res.json({
      data: paginatedUsers,
      pagination: {
        page,
        limit,
        total: filteredUsers.length,
        pages: Math.ceil(filteredUsers.length / limit),
      },
    });
  });

  // User CRUD endpoints
  app.post("/api/users", (req, res) => {
    const newUser = {
      id: Date.now().toString(),
      ...req.body,
      status: "active",
      lastLogin: new Date().toISOString(),
    };
    res.status(201).json({
      message: "User created successfully",
      data: newUser,
    });
  });

  app.put("/api/users/:id/details", (req, res) => {
    const { id } = req.params;
    const updatedUser = {
      id,
      ...req.body,
      lastLogin: new Date().toISOString(),
    };
    res.json({
      message: "User updated successfully",
      data: updatedUser,
    });
  });

  app.delete("/api/users/:id", (req, res) => {
    const { id } = req.params;
    res.json({
      message: "User deleted successfully",
    });
  });
} // End development-only mock endpoints

// ============================================
// Legacy Routes with Deprecation Notices
// ============================================
// These routes maintain backward compatibility with older API clients
// They will be removed in a future version - migrate to new routes

const DEPRECATION_WARNING =
  "This endpoint is deprecated and will be removed in a future version. Please migrate to the new API routes.";

// Legacy flight booking routes - forward to new endpoints with deprecation headers
app.all(
  /^\/bookings\/flight\/.*/,
  (req, res, next) => {
    console.warn(
      `[DEPRECATED] ${req.method} ${req.path} - ${DEPRECATION_WARNING}`,
    );
    res.setHeader("X-Deprecation-Warning", DEPRECATION_WARNING);
    res.setHeader("X-Deprecation-Date", "2025-06-01");
    res.setHeader(
      "X-Deprecation-Migration",
      "Use /api/flight-booking/* instead",
    );
    // Rewrite path to new endpoint
    req.url = req.url.replace("/bookings/flight/", "/api/flight-booking/");
    next();
  },
  resolveEndpoint,
  checkAuth,
  rateLimit,
  forwardRequest,
);

// Legacy hotel booking routes - forward to new endpoints with deprecation headers
app.all(
  /^\/bookings\/hotel\/.*/,
  (req, res, next) => {
    console.warn(
      `[DEPRECATED] ${req.method} ${req.path} - ${DEPRECATION_WARNING}`,
    );
    res.setHeader("X-Deprecation-Warning", DEPRECATION_WARNING);
    res.setHeader("X-Deprecation-Date", "2025-06-01");
    res.setHeader(
      "X-Deprecation-Migration",
      "Use /api/hotel-booking/* instead",
    );
    // Rewrite path to new endpoint
    req.url = req.url.replace("/bookings/hotel/", "/api/hotel-booking/");
    next();
  },
  resolveEndpoint,
  checkAuth,
  rateLimit,
  forwardRequest,
);



// API Gateway Routes - All API requests go through the gateway middleware
// Using regex to match all /api/* paths
app.all(/\/api\/.+/, resolveEndpoint, checkAuth, rateLimit, forwardRequest);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    path: req.path,
    method: req.method,
  });
});

// Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("[APIGateway] Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message || "Unknown error",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
});

export default app;
