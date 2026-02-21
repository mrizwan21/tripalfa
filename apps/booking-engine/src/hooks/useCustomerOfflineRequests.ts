import { useState, useCallback } from 'react';
import axios from 'axios';
import {
  OfflineChangeRequest,
  CreateOfflineRequestPayload,
  OfflineRequestPriority,
  OfflineRequestType,
} from '@tripalfa/shared-types';

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
  const [currentRequest, setCurrentRequest] = useState<OfflineChangeRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthToken = (): string | null => {
    return localStorage.getItem('authToken');
  };

  const apiClient = useCallback(
    async (method: string, url: string, data?: any) => {
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('No authentication token found');
        }

        const config = {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        };

        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const fullURL = `${baseURL}${url}`;

        const response = await axios({
          method,
          url: fullURL,
          data,
          ...config,
        });

        return response.data;
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'API call failed';
        throw new Error(errorMessage);
      }
    },
    []
  );

  // Fetch customer's requests from backend
  const getMyRequests = useCallback(
    async (params: GetMyRequestsParams) => {
      setLoading(true);
      setError(null);
      try {
        const { bookingId, limit = 50, offset = 0 } = params;
        const url = `/api/offline-requests/customer/my-requests?bookingId=${bookingId}&limit=${limit}&offset=${offset}`;
        const response: CustomerRequestsResponse = await apiClient('GET', url);

        setMyRequests(response.data.requests);
        return response.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiClient]
  );

  // Get request by ID
  const getRequest = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient('GET', `/api/offline-requests/${id}`);
        setCurrentRequest(response.data);
        return response.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiClient]
  );

  // Create new change request
  const submitChangeRequest = useCallback(
    async (payload: CreateOfflineRequestPayload) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient('POST', `/api/offline-requests`, payload);
        return response.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiClient]
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
        const response = await apiClient('PUT', `/api/offline-requests/${id}/approve`, payload);
        setCurrentRequest(response.data);
        return response.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiClient]
  );

  // Reject the request pricing (convenience wrapper)
  const rejectRequest = useCallback(
    async (id: string, reason: string) => {
      return approveRequest(id, false, reason);
    },
    [approveRequest]
  );

  // Cancel the request
  const cancelRequest = useCallback(
    async (id: string, reason?: string) => {
      setLoading(true);
      setError(null);
      try {
        const payload = {
          reason: reason || 'Cancelled by customer',
        };
        const response = await apiClient('PUT', `/api/offline-requests/${id}/cancel`, payload);
        setCurrentRequest(response.data);
        setMyRequests((prev) =>
          prev.map((req) => (req.id === id ? response.data : req))
        );
        return response.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiClient]
  );

  // Track status of a request
  const trackStatus = useCallback(
    async (id: string) => {
      try {
        const response = await apiClient('GET', `/api/offline-requests/${id}`);
        return response.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [apiClient]
  );

  // Get audit log for a request
  const getAuditLog = useCallback(
    async (id: string, limit = 100, offset = 0) => {
      try {
        const response = await apiClient('GET', `/api/offline-requests/${id}/audit?limit=${limit}&offset=${offset}`);
        return response.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [apiClient]
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
