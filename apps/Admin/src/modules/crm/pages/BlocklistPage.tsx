import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../../shared/lib/api';
import {
  Plus,
  Search,
  Trash2,
  UserX,
  AlertCircle,
  Clock,
  Shield,
  Link2,
} from '@tripalfa/ui-components/icons';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/optics';
import { Button } from '@/components/optics';
import { Input } from '@/components/optics';
import { Badge } from '@/components/optics';
import { StatusBadge } from '@tripalfa/ui-components/optics';
import { cn } from '@tripalfa/shared-utils/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/optics';

interface BlocklistEntry {
  id: string;
  email?: string;
  phoneNumber?: string;
  name?: string;
  reason: 'FRAUD' | 'ABUSIVE' | 'DUPLICATE' | 'COMPLIANCE' | 'KYC_FAILED' | 'MANUAL';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'EXPIRED' | 'REVIEWED' | 'APPEALED';
  blockedAt: string;
  kycRelated?: {
    kycSubmissionId: string;
    status: 'VERIFIED' | 'REJECTED' | 'PENDING';
    reason?: string;
  };
  linkedAccounts?: Array<{ id: string; email: string }>;
  appealDetails?: {
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    message: string;
  };
}

export default function BlocklistPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<BlocklistEntry | null>(null);
  const [newEntry, setNewEntry] = useState({
    email: '',
    reason: 'MANUAL' as const,
    severity: 'MEDIUM' as const,
    notes: '',
  });

  const { data: entries, isLoading, refetch } = useQuery<BlocklistEntry[]>({
    queryKey: ['blocklist', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      const response = await api.get(`/crm/blocklist?${params}`);
      return response.data;
    },
  });

  const addBlocklistMutation = useMutation({
    mutationFn: async (data: typeof newEntry) => {
      const response = await api.post('/crm/blocklist', data);
      return response.data;
    },
    onSuccess: () => {
      refetch();
      setIsAddOpen(false);
      setNewEntry({ email: '', reason: 'MANUAL', severity: 'MEDIUM', notes: '' });
    },
  });

  const removeBlocklistMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/crm/blocklist/${id}`);
    },
    onSuccess: () => refetch(),
  });

  const getSeverityStatus = (severity: string): 'primary' | 'info' | 'warning' | 'success' | 'default' => {
    const statusMap = {
      LOW: 'info' as const,
      MEDIUM: 'warning' as const,
      HIGH: 'warning' as const,
      CRITICAL: 'primary' as const,
    };
    return statusMap[severity as keyof typeof statusMap] || 'default';
  };

  const getReasonStatus = (reason: string): 'primary' | 'info' | 'warning' | 'success' | 'default' => {
    const statusMap = {
      FRAUD: 'primary' as const,
      KYC_FAILED: 'warning' as const,
      COMPLIANCE: 'info' as const,
      ABUSIVE: 'warning' as const,
      DUPLICATE: 'info' as const,
      MANUAL: 'default' as const,
    };
    return statusMap[reason as keyof typeof statusMap] || 'default';
  };

  const kycRelated = entries?.filter((e) => e.kycRelated) || [];
  const fraudulent = entries?.filter((e) => e.reason === 'FRAUD') || [];

  return (
    <div className="space-y-5">
      <div className="action-row">
        <div>
          <h1 className="text-page-title">Blocklist Management</h1>
          <p className="text-caption mt-1">Manage blocked contacts and fraudulent accounts</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2">
          <Plus size={18} />
          Add to Blocklist
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-900">Total Blocked</p>
            <p className="text-2xl font-bold text-red-900 mt-2">{entries?.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <p className="text-sm text-orange-900">KYC Related</p>
            <p className="text-2xl font-bold text-orange-900 mt-2">{kycRelated.length}</p>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <p className="text-sm text-purple-900">Fraudulent</p>
            <p className="text-2xl font-bold text-purple-900 mt-2">{fraudulent.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex relative">
            <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
            <Input
              placeholder="Search by email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">Loading blocklist...</div>
      ) : (
        <div className="space-y-3">
          {entries?.map((entry) => (
            <Card key={entry.id} className="border-l-4 border-l-red-500">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <UserX className="w-5 h-5 text-red-600" />
                      <h3 className="font-semibold">{entry.email || entry.phoneNumber}</h3>
                    </div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <StatusBadge status={getReasonStatus(entry.reason)} label={entry.reason} size="sm" />
                      <StatusBadge status={getSeverityStatus(entry.severity)} label={entry.severity} size="sm" />
                    </div>
                    {entry.kycRelated && (
                      <div className="mt-2 p-2 bg-orange-50 rounded text-xs border border-orange-200">
                        <p className="font-medium">🔗 KYC: {entry.kycRelated.status}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setSelectedEntry(entry)}>
                      Details
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => removeBlocklistMutation.mutate(entry.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Blocklist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={newEntry.email}
                onChange={(e) => setNewEntry((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <select
                value={newEntry.reason}
                onChange={(e) => setNewEntry((prev) => ({ ...prev, reason: e.target.value as any }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="FRAUD">Fraud</option>
                <option value="KYC_FAILED">KYC Failed</option>
                <option value="COMPLIANCE">Compliance</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Severity</label>
              <select
                value={newEntry.severity}
                onChange={(e) => setNewEntry((prev) => ({ ...prev, severity: e.target.value as any }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => addBlocklistMutation.mutate(newEntry)} disabled={!newEntry.email || addBlocklistMutation.isPending}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
