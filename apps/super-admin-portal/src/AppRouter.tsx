import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import SuperAdminDashboard from './components/SuperAdminDashboard';

// Shared Pages & Scaffolds
import { 
  AirEngineTabs, 
  NonAirTabs, 
  RevenueTabs, 
  TaxEngineManager, 
  PaymentTabs, 
  SecurityTabs, 
  SystemConfigTabs,
  AgencyOrg,
  MastersAndTemplates,
  CommunicationsHub,
  SupplierManagementPage
} from '@tripalfa/shared-features';

const AppRouter = () => {
  return (
    <Router>
      <AuthProvider>
        <TenantProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <SuperAdminDashboard />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/agency" element={
              <ProtectedRoute>
                <Layout>
                  <AgencyOrg />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/content-supplier" element={
              <ProtectedRoute>
                <SupplierManagementPage />
              </ProtectedRoute>
            } />
            
            <Route path="/communications" element={
              <ProtectedRoute>
                <Layout>
                  <CommunicationsHub />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/masters" element={
              <ProtectedRoute>
                <Layout>
                  <MastersAndTemplates />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/air-engine" element={
              <ProtectedRoute>
                <Layout>
                  <AirEngineTabs />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/non-air" element={
              <ProtectedRoute>
                <Layout>
                  <NonAirTabs />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/revenue" element={
              <ProtectedRoute>
                <Layout>
                  <RevenueTabs />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/tax" element={
              <ProtectedRoute>
                <Layout>
                  <TaxEngineManager />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/configs" element={
              <ProtectedRoute>
                <Layout>
                  <SystemConfigTabs />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/payment" element={
              <ProtectedRoute>
                <Layout>
                  <PaymentTabs />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/security" element={
              <ProtectedRoute>
                <Layout>
                  <SecurityTabs />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TenantProvider>
      </AuthProvider>
    </Router>
  );
};

export default AppRouter;