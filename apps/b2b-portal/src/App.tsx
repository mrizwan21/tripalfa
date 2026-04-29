import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { 
  AppProvider, 
  useApp, 
  TenantProvider, 
  UserRole,
  apiManager 
} from '@tripalfa/shared-features';
import { ErrorBoundary } from './components/ErrorBoundary';

// Shared Pages from Library
import {
  LoginPage,
  EnhancedDashboardPage,
  LoginHistoryPage,
  FlightFlowPage,
  ItineraryDetailPage,
  MyBookingsPage,
  HotelFlowPage,
  AccountsPage,
  SalesPage,
  ProfilePage,
  SubUsersPage,
  MPinPage,
  MarkupPage,
  CommissionPage,
  TravellerProfilePage,
  SupplierManagementPage,
  SupplierDashboardPage,
  SalesRepPage,
  SystemAdminPage,
  TravelCalendarPage,
  CancellationsPage,
  NewsletterPage,
  OfflineBookingPage,
  InventoryPage,
  ItineraryBuilderPage,
  AuditTrailPage,
  FavouritesPage,
  BookingQueuePage,
  AgencyHierarchyPage,
  ProviderDisablePage,
  BranchManagementPage,
  CommunicationHubPage,
  AuthorisationWorkspace,
  WalletPage,
  PNRImportPage,
  CreditFacilityPage,
  CompanyProfilePage,
  SubAgentPermissionPage,
  RolePermissionPage
} from '@tripalfa/shared-features';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: UserRole[] }) {
  const { isLoggedIn, hasPermission } = useApp();
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !hasPermission(allowedRoles)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><EnhancedDashboardPage /></ProtectedRoute>} />
      <Route path="/flight" element={<ProtectedRoute><FlightFlowPage /></ProtectedRoute>} />
      <Route path="/flight/results" element={<Navigate to="/flight" replace />} />
      <Route path="/flight/booking" element={<Navigate to="/flight" replace />} />
      <Route path="/flight/itinerary/:id" element={<ProtectedRoute><ItineraryDetailPage /></ProtectedRoute>} />
      <Route path="/booking/:id" element={<ProtectedRoute><ItineraryDetailPage /></ProtectedRoute>} />
      <Route path="/hotel" element={<ProtectedRoute><HotelFlowPage /></ProtectedRoute>} />
      <Route path="/bookings" element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>} />
      <Route path="/accounts" element={<ProtectedRoute allowedRoles={['Admin', 'Accountant']}><AccountsPage /></ProtectedRoute>} />
      <Route path="/sales" element={<ProtectedRoute allowedRoles={['Admin', 'Accountant', 'Sales Executive']}><SalesPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/profile/sub-users" element={<ProtectedRoute allowedRoles={['Admin']}><SubUsersPage /></ProtectedRoute>} />
      <Route path="/profile/mpin" element={<ProtectedRoute><MPinPage /></ProtectedRoute>} />
      <Route path="/profile/login-history" element={<ProtectedRoute><LoginHistoryPage /></ProtectedRoute>} />
      <Route path="/profile/markup" element={<ProtectedRoute allowedRoles={['Admin', 'Ticketing Lead']}><MarkupPage /></ProtectedRoute>} />
      <Route path="/profile/commissions" element={<ProtectedRoute allowedRoles={['Admin', 'Accountant']}><CommissionPage /></ProtectedRoute>} />
      <Route path="/profile/traveller" element={<ProtectedRoute><TravellerProfilePage /></ProtectedRoute>} />
      <Route path="/profile/suppliers" element={<ProtectedRoute allowedRoles={['Admin']}><SupplierManagementPage /></ProtectedRoute>} />
      <Route path="/supplier-dashboard" element={<ProtectedRoute allowedRoles={['Admin', 'Accountant']}><SupplierDashboardPage /></ProtectedRoute>} />
      <Route path="/profile/sales-rep" element={<ProtectedRoute><SalesRepPage /></ProtectedRoute>} />
      <Route path="/support" element={<ProtectedRoute><SalesRepPage /></ProtectedRoute>} />
      <Route path="/system-admin" element={<ProtectedRoute allowedRoles={['Admin']}><SystemAdminPage /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><TravelCalendarPage /></ProtectedRoute>} />
      <Route path="/cancellations" element={<ProtectedRoute><CancellationsPage /></ProtectedRoute>} />
      <Route path="/profile/provider-disable" element={<ProtectedRoute allowedRoles={['Admin']}><ProviderDisablePage /></ProtectedRoute>} />
      <Route path="/newsletter" element={<ProtectedRoute><NewsletterPage /></ProtectedRoute>} />
      <Route path="/offline-booking" element={<ProtectedRoute><OfflineBookingPage /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute allowedRoles={['Admin', 'Ticketing Lead']}><InventoryPage /></ProtectedRoute>} />
      <Route path="/itinerary-builder" element={<ProtectedRoute><ItineraryBuilderPage /></ProtectedRoute>} />
      <Route path="/audit-trail" element={<ProtectedRoute allowedRoles={['Admin']}><AuditTrailPage /></ProtectedRoute>} />
      <Route path="/favourites" element={<ProtectedRoute><FavouritesPage /></ProtectedRoute>} />
      <Route path="/queues" element={<ProtectedRoute><BookingQueuePage /></ProtectedRoute>} />
      <Route path="/agency-hierarchy" element={<ProtectedRoute allowedRoles={['Admin']}><AgencyHierarchyPage /></ProtectedRoute>} />
      <Route path="/profile/branches" element={<ProtectedRoute allowedRoles={['Admin']}><BranchManagementPage /></ProtectedRoute>} />
      <Route path="/communication" element={<ProtectedRoute allowedRoles={['Admin', 'Sales Executive']}><CommunicationHubPage /></ProtectedRoute>} />
      <Route path="/authorization" element={<ProtectedRoute allowedRoles={['Admin', 'Sales Executive', 'Accountant']}><AuthorisationWorkspace /></ProtectedRoute>} />
      <Route path="/wallet" element={<ProtectedRoute allowedRoles={['Admin', 'Accountant']}><WalletPage /></ProtectedRoute>} />
      <Route path="/wallet/clients/:id" element={<ProtectedRoute allowedRoles={['Admin', 'Accountant']}><WalletPage /></ProtectedRoute>} />
      
      {/* Critical v12 Features */}
      <Route path="/pnr-import" element={<ProtectedRoute allowedRoles={['Admin', 'Ticketing Lead']}><PNRImportPage /></ProtectedRoute>} />
      <Route path="/credit-facility" element={<ProtectedRoute allowedRoles={['Admin', 'Accountant']}><CreditFacilityPage /></ProtectedRoute>} />
      <Route path="/company-profile" element={<ProtectedRoute allowedRoles={['Admin']}><CompanyProfilePage /></ProtectedRoute>} />
      <Route path="/sub-agent-permissions" element={<ProtectedRoute allowedRoles={['Admin']}><SubAgentPermissionPage /></ProtectedRoute>} />
      <Route path="/roles-permissions" element={<ProtectedRoute allowedRoles={['Admin']}><RolePermissionPage /></ProtectedRoute>} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <TenantProvider>
      <AppProvider>
        <ErrorBoundary>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ErrorBoundary>
      </AppProvider>
    </TenantProvider>
  );
}