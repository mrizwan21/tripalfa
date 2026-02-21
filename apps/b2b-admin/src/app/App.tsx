import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/shared/components/layout/Layout";
import DashboardPage from "@/features/dashboard/pages/Dashboard";
import BookingsPage from "@/features/bookings/pages/BookingsList";
import BookingDetailsPage from "@/features/bookings/pages/BookingDetails";
import BookingQueuesPage from "@/features/bookings/pages/BookingQueues";
import NewBookingOnlinePage from "@/features/bookings/pages/NewBookingOnline";
import NewBookingOfflinePage from "@/features/bookings/pages/NewBookingOffline";
import { UsersList as UsersPage } from "@/features/users/pages/UsersList";
import FinancePage from "@/features/finance/pages/FinanceList";
import CurrencyListPage from "@/features/finance/pages/CurrencyList";
import B2BReportsPage from "@/features/finance/pages/B2BReports";
import B2CReportsPage from "@/features/finance/pages/B2CReports";
import SuppliersPage from "@/features/suppliers/pages/SuppliersList";
import RulesPage from "@/features/rules/pages/RulesList";
import LoginPage from "@/features/auth/pages/Login";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPassword";
import CompanyManagementPage from "@/features/companies/pages/CompanyManagement";

// New Modules
import WalletOverview from "@/features/wallet/pages/WalletOverview";
import AnalyticsDashboard from "@/features/analytics/pages/AnalyticsDashboard";
import InventoryList from "@/features/inventory/pages/InventoryList";
import DocumentManager from "@/features/documents/pages/DocumentManager";
import SystemHealth from "@/features/system/pages/SystemHealth";

function App() {
  return (
    <Routes>
      <Route path="/auth">
        <Route path="login" element={<LoginPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        
        {/* Analytics & Overview */}
        <Route path="analytics" element={<AnalyticsDashboard />} />
        
        {/* Operation Modules */}
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="bookings/:id" element={<BookingDetailsPage />} />
        <Route path="booking-queues" element={<BookingQueuesPage />} />
        <Route path="bookings/new/online" element={<NewBookingOnlinePage />} />
        <Route path="bookings/new/offline" element={<NewBookingOfflinePage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="companies" element={<CompanyManagementPage />} />
        <Route path="organization" element={<CompanyManagementPage />} />
        <Route path="inventory" element={<InventoryList />} />
        <Route path="documents" element={<DocumentManager />} />
        
        {/* Finance Modules */}
        <Route path="finance" element={<FinancePage />} />
        <Route path="finance/currencies" element={<CurrencyListPage />} />
        <Route path="finance/reports/b2b" element={<B2BReportsPage />} />
        <Route path="finance/reports/b2c" element={<B2CReportsPage />} />
        <Route path="wallet" element={<WalletOverview />} />
        
        {/* Platform & System Modules */}
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="rules" element={<RulesPage />} />
        <Route path="system" element={<SystemHealth />} />
        
        {/* Fallback for Settings */}
        <Route path="settings" element={<div className="p-6">Settings Page Coming Soon</div>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
