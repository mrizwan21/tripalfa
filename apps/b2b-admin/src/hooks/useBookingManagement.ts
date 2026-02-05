import { useState, useCallback } from 'react';
import { Booking, Customer, Supplier, User } from '../types';
import { bookingApi, customerApi, supplierApi, agentApi, systemApi } from '../lib/api';

interface SearchParams {
  status?: string[];
  customer?: string;
  agent?: string;
  serviceType?: string;
  priority?: string[];
  queueType?: string;
  page?: number;
  limit?: number;
  search?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface BookingSearchResult {
  bookings: Booking[];
  pagination: Pagination;
}

export const useBookingManagement = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchBookings = useCallback(async (params: SearchParams): Promise<BookingSearchResult> => {
    setLoading(true);
    setError(null);
    try {
      const result = await bookingApi.searchBookings(params);
      setBookings(result.bookings);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search bookings';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createBooking = useCallback(async (bookingData: any) => {
    setLoading(true);
    setError(null);
    try {
      const newBooking = await bookingApi.createBooking(bookingData);
      setBookings(prev => [newBooking, ...prev]);
      return newBooking;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create booking';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBooking = useCallback(async (bookingId: string, updates: any) => {
    setLoading(true);
    setError(null);
    try {
      const updatedBooking = await bookingApi.updateBooking(bookingId, updates);
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId ? updatedBooking : booking
      ));
      return updatedBooking;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update booking';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const assignAgent = useCallback(async (bookingId: string, agentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await bookingApi.assignAgent(bookingId, agentId);
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId ? { ...booking, assignedAgentId: agentId } : booking
      ));
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign agent';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePriority = useCallback(async (bookingId: string, priority: 'low' | 'medium' | 'high' | 'urgent') => {
    setLoading(true);
    setError(null);
    try {
      const result = await bookingApi.updatePriority(bookingId, priority);
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId ? { ...booking, bookingOptions: { ...booking.bookingOptions, priority } } : booking
      ));
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update priority';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBookingsByQueue = useCallback(async (queueType: string, params: SearchParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await bookingApi.getBookingsByQueue(queueType, params);
      setBookings(result.bookings);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get bookings by queue';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchCustomers = useCallback(async (params: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await customerApi.searchCustomers(params);
      setCustomers(result.customers);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search customers';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createCustomer = useCallback(async (customerData: any) => {
    setLoading(true);
    setError(null);
    try {
      const newCustomer = await customerApi.createCustomer(customerData);
      setCustomers(prev => [newCustomer, ...prev]);
      return newCustomer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create customer';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchSuppliers = useCallback(async (params: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supplierApi.searchSuppliers(params);
      setSuppliers(result.suppliers);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search suppliers';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createSupplier = useCallback(async (supplierData: any) => {
    setLoading(true);
    setError(null);
    try {
      const newSupplier = await supplierApi.createSupplier(supplierData);
      setSuppliers(prev => [newSupplier, ...prev]);
      return newSupplier;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create supplier';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await agentApi.getAgents();
      setAgents(result.agents);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get agents';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const holdInventory = useCallback(async (holdData: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await bookingApi.holdInventory(holdData);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to hold inventory';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmBooking = useCallback(async (bookingId: string, confirmationData: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await bookingApi.confirmBooking(bookingId, confirmationData);
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId ? { ...booking, status: 'CONFIRMED' } : booking
      ));
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to confirm booking';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const issueTicket = useCallback(async (bookingId: string, ticketData: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await bookingApi.issueTicket(bookingId, ticketData);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to issue ticket';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateWorkflowStatus = useCallback(async (bookingId: string, statusData: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await bookingApi.updateWorkflowStatus(bookingId, statusData);
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId ? { ...booking, status: statusData.status } : booking
      ));
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update workflow status';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBookingStatistics = useCallback(async (dateRange: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await bookingApi.getBookingStatistics(dateRange);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get booking statistics';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getSystemHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await systemApi.getSystemHealth();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get system health';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    bookings,
    customers,
    suppliers,
    agents,
    loading,
    error,
    searchBookings,
    createBooking,
    updateBooking,
    assignAgent,
    updatePriority,
    getBookingsByQueue,
    searchCustomers,
    createCustomer,
    searchSuppliers,
    createSupplier,
    getAgents,
    holdInventory,
    confirmBooking,
    issueTicket,
    updateWorkflowStatus,
    getBookingStatistics,
    getSystemHealth
  };
};