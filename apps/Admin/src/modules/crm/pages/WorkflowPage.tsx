import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../../shared/lib/api';
import {
  Plus,
  Search,
  Play,
  Pause,
  Trash2,
  Edit2,
  GitBranch,
  AlertCircle,
  CheckCircle,
} from '@tripalfa/ui-components/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/optics';
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
import { StatusBadge } from '@tripalfa/ui-components/optics';
import { cn } from '@tripalfa/shared-utils/utils';

interface WorkflowStep {
  id: string;
  name: string;
  type: 'TRIGGER' | 'CONDITION' | 'ACTION' | 'DELAY';
  config: Record<string, any>;
  nextStepId?: string;
}

interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  triggerType: 'MANUAL' | 'BOOKING_CREATED' | 'CONTACT_ADDED' | 'TASK_DUE' | 'EMAIL_RECEIVED';
  steps: WorkflowStep[];
  executedCount: number;
  lastExecutedAt?: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  };
}

export function WorkflowPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<Workflow['status'] | 'ALL'>('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    triggerType: 'MANUAL' as const,
  });

  const {
    data: workflows,
    isLoading,
    refetch,
  } = useQuery<Workflow[]>({
    queryKey: ['workflows', searchTerm, selectedStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      const response = await api.get(`/crm/workflows?${params}`);
      return response.data;
    },
  });

  const createWorkflowMutation = useMutation({
    mutationFn: async (data: typeof newWorkflow) => {
      const response = await api.post('/crm/workflows', data);
      return response.data;
    },
    onSuccess: () => {
      refetch();
      setIsCreateOpen(false);
      setNewWorkflow({
        name: '',
        description: '',
        triggerType: 'MANUAL',
      });
    },
  });

  const updateWorkflowMutation = useMutation({
    mutationFn: async (data: Workflow) => {
      const response = await api.put(`/crm/workflows/${data.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      refetch();
      setEditingWorkflow(null);
    },
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/crm/workflows/${id}`);
    },
    onSuccess: () => {
      refetch();
    },
  });

  const toggleWorkflowStatus = (workflow: Workflow) => {
    updateWorkflowMutation.mutate({
      ...workflow,
      status: workflow.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE',
    });
  };

  const getWorkflowStatusForBadge = (
    status: string
  ): 'primary' | 'info' | 'warning' | 'success' | 'default' => {
    const statusMap = {
      ACTIVE: 'success' as const,
      PAUSED: 'warning' as const,
      ARCHIVED: 'default' as const,
    };
    return statusMap[status as keyof typeof statusMap] || 'default';
  };

  const getTriggerLabel = (trigger: string) => {
    const labels = {
      MANUAL: 'Manual',
      BOOKING_CREATED: 'Booking Created',
      CONTACT_ADDED: 'Contact Added',
      TASK_DUE: 'Task Due',
      EMAIL_RECEIVED: 'Email Received',
    };
    return labels[trigger as keyof typeof labels] || trigger;
  };

  const commonWorkflowTemplates = [
    {
      name: 'Welcome Email for New Contacts',
      description: 'Send personalized welcome email when new contact is added',
      trigger: 'CONTACT_ADDED',
    },
    {
      name: 'Booking Confirmation Workflow',
      description: 'Auto-send confirmation and request payment after booking created',
      trigger: 'BOOKING_CREATED',
    },
    {
      name: 'Task Reminder Workflow',
      description: 'Send reminder notifications when task is due',
      trigger: 'TASK_DUE',
    },
    {
      name: 'Follow-up Email Sequence',
      description: 'Automatic follow-up emails at strategic intervals',
      trigger: 'MANUAL',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="action-row">
        <div>
          <h1 className="text-page-title">Workflows</h1>
          <p className="text-caption mt-1">Automate business processes and approvals</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus size={18} />
          New Workflow
        </Button>
      </div>

      {/* Filters */}
      <div className="filter-bar card-compact p-4">
        <div className="flex gap-3 flex-col md:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
            <Input
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {(['ALL', 'ACTIVE', 'PAUSED', 'ARCHIVED'] as const).map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={selectedStatus === status ? 'filter-chip-active' : 'filter-chip'}
            >
              {status === 'ALL' ? 'All Workflows' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Section */}
      <div>
        <h2 className="text-subsection-title mb-3">Workflow Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {commonWorkflowTemplates.map((template, idx) => (
            <Card key={idx} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-sm">{template.name}</h3>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {template.description}
                </p>
                <Button
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => {
                    setNewWorkflow({
                      name: template.name,
                      description: template.description,
                      triggerType: 'MANUAL',
                    });
                    setIsCreateOpen(true);
                  }}
                >
                  Use Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Workflows List */}
      <div>
        <h2 className="text-subsection-title mb-3">Active Workflows</h2>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading workflows...</div>
        ) : workflows && workflows.length === 0 ? (
          <Card className="text-center py-12">
            <GitBranch className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No workflows yet</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {workflows?.map(workflow => (
              <Card key={workflow.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{workflow.name}</h3>
                      {workflow.description && (
                        <p className="text-xs text-muted-foreground mt-1">{workflow.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          <GitBranch className="w-3 h-3 mr-1" />
                          {getTriggerLabel(workflow.triggerType)}
                        </Badge>
                        <StatusBadge
                          status={getWorkflowStatusForBadge(workflow.status)}
                          label={workflow.status}
                          size="sm"
                        />
                        <span className="text-xs text-muted-foreground">
                          Executed: {workflow.executedCount} times
                        </span>
                        {workflow.lastExecutedAt && (
                          <span className="text-xs text-muted-foreground">
                            Last: {new Date(workflow.lastExecutedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleWorkflowStatus(workflow)}
                      >
                        {workflow.status === 'ACTIVE' ? (
                          <>
                            <Pause className="w-3 h-3 mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 mr-1" />
                            Resume
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingWorkflow(workflow)}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteWorkflowMutation.mutate(workflow.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {workflow.steps.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs font-medium mb-2">Steps:</p>
                      <div className="space-y-1">
                        {workflow.steps.map((step, idx) => (
                          <div
                            key={step.id}
                            className="text-xs text-muted-foreground flex items-center gap-2"
                          >
                            <span className="bg-muted px-2 py-1 rounded">{idx + 1}</span>
                            <span>{step.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {step.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Workflow Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Workflow</DialogTitle>
            <DialogDescription>
              Set up automation rules for your business processes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Workflow Name</label>
              <Input
                placeholder="e.g., Send welcome email"
                value={newWorkflow.name}
                onChange={e =>
                  setNewWorkflow(prev => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                placeholder="Describe what this workflow does"
                value={newWorkflow.description}
                onChange={e =>
                  setNewWorkflow(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Trigger Type</label>
              <select
                value={newWorkflow.triggerType}
                onChange={e =>
                  setNewWorkflow(prev => ({
                    ...prev,
                    triggerType: e.target.value as typeof newWorkflow.triggerType,
                  }))
                }
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="MANUAL">Manual</option>
                <option value="BOOKING_CREATED">Booking Created</option>
                <option value="CONTACT_ADDED">Contact Added</option>
                <option value="TASK_DUE">Task Due</option>
                <option value="EMAIL_RECEIVED">Email Received</option>
              </select>
            </div>

            <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 flex gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>
                After creating, you can add steps and configure conditions in the workflow builder.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createWorkflowMutation.mutate(newWorkflow)}
              disabled={!newWorkflow.name || createWorkflowMutation.isPending}
            >
              Create Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
