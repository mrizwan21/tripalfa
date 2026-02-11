/**
 * Supplier Onboarding Manager Component
 * Displays and manages supplier onboarding lifecycle
 */

import React, { useState } from 'react';
import { Check, Clock, AlertCircle, Send, Eye, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import type { SupplierOnboardingRecord } from '@/hooks/useOnboardingManagement';

interface SupplierOnboardingManagerProps {
  records: SupplierOnboardingRecord[];
  onStatusUpdate: (id: string, status: SupplierOnboardingRecord['status']) => void;
  onResendNotification: (id: string, recipient: 'admin' | 'supplier') => void;
}

export function SupplierOnboardingManager({
  records,
  onStatusUpdate,
  onResendNotification,
}: SupplierOnboardingManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<SupplierOnboardingRecord['status'] | 'all'>('all');

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.supplierId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusDisplay = (status: SupplierOnboardingRecord['status']) => {
    const statusConfig = {
      registered: { label: 'Registered', color: 'blue', icon: Clock },
      wallet_assigned: { label: 'Wallet Assigned', color: 'yellow', icon: Clock },
      wallet_activated: { label: 'Wallet Activated', color: 'green', icon: Check },
      active: { label: 'Active', color: 'emerald', icon: Check },
    };
    return statusConfig[status];
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by supplier name or ID..."
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
          <option value="wallet_assigned">Wallet Assigned</option>
          <option value="wallet_activated">Wallet Activated</option>
          <option value="active">Active</option>
        </select>
      </div>

      {/* Records List */}
      <div className="space-y-4">
        {filteredRecords.map((record) => {
          const statusConfig = getStatusDisplay(record.status);
          const StatusIcon = statusConfig.icon;

          return (
            <Card key={record.id} className="border-l-4 border-l-blue-500 overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  {/* Supplier Info */}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-secondary-900 dark:text-white">{record.supplierName}</h3>
                    <p className="text-sm text-secondary-500 mt-1">ID: {record.supplierId}</p>
                    <p className="text-sm text-secondary-500">Email: {record.supplierEmail}</p>

                    {/* Timeline */}
                    <div className="flex items-center gap-3 mt-4 text-xs font-medium">
                      <div
                        className={`flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300`}
                      >
                        <Check size={14} />
                        Registered {new Date(record.registeredAt).toLocaleDateString()}
                      </div>

                      {record.walletAssignedAt && (
                        <div
                          className={`flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300`}
                        >
                          <Clock size={14} />
                          Wallet: {new Date(record.walletAssignedAt).toLocaleDateString()}
                        </div>
                      )}

                      {record.walletActivatedAt && (
                        <div
                          className={`flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300`}
                        >
                          <Check size={14} />
                          Active: {new Date(record.walletActivatedAt).toLocaleDateString()}
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
                        onClick={() => onResendNotification(record.id, 'supplier')}
                        className="text-xs"
                      >
                        <Send size={14} className="mr-1" />
                        Resend Supplier
                      </Button>
                    </div>

                    {/* Status Transition Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {record.status === 'registered' && (
                        <Button
                          size="sm"
                          onClick={() => onStatusUpdate(record.id, 'wallet_assigned')}
                          className="text-xs bg-yellow-600 hover:bg-yellow-700"
                        >
                          Assign Wallet
                        </Button>
                      )}
                      {record.status === 'wallet_assigned' && (
                        <Button
                          size="sm"
                          onClick={() => onStatusUpdate(record.id, 'wallet_activated')}
                          className="text-xs bg-green-600 hover:bg-green-700"
                        >
                          Activate Wallet
                        </Button>
                      )}
                      {record.status === 'wallet_activated' && (
                        <Button
                          size="sm"
                          onClick={() => onStatusUpdate(record.id, 'active')}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700"
                        >
                          Mark as Active
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
            <p className="text-secondary-600 dark:text-secondary-400">No supplier records found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
