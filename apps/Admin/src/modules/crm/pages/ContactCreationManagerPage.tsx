import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../../shared/lib/api';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  Copy,
  Zap,
} from '@tripalfa/ui-components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/optics';
import { Button } from '@/components/optics';
import { Input } from '@/components/optics';
import { Badge } from '@/components/optics';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/optics';
import { StatusBadge } from '@tripalfa/ui-components/optics';
import { cn } from '@tripalfa/shared-utils/utils';

interface ContactForm {
  id: string;
  name: string;
  description?: string;
  fields: Array<{
    name: string;
    type: 'TEXT' | 'EMAIL' | 'PHONE' | 'SELECT';
    required: boolean;
  }>;
  triggers: Array<{
    type: 'ON_SUBMIT' | 'ON_SPECIFIC_VALUE' | 'ON_COMPANY_TYPE';
    action: 'ASSIGN_LEAD' | 'SEND_EMAIL' | 'TRIGGER_KYC' | 'CREATE_BOOKING';
  }>;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  conversions: number;
  kycAutoTrigger: boolean;
  createdAt: string;
}

export function ContactCreationManagerPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<ContactForm | null>(null);
  const [newForm, setNewForm] = useState({
    name: '',
    description: '',
    kycAutoTrigger: false,
  });

  const {
    data: forms,
    isLoading,
    refetch,
  } = useQuery<ContactForm[]>({
    queryKey: ['contact-forms'],
    queryFn: async () => {
      const response = await api.get('/crm/contact-forms');
      return response.data;
    },
  });

  const createFormMutation = useMutation({
    mutationFn: async (data: typeof newForm) => {
      const response = await api.post('/crm/contact-forms', data);
      return response.data;
    },
    onSuccess: () => {
      refetch();
      setIsCreateOpen(false);
      setNewForm({ name: '', description: '', kycAutoTrigger: false });
    },
  });

  const deleteFormMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/crm/contact-forms/${id}`);
    },
    onSuccess: () => refetch(),
  });

  const toggleKYCTrigger = useMutation({
    mutationFn: async (formId: string) => {
      const response = await api.patch(`/crm/contact-forms/${formId}/kyc-trigger`, {
        enable: true,
      });
      return response.data;
    },
    onSuccess: () => refetch(),
  });

  const activeForms = forms?.filter(f => f.status === 'ACTIVE') || [];
  const draftForms = forms?.filter(f => f.status === 'DRAFT') || [];
  const totalConversions = forms?.reduce((sum, f) => sum + f.conversions, 0) || 0;

  return (
    <div className="space-y-5">
      <div className="action-row">
        <div>
          <h1 className="text-page-title">Lead Capture Forms</h1>
          <p className="text-caption mt-1">Create custom forms with auto-KYC triggering</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus size={18} />
          Create Form
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">Active Forms</p>
            <p className="text-2xl font-bold text-blue-900 mt-2">{activeForms.length}</p>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <p className="text-sm text-purple-900">Total Conversions</p>
            <p className="text-2xl font-bold text-purple-900 mt-2">{totalConversions}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-sm text-green-900">KYC Auto-Triggered</p>
            <p className="text-2xl font-bold text-green-900 mt-2">
              {forms?.filter(f => f.kycAutoTrigger).length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active ({activeForms.length})</TabsTrigger>
          <TabsTrigger value="draft">Drafts ({draftForms.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-4">
          {activeForms.length === 0 ? (
            <Card className="text-center">
              <CardContent className="pt-12 pb-12">
                <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground">No active forms</p>
              </CardContent>
            </Card>
          ) : (
            activeForms.map(form => (
              <Card key={form.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{form.name}</h3>
                        {form.kycAutoTrigger && (
                          <Badge className="bg-green-100 text-green-800">
                            <Zap size={12} className="mr-1" />
                            KYC Auto-Trigger
                          </Badge>
                        )}
                      </div>
                      {form.description && (
                        <p className="text-sm text-muted-foreground mt-2">{form.description}</p>
                      )}
                      <div className="flex gap-4 mt-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Fields</p>
                          <p className="font-semibold">{form.fields.length}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Conversions</p>
                          <p className="font-semibold">{form.conversions}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye size={16} className="mr-1" />
                        Preview
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteFormMutation.mutate(form.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="draft" className="space-y-4 mt-4">
          {draftForms.length === 0 ? (
            <Card className="text-center">
              <CardContent className="pt-12 pb-12">
                <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground">No draft forms</p>
              </CardContent>
            </Card>
          ) : (
            draftForms.map(form => (
              <Card key={form.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{form.name}</h3>
                      {form.description && (
                        <p className="text-sm text-muted-foreground mt-2">{form.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="default">
                        Publish
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit2 size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Form</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Form Name</label>
              <Input
                placeholder="e.g., Partner Application, Booking Inquiry"
                value={newForm.name}
                onChange={e => setNewForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Optional description"
                value={newForm.description}
                onChange={e => setNewForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2 p-3 border rounded-lg bg-green-50">
              <input
                type="checkbox"
                id="kycTrigger"
                checked={newForm.kycAutoTrigger}
                onChange={e => setNewForm(prev => ({ ...prev, kycAutoTrigger: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="kycTrigger" className="text-sm font-medium cursor-pointer">
                Auto-trigger KYC workflow on submission
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => createFormMutation.mutate(newForm)}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Tab components
function Tabs({ defaultValue, children, className }: any) {
  const [activeTab, setActiveTab] = React.useState(defaultValue);
  return (
    <div className={className}>
      {React.Children.map(children, child =>
        React.cloneElement(child, { activeTab, setActiveTab } as any)
      )}
    </div>
  );
}

function TabsList({ children, className }: any) {
  return <div className={`flex border-b ${className}`}>{children}</div>;
}

function TabsTrigger({ value, children, activeTab, setActiveTab }: any) {
  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`px-4 py-2 font-medium border-b-2 ${
        activeTab === value
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function TabsContent({ value, children, activeTab }: any) {
  return activeTab === value ? <div>{children}</div> : null;
}
