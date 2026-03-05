import { oas30 } from "openapi3-ts";

const openApiSpec = new oas30.OpenApiBuilder();

// Info
openApiSpec.addInfo({
  title: "TripAlfa B2B Admin API",
  description: "Backend API for managing B2B administrative functions including companies, users, bookings, and suppliers.",
  version: "1.0.0",
  contact: {
    name: "TripAlfa Support",
    email: "support@tripalfa.com",
    url: "https://tripalfa.com",
  },
  license: {
    name: "MIT",
    url: "https://opensource.org/licenses/MIT",
  },
});

// Servers
openApiSpec.addServer({
  url: "http://localhost:3020",
  description: "Development server",
});

openApiSpec.addServer({
  url: "https://api.tripalfa.com/b2b-admin",
  description: "Production server",
});

// Components - Security Schemes
openApiSpec.addSecurityScheme("bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

// Components - Schemas
openApiSpec.addSchema("Company", {
  type: "object",
  properties: {
    id: {
      type: "string",
      description: "Unique identifier for the company",
      example: "cm3x1y8k90000123456789abc",
    },
    name: {
      type: "string",
      description: "Company name",
      example: "Acme Corporation",
    },
    code: {
      type: "string",
      description: "Unique company code",
      example: "acme-corp",
    },
    email: {
      type: "string",
      format: "email",
      description: "Company email address",
      example: "contact@acme.com",
    },
    phone: {
      type: "string",
      description: "Company phone number",
      example: "+1-555-123-4567",
    },
    address: {
      type: "string",
      description: "Company address",
      example: "123 Main Street, New York, NY 10001",
    },
    city: {
      type: "string",
      description: "Company city",
      example: "New York",
    },
    country: {
      type: "string",
      description: "Company country",
      example: "USA",
    },
    businessType: {
      type: "string",
      description: "Type of business",
      example: "Technology",
    },
    registrationNumber: {
      type: "string",
      description: "Company registration number",
      example: "12345678",
    },
    taxId: {
      type: "string",
      description: "Company tax identification number",
      example: "123-45-6789",
    },
    subscriptionPlan: {
      type: "string",
      description: "Current subscription plan",
      example: "premium",
    },
    status: {
      type: "string",
      enum: ["active", "inactive", "suspended"],
      description: "Company status",
      example: "active",
    },
    isActive: {
      type: "boolean",
      description: "Whether the company is active",
      example: true,
    },
    metadata: {
      type: "object",
      description: "Additional company metadata",
      example: {
        customField: "customValue",
      },
    },
    createdAt: {
      type: "string",
      format: "date-time",
      description: "Creation timestamp",
      example: "2026-04-03T02:30:00.000Z",
    },
    updatedAt: {
      type: "string",
      format: "date-time",
      description: "Last update timestamp",
      example: "2026-04-03T02:30:00.000Z",
    },
  },
  required: ["id", "name", "code", "isActive", "createdAt", "updatedAt"],
});

openApiSpec.addSchema("CompanyCreate", {
  type: "object",
  properties: {
    name: {
      type: "string",
      description: "Company name",
      example: "Acme Corporation",
    },
    slug: {
      type: "string",
      description: "Company slug (optional, auto-generated if not provided)",
      example: "acme-corp",
    },
    email: {
      type: "string",
      format: "email",
      description: "Company email address",
      example: "contact@acme.com",
    },
    phone: {
      type: "string",
      description: "Company phone number",
      example: "+1-555-123-4567",
    },
    address: {
      type: "string",
      description: "Company address",
      example: "123 Main Street, New York, NY 10001",
    },
    city: {
      type: "string",
      description: "Company city",
      example: "New York",
    },
    country: {
      type: "string",
      description: "Company country",
      example: "USA",
    },
    businessType: {
      type: "string",
      description: "Type of business",
      example: "Technology",
    },
    registrationNumber: {
      type: "string",
      description: "Company registration number",
      example: "12345678",
    },
    taxId: {
      type: "string",
      description: "Company tax identification number",
      example: "123-45-6789",
    },
    subscriptionPlan: {
      type: "string",
      description: "Subscription plan",
      default: "free",
      example: "premium",
    },
    metadata: {
      type: "object",
      description: "Additional company metadata",
      example: {
        customField: "customValue",
      },
    },
  },
  required: ["name"],
});

openApiSpec.addSchema("CompanyUpdate", {
  type: "object",
  properties: {
    name: {
      type: "string",
      description: "Company name",
      example: "Acme Corporation",
    },
    slug: {
      type: "string",
      description: "Company slug",
      example: "acme-corp",
    },
    email: {
      type: "string",
      format: "email",
      description: "Company email address",
      example: "contact@acme.com",
    },
    phone: {
      type: "string",
      description: "Company phone number",
      example: "+1-555-123-4567",
    },
    address: {
      type: "string",
      description: "Company address",
      example: "123 Main Street, New York, NY 10001",
    },
    city: {
      type: "string",
      description: "Company city",
      example: "New York",
    },
    country: {
      type: "string",
      description: "Company country",
      example: "USA",
    },
    businessType: {
      type: "string",
      description: "Type of business",
      example: "Technology",
    },
    registrationNumber: {
      type: "string",
      description: "Company registration number",
      example: "12345678",
    },
    taxId: {
      type: "string",
      description: "Company tax identification number",
      example: "123-45-6789",
    },
    status: {
      type: "string",
      enum: ["active", "inactive", "suspended"],
      description: "Company status",
      example: "active",
    },
    subscriptionPlan: {
      type: "string",
      description: "Subscription plan",
      example: "premium",
    },
    metadata: {
      type: "object",
      description: "Additional company metadata",
      example: {
        customField: "customValue",
      },
    },
  },
});

// Components - Responses
openApiSpec.addResponse("Unauthorized", {
  description: "Unauthorized - Authentication required",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          error: {
            type: "string",
            example: "Invalid or expired token",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2026-04-03T02:30:00.000Z",
          },
        },
      },
    },
  },
});

openApiSpec.addResponse("Forbidden", {
  description: "Forbidden - Insufficient permissions",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          error: {
            type: "string",
            example: "Insufficient permissions",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2026-04-03T02:30:00.000Z",
          },
        },
      },
    },
  },
});

openApiSpec.addResponse("BadRequest", {
  description: "Bad Request - Invalid input",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          error: {
            type: "string",
            example: "Validation Error",
          },
          message: {
            type: "string",
            example: "Invalid input data",
          },
          field: {
            type: "string",
            example: "email",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2026-04-03T02:30:00.000Z",
          },
        },
      },
    },
  },
});

openApiSpec.addResponse("NotFound", {
  description: "Not Found - Resource does not exist",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          error: {
            type: "string",
            example: "Not Found",
          },
          message: {
            type: "string",
            example: "The requested resource was not found",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2026-04-03T02:30:00.000Z",
          },
        },
      },
    },
  },
});

openApiSpec.addResponse("Conflict", {
  description: "Conflict - Resource already exists",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          error: {
            type: "string",
            example: "Conflict",
          },
          message: {
            type: "string",
            example: "A record with this unique constraint already exists",
          },
          field: {
            type: "string",
            example: "code",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2026-04-03T02:30:00.000Z",
          },
        },
      },
    },
  },
});

// Paths
openApiSpec.addPath("/health", {
  get: {
    summary: "Health check endpoint",
    description: "Returns the health status of the B2B Admin service",
    responses: {
      "200": {
        description: "Service is healthy",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: {
                  type: "string",
                  enum: ["healthy"],
                  example: "healthy",
                },
                service: {
                  type: "string",
                  example: "b2b-admin-service",
                },
                version: {
                  type: "string",
                  example: "1.0.0",
                },
                timestamp: {
                  type: "string",
                  format: "date-time",
                  example: "2026-04-03T02:30:00.000Z",
                },
              },
            },
          },
        },
      },
    },
  },
});

openApiSpec.addPath("/api", {
  get: {
    summary: "API information",
    description: "Returns information about available API endpoints",
    responses: {
      "200": {
        description: "API information",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  example: "TripAlfa B2B Admin API",
                },
                version: {
                  type: "string",
                  example: "1.0.0",
                },
                endpoints: {
                  type: "object",
                  properties: {
                    companies: {
                      type: "string",
                      example: "/api/companies",
                    },
                    users: {
                      type: "string",
                      example: "/api/users",
                    },
                    bookings: {
                      type: "string",
                      example: "/api/bookings",
                    },
                    finance: {
                      type: "string",
                      example: "/api/finance",
                    },
                    suppliers: {
                      type: "string",
                      example: "/api/suppliers",
                    },
                    rules: {
                      type: "string",
                      example: "/api/rules",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});

openApiSpec.addPath("/api/companies", {
  get: {
    summary: "List all companies",
    description: "Retrieve a paginated list of all companies with optional filtering",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "page",
        in: "query",
        description: "Page number",
        required: false,
        schema: {
          type: "integer",
          minimum: 1,
          default: 1,
        },
      },
      {
        name: "limit",
        in: "query",
        description: "Number of items per page",
        required: false,
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          default: 10,
        },
      },
      {
        name: "sortBy",
        in: "query",
        description: "Field to sort by",
        required: false,
        schema: {
          type: "string",
          enum: ["name", "email", "createdAt", "updatedAt"],
        },
      },
      {
        name: "sortOrder",
        in: "query",
        description: "Sort order",
        required: false,
        schema: {
          type: "string",
          enum: ["asc", "desc"],
          default: "desc",
        },
      },
      {
        name: "search",
        in: "query",
        description: "Search term to filter companies",
        required: false,
        schema: {
          type: "string",
        },
      },
    ],
    responses: {
      "200": {
        description: "List of companies",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                  example: true,
                },
                data: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/Company",
                  },
                },
                pagination: {
                  type: "object",
                  properties: {
                    page: {
                      type: "integer",
                      example: 1,
                    },
                    limit: {
                      type: "integer",
                      example: 10,
                    },
                    total: {
                      type: "integer",
                      example: 50,
                    },
                    totalPages: {
                      type: "integer",
                      example: 5,
                    },
                  },
                },
              },
            },
          },
        },
      },
      "401": {
        $ref: "#/components/responses/Unauthorized",
      },
      "403": {
        $ref: "#/components/responses/Forbidden",
      },
    },
  },
  post: {
    summary: "Create a new company",
    description: "Create a new company with the provided information",
    security: [
      {
        bearerAuth: [],
      },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/CompanyCreate",
          },
        },
      },
    },
    responses: {
      "201": {
        description: "Company created successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                  example: true,
                },
                data: {
                  $ref: "#/components/schemas/Company",
                },
                message: {
                  type: "string",
                  example: "Company created successfully",
                },
              },
            },
          },
        },
      },
      "400": {
        $ref: "#/components/responses/BadRequest",
      },
      "401": {
        $ref: "#/components/responses/Unauthorized",
      },
      "403": {
        $ref: "#/components/responses/Forbidden",
      },
      "409": {
        $ref: "#/components/responses/Conflict",
      },
    },
  },
});

openApiSpec.addPath("/api/companies/{id}", {
  get: {
    summary: "Get company by ID",
    description: "Retrieve a specific company by its ID",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Company ID",
        schema: {
          type: "string",
        },
      },
    ],
    responses: {
      "200": {
        description: "Company details",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                  example: true,
                },
                data: {
                  $ref: "#/components/schemas/Company",
                },
              },
            },
          },
        },
      },
      "401": {
        $ref: "#/components/responses/Unauthorized",
      },
      "403": {
        $ref: "#/components/responses/Forbidden",
      },
      "404": {
        $ref: "#/components/responses/NotFound",
      },
    },
  },
  put: {
    summary: "Update company",
    description: "Update an existing company's information",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Company ID",
        schema: {
          type: "string",
        },
      },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/CompanyUpdate",
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Company updated successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                  example: true,
                },
                data: {
                  $ref: "#/components/schemas/Company",
                },
                message: {
                  type: "string",
                  example: "Company updated successfully",
                },
              },
            },
          },
        },
      },
      "400": {
        $ref: "#/components/responses/BadRequest",
      },
      "401": {
        $ref: "#/components/responses/Unauthorized",
      },
      "403": {
        $ref: "#/components/responses/Forbidden",
      },
      "404": {
        $ref: "#/components/responses/NotFound",
      },
    },
  },
  delete: {
    summary: "Deactivate company",
    description: "Soft delete a company by setting its status to inactive",
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        description: "Company ID",
        schema: {
          type: "string",
        },
      },
    ],
    responses: {
      "200": {
        description: "Company deactivated successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                success: {
                  type: "boolean",
                  example: true,
                },
                message: {
                  type: "string",
                  example: "Company deactivated successfully",
                },
              },
            },
          },
        },
      },
      "401": {
        $ref: "#/components/responses/Unauthorized",
      },
      "403": {
        $ref: "#/components/responses/Forbidden",
      },
      "404": {
        $ref: "#/components/responses/NotFound",
      },
    },
  },
});

export default openApiSpec;
