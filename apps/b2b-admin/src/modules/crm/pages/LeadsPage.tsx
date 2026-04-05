import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../shared/lib/api';
import { Search, Filter, Zap, TrendingUp, Clock, Mail, Phone, MapPin, ArrowRight, Download, Eye, Briefcase } from '@tripalfa/ui-components/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/optics';
import { Button } from '@/components/optics';
import { Input } from '@/components/optics';
import { Badge } from '@/components/optics';
import { Progress } from '@/components/optics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/optics';
import { StatusBadge } from '@tripalfa/ui-components';
import { cn } from '@tripalfa/shared-utils/utils';

interface Lead {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  status: 'lead' | 'prospect' | 'customer' | 'inactive';
  source?: string;
  lastInteractionAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('prospect');

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['crm-metrics'],
    queryFn: async () => {
      const response = await api.get('/crm/metrics?range=month');
      return response.data;
    },
  });

  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['leads', searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '50');
      const response = await fetch(`/api/crm/contacts?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch leads');
      return response.json();
    },
  });

  const leads = leadsData?.data || [];

  const QuickStats = () => (
    <div className="data-grid">
      <div className="metric-card">
        <div className="text-center">
          <p className="text-label">Total Prospects</p>
          <p className="text-page-title mt-2">{metrics?.contacts.active || 0}</p>
          <p className="text-success text-caption mt-1">↑ {metrics?.contacts.newThisMonth || 0} new this month</p>
        </div>
      </div>
      <div className="metric-card">
        <div className="text-center">
          <p className="text-label">Open Emails</p>
          <p className="text-page-title mt-2">{metrics?.campaigns.openRate?.toFixed(1) || 0}%</p>
          <p className="text-caption mt-1">Avg open rate</p>
        </div>
      </div>
      <div className="metric-card">
        <div className="text-center">
          <p className="text-label">Hot Leads</p>
          <p className="text-page-title mt-2">{metrics?.engagement.hotLeadsCount || 0}</p>
          <p className="text-caption mt-1">Recently active</p>
        </div>
      </div>
      <div className="metric-card">
        <div className="text-center">
          <p className="text-label">Engagement</p>
          <p className="text-page-title mt-2">{metrics?.engagement.avgEngagementScore?.toFixed(1) || 0}</p>
          <p className="text-caption mt-1">Out of 10</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="action-row">
        <div>
          <h1 className="text-page-title">Sales Pipeline & Prospects</h1>
          <p className="text-caption mt-1">Manage and prioritize your sales prospects</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download size={18} />
          Export Leads
        </Button>
      </div>

      {/* Quick Stats */}
      {!metricsLoading && <QuickStats />}

      {/* Search and Filter */}
      <div className="filter-bar card-compact p-4">
        <div className="space-y-4">
          <div className="flex gap-3 flex-col md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
              <Input
                placeholder="Search by name, email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {(['prospect', 'lead', 'customer'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
                  className={statusFilter === status ? 'filter-chip-active' : 'filter-chip'}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="card-compact">
        <div className="p-4 border-b">
          <h2 className="text-subsection-title">Prospects ({leads.length})</h2>
          <p className="text-caption">Manage your sales prospects and contact information</p>
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="empty-state">
              <Briefcase className="empty-state-icon" />
              <h3 className="empty-state-title">Loading prospects...</h3>
            </div>
          ) : leads && leads.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="record-table">
                <thead className="record-table-header">
                  <tr>
                    <th className="record-table-cell">Contact</th>
                    <th className="record-table-cell">Email</th>
                    <th className="record-table-cell">Phone</th>
                    <th className="record-table-cell">Company</th>
                    <th className="record-table-cell">Status</th>
                    <th className="record-table-cell">Source</th>
                    <th className="record-table-cell">Last Interaction</th>
                    <th className="record-table-cell text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead: Lead) => (
                    <tr key={lead.id} className="record-table-row">
                      <td className="record-table-cell">
                        <p className="font-medium">{lead.firstName || ''} {lead.lastName || ''}</p>
                        <p className="text-caption">{lead.id.substring(0, 8)}</p>
                      </td>
                      <td className="record-table-cell">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail size={14} className="text-muted-foreground" />
                          {lead.email}
                        </div>
                      </td>
                      <td className="record-table-cell">
                        {lead.phone ? (
                          <div className="flex items-center gap-1">
                            <Phone size={14} className="text-muted-foreground" />
                            {lead.phone}
                          </div>
                        ) : (
                          <span className="text-caption">-</span>
                        )}
                      </td>
                      <td className="record-table-cell">{lead.company || '-'}</td>
                      <td className="record-table-cell">
                        <StatusBadge status={lead.status as any} label={lead.status?.charAt(0).toUpperCase() + lead.status?.slice(1) || 'Unknown'} size="sm" />
                      </td>
                      <td className="record-table-cell">
                        <Badge variant="secondary">{lead.source || 'Direct'}</Badge>
                      </td>
                      <td className="record-table-cell text-caption">
                        {lead.lastInteractionAt ? new Date(lead.lastInteractionAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="record-table-cell text-right">
                        <Button size="sm" variant="ghost" className="gap-1">
                          <Mail size={14} />
                          Email
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <Briefcase className="empty-state-icon" />
              <h3 className="empty-state-title">No prospects yet</h3>
              <p className="empty-state-description">Start adding prospects to build your sales pipeline</p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Status Distribution */}
      <div className="card-compact">
        <div className="p-4 border-b">
          <h2 className="text-subsection-title">Contact Distribution</h2>
          <p className="text-caption">Breakdown of contacts by status</p>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {[
              { status: 'Leads', count: metrics?.contacts.leads || 0, total: metrics?.contacts.total || 1 },
              { status: 'Prospects', count: metrics?.contacts.active || 0, total: metrics?.contacts.total || 1 },
              { status: 'Customers', count: metrics?.contacts.total - (metrics?.contacts.leads || 0) - (metrics?.contacts.active || 0) || 0, total: metrics?.contacts.total || 1 },
            ].map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-label">{item.status}</p>
                  <span className="font-bold">{item.count}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={(item.count / Math.max(item.total, 1)) * 100} className="h-3" />
                  <span className="text-caption font-semibold w-12 text-right">
                    {((item.count / Math.max(item.total, 1)) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
