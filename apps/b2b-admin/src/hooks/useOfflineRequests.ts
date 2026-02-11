import { useState, useCallback } from 'react';
import axios from 'axios';
import {
  OfflineChangeRequest,
  OfflineRequestAuditLog,
  OfflineRequestStatus,
} from '@tripalfa/shared-types';

interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface QueueResponse {
  data: OfflineChangeRequest[];
  pagination: PaginationMeta;
  meta: {
    requestId: string;
    timestamp: string;
    duration_ms: number;
  };
}

interface QueryFilters {
  status?: string;
  priority?: string;
  page?: number;
  pageSize?: number;
}

export const useOfflineRequests = () => {
  const [queue, setQueue] = useState<OfflineChangeRequest[]>([]);
  const [currentRequest, setCurrentRequest] = useState<OfflineChangeRequest | null>(null);
  const [auditLog, setAuditLog] = useState<OfflineRequestAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    pageSize: 50,
    totalPages: 0,
  });

  const getAuthToken = (): string | null => {
    return localStorage.getItem('auth_token');
  };

  const apiClient = useCallback(
    async (method: string, url: string, data?: any) => {
      try {
        const token = getAuthToken();
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        };

        const baseURL = 'http://localhost:3001';
        const fullURL = `${baseURL}${url}`;

        const response = await axios({
          method,
          url: fullURL,
          data,
          ...config,
        });

        return response.data;
      } catch (err: any) {
        const errorMessage = err.response?.data?.error?.message || err.message || 'API call failed';
        throw new Error(errorMessage);
      }
    },
    []
  );

  // Fetch staff queue
  const fetchQueue = useCallback(
    async (filters?: QueryFilters) => {
      setLoading(true);
      setError(null);
      try {
        const page = filters?.page || 1;
        const pageSize = filters?.pageSize || 50;
        let url = `/api/offline-requests/queue?page=${page}&pageSize=${pageSize}`;

        if (filters?.status) {
          url += `&status=${filters.status}`;
        }
        if (filters?.priority) {
          url += `&priority=${filters.priority}`;
        }

        const response: QueueResponse = await apiClient('GET', url);

        setQueue(response.data);
        setPagination(response.pagination);
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

  // Submit pricing
  const submitPricing = useCallback(
    async (
      id: string,
      newBaseFare: number,
      newTaxes: number,
      newFees: number,
      notes?: string
    ) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient('PUT', `/api/offline-requests/${id}/pricing`, {
          newBaseFare,
          newTaxes,
          newFees,
          notes,
        });

        // Refresh queue after pricing submission
        await fetchQueue();
        return response.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiClient, fetchQueue]
  );

  // Complete request
  const completeRequest = useCallback(
    async (
      id: string,
      documents: {
        eTicketNumber?: string;
        voucherNumber?: string;
        invoiceId?: string;
      },
      notes?: string
    ) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient('PUT', `/api/offline-requests/${id}/complete`, {
          documents,
          notes,
        });

        // Refresh queue after completion
        await fetchQueue();
        return response.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiClient, fetchQueue]
  );

  // Add internal note
  const addNote = useCallback(
    async (id: string, note: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient('POST', `/api/offline-requests/${id}/notes`, {
          note,
          isInternal: true,
        });

        // Refresh current request
        if (currentRequest?.id === id) {
          await getRequest(id);
        }

        return response.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiClient, currentRequest, getRequest]
  );

  // Get audit log
  const getAuditLog = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient('GET', `/api/offline-requests/${id}/audit`);
        setAuditLog(response.data);
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

  // Cancel request
  const cancelRequest = useCallback(
    async (id: string, reason: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient('PUT', `/api/offline-requests/${id}/cancel`, {
          cancellationReason: reason,
        });

        // Refresh queue after cancellation
        await fetchQueue();
        return response.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiClient, fetchQueue]
  );

  return {
    // State
    queue,
    currentRequest,
    auditLog,
    loading,
    error,
    pagination,

    // Methods
    fetchQueue,
    getRequest,
    submitPricing,
    completeRequest,
    addNote,
    getAuditLog,
    cancelRequest,
  };
};
