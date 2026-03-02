#!/usr/bin/env tsx
/**
 * Comprehensive E2E Test Suite for Supplier Management Module Phase 2
 * Tests: Product Mapping, Financial Details, Supplier Wallets
 *
 * Usage: API_GATEWAY_BASE_URL=http://localhost:3000 npm run test:api:supplier-management:e2e
 */

import axios, { AxiosError } from "axios";
import * as fs from "fs";
import * as path from "path";
import jwt from "jsonwebtoken";

// ============================================
// Configuration
// ============================================

const API_GATEWAY_BASE_URL = process.env.API_GATEWAY_BASE_URL || "http://localhost:3000";
const JWT_SECRET = process.env.JWT_SECRET || "local-dev-secret-key";
const SUPPLIER_ONBOARDING_API_BASE_URL =
  process.env.SUPPLIER_ONBOARDING_API_BASE_URL || process.env.LITEAPI_API_BASE_URL || "https://api.liteapi.com/v3";
const SUPPLIER_ONBOARDING_API_KEY =
  process.env.SUPPLIER_ONBOARDING_API_KEY || process.env.LITEAPI_PROD_API_KEY || "dev-test-key";

// ============================================
// Test Harness
// ============================================

interface TestResult {
  name: string;
  status: "pass" | "fail" | "skip";
  duration: number;
  error?: string;
  details?: any;
}

class SupplierManagementE2E {
  private results: TestResult[] = [];
  private supplierId: string = "";
  private supplierProductId: string = "";   private mappingId: string = "";
  private walletId: string = "";
  private paymentId: string = "";
  private authToken: string = "";

  constructor() {
    this.generateAuthToken();
  }

  // Generate JWT token for authenticated requests
  private generateAuthToken(): void {
    const payload = {
      userId: "test-admin-user",
      email: "admin@test.com",
      role: "super_admin",
      permissions: [
        "suppliers:create",
        "suppliers:read",
        "suppliers:update",
        "suppliers:delete",
        "suppliers:approve",
      ],
    };

    this.authToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
  }

  private async request(method: string, url: string, data?: any): Promise<any> {
    try {
      const response = await axios({
        method,
        url: `${API_GATEWAY_BASE_URL}${url}`,
        data,
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          "Content-Type": "application/json",
        },
      });
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return error.response;
      }
      throw error;
    }
  }

  private recordResult(name: string, status: "pass" | "fail" | "skip", duration: number, error?: string, details?: any): void {
    this.results.push({ name, status, duration, error, details });
  }

  private log(message: string): void {
    if (process.env.VERBOSE) {
      console.log(message);
    }
  }

  // ============================================
  // Phase 2 Test Steps
  // ============================================

  async run(): Promise<void> {
    console.log("\n📊 Supplier Management Module E2E Tests (Phase 2)\n");
    console.log(`API Gateway: ${API_GATEWAY_BASE_URL}\n`);

    // Test Phase 1: Create Supplier (using existing Phase 1 test)
    await this.createSupplier();

    // Test Phase 2a: Product Mapping
    await this.testProductManagement();
    await this.testProductMapping();
    await this.testMappingParameters();

    // Test Phase 2b: Financial Details
    await this.testFinancialDetails();
    await this.testPaymentTerms();

    // Test Phase 2c: Supplier Wallets
    await this.testSupplierWalletCreation();
    await this.testWalletApprovalWorkflow();

    // Test Phase 2d: Payment Processing
    await this.testPaymentProcessing();

    // Test Phase 2e: Deletion Constraints
    await this.testDeletionConstraints();

    // Generate Report
    this.generateReport();
  }

  // ============================================
  // Test: Create Supplier (Reuse from Phase 1)
  // ============================================

  private async createSupplier(): Promise<void> {
    const startTime = Date.now();
    try {
      const response = await this.request("POST", "/api/suppliers", {
        name: "LiteAPI Test Supplier Phase 2",
        code: `test-supplier-phase2-${Date.now()}`,
        type: "hotel",
        apiBaseUrl: SUPPLIER_ONBOARDING_API_BASE_URL,
        metadata: {
          onboardingMode: "supplier-mgmt-phase2-e2e",
          testLevel: "comprehensive",
        },
      });

      if (response.status === 201) {
        this.supplierId = response.data.data?.id || response.data.id;
        this.log(`✓ Supplier Created: ${this.supplierId}`);
        this.recordResult("Create Supplier", "pass", Date.now() - startTime, undefined, { supplierId: this.supplierId });
      } else {
        this.recordResult("Create Supplier", "fail", Date.now() - startTime, `HTTP ${response.status}`);
      }
    } catch (error) {
      this.recordResult("Create Supplier", "fail", Date.now() - startTime, String(error));
    }
  }

  // ============================================
  // Test Phase 2a: Product Management
  // ============================================

  private async testProductManagement(): Promise<void> {
    console.log("\n🛍️  Testing Product Management...");

    // Test: Add Supplier Product
    await this.addSupplierProduct();

    // Test: List Supplier Products
    await this.listSupplierProducts();

    // Test: Update Supplier Product
    await this.updateSupplierProduct();

    // Test: Product validation
    await this.testProductValidation();
  }

  private async addSupplierProduct(): Promise<void> {
    const startTime = Date.now();
    try {
      const response = await this.request("POST", `/api/suppliers/${this.supplierId}/products`, {
        externalProductId: "liteapi-hotel-mapping-001",
        productType: "hotel",
        name: "Luxury Hotel Collection",
        description: "Premium 5-star hotel offerings",
        category: "accommodation",
        subCategory: "luxury",
      });

      if (response.status === 201) {
        this.supplierProductId = response.data.data?.id;
        this.recordResult("Add Supplier Product", "pass", Date.now() - startTime);
      } else {
        this.recordResult("Add Supplier Product", "fail", Date.now() - startTime, `HTTP ${response.status}`);
      }
    } catch (error) {
      this.recordResult("Add Supplier Product", "fail", Date.now() - startTime, String(error));
    }
  }

  private async listSupplierProducts(): Promise<void> {
    const startTime = Date.now();
    try {
      const response = await this.request("GET", `/api/suppliers/${this.supplierId}/products?page=1&limit=10`);

      if (response.status === 200 && Array.isArray(response.data.data)) {
        this.recordResult("List Supplier Products", "pass", Date.now() - startTime, undefined, {
          productCount: response.data.data.length,
        });
      } else {
        this.recordResult("List Supplier Products", "fail", Date.now() - startTime, `HTTP ${response.status}`);
      }
    } catch (error) {
      this.recordResult("List Supplier Products", "fail", Date.now() - startTime, String(error));
    }
  }

  private async updateSupplierProduct(): Promise<void> {
    const startTime = Date.now();
    try {
      const response = await this.request("PUT", `/api/suppliers/${this.supplierId}/products/${this.supplierProductId}`, {
        name: "Luxury Hotel Collection - Updated",
        description: "Updated premium 5-star hotel offerings",
      });

      if (response.status === 200) {
        this.recordResult("Update Supplier Product", "pass", Date.now() - startTime);
      } else {
        this.recordResult("Update Supplier Product", "fail", Date.now() - startTime, `HTTP ${response.status}`);
      }
    } catch (error) {
      this.recordResult("Update Supplier Product", "fail", Date.now() - startTime, String(error));
    }
  }

  private async testProductValidation(): Promise<void> {
    const startTime = Date.now();
    try {
      // Test: Missing required fields
      const response = await this.request("POST", `/api/suppliers/${this.supplierId}/products`, {
        externalProductId: "test-product-002",
        // Missing productType and name
      });

      if (response.status === 400) {
        this.recordResult("Product Validation: Missing Fields", "pass", Date.now() - startTime);
      } else {
        this.recordResult("Product Validation: Missing Fields", "fail", Date.now() - startTime, `Expected 400, got ${response.status}`);
      }
    } catch (error) {
      this.recordResult("Product Validation: Missing Fields", "fail", Date.now() - startTime, String(error));
    }
  }

  // ============================================
  // Test Phase 2b: Product Mapping
  // ============================================

  private async testProductMapping(): Promise<void> {
    console.log("\n🗺️  Testing Product Mapping...");

    // Test: Create Mapping
    await this.createProductMapping();

    // Test: List Mappings
    await this.listProductMappings();

    // Test: Admin Approve Mapping
    await this.approveProductMapping();

    // Test: Mapping Geo Rules
    await this.testMappingWithGeoRules();
  }

  private async createProductMapping(): Promise<void> {
    const startTime = Date.now();
    try {
      const response = await this.request("POST", `/api/suppliers/${this.supplierId}/mappings`, {
        supplierProductId: this.supplierProductId,
        productType: "hotel",
        platformProductId: "platform-hotel-001",
        marketNames: ["US", "EU", "ASIA"],
        geographyZones: ["North America", "Western Europe", "Southeast Asia"],
        seasonalApplicable: "year-round",
        businessRules: {
          commissionType: "percent",
          commissionValue: 8.5,
          minRate: 2500,
          currencyCode: "USD",
        },
      });

      if (response.status === 201) {
        this.mappingId = response.data.data?.id;
        this.recordResult("Create Product Mapping (Pending)", "pass", Date.now() - startTime, undefined, {
          status: response.data.data?.status,
        });
      } else {
        this.recordResult("Create Product Mapping (Pending)", "fail", Date.now() - startTime, `HTTP ${response.status}`);
      }
    } catch (error) {
      this.recordResult("Create Product Mapping (Pending)", "fail", Date.now() - startTime, String(error));
    }
  }

  private async listProductMappings(): Promise<void> {
    const startTime = Date.now();
    try {
      const response = await this.request("GET", `/api/suppliers/${this.supplierId}/mappings?status=pending`);

      if (response.status === 200 && Array.isArray(response.data.data)) {
        this.recordResult("List Product Mappings", "pass", Date.now() - startTime, undefined, {
          mappingCount: response.data.data.length,
        });
      } else {
        this.recordResult("List Product Mappings", "fail", Date.now() - startTime, `HTTP ${response.status}`);
      }
    } catch (error) {
      this.recordResult("List Product Mappings", "fail", Date.now() - startTime, String(error));
    }
  }

  private async approveProductMapping(): Promise<void> {
    const startTime = Date.now();
    try {
      const response = await this.request("POST", `/api/suppliers/${this.supplierId}/mappings/${this.mappingId}/approve`, {
        matchConfidence: 92.5,
        approvalNotes: "Mapping verified against platform standards",
      });

      if (response.status === 200) {
        this.recordResult("Admin Approve Product Mapping", "pass", Date.now() - startTime, undefined, {
          status: response.data.data?.status,
        });
      } else {
        this.recordResult("Admin Approve Product Mapping", "fail", Date.now() - startTime, `HTTP ${response.status}`);
      }
    } catch (error) {
      this.recordResult("Admin Approve Product Mapping", "fail", Date.now() - startTime, String(error));
    }
  }

  private async testMappingWithGeoRules(): Promise<void> {
    const startTime = Date.now();
    try {
      // Create mapping with specific geographic constraints
      const response = await this.request("POST", `/api/suppliers/${this.supplierId}/mappings`, {
        supplierProductId: this.supplierProductId,
        productType: "hotel",
        marketNames: ["JP", "SG", "TH"],
        geographyZones: ["Northeast Asia", "Southeast Asia"],
        seasonalApplicable: "peak",
      });

      if (response.status === 201) {
        this.recordResult("Create Mapping with Geo Rules", "pass", Date.now() - startTime);
      } else {
        this.recordResult("Create Mapping with Geo Rules", "fail", Date.now() - startTime, `HTTP ${response.status}`);
      }
    } catch (error) {
      this.recordResult("Create Mapping with Geo Rules", "fail", Date.now() - startTime, String(error));
    }
  }

  // ============================================
  // Test: Mapping Parameters
  // ============================================

  private async testMappingParameters(): Promise<void> {
    console.log("\n⚙️  Testing Mapping Parameters...");

    // Test: Add Parameter
    await this.addMappingParameter();

    // Test: List Parameters
    await this.listMappingParameters();

    // Test: Additional Parameters (markup, discount)
    await this.addMarkupAndDiscountParameters();
  }

  private async addMappingParameter(): Promise<void> {
    const startTime = Date.now();
    try {
      const response = await this.request("POST", `/api/suppliers/${this.supplierId}/mappings/${this.mappingId}/parameters`, {
        parameterType: "commission",
        parameterName: "base_commission_usd",
        parameterValue: 8.5,
        unit: "percentage",
        marketName: "US",
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (response.status === 201) {
        this.recordResult("Add Mapping Parameter (Commission)", "pass", Date.now() - startTime);
      } else {
        this.recordResult("Add Mapping Parameter (Commission)", "fail", Date.now() - startTime, `HTTP ${response.status}`);
      }
    } catch (error) {
      this.recordResult("Add Mapping Parameter (Commission)", "fail", Date.now() - startTime, String(error));
    }
  }

  private async listMappingParameters(): Promise<void> {
    const startTime = Date.now();
    try {
      const response = await this.request("GET", `/api/suppliers/${this.supplierId}/mappings/${this.mappingId}/parameters`);

      if (response.status === 200 && Array.isArray(response.data.data)) {
        this.recordResult("List Mapping Parameters", "pass", Date.now() - startTime, undefined, {
          paramCount: response.data.data.length,
        });
      } else {
        this.recordResult("List Mapping Parameters", "fail", Date.now() - startTime, `HTTP ${response.status}`);
      }
    } catch (error) {
      this.recordResult("List Mapping Parameters", "fail", Date.now() - startTime, String(error));
    }
  }

  private async addMarkupAndDiscountParameters(): Promise<void> {
    const startTime = Date.now();
    try {
      // Add markup
      const markupResponse = await this.request("POST", `/api/suppliers/${this.supplierId}/mappings/${this.mappingId}/parameters`, {
        parameterType: "markup",
        parameterName: "peak_season_markup",
        parameterValue: 15,
        unit: "percentage",
        marketName: "US",
      });

      // Add discount
      const discountResponse = await this.request("POST", `/api/suppliers/${this.supplierId}/mappings/${this.mappingId}/parameters`, {
        parameterType: "discount",
        parameterName: "bulk_discount_threshold",
        parameterValue: 500,
        unit: "fixed",
      });

      if (markupResponse.status === 201 && discountResponse.status === 201) {
        this.recordResult("Add Markup and Discount Parameters", "pass", Date.now() - startTime);
      } else {
        this.recordResult("Add Markup and Discount Parameters", "fail", Date.now() - startTime,
          `Markup: ${markupResponse.status}, Discount: ${discountResponse.status}`
        );
      }
    } catch (error) {
      this.recordResult("Add Markup and Discount Parameters", "fail", Date.now() - startTime, String(error));
    }
  }

  // ============================================
  // Test Phase 2b: Financial Details
  // ============================================

  private async testFinancialDetails(): Promise<void> {
    console.log("\n💰 Testing Financial Details...");

    // Test: Get Financial Profile
    await this.getFinancialProfile();

    // Test: Update Financial Details
    await this.updateFinancialProfile();

    // Test: Financial Hold
    await this.testFinancialHold();
  }

  private async getFinancialProfile(): Promise<void> {
    const startTime = Date.now();
    try {
      const response = await this.request("GET", `/api/suppliers/${this.supplierId}/financial`);

      if (response.status === 200 && response.data.data) {
        this.recordResult("Get Financial Profile", "pass", Date.now() - startTime, undefined, {
          paymentTerms: response.data.data.paymentTerms,
          currency: response.data.data.currency,
        });
      } else if (response.status === 404) {
        // Financial profile may not exist until created
        this.recordResult("Get Financial Profile (Not Yet Created)", "pass", Date.now() - startTime);
      } else {
        this.recordResult("Get Financial Profile", "fail", Date.now() - startTime, `HTTP ${response.status}`);
      }
    } catch (error) {
      this.recordResult("Get Financial Profile", "fail", Date.now() - startTime, String(error));
    }
  }

  private async updateFinancialProfile(): Promise<void> {
    const startTime = Date.now();
    try {
      const response = await this.request("PUT", `/api/suppliers/${this.supplierId}/financial`, {
        paymentTerms: "30_days",
        settlementCycle: "monthly",
        minimumPayoutAmount: 5000,
        bankAccountName: "Test Account",
        bankAccountNumber: "1234567890",
        bankCode: "TESTBANK",
        accountHolderName: "Test Supplier",
        country: "US",
        currency: "USD",
        taxId: "123456789",
        commissionStructure: {
          flight: 5.5,
          hotel: 8.0,
          activity: 12.0,
        },
      });

      if (response.status === 200) {
        this.recordResult("Update Financial Profile", "pass", Date.now() - startTime);
      } else if (response.status === 201) {
        // Might create if not existed
        this.recordResult("Update/Create Financial Profile", "pass", Date.now() - startTime);
      } else {
        this.recordResult("Update Financial Profile", "fail", Date.now() - startTime, `HTTP ${response.status}`);
      }
    } catch (error) {
      this.recordResult("Update Financial Profile", "fail", Date.now() - startTime, String(error));
    }
  }

  private async testFinancialHold(): Promise<void> {
    const startTime = Date.now();
    try {
      const response = await this.request("PUT", `/api/suppliers/${this.supplierId}/financial`, {
        paymentHolds: false, // Ensure not on hold
      });

      if (response.status === 200 || response.status === 201) {
        this.recordResult("Financial Hold Control", "pass", Date.now() - startTime);
      } else {
        this.recordResult("Financial Hold Control", "fail", Date.now() - startTime, `HTTP ${response.status}`);
      }
    } catch (error) {
      this.recordResult("Financial Hold Control", "fail", Date.now() - startTime, String(error));
    }
  }

  // ============================================
  // Test: Payment Terms
  // ============================================

  private async testPaymentTerms(): Promise<void> {
    console.log("\n📋 Testing Payment Terms...");

    // Test: Add Payment Term
    await this.addPaymentTerm();

    // Test: List Payment Terms
    await this.listPaymentTerms();
  }

  private async addPaymentTerm(): Promise<void> {
    const startTime = Date.now();
    try {
      const response = await this.request("POST", `/api/suppliers/${this.supplierId}/payment-terms`, {
        termType: "deposit",
        daysFromBooking: 0,
        percentageRequired: 30,
        minimumAmount: 1000,
        description: "30% deposit required at booking",
      });

      if (response.status === 201) {
        this.recordResult("Add Payment Term (Deposit)", "pass", Date.now() - startTime);
      } else {
        this.recordResult("Add Payment Term (Deposit)", "fail", Date.now() - startTime, `HTTP ${response.status}`);
      }
    } catch (error) {
      this.recordResult("Add Payment Term (Deposit)", "fail", Date.now() - startTime, String(error));
    }
  }

  private async listPaymentTerms(): Promise<void> {
    const startTime = Date.now();
    try {
      const response = await this.request("GET", `/api/suppliers/${this.supplierId}/payment-terms?page=1&limit=10`);

      if (response.status === 200) {
        this.recordResult("List Payment Terms", "pass", Date.now() - startTime, undefined, {
          termCount: response.data.data?.length || 0,
        });
      } else {
        this.recordResult("List Payment Terms", "fail", Date.now() - startTime, `HTTP ${response.status}`);
      }
    } catch (error) {
      this.recordResult("List Payment Terms", "fail", Date.now() - startTime, String(error));
    }
  }

  // ============================================
  // Test Phase 2c: Supplier Wallets
  // ============================================

  private async testSupplierWalletCreation(): Promise<void> {
    console.log("\n👛 Testing Supplier Wallet Creation...");

    // Test: Request Wallet Creation
    await this.requestWalletCreation();

    // Test: List Wallets
    await this.listSupplierWallets();
  }

  private async requestWalletCreation(): Promise<void> {
    const startTime = Date.now();
    try {
      const response = await this.request("POST", `/api/suppliers/${this.supplierId}/wallets/request`, {
        currency: "USD",
        requestMessage: "Request wallet creation for supplier",
      });

      if (response.status === 201) {
        this.walletId = response.data.data?.wallet?.id;
        this.recordResult("Request Wallet Creation", "pass", Date.now() - startTime, undefined, {
          status: response.data.data?.wallet?.approvalStatus,
        });
      } else {
        this.recordResult("Request Wallet Creation", "fail", Date.now() - startTime, `HTTP ${response.status}`);
      }
    } catch (error) {
      this.recordResult("Request Wallet Creation", "fail", Date.now() - startTime, String(error));
    }
  }

  private async listSupplierWallets(): Promise<void> {
    const startTime = Date.now();
    try {
      const response = await this.request("GET", `/api/suppliers/${this.supplierId}/wallets`);

      if (response.status === 200) {
        this.recordResult("Get Supplier Wallet", "pass", Date.now() - startTime, undefined, {
          balance: response.data.data?.balance,
          status: response.data.data?.status,
        });
      } else {
        this.recordResult("Get Supplier Wallet", "fail", Date.now() - startTime, `HTTP ${response.status}`);
      }
    } catch (error) {
      this.recordResult("Get Supplier Wallet", "fail", Date.now() - startTime, String(error));
    }
  }

  // ============================================
  // Test: Wallet Approval Workflow
  // ============================================

  private async testWalletApprovalWorkflow(): Promise<void> {
    console.log("\n✅ Testing Wallet Approval Workflow...");

    // Test: List Approval Requests
    await this.listWalletApprovalRequests();

    // Test: Admin Approves Wallet
    await this.approveWalletRequest();

    // Test: Verify Wallet Active
    await this.verifyWalletActive();
  }

  private async listWalletApprovalRequests(): Promise<void> {
    const startTime = Date.now();
    try {
      const response = await this.request("GET", `/api/suppliers/${this.supplierId}/wallet-approvals?status=pending`);

      if (response.status === 200) {
        this.recordResult("List Wallet Approval Requests", "pass", Date.now() - startTime, undefined, {
          requestCount: response.data.data?.length || 0,
        });
      } else {
        this.recordResult("List Wallet Approval Requests", "fail", Date.now() - startTime, `HTTP ${response.status}`);
      }
    } catch (error) {
      this.recordResult("List Wallet Approval Requests", "fail", Date.now() - startTime, String(error));
    }
  }

  private async approveWalletRequest(): Promise<void> {
    const startTime = Date.now();
    try {
      // First, get pending requests
      const listResponse = await this.request("GET", `/api/suppliers/${this.supplierId}/wallet-approvals?status=pending`);

      if (listResponse.status === 200 && listResponse.data.data?.length > 0) {
        const requestId = listResponse.data.data[0].id;

        const approveResponse = await this.request("POST", `/api/suppliers/${this.supplierId}/wallet-approvals/${requestId}/approve`, {
          approvalNotes: "Supplier verified and approved for payments",
        });

        if (approveResponse.status === 200) {
          this.recordResult("Admin Approve Wallet Request", "pass", Date.now() - startTime);
        } else {
          this.recordResult("Admin Approve Wallet Request", "fail", Date.now() - startTime, `HTTP ${approveResponse.status}`);
        }
      } else {
        this.recordResult("Admin Approve Wallet Request", "skip", Date.now() - startTime, "No pending requests");
      }
    } catch (error) {
      this.recordResult("Admin Approve Wallet Request", "fail", Date.now() - startTime, String(error));
    }
  }

  private async verifyWalletActive(): Promise<void> {
    const startTime = Date.now();
    try {
      const response = await this.request("GET", `/api/suppliers/${this.supplierId}/wallets`);

      if (response.status === 200 && response.data.data?.status === "active") {
        this.recordResult("Verify Wallet Active", "pass", Date.now() - startTime, undefined, {
          walletStatus: response.data.data.status,
        });
      } else {
        const actualStatus = response.data.data?.status || "unknown";
        this.recordResult("Verify Wallet Active", "fail", Date.now() - startTime, `Status is ${actualStatus}, not active`);
      }
    } catch (error) {
      this.recordResult("Verify Wallet Active", "fail", Date.now() - startTime, String(error));
    }
  }

  // ============================================
  // Test Phase 2d: Payment Processing
  // ============================================

  private async testPaymentProcessing(): Promise<void> {
    console.log("\n💳 Testing Payment Processing...");

    // Test: Create Payment Request
    await this.createPaymentRequest();

    // Test: List Payments
    await this.listPayments();

    // Test: Payment Audit Log
    await this.getPaymentLogs();
  }

  private async createPaymentRequest(): Promise<void> {
    const startTime = Date.now();
    try {
      const response = await this.request("POST", `/api/suppliers/${this.supplierId}/payments`, {
        amount: 5000,
        currency: "USD",
        paymentType: "adjustment",
        paymentMethod: "bank_transfer",
        description: "Payment adjustment for Phase 2 testing",
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      if (response.status === 201) {
        this.paymentId = response.data.data?.id;
        this.recordResult("Create Payment Request", "pass", Date.now() - startTime, undefined, {
          paymentStatus: response.data.data?.status,
        });
      } else {
        this.recordResult("Create Payment Request", "fail", Date.now() - startTime, `HTTP ${response.status}`);
      }
    } catch (error) {
      this.recordResult("Create Payment Request", "fail", Date.now() - startTime, String(error));
    }
  }

  private async listPayments(): Promise<void> {
    const startTime = Date.now();
    try {
      const response = await this.request("GET", `/api/suppliers/${this.supplierId}/payments?page=1&limit=10`);

      if (response.status === 200) {
        this.recordResult("List Payments", "pass", Date.now() - startTime, undefined, {
          paymentCount: response.data.data?.length || 0,
        });
      } else {
        this.recordResult("List Payments", "fail", Date.now() - startTime, `HTTP ${response.status}`);
      }
    } catch (error) {
      this.recordResult("List Payments", "fail", Date.now() - startTime, String(error));
    }
  }

  private async getPaymentLogs(): Promise<void> {
    const startTime = Date.now();
    try {
      const response = await this.request("GET", `/api/suppliers/${this.supplierId}/payment-logs?page=1&limit=20`);

      if (response.status === 200) {
        this.recordResult("Get Payment Audit Logs", "pass", Date.now() - startTime, undefined, {
          logCount: response.data.data?.length || 0,
        });
      } else {
        this.recordResult("Get Payment Audit Logs", "fail", Date.now() - startTime, `HTTP ${response.status}`);
      }
    } catch (error) {
      this.recordResult("Get Payment Audit Logs", "fail", Date.now() - startTime, String(error));
    }
  }

  // ============================================
  // Test Phase 2e: Deletion Constraints
  // ============================================

  private async testDeletionConstraints(): Promise<void> {
    console.log("\n🗑️  Testing Deletion Constraints...");

    // Test: Cannot delete supplier with active wallet
    await this.testSupplierDeletionBlocked();

    // Test: Supplier soft delete rules
    await this.testSupplierSoftDelete();
  }

  private async testSupplierDeletionBlocked(): Promise<void> {
    const startTime = Date.now();
    try {
      // Try to delete supplier with active wallet (should be blocked)
      const response = await this.request("DELETE", `/api/suppliers/${this.supplierId}`);

      if (response.status === 409) {
        this.recordResult("Supplier Deletion Blocked (Has Wallet)", "pass", Date.now() - startTime, undefined, {
          reason: response.data.error,
        });
      } else if (response.status === 400) {
        // Alternative error code
        this.recordResult("Supplier Deletion Blocked (Has Wallet)", "pass", Date.now() - startTime);
      } else {
        this.recordResult("Supplier Deletion Blocked (Has Wallet)", "fail", Date.now() - startTime,
          `Expected 409/400, got ${response.status}`
        );
      }
    } catch (error) {
      this.recordResult("Supplier Deletion Blocked (Has Wallet)", "fail", Date.now() - startTime, String(error));
    }
  }

  private async testSupplierSoftDelete(): Promise<void> {
    const startTime = Date.now();
    try {
      // This would be tested after clearing financial liabilities
      this.recordResult("Supplier Soft Delete (Deferred)", "skip", Date.now() - startTime,
        "Requires clearing all financial liabilities"
      );
    } catch (error) {
      this.recordResult("Supplier Soft Delete (Deferred)", "fail", Date.now() - startTime, String(error));
    }
  }

  // ============================================
  // Report Generation
  // ============================================

  private generateReport(): void {
    const passed = this.results.filter((r) => r.status === "pass").length;
    const failed = this.results.filter((r) => r.status === "fail").length;
    const skipped = this.results.filter((r) => r.status === "skip").length;
    const total = this.results.length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log("\n\n════════════════════════════════════════════════════════════");
    console.log("📊 TEST REPORT - SUPPLIER MANAGEMENT MODULE (PHASE 2)");
    console.log("════════════════════════════════════════════════════════════\n");

    // Print results
    this.results.forEach((result) => {
      const icon = result.status === "pass" ? "✓" : result.status === "fail" ? "✗" : "⊘";
      const color = result.status === "pass" ? "\x1b[32m" : result.status === "fail" ? "\x1b[31m" : "\x1b[33m";
      const reset = "\x1b[0m";

      console.log(`${color}${icon}${reset} ${result.name} [${result.duration}ms]`);
      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
      if (result.details) {
        console.log(`    Details: ${JSON.stringify(result.details)}`);
      }
    });

    console.log("\n════════════════════════════════════════════════════════════");
    console.log(`📈 SUMMARY: ${passed}/${total} passed${failed > 0 ? `, ${failed} failed` : ""}${skipped > 0 ? `, ${skipped} skipped` : ""}`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);
    console.log("════════════════════════════════════════════════════════════\n");

    // Save report to file
    const reportPath = path.join(process.cwd(), `test-reports/supplier-management-phase2-e2e-${Date.now()}.json`);
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          summary: { total, passed, failed, skipped, duration: totalDuration },
          results: this.results,
        },
        null,
        2
      )
    );

    console.log(`📄 Report saved to: ${reportPath}\n`);

    // Exit with appropriate code
    process.exit(failed > 0 ? 1 : 0);
  }
}

// ============================================
// Main Execution
// ============================================

const tester = new SupplierManagementE2E();
tester.run().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});
