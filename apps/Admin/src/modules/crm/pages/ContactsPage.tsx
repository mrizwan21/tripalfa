import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../shared/lib/api';
import {
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  Filter,
  MoreHorizontal,
  Database,
} from '@tripalfa/ui-components/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/optics';
import { Button } from '@/components/optics';
import { Input } from '@/components/optics';
import { Badge } from '@/components/optics';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/optics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/optics';
import { cn } from '@tripalfa/shared-utils/utils';
import { StatusBadge } from '@tripalfa/ui-components/optics';

interface Contact {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalBookings: number;
  totalSpent: number;
  bookingsCount: number;
  openTicketsCount: number;
  lastActivity: string;
  source?: string;
  phone?: string;
  location?: string;
}

export function ContactsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const { data: contacts, isLoading } = useQuery<Contact[]>({
    queryKey: ['contacts', searchTerm, selectedTier],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedTier) params.append('tier', selectedTier);
      const response = await api.get(`/crm/contacts?${params}`);
      return response.data;
    },
  });

  const tierPriority = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
  const sorted = useMemo(
    () => [...(contacts || [])].sort((a, b) => tierPriority[a.tier] - tierPriority[b.tier]),
    [contacts]
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="action-row">
        <div>
          <h1 className="text-page-title">Contacts</h1>
          <p className="text-caption mt-1">Manage customer profiles and interactions</p>
        </div>
        <Button className="gap-2">
          <Plus size={18} />
          Add Contact
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="filter-bar card-compact p-4">
        <div className="flex gap-3 flex-col md:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(['platinum', 'gold', 'silver', 'bronze'] as const).map(tier => (
              <Button
                key={tier}
                className={selectedTier === tier ? 'filter-chip filter-chip-active' : 'filter-chip'}
                size="sm"
                onClick={() => setSelectedTier(selectedTier === tier ? null : tier)}
              >
                {tier.charAt(0).toUpperCase() + tier.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="card-compact">
        <div className="action-row p-4 border-b">
          <div>
            <h2 className="text-subsection-title">All Contacts</h2>
            <p className="text-caption">{contacts?.length || 0} total contacts</p>
          </div>
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="skeleton skeleton-card"></div>
          ) : sorted && sorted.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="record-table">
                <thead className="record-table-header">
                  <tr className="text-label">
                    <th className="record-table-cell">Name</th>
                    <th className="record-table-cell">Email</th>
                    <th className="record-table-cell">Tier</th>
                    <th className="record-table-cell">Bookings</th>
                    <th className="record-table-cell">Spent</th>
                    <th className="record-table-cell">Tickets</th>
                    <th className="record-table-cell">Last Activity</th>
                    <th className="record-table-cell text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(contact => (
                    <tr
                      key={contact.id}
                      className="record-table-row"
                      onClick={() => setSelectedContact(contact)}
                    >
                      <td className="record-table-cell">
                        <div>
                          <p className="font-medium">
                            {contact.firstName} {contact.lastName}
                          </p>
                          <p className="text-caption">{contact.source || 'Direct'}</p>
                        </div>
                      </td>
                      <td className="record-table-cell">
                        <div className="flex items-center gap-1">
                          <Mail size={14} className="text-muted-foreground" />
                          {contact.email}
                        </div>
                      </td>
                      <td className="record-table-cell">
                        <StatusBadge
                          status={contact.tier as any}
                          label={
                            contact.tier?.charAt(0).toUpperCase() + contact.tier?.slice(1) ||
                            'Unknown'
                          }
                          size="sm"
                        />
                      </td>
                      <td className="record-table-cell">
                        <span className="font-semibold">{contact.bookingsCount}</span>
                      </td>
                      <td className="record-table-cell">
                        <span className="font-semibold text-success">
                          $
                          {contact.totalSpent.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </span>
                      </td>
                      <td className="record-table-cell">
                        {contact.openTicketsCount > 0 ? (
                          <StatusBadge
                            status="failed"
                            label={contact.openTicketsCount.toString()}
                            size="sm"
                          />
                        ) : (
                          <span className="text-caption">-</span>
                        )}
                      </td>
                      <td className="record-table-cell text-caption">
                        {new Date(contact.lastActivity).toLocaleDateString()}
                      </td>
                      <td className="record-table-cell text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="cursor-pointer">
                              <Mail size={14} className="mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              Edit Contact
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-red-600">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <Database className="empty-state-icon" />
              <h3 className="empty-state-title">No contacts yet</h3>
              <p className="empty-state-description">
                Start by adding your first contact to track customer interactions
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Detail Modal */}
      {selectedContact && (
        <div className="hidden">
          {/* ContactDetailModal placeholder - implementation pending */}
        </div>
      )}
    </div>
  );
}
