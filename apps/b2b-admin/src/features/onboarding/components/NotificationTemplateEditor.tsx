/**
 * Notification Template Editor Component
 * Create and edit notification templates for onboarding events
 */

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import type { NotificationTemplate } from '@/hooks/useOnboardingManagement';

interface NotificationTemplateEditorProps {
  templates: NotificationTemplate[];
  onCreateTemplate: (template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateTemplate: (id: string, template: Partial<NotificationTemplate>) => void;
  onDeleteTemplate: (id: string) => void;
}

const EVENT_TYPES = {
  supplier_onboarding: ['supplier_registered', 'wallet_assigned', 'wallet_activated'],
  customer_onboarding: ['customer_registered', 'profile_completed', 'account_verified', 'payment_method_added'],
};

const CHANNEL_LABELS = {
  email: '📧 Email',
  sms: '💬 SMS',
  in_app: '🔔 In-App',
};

type FormData = {
  name: string;
  type: 'supplier_onboarding' | 'customer_onboarding';
  eventType: string;
  subject: string;
  channels: ('email' | 'sms' | 'in_app')[];
  templateContent: {
    email?: string;
    sms?: string;
    in_app?: string;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
};

export function NotificationTemplateEditor({
  templates,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
}: NotificationTemplateEditorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'supplier_onboarding' | 'customer_onboarding'>('all');

  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: 'supplier_onboarding',
    eventType: '',
    subject: '',
    channels: ['email'],
    templateContent: { email: '', sms: '', in_app: '' },
    priority: 'medium',
  });

  const filteredTemplates = templates.filter((t) => filterType === 'all' || t.type === filterType);

  const handleCreateClick = () => {
    setFormData({
      name: '',
      type: 'supplier_onboarding',
      eventType: EVENT_TYPES.supplier_onboarding[0],
      subject: '',
      channels: ['email'],
      templateContent: { email: '', sms: '', in_app: '' },
      priority: 'medium',
    });
    setIsCreating(true);
  };

  const handleEditClick = (template: NotificationTemplate) => {
    setFormData({
      name: template.name,
      type: template.type,
      eventType: template.eventType,
      subject: template.subject,
      channels: template.channels,
      templateContent: template.templateContent,
      priority: template.priority,
    });
    setEditingId(template.id);
  };

  const handleSave = () => {
    if (!formData.name || !formData.subject) {
      alert('Please fill in all required fields');
      return;
    }

    const templateData = {
      ...formData,
      variables: extractVariables(formData.templateContent),
      isActive: true,
    };

    if (isCreating) {
      onCreateTemplate(templateData);
      setIsCreating(false);
    } else if (editingId) {
      onUpdateTemplate(editingId, templateData);
      setEditingId(null);
    }
  };

  const extractVariables = (content: Record<string, string>) => {
    const variablePattern = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    Object.values(content).forEach((text) => {
      if (text) {
        const matches = text.matchAll(variablePattern);
        for (const match of matches) {
          variables.add(match[1]);
        }
      }
    });
    return Array.from(variables);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">Notification Templates</h2>
        <Button onClick={handleCreateClick} className="bg-primary-600 hover:bg-primary-700">
          <Plus size={18} className="mr-2" />
          Create Template
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'supplier_onboarding', 'customer_onboarding'] as const).map((type) => (
          <Button
            key={type}
            variant={filterType === type ? 'default' : 'outline'}
            onClick={() => setFilterType(type)}
            className="text-sm"
          >
            {type === 'all' ? 'All Templates' : type === 'supplier_onboarding' ? 'Supplier' : 'Customer'}
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-secondary-900 dark:text-white">{template.name}</h3>
                  <p className="text-sm text-secondary-500 mt-1">{template.subject}</p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="outline" className="text-xs">
                      {template.type === 'supplier_onboarding' ? '🏢 Supplier' : '👤 Customer'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {template.eventType}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        template.priority === 'high' || template.priority === 'urgent'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-yellow-50 text-yellow-700'
                      }`}
                    >
                      {template.priority.toUpperCase()}
                    </Badge>
                    {template.isActive && (
                      <Badge className="text-xs bg-green-100 text-green-700">
                        <Check size={12} className="mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2 mt-3">
                    {template.channels.map((channel) => (
                      <span key={channel} className="text-xs bg-secondary-100 dark:bg-secondary-800 px-2 py-1 rounded">
                        {CHANNEL_LABELS[channel]}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPreviewId(template.id)}
                    className="text-xs"
                  >
                    <Eye size={14} className="mr-1" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditClick(template)}
                    className="text-xs"
                  >
                    <Edit2 size={14} className="mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDeleteTemplate(template.id)}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {(isCreating || editingId) && (
        <Modal
          isOpen={isCreating || !!editingId}
          onClose={() => {
            setIsCreating(false);
            setEditingId(null);
          }}
          title={isCreating ? 'Create Template' : 'Edit Template'}
        >
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <label className="block text-sm font-bold mb-2">Template Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Supplier Registration Welcome"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => {
                  const type = e.target.value as any;
                  const events = EVENT_TYPES[type];
                  setFormData({
                    ...formData,
                    type,
                    eventType: events[0],
                  });
                }}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg"
              >
                <option value="supplier_onboarding">Supplier Onboarding</option>
                <option value="customer_onboarding">Customer Onboarding</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Event Type *</label>
              <select
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg"
              >
                {EVENT_TYPES[formData.type].map((event) => (
                  <option key={event} value={event}>
                    {event}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Subject Line *</label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., Welcome to TripAlfa"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Channels</label>
              <div className="flex gap-4">
                {['email', 'sms', 'in_app'].map((channel) => (
                  <label key={channel} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.channels.includes(channel as any)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            channels: [...formData.channels, channel as any],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            channels: formData.channels.filter((c) => c !== channel),
                          });
                        }
                      }}
                    />
                    <span className="text-sm">{CHANNEL_LABELS[channel as keyof typeof CHANNEL_LABELS]}</span>
                  </label>
                ))}
              </div>
            </div>

            {formData.channels.includes('email') && (
              <div>
                <label className="block text-sm font-bold mb-2">Email Template</label>
                <textarea
                  value={formData.templateContent.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      templateContent: { ...formData.templateContent, email: e.target.value },
                    })
                  }
                  placeholder="Use {{variable}} for dynamic content"
                  rows={4}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg"
                />
              </div>
            )}

            {formData.channels.includes('sms') && (
              <div>
                <label className="block text-sm font-bold mb-2">SMS Template (160 chars)</label>
                <textarea
                  value={formData.templateContent.sms}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      templateContent: { ...formData.templateContent, sms: e.target.value },
                    })
                  }
                  placeholder="Use {{variable}} for dynamic content"
                  rows={3}
                  maxLength={160}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg"
                />
                <p className="text-xs text-secondary-500 mt-1">{(formData.templateContent.sms || '').length}/160</p>
              </div>
            )}

            {formData.channels.includes('in_app') && (
              <div>
                <label className="block text-sm font-bold mb-2">In-App Template</label>
                <textarea
                  value={formData.templateContent.in_app}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      templateContent: { ...formData.templateContent, in_app: e.target.value },
                    })
                  }
                  placeholder="Use {{variable}} for dynamic content"
                  rows={4}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg"
                />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} className="bg-primary-600 hover:bg-primary-700 flex-1">
                {isCreating ? 'Create' : 'Update'} Template
              </Button>
              <Button
                onClick={() => {
                  setIsCreating(false);
                  setEditingId(null);
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Preview Modal */}
      {previewId && (
        <Modal
          isOpen={!!previewId}
          onClose={() => setPreviewId(null)}
          title="Template Preview"
        >
          {templates.find((t) => t.id === previewId) && (
            <div className="space-y-4">
              {templates.find((t) => t.id === previewId)!.channels.map((channel) => (
                <div key={channel} className="border-t pt-4">
                  <h3 className="font-bold mb-2">{CHANNEL_LABELS[channel]}</h3>
                  <div className="bg-secondary-50 dark:bg-secondary-900 p-4 rounded-lg text-sm whitespace-pre-wrap">
                    {templates.find((t) => t.id === previewId)!.templateContent[channel]}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
