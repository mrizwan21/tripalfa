import React, { useState } from 'react';
import { Plus, Download, Save, Eye, Send } from '@tripalfa/ui-components/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/optics';
import { Button } from '@/components/optics';
import { Input } from '@/components/optics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/optics';
import { Badge } from '@/components/optics';
import { StatusBadge } from '@tripalfa/ui-components/optics';
import { cn } from '@tripalfa/shared-utils/utils';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  preview: string;
  content: string;
  status: 'draft' | 'published';
  createdAt: string;
  usageCount: number;
}

export function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [activeTab, setActiveTab] = useState('templates');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [tempSubject, setTempSubject] = useState('');
  const [tempContent, setTempContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const getTemplateStatusForBadge = (
    status: string
  ): 'primary' | 'info' | 'warning' | 'success' | 'default' => {
    const statusMap = {
      draft: 'warning' as const,
      published: 'success' as const,
    };
    return statusMap[status as keyof typeof statusMap] || 'default';
  };

  const templateVariables = [
    { name: 'First Name', value: '{{firstName}}' },
    { name: 'Last Name', value: '{{lastName}}' },
    { name: 'Email', value: '{{email}}' },
    { name: 'Booking ID', value: '{{bookingId}}' },
    { name: 'Total Bookings', value: '{{totalBookings}}' },
    { name: 'Unsubscribe Link', value: '{{unsubscribeLink}}' },
  ];

  const emailBlocks = [
    {
      name: 'Heading',
      content: '<h1 style="font-size: 24px; font-weight: bold;">Your heading here</h1>',
    },
    {
      name: 'Paragraph',
      content: '<p style="font-size: 14px; line-height: 1.6;">Your text here</p>',
    },
    {
      name: 'Button',
      content:
        '<a href="https://example.com" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Click here</a>',
    },
    {
      name: 'Divider',
      content: '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />',
    },
  ];

  const presetTemplates = [
    {
      name: 'Welcome Email',
      subject: 'Welcome to TripAlfa, {{firstName}}!',
      content: `<h1>Welcome!</h1>
<p>Hi {{firstName}},</p>
<p>Thanks for joining our travel platform. We're excited to help you book amazing trips.</p>
<p style="margin-top: 20px;"><a href="https://example.com" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Start Booking</a></p>`,
    },
    {
      name: 'Booking Confirmation',
      subject: 'Your booking {{bookingId}} is confirmed!',
      content: `<h1>Booking Confirmed</h1>
<p>Hi {{firstName}},</p>
<p>Your booking has been confirmed. Here are your details:</p>
<p><strong>Booking ID:</strong> {{bookingId}}</p>
<p><strong>View your booking:</strong> <a href="https://example.com/bookings/{{bookingId}}">Click here</a></p>`,
    },
    {
      name: 'Special Offer',
      subject: 'Exclusive 20% off for {{firstName}}',
      content: `<h1>Special Offer Just for You!</h1>
<p>Hi {{firstName}},</p>
<p>As one of our valued customers, we're giving you an exclusive 20% discount on your next booking.</p>
<p style="margin-top: 20px;"><a href="https://example.com" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Claim Your Offer</a></p>`,
    },
  ];

  const handleAddBlock = (block: { name: string; content: string }) => {
    setTempContent(tempContent + '\n' + block.content);
  };

  const handleAddVariable = (variable: { name: string; value: string }) => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = tempContent.substring(0, start);
      const after = tempContent.substring(end);
      setTempContent(before + variable.value + after);
    }
  };

  const handleLoadPreset = (preset: any) => {
    setTempName(preset.name);
    setTempSubject(preset.subject);
    setTempContent(preset.content);
  };

  const handleSaveTemplate = () => {
    if (!tempName || !tempSubject || !tempContent) {
      alert('Please fill in all fields');
      return;
    }

    const newTemplate: EmailTemplate = {
      id: editingId || Date.now().toString(),
      name: tempName,
      subject: tempSubject,
      preview: tempContent.substring(0, 80) + '...',
      content: tempContent,
      status: 'published',
      createdAt: new Date().toISOString(),
      usageCount: 0,
    };

    if (editingId) {
      setTemplates(templates.map(t => (t.id === editingId ? newTemplate : t)));
      setEditingId(null);
    } else {
      setTemplates([...templates, newTemplate]);
    }

    setTempName('');
    setTempSubject('');
    setTempContent('');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="action-row">
        <div>
          <h1 className="text-page-title">Email Templates</h1>
          <p className="text-caption mt-1">Create and manage reusable email templates</p>
        </div>
        <Button className="gap-2" onClick={() => setActiveTab('builder')}>
          <Plus size={18} />
          New Template
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="builder">Template Builder</TabsTrigger>
        </TabsList>

        {/* Templates List */}
        <TabsContent value="templates" className="space-y-4">
          {templates.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <p className="text-muted-foreground mb-4">No templates yet</p>
                <Button onClick={() => setActiveTab('builder')}>Create your first template</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {templates.map(template => (
                <Card key={template.id} className="hover:shadow-lg transition-all">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{template.name}</h3>
                          <StatusBadge
                            status={getTemplateStatusForBadge(template.status)}
                            label={template.status}
                            size="sm"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Subject: {template.subject}
                        </p>
                        <p className="text-sm line-clamp-2">{template.preview}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
                          <Eye size={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingId(template.id);
                            setTempName(template.name);
                            setTempSubject(template.subject);
                            setTempContent(template.content);
                            setActiveTab('builder');
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Template Builder */}
        <TabsContent value="builder" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main Editor */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Template Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Template Name</label>
                    <Input
                      placeholder="e.g., Welcome Email, Order Confirmation"
                      value={tempName}
                      onChange={e => setTempName(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Subject Line</label>
                    <Input
                      placeholder="e.g., Welcome {{firstName}}!"
                      value={tempSubject}
                      onChange={e => setTempSubject(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Email Content</CardTitle>
                    {showPreview && (
                      <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
                        Back to Editor
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {showPreview ? (
                    <div
                      className="border rounded-lg p-6 bg-white"
                      dangerouslySetInnerHTML={{ __html: tempContent }}
                    />
                  ) : (
                    <textarea
                      id="content-editor"
                      value={tempContent}
                      onChange={e => setTempContent(e.target.value)}
                      placeholder="Enter HTML email content..."
                      className="w-full h-64 p-4 border rounded-lg font-mono text-sm resize-none"
                    />
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button onClick={handleSaveTemplate} className="flex-1 gap-2">
                  <Save size={16} />
                  {editingId ? 'Update Template' : 'Save Template'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(!showPreview)}
                  className="gap-2"
                >
                  <Eye size={16} />
                  {showPreview ? 'Edit' : 'Preview'}
                </Button>
              </div>
            </div>

            {/* Sidebar Tools */}
            <div className="space-y-4">
              {/* Preset Templates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Preset Templates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {presetTemplates.map((preset, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="w-full justify-start text-left"
                      onClick={() => handleLoadPreset(preset)}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Email Blocks */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Email Blocks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {emailBlocks.map((block, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => handleAddBlock(block)}
                    >
                      + {block.name}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Variables */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Variables</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {templateVariables.map((variable, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start font-mono"
                      onClick={() => handleAddVariable(variable)}
                    >
                      {variable.value}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
