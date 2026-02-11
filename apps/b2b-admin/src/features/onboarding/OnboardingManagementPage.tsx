/**
 * Onboarding Management Page
 * Central hub for managing supplier and customer onboarding processes
 * Includes lifecycle tracking and notification templates
 */

import React, { useState, useCallback } from 'react';
import { Settings2, Users, Briefcase, Mail, TrendingUp, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/Card';
import { useOnboardingManagement } from '@/hooks/useOnboardingManagement';
import { SupplierOnboardingManager } from './components/SupplierOnboardingManager';
import { CustomerOnboardingManager } from './components/CustomerOnboardingManager';
import { NotificationTemplateEditor } from './components/NotificationTemplateEditor';

export function OnboardingManagementPage() {
  const {
    supplierRecords,
    customerRecords,
    templates,
    updateSupplierStatus,
    updateCustomerStatus,
    updateTemplate,
    createTemplate,
  } = useOnboardingManagement();

  const [activeTab, setActiveTab] = useState('overview');

  const handleSupplierResend = useCallback((id: string, recipient: 'admin' | 'supplier') => {
    console.log(`Resending ${recipient} notification for supplier onboarding:`, id);
    // Trigger webhook/API call to resend notification
  }, []);

  const handleCustomerResend = useCallback((id: string, recipient: 'admin' | 'customer') => {
    console.log(`Resending ${recipient} notification for customer onboarding:`, id);
    // Trigger webhook/API call to resend notification
  }, []);

  // Calculate statistics
  const supplierStats = {
    total: supplierRecords.length,
    registered: supplierRecords.filter((r) => r.status === 'registered').length,
    walletAssigned: supplierRecords.filter((r) => r.status === 'wallet_assigned').length,
    active: supplierRecords.filter((r) => r.status === 'active' || r.status === 'wallet_activated').length,
  };

  const customerStats = {
    total: customerRecords.length,
    registered: customerRecords.filter((r) => r.status === 'registered').length,
    profileCompleted: customerRecords.filter((r) => r.status === 'profile_completed').length,
    activeWithPayment: customerRecords.filter((r) => r.status === 'payment_added' || r.status === 'active').length,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-secondary-900 tracking-tight dark:text-white">
            Onboarding Hub
          </h1>
          <p className="text-secondary-500 mt-2 font-medium">
            Manage supplier and customer onboarding lifecycles with notification templates.
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Supplier Stats */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-300 uppercase">Suppliers</p>
                <h3 className="text-2xl font-black text-blue-900 dark:text-blue-100 mt-1">{supplierStats.total}</h3>
                <p className="text-xs text-blue-700 dark:text-blue-200 mt-2">{supplierStats.active} Active</p>
              </div>
              <Briefcase size={40} className="text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-purple-600 dark:text-purple-300 uppercase">Customers</p>
                <h3 className="text-2xl font-black text-purple-900 dark:text-purple-100 mt-1">{customerStats.total}</h3>
                <p className="text-xs text-purple-700 dark:text-purple-200 mt-2">{customerStats.activeWithPayment} Active</p>
              </div>
              <Users size={40} className="text-purple-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-green-600 dark:text-green-300 uppercase">Completion Rate</p>
                <h3 className="text-2xl font-black text-green-900 dark:text-green-100 mt-1">
                  {Math.round(
                    ((supplierStats.active / supplierStats.total) * 100 +
                      (customerStats.activeWithPayment / customerStats.total) * 100) /
                      2
                  )}%
                </h3>
                <p className="text-xs text-green-700 dark:text-green-200 mt-2">Both Types</p>
              </div>
              <TrendingUp size={40} className="text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-600 dark:text-amber-300 uppercase">Templates</p>
                <h3 className="text-2xl font-black text-amber-900 dark:text-amber-100 mt-1">
                  {templates.filter((t) => t.isActive).length}
                </h3>
                <p className="text-xs text-amber-700 dark:text-amber-200 mt-2">Active Templates</p>
              </div>
              <Mail size={40} className="text-amber-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-secondary-100/80 dark:bg-secondary-900/80 backdrop-blur-xl rounded-2xl p-1.5 shadow-xl border border-secondary-200 dark:border-secondary-800 grid w-full grid-cols-3 gap-1">
          <TabsTrigger
            value="overview"
            className="rounded-xl flex items-center gap-2 px-6 py-2.5 font-bold data-[state=active]:bg-secondary-900 data-[state=active]:text-white dark:data-[state=active]:bg-primary-600"
          >
            <CheckCircle size={16} />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="suppliers"
            className="rounded-xl flex items-center gap-2 px-6 py-2.5 font-bold data-[state=active]:bg-secondary-900 data-[state=active]:text-white dark:data-[state=active]:bg-primary-600"
          >
            <Briefcase size={16} />
            Suppliers
          </TabsTrigger>
          <TabsTrigger
            value="customers"
            className="rounded-xl flex items-center gap-2 px-6 py-2.5 font-bold data-[state=active]:bg-secondary-900 data-[state=active]:text-white dark:data-[state=active]:bg-primary-600"
          >
            <Users size={16} />
            Customers
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Supplier Overview */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4">Supplier Onboarding Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Registered</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-secondary-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(supplierStats.registered / supplierStats.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-secondary-900 dark:text-white min-w-8">
                        {supplierStats.registered}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Wallet Assigned</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-secondary-200 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${(supplierStats.walletAssigned / supplierStats.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-secondary-900 dark:text-white min-w-8">
                        {supplierStats.walletAssigned}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Active</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-secondary-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(supplierStats.active / supplierStats.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-secondary-900 dark:text-white min-w-8">
                        {supplierStats.active}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Overview */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4">Customer Onboarding Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Registered</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-secondary-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${(customerStats.registered / customerStats.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-secondary-900 dark:text-white min-w-8">
                        {customerStats.registered}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Profile Completed</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-secondary-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${(customerStats.profileCompleted / customerStats.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-secondary-900 dark:text-white min-w-8">
                        {customerStats.profileCompleted}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Active with Payment</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-secondary-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(customerStats.activeWithPayment / customerStats.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-secondary-900 dark:text-white min-w-8">
                        {customerStats.activeWithPayment}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Template Status */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4">Template Status</h3>
              <div className="grid grid-cols-2 gap-4">
                {templates.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg"
                  >
                    <p className="text-sm font-bold text-secondary-900 dark:text-white">{tmpl.name}</p>
                    <p className="text-xs text-secondary-500 mt-1">{tmpl.eventType}</p>
                    <div className="flex gap-1 mt-2">
                      {tmpl.channels.map((ch) => (
                        <span key={ch} className="text-xs px-2 py-1 bg-secondary-100 dark:bg-secondary-800 rounded">
                          {ch}
                        </span>
                      ))}
                    </div>
                    {tmpl.isActive && <p className="text-xs text-green-600 mt-2 font-bold">✓ Active</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-6 mt-8">
          <SupplierOnboardingManager
            records={supplierRecords}
            onStatusUpdate={updateSupplierStatus}
            onResendNotification={handleSupplierResend}
          />
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6 mt-8">
          <CustomerOnboardingManager
            records={customerRecords}
            onStatusUpdate={updateCustomerStatus}
            onResendNotification={handleCustomerResend}
          />
        </TabsContent>
      </Tabs>

      {/* Templates Section - Always visible but after tabs */}
      <div className="pt-8 border-t border-secondary-200 dark:border-secondary-700">
        <div className="flex items-center gap-2 mb-6">
          <Settings2 size={24} className="text-primary-600" />
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">Notification Templates</h2>
        </div>
        <NotificationTemplateEditor
          templates={templates}
          onCreateTemplate={createTemplate}
          onUpdateTemplate={updateTemplate}
          onDeleteTemplate={(id) => {
            console.log('Delete template:', id);
          }}
        />
      </div>
    </div>
  );
}
