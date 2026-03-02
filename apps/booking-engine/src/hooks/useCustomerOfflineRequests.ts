import { useState, useCallback } from "react";
import { api } from "../lib/api";
import {
  OfflineChangeRequest,
  CreateOfflineRequestPayload,
  OfflineRequestPriority,
  OfflineRequestType,
} from "@tripalfa/shared-types";

interface CustomerRequestsResponse {
  success: boolean;
  data: {
    total: number;
    requests: OfflineChangeRequest[];
  };
}

interface GetMyRequestsParams {
  bookingId: string;
  limit?: number;
  offset?: number;
}

export const useCustomerOfflineRequests = () => {
  const [myRequests, setMyRequests] = useState<OfflineChangeRequest[]>([]);
  const [currentRequest, setCurrentRequest] =
    useState<OfflineChangeRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch customer's requests from backend
  const getMyRequests = useCallback(async (params: GetMyRequestsParams) => {
    setLoading(true);
    setError(null);
    try {
      const { bookingId, limit = 50, offset = 0 } = params;
      const response: CustomerRequestsResponse = await api.get(
        `/api/offline-requests/customer/my-requests?bookingId=${bookingId}&limit=${limit}&offset=${offset}`,
      );

      setMyRequests(response.data.requests);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get request by ID
  const getRequest = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/offline-requests/${id}`);
      setCurrentRequest(response.data);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new change request
  const submitChangeRequest = useCallback(
    async (payload: CreateOfflineRequestPayload) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.post("/api/offline-requests", payload);
        return response.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Approve or reject the request pricing
  const approveRequest = useCallback(
    async (id: string, approved: boolean = true, rejectionReason?: string) => {
      setLoading(true);
      setError(null);
      try {
        const payload: any = { approved };
        if (!approved && rejectionReason) {
          payload.rejectionReason = rejectionReason;
        }
        const response = await api.put(
          `/api/offline-requests/${id}/approve`,
          payload,
        );
        setCurrentRequest(response.data);
        return response.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Reject the request pricing (convenience wrapper)
  const rejectRequest = useCallback(
    async (id: string, reason: string) => {
      return approveRequest(id, false, reason);
    },
    [approveRequest],
  );

  // Cancel the request
  const cancelRequest = useCallback(async (id: string, reason?: string) => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        reason: reason || "Cancelled by customer",
      };
      const response = await api.put(
        `/api/offline-requests/${id}/cancel`,
        payload,
      );
      setCurrentRequest(response.data);
      setMyRequests((prev) =>
        prev.map((req) => (req.id === id ? response.data : req)),
      );
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Track status of a request
  const trackStatus = useCallback(async (id: string) => {
    try {
      const response = await api.get(`/api/offline-requests/${id}`);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Get audit log for a request
  const getAuditLog = useCallback(
    async (id: string, limit = 100, offset = 0) => {
      try {
        const response = await api.get(
          `/api/offline-requests/${id}/audit?limit=${limit}&offset=${offset}`,
        );
        return response.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [],
  );

  return {
    // State
    myRequests,
    currentRequest,
    loading,
    error,

    // Methods
    getMyRequests,
    getRequest,
    submitChangeRequest,
    approveRequest,
    rejectRequest,
    cancelRequest,
    trackStatus,
    getAuditLog,
  };
};
