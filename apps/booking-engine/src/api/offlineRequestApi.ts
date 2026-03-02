import axios, { AxiosInstance } from "axios";
import type {
  OfflineChangeRequest,
  CreateOfflineRequestPayload,
  SubmitPricingPayload,
  OfflineRequestAuditLog,
} from "../../../../packages/shared-types/src/index.js";

interface PaginatedResult<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    limit: number;
    offset: number;
  };
}

interface CreateRequestResponse {
  success: boolean;
  data: OfflineChangeRequest;
  message: string;
}

interface PaymentRecordResponse {
  success: boolean;
  data: OfflineChangeRequest;
  payment?: {
    transactionRef: string;
    status: string;
    amount: number;
  };
  transactionId?: string;
}

class OfflineRequestApi {
  private api: AxiosInstance;
  private baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  constructor() {
    this.api = axios.create({
      baseURL: `${this.baseURL}/offline-requests`,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Create a new offline change request
   * POST /api/offline-requests
   */
  async createRequest(
    payload: CreateOfflineRequestPayload,
  ): Promise<OfflineChangeRequest> {
    try {
      const response = await this.api.post<CreateRequestResponse>("/", payload);
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to create offline request",
      );
    }
  }

  /**
   * Get offline request by ID
   * GET /api/offline-requests/:id
   */
  async getRequest(requestId: string): Promise<OfflineChangeRequest> {
    try {
      const response = await this.api.get<{
        success: boolean;
        data: OfflineChangeRequest;
      }>(`/${requestId}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch offline request",
      );
    }
  }

  /**
   * Get offline request by reference
   * GET /api/offline-requests/ref/:requestRef
   */
  async getRequestByRef(requestRef: string): Promise<OfflineChangeRequest> {
    try {
      const response = await this.api.get<{
        success: boolean;
        data: OfflineChangeRequest;
      }>(`/ref/${requestRef}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch offline request",
      );
    }
  }

  /**
   * Get customer's offline requests
   * GET /api/offline-requests/customer/my-requests
   */
  async getCustomerRequests(
    bookingId: string,
    limit = 50,
    offset = 0,
  ): Promise<PaginatedResult<OfflineChangeRequest>["data"]> {
    try {
      const response = await this.api.get<
        PaginatedResult<OfflineChangeRequest>
      >("/customer/my-requests", {
        params: { bookingId, limit, offset },
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch customer requests",
      );
    }
  }

  /**
   * Get staff queue
   * GET /api/offline-requests/queue
   */
  async getStaffQueue(
    status = "pending_staff",
    limit = 50,
    offset = 0,
  ): Promise<PaginatedResult<OfflineChangeRequest>["data"]> {
    try {
      const response = await this.api.get<
        PaginatedResult<OfflineChangeRequest>
      >("/queue", {
        params: { status, limit, offset },
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch staff queue",
      );
    }
  }

  /**
   * Submit pricing for a request (Staff only)
   * PUT /api/offline-requests/:id/pricing
   */
  async submitPricing(
    requestId: string,
    payload: SubmitPricingPayload,
  ): Promise<OfflineChangeRequest> {
    try {
      const response = await this.api.put<{
        success: boolean;
        data: OfflineChangeRequest;
      }>(`/${requestId}/pricing`, payload);
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to submit pricing",
      );
    }
  }

  /**
   * Approve or reject pricing (Customer)
   * PUT /api/offline-requests/:id/approve
   * Payload: { approved: true } for approval
   * Payload: { approved: false, rejectionReason } for rejection
   */
  async approveRequest(
    requestId: string,
    approved: boolean = true,
    rejectionReason?: string,
  ): Promise<OfflineChangeRequest> {
    try {
      const payload: any = { approved };
      if (!approved && rejectionReason) {
        payload.rejectionReason = rejectionReason;
      }
      const response = await this.api.put<{
        success: boolean;
        data: OfflineChangeRequest;
      }>(`/${requestId}/approve`, payload);
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to approve request",
      );
    }
  }

  /**
   * Reject pricing (Customer)
   * PUT /api/offline-requests/:id/approve with { approved: false, rejectionReason }
   * @deprecated Use approveRequest(requestId, false, rejectionReason) instead
   */
  async rejectRequest(
    requestId: string,
    rejectionReason: string,
  ): Promise<OfflineChangeRequest> {
    return this.approveRequest(requestId, false, rejectionReason);
  }

  /**
   * Record payment for a request
   * POST /api/offline-requests/:id/payment
   */
  async recordPayment(
    requestId: string,
    paymentData: {
      paymentId: string;
      amount: number;
      method: string;
      transactionRef?: string;
    },
  ): Promise<PaymentRecordResponse["data"]> {
    try {
      const response = await this.api.post<PaymentRecordResponse>(
        `/${requestId}/payment`,
        paymentData,
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to process payment",
      );
    }
  }

  /**
   * Complete offline request (Staff only)
   * PUT /api/offline-requests/:id/complete
   */
  async completeRequest(
    requestId: string,
    documentUrls?: string[],
  ): Promise<OfflineChangeRequest> {
    try {
      const response = await this.api.put<{
        success: boolean;
        data: OfflineChangeRequest;
      }>(`/${requestId}/complete`, { documentUrls: documentUrls || [] });
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to complete request",
      );
    }
  }

  /**
   * Cancel offline request (Customer)
   * PUT /api/offline-requests/:id/cancel
   */
  async cancelRequest(
    requestId: string,
    reason: string,
  ): Promise<OfflineChangeRequest> {
    try {
      const response = await this.api.put<{
        success: boolean;
        data: OfflineChangeRequest;
      }>(`/${requestId}/cancel`, { reason });
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to cancel request",
      );
    }
  }

  /**
   * Add internal note to request (Staff only)
   * POST /api/offline-requests/:id/notes
   */
  async addInternalNote(
    requestId: string,
    note: string,
  ): Promise<OfflineChangeRequest> {
    try {
      const response = await this.api.post<{
        success: boolean;
        data: OfflineChangeRequest;
      }>(`/${requestId}/notes`, { note });
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || error.message || "Failed to add note",
      );
    }
  }

  /**
   * Get audit log for a request
   * GET /api/offline-requests/:id/audit
   */
  async getAuditLog(
    requestId: string,
    limit = 100,
    offset = 0,
  ): Promise<{
    items: OfflineRequestAuditLog[];
    total: number;
    limit: number;
    offset: number;
  }> {
    try {
      const response = await this.api.get<{
        success: boolean;
        data: {
          items: OfflineRequestAuditLog[];
          total: number;
          limit: number;
          offset: number;
        };
      }>(`/${requestId}/audit`, {
        params: { limit, offset },
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch audit log",
      );
    }
  }
}

// Export singleton instance
const offlineRequestApi = new OfflineRequestApi();
export default offlineRequestApi;
