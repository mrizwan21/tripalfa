/**
 * Customer Onboarding Manager Component
 * Displays and manages customer onboarding lifecycle
 */

import React, { useState } from 'react';
import { Check, Clock, AlertCircle, Send, Mail, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import type { CustomerOnboardingRecord } from '@/hooks/useOnboardingManagement';

interface CustomerOnboardingManagerProps {
  records: CustomerOnboardingRecord[];
  onStatusUpdate: (id: string, status: CustomerOnboardingRecord['status']) => void;
  onResendNotification: (id: string, recipient: 'admin' | 'customer') => void;
}

export function CustomerOnboardingManager({
  records,
  onStatusUpdate,
  onResendNotification,
}: CustomerOnboardingManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<CustomerOnboardingRecord['status'] | 'all'>('all');

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusDisplay = (status: CustomerOnboardingRecord['status']) => {
    const statusConfig = {
      registered: { label: 'Registered', color: 'blue', icon: Clock },
      profile_completed: { label: 'Profile Completed', color: 'purple', icon: User },
      account_verified: { label: 'Account Verified', color: 'yellow', icon: Check },
      payment_added: { label: 'Payment Added', color: 'green', icon: Check },
      active: { label: 'Active', color: 'emerald', icon: Check },
    };
    return statusConfig[status];
  };

  const getProgressPercentage = (status: CustomerOnboardingRecord['status']) => {
    const stages = {
      registered: 25,
      profile_completed: 50,
      account_verified: 75,
      payment_added: 100,
      active: 100,
    };
    return stages[status];
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by customer name, ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-4 py-2 border border-secondary-300 rounded-lg bg-white dark:bg-secondary-800 dark:border-secondary-600"
        >
          <option value="all">All Status</option>
          <option value="registered">Registered</option>
          <option value="profile_completed">Profile Completed</option>
          <option value="account_verified">Account Verified</option>
          <option value="payment_added">Payment Added</option>
          <option value="active">Active</option>
        </select>
      </div>

      {/* Records List */}
      <div className="space-y-4">
        {filteredRecords.map((record) => {
          const statusConfig = getStatusDisplay(record.status);
          const StatusIcon = statusConfig.icon;
          const progress = getProgressPercentage(record.status);

          return (
            <Card key={record.id} className="border-l-4 border-l-purple-500 overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  {/* Customer Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-secondary-900 dark:text-white">{record.customerName}</h3>
                    </div>
                    <p className="text-sm text-secondary-500 mt-1">ID: {record.customerId}</p>
                    <p className="text-sm text-secondary-500">Email: {record.customerEmail}</p>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-secondary-600 dark:text-secondary-400">Onboarding Progress</span>
                        <span className="text-xs font-bold text-secondary-900 dark:text-white">{progress}%</span>
                      </div>
                      <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-medium">
                      <div className="flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        <Check size={12} />
                        {new Date(record.registeredAt).toLocaleDateString()}
                      </div>

                      {record.profileCompletedAt && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          <User size={12} />
                          {new Date(record.profileCompletedAt).toLocaleDateString()}
                        </div>
                      )}

                      {record.accountVerifiedAt && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                          <Check size={12} />
                          {new Date(record.accountVerifiedAt).toLocaleDateString()}
                        </div>
                      )}

                      {record.paymentAddedAt && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          <Check size={12} />
                          {new Date(record.paymentAddedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex flex-col items-end gap-3 w-full lg:w-auto">
                    <Badge
                      variant="outline"
                      className={`bg-${statusConfig.color}-50 text-${statusConfig.color}-700 border-${statusConfig.color}-200 dark:bg-${statusConfig.color}-900/30 dark:text-${statusConfig.color}-300`}
                    >
                      <StatusIcon size={14} className="mr-1" />
                      {statusConfig.label}
                    </Badge>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onResendNotification(record.id, 'admin')}
                        className="text-xs"
                      >
                        <Mail size={14} className="mr-1" />
                        Resend Admin
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onResendNotification(record.id, 'customer')}
                        className="text-xs"
                      >
                        <Send size={14} className="mr-1" />
                        Resend Customer
                      </Button>
                    </div>

                    {/* Status Transition Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {record.status === 'registered' && (
                        <Button
                          size="sm"
                          onClick={() => onStatusUpdate(record.id, 'profile_completed')}
                          className="text-xs bg-purple-600 hover:bg-purple-700"
                        >
                          Complete Profile
                        </Button>
                      )}
                      {record.status === 'profile_completed' && (
                        <Button
                          size="sm"
                          onClick={() => onStatusUpdate(record.id, 'account_verified')}
                          className="text-xs bg-yellow-600 hover:bg-yellow-700"
                        >
                          Verify Account
                        </Button>
                      )}
                      {record.status === 'account_verified' && (
                        <Button
                          size="sm"
                          onClick={() => onStatusUpdate(record.id, 'payment_added')}
                          className="text-xs bg-green-600 hover:bg-green-700"
                        >
                          Add Payment
                        </Button>
                      )}
                      {record.status === 'payment_added' && (
                        <Button
                          size="sm"
                          onClick={() => onStatusUpdate(record.id, 'active')}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700"
                        >
                          Activate
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredRecords.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <AlertCircle size={40} className="mx-auto text-secondary-400 mb-3" />
            <p className="text-secondary-600 dark:text-secondary-400">No customer records found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
