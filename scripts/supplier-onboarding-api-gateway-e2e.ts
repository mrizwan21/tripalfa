#!/usr/bin/env npx tsx

import axios, { AxiosInstance, AxiosResponse } from "axios";
import dotenv from "dotenv";
import fs from "fs";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
dotenv.config({ path: path.resolve(rootDir, ".env") });

interface TestStepResult {
  name: string;
  status: "PASS" | "FAIL" | "SKIP";
  details?: string;
  statusCode?: number;
}

interface TestReport {
  timestamp: string;
  gatewayBaseUrl: string;
  steps: TestStepResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  createdSupplierId?: string;
  createdCredentialId?: string;
}

class SupplierOnboardingE2E {
  private gatewayBaseUrl: string;
  private verbose: boolean;
  private realSupplierApiBaseUrl: string;
  private realSupplierApiKey: string;
  private realSupplierApiSecret: string | undefined;
  private realSupplierCredentialName: string;
  private api: AxiosInstance;
  private readOnlyApi: AxiosInstance;
  private invalidTokenApi: AxiosInstance;
  private noAuthApi: AxiosInstance;
  private authHeader: string;
  private steps: TestStepResult[] = [];

  private createdSupplierId: string | undefined;
  private createdCredentialId: string | undefined;
  private createdSupplierCode: string | undefined;

  constructor() {
    this.gatewayBaseUrl = process.env.API_GATEWAY_BASE_URL || "http://localhost:3000";
    this.verbose = process.env.VERBOSE === "true";
    this.realSupplierApiBaseUrl =
      process.env.SUPPLIER_ONBOARDING_API_BASE_URL ||
      process.env.LITEAPI_API_BASE_URL ||
      "";
    this.realSupplierApiKey =
      process.env.SUPPLIER_ONBOARDING_API_KEY ||
      process.env.LITEAPI_PROD_API_KEY ||
      process.env.LITEAPI_API_KEY ||
      "";
    this.realSupplierApiSecret = process.env.SUPPLIER_ONBOARDING_API_SECRET;
    this.realSupplierCredentialName =
      process.env.SUPPLIER_ONBOARDING_CREDENTIAL_NAME || "production";

    if (!this.realSupplierApiBaseUrl || !this.realSupplierApiKey) {
      throw new Error(
        "Real supplier API values are required. Set SUPPLIER_ONBOARDING_API_BASE_URL and SUPPLIER_ONBOARDING_API_KEY (or LITEAPI_API_BASE_URL/LITEAPI_API_KEY).",
      );
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is required to generate E2E auth token");
    }

    const token = this.createToken(jwtSecret, {
      id: "e2e-admin",
      userId: "e2e-admin",
      email: "e2e@tripalfa.local",
      role: "super_admin",
      permissions: [
        "suppliers:read",
        "suppliers:create",
        "suppliers:update",
        "suppliers:delete",
      ],
    });

    const readOnlyToken = this.createToken(jwtSecret, {
      id: "e2e-readonly",
      userId: "e2e-readonly",
      email: "readonly@tripalfa.local",
      role: "admin",
      permissions: ["suppliers:read"],
    });

    const invalidToken = `${token}tampered`;

    this.authHeader = `Bearer ${token}`;

    this.api = axios.create({
      baseURL: this.gatewayBaseUrl,
      timeout: 20000,
      validateStatus: () => true,
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json",
      },
    });

    this.readOnlyApi = axios.create({
      baseURL: this.gatewayBaseUrl,
      timeout: 20000,
      validateStatus: () => true,
      headers: {
        Authorization: `Bearer ${readOnlyToken}`,
        "Content-Type": "application/json",
      },
    });

    this.invalidTokenApi = axios.create({
      baseURL: this.gatewayBaseUrl,
      timeout: 20000,
      validateStatus: () => true,
      headers: {
        Authorization: `Bearer ${invalidToken}`,
        "Content-Type": "application/json",
      },
    });

    this.noAuthApi = axios.create({
      baseURL: this.gatewayBaseUrl,
      timeout: 20000,
      validateStatus: () => true,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  private createToken(jwtSecret: string, payload: Record<string, unknown>): string {
    return jwt.sign(payload, jwtSecret, { expiresIn: "1h" });
  }

  private log(message: string, data?: unknown): void {
    if (!this.verbose) return;
    if (data !== undefined) {
      console.log(`[VERBOSE] ${message}`, data);
    } else {
      console.log(`[VERBOSE] ${message}`);
    }
  }

  private pushStep(step: TestStepResult): void {
    this.steps.push(step);
    const icon = step.status === "PASS" ? "✓" : step.status === "FAIL" ? "✗" : "⊘";
    const suffix = step.statusCode ? ` [HTTP ${step.statusCode}]` : "";
    const details = step.details ? ` - ${step.details}` : "";
    console.log(`${icon} ${step.name}${suffix}${details}`);
  }

  private assertStatus(
    name: string,
    response: AxiosResponse,
    expectedStatus: number | number[],
    details?: string,
  ): boolean {
    const expected = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    const isOk = expected.includes(response.status);

    this.pushStep({
      name,
      status: isOk ? "PASS" : "FAIL",
      statusCode: response.status,
      details: isOk ? details : `Unexpected response: ${JSON.stringify(response.data)}`,
    });

    return isOk;
  }

  private skipStep(name: string, details: string): void {
    this.pushStep({
      name,
      status: "SKIP",
      details,
    });
  }

  async run(): Promise<TestReport> {
    console.log("\n🚀 Supplier Onboarding + API Gateway Comprehensive E2E Test");
    console.log("═".repeat(68));
    console.log(`Gateway: ${this.gatewayBaseUrl}`);

    await this.stepGatewayHealth();
    if (this.steps.some((step) => step.name === "Gateway health check" && step.status === "FAIL")) {
      return this.buildReport();
    }

    await this.stepUnauthorizedCreate();
    await this.stepInvalidTokenCreate();
    await this.stepForbiddenCreate();
    await this.stepInvalidCreateMissingFields();
    await this.stepInvalidCreateType();

    await this.stepCreateSupplier();
    if (!this.createdSupplierId) {
      return this.buildReport();
    }

    await this.stepDuplicateCreateSupplier();
    await this.stepListSuppliers();
    await this.stepGetSupplier();
    await this.stepGetSupplierNotFound();
    await this.stepUpdateSupplier();
    await this.stepListCredentialsInitial();
    await this.stepAddCredentialMissingFields();
    await this.stepAddCredential();
    await this.stepAddDuplicateCredential();
    await this.stepListCredentials();
    await this.stepUpdateCredential();
    await this.stepUpdateCredentialNotFound();
    await this.stepTriggerSync();
    await this.stepGetSyncLogs();
    await this.stepDeleteCredential();
    await this.stepDeleteSupplier();
    await this.stepGetDeletedSupplier();
    await this.stepDeleteSupplierAgain();

    return this.buildReport();
  }

  private async stepGatewayHealth(): Promise<void> {
    try {
      const response = await this.api.get("/health", {
        headers: { Authorization: undefined as unknown as string },
      });
      this.assertStatus("Gateway health check", response, 200, "Gateway is reachable");
    } catch (error: any) {
      this.pushStep({
        name: "Gateway health check",
        status: "FAIL",
        details: error?.message || "Unknown error",
      });
    }
  }

  private async stepUnauthorizedCreate(): Promise<void> {
    const response = await this.noAuthApi.post("/api/suppliers", {
      code: `NOAUTH_${Date.now()}`,
      name: "NoAuth Supplier",
      type: "hotel",
    });
    this.assertStatus("Unauthorized create supplier", response, 401);
  }

  private async stepInvalidTokenCreate(): Promise<void> {
    const response = await this.invalidTokenApi.post("/api/suppliers", {
      code: `BADTOKEN_${Date.now()}`,
      name: "Bad Token Supplier",
      type: "hotel",
    });
    this.assertStatus("Invalid token create supplier", response, 401);
  }

  private async stepForbiddenCreate(): Promise<void> {
    const response = await this.readOnlyApi.post("/api/suppliers", {
      code: `FORBIDDEN_${Date.now()}`,
      name: "Forbidden Supplier",
      type: "hotel",
    });
    this.assertStatus("Forbidden create supplier", response, 403);
  }

  private async stepInvalidCreateMissingFields(): Promise<void> {
    const response = await this.api.post("/api/suppliers", {
      name: "Missing Code Supplier",
    });
    this.assertStatus("Create supplier validation: missing fields", response, 400);
  }

  private async stepInvalidCreateType(): Promise<void> {
    const response = await this.api.post("/api/suppliers", {
      code: `BADTYPE_${Date.now()}`,
      name: "Bad Type Supplier",
      type: "invalid_type",
    });
    this.assertStatus("Create supplier validation: invalid type", response, 400);
  }

  private async stepCreateSupplier(): Promise<void> {
    const supplierCode = `E2E_SUP_${Date.now()}`;
    this.createdSupplierCode = supplierCode;
    const payload = {
      code: supplierCode,
      name: `E2E Supplier ${supplierCode}`,
      type: "hotel",
      apiBaseUrl: this.realSupplierApiBaseUrl,
      rateLimitPerMin: 120,
      rateLimitPerDay: 5000,
      features: {
        hotels: true,
        rates: true,
        bookings: true,
      },
      metadata: {
        onboardingMode: "api-gateway-e2e-real",
      },
    };

    this.log("Create supplier payload", payload);

    const response = await this.api.post("/api/suppliers", payload);
    if (this.assertStatus("Create supplier via gateway", response, [200, 201])) {
      this.createdSupplierId = response.data?.data?.id;
      if (!this.createdSupplierId) {
        this.pushStep({
          name: "Capture created supplier id",
          status: "FAIL",
          details: "Response missing data.id",
        });
      } else {
        this.pushStep({
          name: "Capture created supplier id",
          status: "PASS",
          details: this.createdSupplierId,
        });
      }
    }
  }

  private async stepDuplicateCreateSupplier(): Promise<void> {
    if (!this.createdSupplierCode) {
      this.skipStep("Duplicate create supplier", "No supplier code available");
      return;
    }

    const response = await this.api.post("/api/suppliers", {
      code: this.createdSupplierCode,
      name: `Duplicate ${this.createdSupplierCode}`,
      type: "hotel",
    });
    this.assertStatus("Duplicate create supplier code", response, 400);
  }

  private async stepListSuppliers(): Promise<void> {
    const response = await this.api.get("/api/suppliers", {
      params: { page: 1, limit: 50, search: this.createdSupplierCode },
    });

    const ok = this.assertStatus("List suppliers", response, 200);
    if (!ok || !this.createdSupplierId) return;

    const suppliers = response.data?.data ?? [];
    const found = suppliers.some((supplier: { id?: string }) => supplier.id === this.createdSupplierId);
    this.pushStep({
      name: "Verify created supplier appears in list",
      status: found ? "PASS" : "FAIL",
    });
  }

  private async stepGetSupplier(): Promise<void> {
    if (!this.createdSupplierId) return;
    const response = await this.api.get(`/api/suppliers/${this.createdSupplierId}`);
    this.assertStatus("Get supplier details", response, 200);
  }

  private async stepGetSupplierNotFound(): Promise<void> {
    const response = await this.api.get(`/api/suppliers/non-existent-supplier-id-${Date.now()}`);
    this.assertStatus("Get supplier not found", response, 404);
  }

  private async stepUpdateSupplier(): Promise<void> {
    if (!this.createdSupplierId) return;
    const response = await this.api.put(`/api/suppliers/${this.createdSupplierId}`, {
      name: "E2E Supplier Updated",
      syncEnabled: true,
      syncInterval: 30,
      features: {
        hotels: true,
        rates: true,
        bookings: true,
        availability: true,
      },
    });
    this.assertStatus("Update supplier", response, 200);
  }

  private async stepListCredentialsInitial(): Promise<void> {
    if (!this.createdSupplierId) return;
    const response = await this.api.get(
      `/api/suppliers/${this.createdSupplierId}/credentials`,
    );

    const ok = this.assertStatus("List credentials (initial)", response, 200);
    if (!ok) return;

    const credentials = response.data?.data;
    const isArray = Array.isArray(credentials);
    this.pushStep({
      name: "Verify credentials response is array",
      status: isArray ? "PASS" : "FAIL",
    });
  }

  private async stepAddCredentialMissingFields(): Promise<void> {
    if (!this.createdSupplierId) return;
    const response = await this.api.post(
      `/api/suppliers/${this.createdSupplierId}/credentials`,
      { name: "missing-api-key" },
    );
    this.assertStatus("Add credential validation: missing apiKey", response, 400);
  }

  private async stepAddCredential(): Promise<void> {
    if (!this.createdSupplierId) return;
    const response = await this.api.post(
      `/api/suppliers/${this.createdSupplierId}/credentials`,
      {
        name: this.realSupplierCredentialName,
        apiKey: this.realSupplierApiKey,
        apiSecret: this.realSupplierApiSecret,
      },
    );

    if (this.assertStatus("Add supplier credential", response, [200, 201])) {
      this.createdCredentialId = response.data?.data?.id;
      if (!this.createdCredentialId) {
        this.pushStep({
          name: "Capture created credential id",
          status: "FAIL",
          details: "Response missing data.id",
        });
      } else {
        this.pushStep({
          name: "Capture created credential id",
          status: "PASS",
          details: this.createdCredentialId,
        });
      }
    }
  }

  private async stepAddDuplicateCredential(): Promise<void> {
    if (!this.createdSupplierId) return;
    const response = await this.api.post(
      `/api/suppliers/${this.createdSupplierId}/credentials`,
      {
        name: this.realSupplierCredentialName,
        apiKey: this.realSupplierApiKey,
        apiSecret: this.realSupplierApiSecret,
      },
    );
    this.assertStatus("Duplicate credential name", response, 400);
  }

  private async stepListCredentials(): Promise<void> {
    if (!this.createdSupplierId) return;
    const response = await this.api.get(
      `/api/suppliers/${this.createdSupplierId}/credentials`,
    );

    const ok = this.assertStatus("List supplier credentials", response, 200);
    if (ok && this.createdCredentialId) {
      const credentials = response.data?.data ?? [];
      const found = credentials.some((cred: { id?: string }) => cred.id === this.createdCredentialId);
      this.pushStep({
        name: "Verify created credential appears in list",
        status: found ? "PASS" : "FAIL",
      });
    }
  }

  private async stepUpdateCredential(): Promise<void> {
    if (!this.createdSupplierId || !this.createdCredentialId) return;
    const response = await this.api.put(
      `/api/suppliers/${this.createdSupplierId}/credentials/${this.createdCredentialId}`,
      {
        apiKey: this.realSupplierApiKey,
        apiSecret: this.realSupplierApiSecret,
        status: "active",
      },
    );
    this.assertStatus("Update supplier credential", response, 200);
  }

  private async stepUpdateCredentialNotFound(): Promise<void> {
    if (!this.createdSupplierId) return;
    const response = await this.api.put(
      `/api/suppliers/${this.createdSupplierId}/credentials/non-existent-cred-id-${Date.now()}`,
      {
        apiKey: `key_should_fail_${Date.now()}`,
      },
    );
    this.assertStatus("Update credential not found", response, 404);
  }

  private async stepTriggerSync(): Promise<void> {
    if (!this.createdSupplierId) return;
    const response = await this.api.post(`/api/suppliers/${this.createdSupplierId}/sync`, {
      syncType: "incremental",
      dataType: "hotels",
    });
    this.assertStatus("Trigger supplier sync", response, 200);
  }

  private async stepGetSyncLogs(): Promise<void> {
    if (!this.createdSupplierId) return;
    const response = await this.api.get(
      `/api/suppliers/${this.createdSupplierId}/sync-logs`,
      { params: { page: 1, limit: 20 } },
    );
    this.assertStatus("Get supplier sync logs", response, 200);
  }

  private async stepDeleteCredential(): Promise<void> {
    if (!this.createdSupplierId || !this.createdCredentialId) return;
    const response = await this.api.delete(
      `/api/suppliers/${this.createdSupplierId}/credentials/${this.createdCredentialId}`,
    );
    this.assertStatus("Delete supplier credential", response, 200);
  }

  private async stepDeleteSupplier(): Promise<void> {
    if (!this.createdSupplierId) return;
    const response = await this.api.delete(`/api/suppliers/${this.createdSupplierId}`);
    this.assertStatus("Delete supplier", response, 200);
  }

  private async stepGetDeletedSupplier(): Promise<void> {
    if (!this.createdSupplierId) return;
    const response = await this.api.get(`/api/suppliers/${this.createdSupplierId}`);
    this.assertStatus("Get deleted supplier", response, 404);
  }

  private async stepDeleteSupplierAgain(): Promise<void> {
    if (!this.createdSupplierId) return;
    const response = await this.api.delete(`/api/suppliers/${this.createdSupplierId}`);
    this.assertStatus("Delete supplier again", response, 404);
  }

  private buildReport(): TestReport {
    const passed = this.steps.filter((s) => s.status === "PASS").length;
    const failed = this.steps.filter((s) => s.status === "FAIL").length;
    const skipped = this.steps.filter((s) => s.status === "SKIP").length;

    const report: TestReport = {
      timestamp: new Date().toISOString(),
      gatewayBaseUrl: this.gatewayBaseUrl,
      steps: this.steps,
      summary: {
        total: this.steps.length,
        passed,
        failed,
        skipped,
      },
      createdSupplierId: this.createdSupplierId,
      createdCredentialId: this.createdCredentialId,
    };

    const reportDir = path.resolve(rootDir, "test-reports");
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(
      reportDir,
      `supplier-onboarding-gateway-e2e-${new Date().toISOString().slice(0, 10)}.json`,
    );
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log("\n📊 Test Summary");
    console.log("─".repeat(68));
    console.log(`Total:  ${report.summary.total}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Skipped:${report.summary.skipped}`);
    console.log(`Report: ${reportPath}`);

    return report;
  }
}

async function main(): Promise<void> {
  try {
    const suite = new SupplierOnboardingE2E();
    const report = await suite.run();
    process.exit(report.summary.failed > 0 ? 1 : 0);
  } catch (error: any) {
    console.error("\n❌ Supplier onboarding E2E failed to start:");
    console.error(error?.message || error);
    process.exit(1);
  }
}

main();
