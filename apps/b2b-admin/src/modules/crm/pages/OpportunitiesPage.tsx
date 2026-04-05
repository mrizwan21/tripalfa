import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../../shared/lib/api';
import {
  Plus,
  Search,
  TrendingUp,
  DollarSign,
  Calendar,
  User,
  Trash2,
  Edit2,
  Check,
  Briefcase,
} from '@tripalfa/ui-components/icons';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/optics';
import { Button } from '@/components/optics';
import { Input } from '@/components/optics';
import { Badge } from '@/components/optics';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/optics';
import { cn } from '@tripalfa/shared-utils/utils';
import { StatusBadge } from '@tripalfa/ui-components';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { CHART_STATUS_PALETTE, CHART_COLORS } from '@/theme/chart-colors';

interface Opportunity {
  id: string;
  name: string;
  description?: string;
  stage:
    | 'PROSPECTING'
    | 'QUALIFICATION'
    | 'PROPOSAL'
    | 'NEGOTIATION'
    | 'CLOSED_WON'
    | 'CLOSED_LOST';
  probability: number; // 0-100
  value: number;
  currency: string;
  expectedCloseDate?: string;
  company?: {
    id: string;
    name: string;
  };
  contact?: {
    id: string;
    name: string;
  };
  owner?: {
    id: string;
    name: string;
  };
  tags?: string[];
  nextAction?: string;
  nextActionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export default function OpportunitiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<Opportunity['stage'] | 'ALL'>('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [newOpportunity, setNewOpportunity] = useState({
    name: '',
    description: '',
    stage: 'PROSPECTING' as const,
    probability: 50,
    value: 0,
    currency: 'USD',
    expectedCloseDate: '',
  });

  const {
    data: opportunities,
    isLoading,
    refetch,
  } = useQuery<Opportunity[]>({
    queryKey: ['opportunities', searchTerm, selectedStage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedStage !== 'ALL') params.append('stage', selectedStage);
      const response = await api.get(`/crm/opportunities?${params}`);
      return response.data;
    },
  });

  const createOpportunityMutation = useMutation({
    mutationFn: async (data: typeof newOpportunity) => {
      const response = await api.post('/crm/opportunities', data);
      return response.data;
    },
    onSuccess: () => {
      refetch();
      setIsCreateOpen(false);
      setNewOpportunity({
        name: '',
        description: '',
        stage: 'PROSPECTING',
        probability: 50,
        value: 0,
        currency: 'USD',
        expectedCloseDate: '',
      });
    },
  });

  const updateOpportunityMutation = useMutation({
    mutationFn: async (data: Opportunity) => {
      const response = await api.put(`/crm/opportunities/${data.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      refetch();
      setEditingOpportunity(null);
    },
  });

  const deleteOpportunityMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/crm/opportunities/${id}`);
    },
    onSuccess: () => {
      refetch();
    },
  });

  const getStageStatus = (stage: string): 'primary' | 'info' | 'warning' | 'success' | 'error' => {
    const statusMap = {
      PROSPECTING: 'primary' as const,
      QUALIFICATION: 'info' as const,
      PROPOSAL: 'warning' as const,
      NEGOTIATION: 'warning' as const,
      CLOSED_WON: 'success' as const,
      CLOSED_LOST: 'error' as const,
    };
    return statusMap[stage as keyof typeof statusMap] || 'default';
  };

  const stages = [
    'PROSPECTING',
    'QUALIFICATION',
    'PROPOSAL',
    'NEGOTIATION',
    'CLOSED_WON',
    'CLOSED_LOST',
  ] as const;

  const groupedByStage = {
    PROSPECTING: opportunities?.filter(o => o.stage === 'PROSPECTING') || [],
    QUALIFICATION: opportunities?.filter(o => o.stage === 'QUALIFICATION') || [],
    PROPOSAL: opportunities?.filter(o => o.stage === 'PROPOSAL') || [],
    NEGOTIATION: opportunities?.filter(o => o.stage === 'NEGOTIATION') || [],
    CLOSED_WON: opportunities?.filter(o => o.stage === 'CLOSED_WON') || [],
    CLOSED_LOST: opportunities?.filter(o => o.stage === 'CLOSED_LOST') || [],
  };

  const totalValue = opportunities?.reduce((sum, o) => sum + o.value, 0) || 0;
  const expectedValue =
    opportunities?.reduce((sum, o) => sum + (o.value * o.probability) / 100, 0) || 0;

  const stageData = stages.map(stage => {
    const stageOpportunities = groupedByStage[stage];
    return {
      stage: stage.replace(/_/g, ' '),
      count: stageOpportunities.length,
      value: stageOpportunities.reduce((sum, o) => sum + o.value, 0),
    };
  });

  const probabilityData = [
    { name: '0-25%', value: opportunities?.filter(o => o.probability <= 25).length || 0 },
    {
      name: '25-50%',
      value: opportunities?.filter(o => o.probability > 25 && o.probability <= 50).length || 0,
    },
    {
      name: '50-75%',
      value: opportunities?.filter(o => o.probability > 50 && o.probability <= 75).length || 0,
    },
    { name: '75-100%', value: opportunities?.filter(o => o.probability > 75).length || 0 },
  ];

  const COLORS = CHART_STATUS_PALETTE;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="action-row">
        <div>
          <h1 className="text-page-title">Opportunities</h1>
          <p className="text-caption mt-1">Manage your sales pipeline and track deals</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus size={18} />
          New Opportunity
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="data-grid">
        <div className="metric-card">
          <div>
            <p className="text-label">Total Value</p>
            <p className="text-page-title mt-2">${totalValue.toLocaleString()}</p>
          </div>
        </div>

        <div className="metric-card">
          <div>
            <p className="text-label">Expected Value</p>
            <p className="text-page-title mt-2">${expectedValue.toLocaleString()}</p>
          </div>
        </div>

        <div className="metric-card">
          <div>
            <p className="text-label">Total Opportunities</p>
            <p className="text-page-title mt-2">{opportunities?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* Analytics */}
      <div className="data-grid grid-cols-1 lg:grid-cols-2">
        <div className="card-compact">
          <div className="p-4 border-b">
            <h2 className="text-subsection-title">Opportunities by Stage</h2>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" angle={-45} textAnchor="end" height={80} fontSize={12} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={CHART_COLORS.blue} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-compact">
          <div className="p-4 border-b">
            <h2 className="text-subsection-title">Win Probability Distribution</h2>
          </div>
          <div className="p-4 flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={probabilityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill={CHART_COLORS.violet}
                  dataKey="value"
                >
                  {probabilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar card-compact p-4">
        <div className="flex gap-3 flex-col md:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
            <Input
              placeholder="Search opportunities..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge
            variant={selectedStage === 'ALL' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedStage('ALL')}
          >
            All
          </Badge>
          {stages.map(stage => (
            <button
              key={stage}
              onClick={() => setSelectedStage(stage)}
              className={selectedStage === stage ? 'filter-chip-active' : 'filter-chip'}
            >
              {stage.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban View */}
      {isLoading ? (
        <div className="text-center py-8">Loading opportunities...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
          {stages.map(stage => (
            <div key={stage} className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <StatusBadge
                  status={getStageStatus(stage)}
                  label={`${stage.replace(/_/g, ' ')} (${groupedByStage[stage].length})`}
                />
              </div>
              <div className="space-y-3">
                {groupedByStage[stage].map(opportunity => (
                  <Card
                    key={opportunity.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">{opportunity.name}</h4>

                        {opportunity.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {opportunity.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <span className="font-semibold">
                              ${opportunity.value.toLocaleString()}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {opportunity.probability}%
                          </Badge>
                        </div>

                        {opportunity.expectedCloseDate && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(opportunity.expectedCloseDate).toLocaleDateString()}
                          </div>
                        )}

                        <div className="flex justify-end gap-1 pt-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingOpportunity(opportunity)}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteOpportunityMutation.mutate(opportunity.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Opportunity Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Opportunity</DialogTitle>
            <DialogDescription>Add a new sales opportunity to your pipeline</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="Opportunity name"
                value={newOpportunity.name}
                onChange={e =>
                  setNewOpportunity(prev => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                placeholder="Opportunity description"
                value={newOpportunity.description}
                onChange={e =>
                  setNewOpportunity(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Stage</label>
                <select
                  value={newOpportunity.stage}
                  onChange={e =>
                    setNewOpportunity(prev => ({
                      ...prev,
                      stage: e.target.value as typeof newOpportunity.stage,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  {stages.map(s => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Probability (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={newOpportunity.probability}
                  onChange={e =>
                    setNewOpportunity(prev => ({
                      ...prev,
                      probability: parseInt(e.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Value</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newOpportunity.value}
                  onChange={e =>
                    setNewOpportunity(prev => ({
                      ...prev,
                      value: parseFloat(e.target.value),
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Expected Close Date</label>
                <Input
                  type="date"
                  value={newOpportunity.expectedCloseDate}
                  onChange={e =>
                    setNewOpportunity(prev => ({
                      ...prev,
                      expectedCloseDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createOpportunityMutation.mutate(newOpportunity)}
              disabled={!newOpportunity.name || createOpportunityMutation.isPending}
            >
              Create Opportunity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
