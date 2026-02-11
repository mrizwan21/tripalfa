import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import AdminLayout from './components/AdminLayout';

// Page Imports
import { ExecutiveDashboard } from './features/dashboard';
import { CompaniesListPage } from './features/companies/CompaniesListPage';
import UsersListPage from './features/users/UsersListPage';
import FinanceManagementPage from './features/finance/FinanceManagementPage';
import { EnhancedBookingCard } from './features/bookings/components/EnhancedBookingCard';
import { BookingsListPage } from './features/bookings/BookingsListPage';

// Configure React Query Client with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
    mutations: {
      retry: false,
    },
  },
});

// Main App Component with Providers and Routing
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Admin Layout Routes - All admin pages wrapped with AdminLayout */}
            <Route element={<AdminLayout />}>
              {/* Dashboard - Default landing page */}
              <Route index element={<ExecutiveDashboard />} />
              <Route path="dashboard" element={<ExecutiveDashboard />} />

              {/* Bookings Management */}
              <Route path="bookings" element={<BookingsListPage />} />
              <Route path="bookings/:bookingId" element={<EnhancedBookingCard />} />

              {/* Companies Management */}
              <Route path="companies" element={<CompaniesListPage />} />

              {/* Users Management */}
              <Route path="users" element={<UsersListPage />} />

              {/* Finance Management */}
              <Route path="finance" element={<FinanceManagementPage />} />
            </Route>

            {/* Default redirect to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Catch-all redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
