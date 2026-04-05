import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../shared/lib/api';
import { Search, Filter, Download, Calendar, User, MessageSquare, BookOpen, Ticket, Gift } from '@tripalfa/ui-components/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/optics';
import { Button } from '@/components/optics';
import { Input } from '@/components/optics';
import { Badge } from '@/components/optics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/optics';
import { StatusBadge } from '@tripalfa/ui-components';
import { cn } from '@tripalfa/shared-utils/utils';

interface ActivityItem {
  id: string;
  contactId: string;
  contactName: string;
  type:
    | 'BOOKING_CREATED'
    | 'BOOKING_MODIFIED'
    | 'BOOKING_CANCELLED'
    | 'TICKET_CREATED'
    | 'TICKET_RESOLVED'
    | 'EMAIL_SENT'
    | 'EMAIL_OPENED'
    | 'LINK_CLICKED'
    | 'NOTE_ADDED'
    | 'AMENDMENT';
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  createdBy?: string;
  isInternal?: boolean;
}

export default function ActivityTimelinePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'oldest'>('recent');

  const { data: activities, isLoading } = useQuery<ActivityItem[]>({
    queryKey: ['activities', searchTerm, selectedType, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedType) params.append('type', selectedType);
      params.append('sort', sortBy);
      const response = await api.get(`/crm/activities?${params}`);
      return response.data;
    },
  });

  const activityTypes = [
    'BOOKING_CREATED',
    'BOOKING_MODIFIED',
    'TICKET_CREATED',
    'EMAIL_SENT',
    'AMENDMENT',
    'NOTE_ADDED',
  ];

  const getActivityIcon = (type: string) => {
    const icons = {
      BOOKING_CREATED: <BookOpen size={16} className="text-blue-600" />,
      BOOKING_MODIFIED: <BookOpen size={16} className="text-purple-600" />,
      BOOKING_CANCELLED: <BookOpen size={16} className="text-red-600" />,
      TICKET_CREATED: <Ticket size={16} className="text-orange-600" />,
      TICKET_RESOLVED: <Ticket size={16} className="text-green-600" />,
      EMAIL_SENT: <MessageSquare size={16} className="text-blue-500" />,
      EMAIL_OPENED: <MessageSquare size={16} className="text-green-500" />,
      LINK_CLICKED: <Gift size={16} className="text-yellow-600" />,
      NOTE_ADDED: <MessageSquare size={16} className="text-gray-600" />,
      AMENDMENT: <Filter size={16} className="text-indigo-600" />,
    };
    return icons[type as keyof typeof icons] || <MessageSquare size={16} />;
  };

  const getActivityTypeForBadge = (type: string): 'primary' | 'info' | 'warning' | 'success' | 'default' => {
    const typeMap = {
      BOOKING_CREATED: 'primary' as const,
      BOOKING_MODIFIED: 'info' as const,
      BOOKING_CANCELLED: 'warning' as const,
      TICKET_CREATED: 'primary' as const,
      TICKET_RESOLVED: 'success' as const,
      EMAIL_SENT: 'primary' as const,
      EMAIL_OPENED: 'info' as const,
      LINK_CLICKED: 'warning' as const,
      NOTE_ADDED: 'default' as const,
      AMENDMENT: 'info' as const,
    };
    return typeMap[type as keyof typeof typeMap] || 'default';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="action-row">
        <div>
          <h1 className="text-page-title">Activity Timeline</h1>
          <p className="text-caption mt-1">Unified view of all customer interactions</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download size={18} />
          Export
        </Button>
      </div>

      {/* Filters */}
      <div className="filter-bar card-compact p-4">
        <div className="space-y-4">
          <div className="flex gap-3 flex-col md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
              <Input
                placeholder="Search by contact name, booking ID, or ticket ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2 md:w-auto">
              <Calendar size={16} />
              Date Range
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activityTypes.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(selectedType === type ? null : type)}
                className={selectedType === type ? 'filter-chip-active' : 'filter-chip'}
              >
                {getActivityIcon(type)}
                <span>{type.replace(/_/g, ' ')}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('recent')}
              className={sortBy === 'recent' ? 'filter-chip-active' : 'filter-chip'}
            >
              Most Recent
            </button>
            <button
              onClick={() => setSortBy('oldest')}
              className={sortBy === 'oldest' ? 'filter-chip-active' : 'filter-chip'}
            >
              Oldest First
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline Events</CardTitle>
          <CardDescription>{activities?.length || 0} activities found</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading activities...</div>
          ) : activities && activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity, idx) => (
                <div
                  key={activity.id}
                  className="flex gap-4 pb-4 border-b last:border-b-0 hover:bg-muted/40 p-3 rounded-lg transition-colors"
                >
                  {/* Timeline marker */}
                  <div className="flex flex-col items-center">
                    <div className="p-2 rounded-full bg-muted">{getActivityIcon(activity.type)}</div>
                    {idx < (activities?.length || 0) - 1 && (
                      <div className="w-0.5 h-12 bg-border my-2" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{activity.title}</p>
                          <StatusBadge status={getActivityTypeForBadge(activity.type)} label={activity.type.replace(/_/g, ' ')} size="sm" />
                          {activity.isInternal && <Badge variant="secondary">Internal</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          <User size={14} className="inline mr-1" />
                          {activity.contactName}
                        </p>
                        {activity.description && (
                          <p className="text-sm mt-2 text-foreground">{activity.description}</p>
                        )}
                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                          <div className="mt-2 text-xs space-y-1 bg-muted/50 p-2 rounded">
                            {Object.entries(activity.metadata).map(([key, value]) => (
                              <p key={key}>
                                <span className="font-medium">{key}:</span>{' '}
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No activities found</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
