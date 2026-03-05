import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import app from "../index.js";
import prisma from "../database.js";
import { createAdminToken } from "./helpers.js";

describe("Companies API", () => {
  beforeEach(async () => {
    // Clean up database before each test
    await prisma.company.deleteMany();
  });

  afterEach(async () => {
    // Clean up database after each test
    await prisma.company.deleteMany();
  });

  describe("GET /api/companies", () => {
    it("should return empty list when no companies exist", async () => {
      const response = await request(app)
        .get("/api/companies")
        .set("Authorization", `Bearer ${createAdminToken()}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      });
    });

    it("should return paginated list of companies", async () => {
      // Create test companies
      await prisma.company.createMany({
        data: [
          { name: "Test Company 1", code: "test1", email: "test1@example.com" },
          { name: "Test Company 2", code: "test2", email: "test2@example.com" },
          { name: "Test Company 3", code: "test3", email: "test3@example.com" },
        ],
      });

      const response = await request(app)
        .get("/api/companies?page=1&limit=2")
        .set("Authorization", `Bearer ${createAdminToken()}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
      });
    });

    it("should filter companies by search query", async () => {
      await prisma.company.createMany({
        data: [
          { name: "Acme Corp", code: "acme", email: "contact@acme.com" },
          { name: "Beta Inc", code: "beta", email: "info@beta.com" },
          { name: "Gamma LLC", code: "gamma", email: "hello@gamma.com" },
        ],
      });

      const response = await request(app)
        .get("/api/companies?search=acme")
        .set("Authorization", `Bearer ${createAdminToken()}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe("Acme Corp");
    });
  });

  describe("POST /api/companies", () => {
    it("should create a new company", async () => {
      const companyData = {
        name: "New Test Company",
        email: "contact@newtest.com",
        phone: "+1234567890",
      };

      const response = await request(app)
        .post("/api/companies")
        .set("Authorization", `Bearer ${createAdminToken()}`)
        .send(companyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(companyData.name);
      expect(response.body.data.email).toBe(companyData.email);
      expect(response.body.data.code).toBe("new-test-company");
    });

    it("should generate code from name if not provided", async () => {
      const companyData = {
        name: "My Awesome Company",
        email: "contact@awesome.com",
      };

      const response = await request(app)
        .post("/api/companies")
        .set("Authorization", `Bearer ${createAdminToken()}`)
        .send(companyData)
        .expect(201);

      expect(response.body.data.code).toBe("my-awesome-company");
    });

    it("should return 400 if company with same code already exists", async () => {
      await prisma.company.create({
        data: {
          name: "Existing Company",
          code: "existing",
          email: "existing@example.com",
        },
      });

      const companyData = {
        name: "Duplicate Company",
        code: "existing",
        email: "duplicate@example.com",
      };

      const response = await request(app)
        .post("/api/companies")
        .set("Authorization", `Bearer ${createAdminToken()}`)
        .send(companyData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Company with this code already exists");
    });
  });

  describe("GET /api/companies/:id", () => {
    it("should return company by ID", async () => {
      const company = await prisma.company.create({
        data: {
          name: "Test Company",
          code: "test",
          email: "test@example.com",
        },
      });

      const response = await request(app)
        .get(`/api/companies/${company.id}`)
        .set("Authorization", `Bearer ${createAdminToken()}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("Test Company");
      expect(response.body.data.code).toBe("test");
    });

    it("should return 404 if company not found", async () => {
      const response = await request(app)
        .get("/api/companies/nonexistent-id")
        .set("Authorization", `Bearer ${createAdminToken()}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Company not found");
    });
  });

  describe("PUT /api/companies/:id", () => {
    it("should update company", async () => {
      const company = await prisma.company.create({
        data: {
          name: "Original Name",
          code: "original",
          email: "original@example.com",
        },
      });

      const updateData = {
        name: "Updated Name",
        email: "updated@example.com",
      };

      const response = await request(app)
        .put(`/api/companies/${company.id}`)
        .set("Authorization", `Bearer ${createAdminToken()}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("Updated Name");
      expect(response.body.data.email).toBe("updated@example.com");
    });

    it("should return 404 if company not found", async () => {
      const response = await request(app)
        .put("/api/companies/nonexistent-id")
        .set("Authorization", `Bearer ${createAdminToken()}`)
        .send({ name: "Updated Name" })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Company not found");
    });
  });

  describe("DELETE /api/companies/:id", () => {
    it("should soft delete company", async () => {
      const company = await prisma.company.create({
        data: {
          name: "Test Company",
          code: "test",
          email: "test@example.com",
        },
      });

      const response = await request(app)
        .delete(`/api/companies/${company.id}`)
        .set("Authorization", `Bearer ${createAdminToken()}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Company deactivated successfully");

      // Verify company is marked as inactive
      const deletedCompany = await prisma.company.findUnique({
        where: { id: company.id },
      });
      expect(deletedCompany?.isActive).toBe(false);
    });

    it("should return 404 if company not found", async () => {
      const response = await request(app)
        .delete("/api/companies/nonexistent-id")
        .set("Authorization", `Bearer ${createAdminToken()}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Company not found");
    });
  });
});