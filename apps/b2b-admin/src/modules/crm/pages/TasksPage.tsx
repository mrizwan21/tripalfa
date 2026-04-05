import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../../shared/lib/api';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  CheckCircle2,
  Circle,
  AlertCircle,
  Trash2,
  Edit2,
  Clock,
  ListTodo,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/optics';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/optics';
import { StatusBadge } from '@tripalfa/ui-components';
import { cn } from '@tripalfa/shared-utils/utils';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  relatedTo?: {
    type: 'BOOKING' | 'CONTACT' | 'COMPANY' | 'OPPORTUNITY';
    id: string;
    name: string;
  };
  dueDate?: string;
  reminderDate?: string;
  tags?: string[];
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  };
  completedAt?: string;
}

interface TaskFilters {
  status: Task['status'] | 'ALL';
  priority: Task['priority'] | 'ALL';
  assignedTo: 'ALL' | 'ME' | 'UNASSIGNED' | string;
  view: 'kanban' | 'list';
}

export default function TasksPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<TaskFilters>({
    status: 'ALL',
    priority: 'ALL',
    assignedTo: 'ALL',
    view: 'kanban',
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    priority: Task['priority'];
    status: Task['status'];
    dueDate: string;
  }>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'TODO',
    dueDate: '',
  });

  const { data: tasks, isLoading, refetch } = useQuery<Task[]>({
    queryKey: ['tasks', searchTerm, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filters.status !== 'ALL') params.append('status', filters.status);
      if (filters.priority !== 'ALL') params.append('priority', filters.priority);
      if (filters.assignedTo !== 'ALL')
        params.append('assignedTo', filters.assignedTo);
      const response = await api.get(`/crm/tasks?${params}`);
      return response.data;
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: typeof newTask) => {
      const response = await api.post('/crm/tasks', data);
      return response.data;
    },
    onSuccess: () => {
      refetch();
      setIsCreateOpen(false);
      setNewTask({ title: '', description: '', priority: 'MEDIUM', status: 'TODO', dueDate: '' });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (data: Task) => {
      const response = await api.put(`/crm/tasks/${data.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      refetch();
      setEditingTask(null);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/crm/tasks/${id}`);
    },
    onSuccess: () => {
      refetch();
    },
  });

  const getTaskStatus = (status: string): 'primary' | 'info' | 'warning' | 'success' | 'default' => {
    const statusMap = {
      TODO: 'default' as const,
      IN_PROGRESS: 'info' as const,
      COMPLETED: 'success' as const,
      CANCELLED: 'warning' as const,
    };
    return statusMap[status as keyof typeof statusMap] || 'default';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <AlertCircle className="w-4 h-4" />;
      case 'HIGH':
        return <AlertCircle className="w-4 h-4" />;
      case 'MEDIUM':
        return <Clock className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      TODO: 'bg-gray-100 text-gray-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      LOW: 'bg-gray-100 text-gray-800',
      MEDIUM: 'bg-blue-100 text-blue-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const groupedTasks = {
    TODO: tasks?.filter((t) => t.status === 'TODO') || [],
    IN_PROGRESS: tasks?.filter((t) => t.status === 'IN_PROGRESS') || [],
    COMPLETED: tasks?.filter((t) => t.status === 'COMPLETED') || [],
    CANCELLED: tasks?.filter((t) => t.status === 'CANCELLED') || [],
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className={cn('cursor-pointer hover:shadow-md transition-shadow', {
      'opacity-50': task.status === 'CANCELLED',
    })}>
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {task.status === 'COMPLETED' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
                <h3 className="font-semibold text-sm">{task.title}</h3>
              </div>
            </div>
            <StatusBadge status={getTaskStatus(task.status)} label={task.priority} size="sm" />
          </div>

          {task.description && (
            <p className="text-caption line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              {task.dueDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingTask(task)}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteTaskMutation.mutate(task.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {task.assignedTo && (
            <div className="flex items-center gap-2 text-xs pt-2 border-t">
              <User className="w-3 h-3" />
              <span>{task.assignedTo.name}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const TaskListItem = ({ task }: { task: Task }) => (
    <Card className="mb-3">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            {task.status === 'COMPLETED' ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm">{task.title}</h3>
              <p className="text-xs text-muted-foreground">{task.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={getTaskStatus(task.status)} label={task.priority} size="sm" />
            <StatusBadge status={getTaskStatus(task.status)} label={task.status} size="sm" />
            {task.dueDate && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingTask(task)}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteTaskMutation.mutate(task.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="action-row">
        <div>
          <h1 className="text-page-title">Tasks</h1>
          <p className="text-caption mt-1">
            Manage your team's workflow and approvals
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus size={18} />
          New Task
        </Button>
      </div>

      {/* Filters */}
      <div className="filter-bar card-compact p-4">
        <div className="space-y-4">
          <div className="flex gap-3 flex-col md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
              <Tabs
                value={filters.view}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, view: value as 'kanban' | 'list' }))
                }
              >
                <TabsList>
                  <TabsTrigger value="kanban">Kanban</TabsTrigger>
                  <TabsTrigger value="list">List</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Priority Filter */}
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, priority: 'ALL' }))
                  }
                  className={filters.priority === 'ALL' ? 'filter-chip-active' : 'filter-chip'}
                >
                  All Priorities
                </button>
                {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, priority: p }))
                    }
                    className={filters.priority === p ? 'filter-chip-active' : 'filter-chip'}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

      {/* Tasks View */}
      {isLoading ? (
        <div className="text-center py-8">Loading tasks...</div>
      ) : filters.view === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const).map(
            (status) => (
              <div key={status} className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <Badge className={getStatusColor(status)}>
                    {status} ({groupedTasks[status].length})
                  </Badge>
                </div>
                <div className="space-y-3">
                  {groupedTasks[status].map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {tasks?.map((task) => (
            <TaskListItem key={task.id} task={task} />
          ))}
        </div>
      )}

      {/* Create Task Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task for your team
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="Task description (optional)"
                value={newTask.description}
                onChange={(e) =>
                  setNewTask((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Priority</label>
                <select
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      priority: e.target.value as Task['priority'],
                    }))
                  }
                >
                  <option>LOW</option>
                  <option>MEDIUM</option>
                  <option>HIGH</option>
                  <option>URGENT</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      dueDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createTaskMutation.mutate(newTask)}
              disabled={!newTask.title || createTaskMutation.isPending}
            >
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
