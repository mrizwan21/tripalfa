import jwt from "jsonwebtoken";

export const JWT_SECRET = process.env.JWT_SECRET || "test-secret-key";

export function createTestToken(payload: {
  userId: string;
  email?: string;
  role?: string;
  companyId?: string;
  permissions?: string[];
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

export function createAdminToken(): string {
  return createTestToken({
    userId: "test-admin-id",
    email: "admin@test.com",
    role: "admin",
    permissions: [
      "companies:read",
      "companies:create", 
      "companies:update",
      "companies:delete",
      "users:read",
      "users:create",
      "users:update",
      "users:delete",
    ],
  });
}

export function createSuperAdminToken(): string {
  return createTestToken({
    userId: "test-super-admin-id",
    email: "superadmin@test.com",
    role: "super_admin",
    permissions: ["*"],
  });
}