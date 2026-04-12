import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../shared/lib/api';
import {
  Plus,
  Search,
  BarChart3,
  Users,
  Mail,
  MousePointerClick,
  TrendingUp,
  MoreHorizontal,
  Play,
  Pause,
  Eye,
  Megaphone,
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
import { Progress } from '@/components/optics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/optics';
import { StatusBadge } from '@tripalfa/ui-components/optics';
import { cn } from '@tripalfa/shared-utils/utils';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  recipientCount: number;
  sentCount: number;
  openCount: number;
  clickCount: number;
  convertedCount: number;
  status: 'draft' | 'scheduled' | 'running' | 'completed';
  createdAt: string;
  scheduledFor?: string;
  completedAt?: string;
}

export function CampaignsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ['crm-campaigns', searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      const response = await api.get(`/crm/campaigns?${params}`);
      return response.data;
    },
  });

  const getStatusForBadge = (
    status: string
  ): 'primary' | 'info' | 'warning' | 'success' | 'default' => {
    const statusMap = {
      draft: 'default' as const,
      scheduled: 'primary' as const,
      running: 'warning' as const,
      completed: 'success' as const,
    };
    return statusMap[status as keyof typeof statusMap] || 'default';
  };

  const CampaignCard = ({ campaign }: { campaign: Campaign }) => {
    const sentProgress = (campaign.sentCount / campaign.recipientCount) * 100;
    const openRate = campaign.sentCount > 0 ? (campaign.openCount / campaign.sentCount) * 100 : 0;
    const clickRate = campaign.sentCount > 0 ? (campaign.clickCount / campaign.sentCount) * 100 : 0;
    const conversionRate =
      campaign.sentCount > 0 ? (campaign.convertedCount / campaign.sentCount) * 100 : 0;

    return (
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-base">{campaign.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {campaign.subject}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="cursor-pointer">
                    <Eye size={14} className="mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">Edit</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer text-red-600">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <StatusBadge
                status={getStatusForBadge(campaign.status)}
                label={campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                size="sm"
              />
              <span className="text-caption">
                {new Date(campaign.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Send Progress</span>
                <span className="text-xs font-semibold">
                  {campaign.sentCount} / {campaign.recipientCount}
                </span>
              </div>
              <Progress value={sentProgress} className="h-2" />
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 p-3 rounded">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail size={14} />
                  Opens
                </div>
                <p className="font-bold mt-1">{campaign.openCount}</p>
                <p className="text-xs text-muted-foreground">{openRate.toFixed(1)}% open rate</p>
              </div>
              <div className="bg-muted/50 p-3 rounded">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MousePointerClick size={14} />
                  Clicks
                </div>
                <p className="font-bold mt-1">{campaign.clickCount}</p>
                <p className="text-xs text-muted-foreground">{clickRate.toFixed(1)}% click rate</p>
              </div>
              <div className="bg-muted/50 p-3 rounded col-span-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp size={14} />
                  Conversions
                </div>
                <p className="font-bold mt-1">{campaign.convertedCount}</p>
                <p className="text-xs text-muted-foreground">
                  {conversionRate.toFixed(1)}% conversion rate
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            {campaign.status === 'draft' && (
              <Button className="w-full" size="sm">
                <Play size={14} className="mr-2" />
                Schedule
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="action-row">
        <div>
          <h1 className="text-page-title">Email Campaigns</h1>
          <p className="text-caption mt-1">Create and manage email marketing campaigns</p>
        </div>
        <Button className="gap-2">
          <Plus size={18} />
          New Campaign
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="filter-bar card-compact p-4">
        <div className="flex gap-3 flex-col md:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
            <Input
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(['draft', 'scheduled', 'running', 'completed'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(statusFilter === status ? null : status)}
                className={statusFilter === status ? 'filter-chip-active' : 'filter-chip'}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Campaigns Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading campaigns...</div>
      ) : campaigns && campaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map(campaign => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Mail size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">No campaigns found</p>
            <Button className="mt-4" variant="outline">
              Create your first campaign
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
