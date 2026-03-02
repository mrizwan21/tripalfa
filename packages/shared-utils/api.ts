// Admin Panel - API Client
import axios from "axios";
// Stubbing types due to persistent module resolution issues
type AxiosError = any;
type AxiosInstance = any;
type AxiosRequestConfig = any;
type AxiosResponse = any;
import { API_BASE_URL } from "./constants";
import type { ApiResponse, ApiErrorResponse } from "./types";

// ============================================================================
// API Client Configuration
// ============================================================================

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: any) => {
        // Add auth token if available
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }

        // Add request ID for tracing
        config.headers["X-Request-ID"] = this.generateRequestId();

        return config;
      },
      (error: any) => Promise.reject(error),
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & {
          _retry?: boolean;
        };

        // Handle 401 - Token expired
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshToken();
            return this.client(originalRequest);
          } catch (refreshError) {
            // Redirect to login
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(this.formatError(error));
      },
    );
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatError(error: AxiosError): Error {
    const apiData = error.response?.data as ApiErrorResponse | undefined;
    if (apiData) {
      const err = new Error(apiData.message || "An unexpected error occurred");
      (err as any).code = apiData.code;
      (err as any).details = apiData.details;
      (err as any).errors = apiData.errors;
      return err;
    }

    if (error.message === "Network Error") {
      return new Error(
        "Unable to connect to the server. Please check your internet connection.",
      );
    }

    return new Error(error.message || "An unexpected error occurred");
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  private async refreshToken(): Promise<void> {
    const refreshToken =
      typeof window !== "undefined"
        ? localStorage.getItem("refreshToken")
        : null;

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await axios.post<{
      data: { accessToken: string; refreshToken: string };
    }>(`${API_BASE_URL}/auth/refresh`, { refreshToken });

    if (response.data.data) {
      this.accessToken = response.data.data.accessToken;
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", response.data.data.accessToken);
        localStorage.setItem("refreshToken", response.data.data.refreshToken);
      }
    }
  }

  // ============================================================================
  // HTTP Methods
  // ============================================================================

  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data.data as T;
  }

  async post<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data.data as T;
  }

  async put<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data.data as T;
  }

  async patch<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.patch(url, data, config);
    return response.data.data as T;
  }

  async delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data.data as T;
  }

  // ============================================================================
  // File Upload
  // ============================================================================

  async upload<T>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<T> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await this.client.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress(progress);
        }
      },
    });

    return response.data.data as T;
  }

  // ============================================================================
  // Download
  // ============================================================================

  async download(url: string, filename: string): Promise<void> {
    const response = await this.client.get(url, {
      responseType: "blob",
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }
}

// Singleton instance
export const api = new ApiClient();

// ============================================================================
// Query Keys Factory
// ============================================================================

export const queryKeys = {
  // Auth
  auth: {
    me: ["auth", "me"] as const,
  },

  // Companies
  companies: {
    all: ["companies"] as const,
    list: (params?: Record<string, unknown>) =>
      ["companies", "list", params] as const,
    detail: (id: string) => ["companies", "detail", id] as const,
    branches: (companyId: string) =>
      ["companies", companyId, "branches"] as const,
    settings: (companyId: string) =>
      ["companies", companyId, "settings"] as const,
    financials: (companyId: string) =>
      ["companies", companyId, "financials"] as const,
  },

  // Users
  users: {
    all: ["users"] as const,
    list: (params?: Record<string, unknown>) =>
      ["users", "list", params] as const,
    detail: (id: string) => ["users", "detail", id] as const,
    activity: (userId: string) => ["users", userId, "activity"] as const,
  },

  // Roles
  roles: {
    all: ["roles"] as const,
    list: (params?: Record<string, unknown>) =>
      ["roles", "list", params] as const,
    detail: (id: string) => ["roles", "detail", id] as const,
    permissions: ["roles", "permissions"] as const,
  },

  // Bookings
  bookings: {
    all: ["bookings"] as const,
    list: (params?: Record<string, unknown>) =>
      ["bookings", "list", params] as const,
    detail: (id: string) => ["bookings", "detail", id] as const,
    queue: (params?: Record<string, unknown>) =>
      ["bookings", "queue", params] as const,
    history: (bookingId: string) => ["bookings", bookingId, "history"] as const,
  },

  // Suppliers
  suppliers: {
    all: ["suppliers"] as const,
    list: (params?: Record<string, unknown>) =>
      ["suppliers", "list", params] as const,
    detail: (id: string) => ["suppliers", "detail", id] as const,
    contracts: (supplierId?: string) =>
      ["suppliers", supplierId, "contracts"] as const,
    performance: (supplierId: string) =>
      ["suppliers", supplierId, "performance"] as const,
  },

  // Finance
  finance: {
    wallets: (params?: Record<string, unknown>) =>
      ["finance", "wallets", params] as const,
    wallet: (id: string) => ["finance", "wallets", id] as const,
    transactions: (params?: Record<string, unknown>) =>
      ["finance", "transactions", params] as const,
    invoices: (params?: Record<string, unknown>) =>
      ["finance", "invoices", params] as const,
    commissions: (params?: Record<string, unknown>) =>
      ["finance", "commissions", params] as const,
  },

  // Pricing
  pricing: {
    markup: (params?: Record<string, unknown>) =>
      ["pricing", "markup", params] as const,
    discounts: (params?: Record<string, unknown>) =>
      ["pricing", "discounts", params] as const,
    taxes: (params?: Record<string, unknown>) =>
      ["pricing", "taxes", params] as const,
  },

  // Reports
  reports: {
    list: ["reports", "list"] as const,
    detail: (id: string) => ["reports", "detail", id] as const,
    execute: (id: string) => ["reports", "execute", id] as const,
  },

  // Reference Data
  reference: {
    airlines: ["reference", "airlines"] as const,
    airports: ["reference", "airports"] as const,
    cities: ["reference", "cities"] as const,
    currencies: ["reference", "currencies"] as const,
  },

  // Dashboard
  dashboard: {
    stats: ["dashboard", "stats"] as const,
    revenue: (period: string) => ["dashboard", "revenue", period] as const,
    activity: ["dashboard", "activity"] as const,
    topPerformers: ["dashboard", "topPerformers"] as const,
  },

  // Audit
  audit: {
    logs: (params?: Record<string, unknown>) =>
      ["audit", "logs", params] as const,
  },
};
