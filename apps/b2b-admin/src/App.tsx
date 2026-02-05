import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import AdminLayout from './components/AdminLayout';
import { DashboardHeader } from './features/dashboard/DashboardHeader';
import ExecutiveDashboard from './features/dashboard/ExecutiveDashboard';

// Eager load components that need proper export handling
import PermissionManagementPage from './features/permissions/PermissionManagementPage';
import { CompaniesListPage } from './features/companies';
import CompanyDetailPage from './features/companies/CompanyDetailPage';
import { BookingsListPage } from './features/bookings';
import BookingDetailPage from './features/bookings/BookingDetailPage';
import { AuditLogsListPage } from './features/audit-logs';
import { FinanceManagementPage } from './features/finance';
import InventoryManagementPage from './features/inventory/InventoryManagementPage';
import MarketingManagementPage from './features/marketing/MarketingManagementPage';
import PromotionsManagementPage from './features/promotions/PromotionsManagementPage';
import { ReportsManagementPage } from './features/reports';
import { RulesManagementPage } from './features/rules';
import { SupplierManagementPage } from './features/suppliers/SupplierManagementPage';
import TaxManagementPage from './features/tax/TaxManagementPage';
import { SettingsManagementPage } from './features/settings/SettingsManagementPage';
import { NotificationManagement } from './features/notifications/NotificationManagement';
import UsersListPage from './features/users/UsersListPage';
import UserProfilePage from './features/users/UserProfilePage';
import SubagencyDetailPage from './features/users/SubagencyDetailPage';
import RolesListPage from './features/roles/RolesListPage';
import { BookingManagementPage } from './features/booking-management/BookingManagementPage';
import { FlightBookingFormOptimized } from './features/manual-booking/components/booking/flight/FlightBookingFormOptimized';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const LoadingFallback = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
  </div>
);

// Layout wrapper that includes DashboardHeader
function AppLayout() {
  return (
    <div className="App">
      <DashboardHeader />
      <main style={{ padding: '20px', marginTop: '64px' }}>
        <Outlet />
      </main>
    </div>
  );
}

// Main App Component
function App() {
  console.log('App component rendering');
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Admin Layout Routes */}
                <Route element={<AdminLayout />}>
                  {/* Dashboard Routes */}
                  <Route path="/" element={<ExecutiveDashboard />} />
                  <Route path="/dashboard" element={<ExecutiveDashboard />} />

                  {/* Company Management Routes */}
                  <Route path="/companies" element={<CompaniesListPage />} />
                  <Route path="/companies/:companyId" element={<CompanyDetailPage />} />
                  <Route path="/companies/:companyId/:tab" element={<CompanyDetailPage />} />

                  {/* User Management Routes */}
                  <Route path="/users" element={<UsersListPage />} />
                  <Route path="/users/:userId" element={<UserProfilePage />} />
                  <Route path="/users/:userId/:tab" element={<UserProfilePage />} />
                  <Route path="/subagencies/:subagencyId" element={<SubagencyDetailPage />} />
                  <Route path="/subagencies/:subagencyId/:tab" element={<SubagencyDetailPage />} />

                  {/* Role & Permission Routes */}
                  <Route path="/roles" element={<RolesListPage />} />
                  <Route path="/permissions" element={<PermissionManagementPage />} />

                  {/* Booking Routes */}
                  <Route path="/bookings" element={<BookingsListPage />} />
                  <Route path="/bookings/:id" element={<BookingDetailPage />} />
                  <Route path="/booking-management" element={<BookingManagementPage />} />

                  {/* Supplier Routes */}
                  <Route path="/suppliers" element={<SupplierManagementPage />} />
                  <Route path="/suppliers/:tab" element={<SupplierManagementPage />} />

                  {/* Finance Routes */}
                  <Route path="/finance" element={<FinanceManagementPage />} />
                  <Route path="/finance/:tab" element={<FinanceManagementPage />} />

                  {/* Rules Routes */}
                  <Route path="/rules" element={<RulesManagementPage />} />
                  <Route path="/rules/:tab" element={<RulesManagementPage />} />

                  {/* Reports Routes */}
                  <Route path="/reports" element={<ReportsManagementPage />} />
                  <Route path="/reports/:tab" element={<ReportsManagementPage />} />

                  {/* Marketing Routes */}
                  <Route path="/marketing" element={<MarketingManagementPage />} />
                  <Route path="/marketing/:tab" element={<MarketingManagementPage />} />

                  {/* Promotions Routes */}
                  <Route path="/promotions" element={<PromotionsManagementPage />} />
                  <Route path="/promotions/:tab" element={<PromotionsManagementPage />} />

                  {/* Inventory Routes */}
                  <Route path="/inventory" element={<InventoryManagementPage />} />
                  <Route path="/inventory/:tab" element={<InventoryManagementPage />} />

                  {/* Tax Routes */}
                  <Route path="/tax" element={<TaxManagementPage />} />
                  <Route path="/tax/:tab" element={<TaxManagementPage />} />

                  {/* Settings Routes */}
                  <Route path="/settings" element={<SettingsManagementPage />} />
                  <Route path="/settings/:tab" element={<SettingsManagementPage />} />

                  {/* Audit Logs Routes */}
                  <Route path="/audit-logs" element={<AuditLogsListPage />} />

                  {/* Notifications Routes */}
                  <Route path="/notifications" element={<NotificationManagement />} />

                  {/* Manual Booking Routes */}
                  <Route path="/manual-booking/flight" element={<FlightBookingFormOptimized mode="new" />} />
                </Route>

                {/* Catch-all Route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
