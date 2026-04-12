import React, { useState } from 'react';
import { Save, Mail, Database, Shield } from '@tripalfa/ui-components/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/optics';
import { Button } from '@/components/optics';
import { Input } from '@/components/optics';
import { Label } from '@/components/optics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/optics';
import { Alert } from '@/components/optics';
import { Badge } from '@/components/optics';
import { StatusBadge } from '@tripalfa/ui-components/optics';
import { cn } from '@tripalfa/shared-utils/utils';

export function SettingsPage() {
  const [notificationSettings, setNotificationSettings] = useState({
    emailOnNewContact: true,
    emailOnActivityCreated: true,
    emailOnCampaignLaunch: true,
    emailOnHotLeadDetected: true,
  });

  const [campaignDefaults, setCampaignDefaults] = useState({
    defaultSenderName: 'TripAlfa',
    defaultFromEmail: 'campaigns@tripalfa.com',
    defaultReplyTo: 'support@tripalfa.com',
    unsubscribeEnabled: true,
  });

  const [dataSettings, setDataSettings] = useState({
    autoArchiveInactiveMonths: 12,
    deleteArchivedMonths: 24,
    dataRetention: 'compliant',
  });

  const handleSaveNotifications = () => {
    console.log('Saving notification settings:', notificationSettings);
    alert('Notification preferences saved successfully!');
  };

  const handleSaveCampaignDefaults = () => {
    console.log('Saving campaign defaults:', campaignDefaults);
    alert('Campaign defaults saved successfully!');
  };

  const handleSaveDataSettings = () => {
    console.log('Saving data settings:', dataSettings);
    alert('Data retention settings saved successfully!');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="action-row">
        <h1 className="text-page-title">CRM Settings</h1>
        <p className="text-caption mt-1">
          Configure CRM preferences, notifications, and data management
        </p>
      </div>

      {/* Alert */}
      <Alert
        type="info"
        title="CRM System Active"
        message="Your CRM is fully configured and ready to use. All contacts, activities, and campaigns are being tracked and stored securely."
      />

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications" className="gap-2">
            <Mail size={16} />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-2">
            <Mail size={16} />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <Database size={16} />
            Data
          </TabsTrigger>
        </TabsList>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Choose which CRM events trigger email notifications to your team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">New Contact Created</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when a new contact is added
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailOnNewContact}
                    onChange={e =>
                      setNotificationSettings({
                        ...notificationSettings,
                        emailOnNewContact: e.target.checked,
                      })
                    }
                    className="w-5 h-5"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Activity Created</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when activities are logged
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailOnActivityCreated}
                    onChange={e =>
                      setNotificationSettings({
                        ...notificationSettings,
                        emailOnActivityCreated: e.target.checked,
                      })
                    }
                    className="w-5 h-5"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Campaign Launched</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when campaigns are sent
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailOnCampaignLaunch}
                    onChange={e =>
                      setNotificationSettings({
                        ...notificationSettings,
                        emailOnCampaignLaunch: e.target.checked,
                      })
                    }
                    className="w-5 h-5"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Hot Lead Detected</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when a hot lead is identified
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailOnHotLeadDetected}
                    onChange={e =>
                      setNotificationSettings({
                        ...notificationSettings,
                        emailOnHotLeadDetected: e.target.checked,
                      })
                    }
                    className="w-5 h-5"
                  />
                </div>
              </div>

              <Button onClick={handleSaveNotifications} className="gap-2">
                <Save size={16} />
                Save Notification Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaign Settings */}
        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Default Settings</CardTitle>
              <CardDescription>Configure default values for new email campaigns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="senderName">Default Sender Name</Label>
                  <Input
                    id="senderName"
                    value={campaignDefaults.defaultSenderName}
                    onChange={e =>
                      setCampaignDefaults({
                        ...campaignDefaults,
                        defaultSenderName: e.target.value,
                      })
                    }
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The name that appears in recipients' inbox
                  </p>
                </div>

                <div>
                  <Label htmlFor="fromEmail">Default From Email</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={campaignDefaults.defaultFromEmail}
                    onChange={e =>
                      setCampaignDefaults({
                        ...campaignDefaults,
                        defaultFromEmail: e.target.value,
                      })
                    }
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Must be a verified sending address
                  </p>
                </div>

                <div>
                  <Label htmlFor="replyTo">Default Reply-To Email</Label>
                  <Input
                    id="replyTo"
                    type="email"
                    value={campaignDefaults.defaultReplyTo}
                    onChange={e =>
                      setCampaignDefaults({
                        ...campaignDefaults,
                        defaultReplyTo: e.target.value,
                      })
                    }
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Where recipients' replies are sent
                  </p>
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={campaignDefaults.unsubscribeEnabled}
                      onChange={e =>
                        setCampaignDefaults({
                          ...campaignDefaults,
                          unsubscribeEnabled: e.target.checked,
                        })
                      }
                    />
                    <span>Enable Unsubscribe Link</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add unsubscribe link to campaigns for compliance
                  </p>
                </div>
              </div>

              <Button onClick={handleSaveCampaignDefaults} className="gap-2">
                <Save size={16} />
                Save Campaign Defaults
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Settings */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Retention &amp; Privacy</CardTitle>
              <CardDescription>
                Manage data retention policies and compliance settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert
                type="info"
                title="GDPR Compliance"
                message="Your CRM follows GDPR guidelines for data retention and user privacy. Data is encrypted and securely stored."
              />

              <div className="space-y-4">
                <div>
                  <Label htmlFor="archiveMonths">Auto-Archive Inactive Contacts After</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="archiveMonths"
                      type="number"
                      min="1"
                      max="24"
                      value={dataSettings.autoArchiveInactiveMonths}
                      onChange={e =>
                        setDataSettings({
                          ...dataSettings,
                          autoArchiveInactiveMonths: parseInt(e.target.value),
                        })
                      }
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground self-center">
                      months of inactivity
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Contacts with no interactions for this period will be marked inactive
                  </p>
                </div>

                <div>
                  <Label htmlFor="deleteMonths">Permanently Delete Archived Data After</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="deleteMonths"
                      type="number"
                      min="1"
                      max="60"
                      value={dataSettings.deleteArchivedMonths}
                      onChange={e =>
                        setDataSettings({
                          ...dataSettings,
                          deleteArchivedMonths: parseInt(e.target.value),
                        })
                      }
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground self-center">
                      months after archiving
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Archived data will be permanently deleted after this period (irreversible)
                  </p>
                </div>

                <div>
                  <Label>Data Retention Policy</Label>
                  <Badge className="mt-2">{dataSettings.dataRetention}</Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    Your account is set to <strong>GDPR compliant</strong> retention policy
                  </p>
                </div>
              </div>

              <Button onClick={handleSaveDataSettings} className="gap-2">
                <Save size={16} />
                Save Data Settings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Export &amp; Backup</CardTitle>
              <CardDescription>Export or backup your CRM data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You can export all your contacts, activities, and campaigns for backup or analysis
                purposes.
              </p>
              <div className="flex gap-2">
                <Button variant="outline">Export as CSV</Button>
                <Button variant="outline">Export as JSON</Button>
                <Button variant="outline">Request Data Backup</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
