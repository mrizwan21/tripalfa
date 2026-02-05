import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Twitter, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Youtube, 
  Globe, 
  Save, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle,
  Shield,
  Lock,
  Calendar,
  Clock,
  Users,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { useMarketingPermissions } from '@/hooks/useMarketingPermissions';
import PermissionGuard, { PermissionButton, PermissionStatus } from '@/components/PermissionGuard';

const socialMediaSchema = z.object({
  platforms: z.array(z.object({
    name: z.enum(['twitter', 'facebook', 'instagram', 'linkedin', 'youtube']),
    enabled: z.boolean(),
    username: z.string().min(1, "Username is required"),
    url: z.string().url("Must be a valid URL"),
    apiKey: z.string().optional(),
    lastPostDate: z.string().optional(),
    followers: z.number().optional(),
    engagementRate: z.number().optional()
  })),
  autoPostEnabled: z.boolean(),
  postSchedule: z.object({
    enabled: z.boolean(),
    days: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])),
    time: z.string(),
    timezone: z.string()
  }),
  contentApproval: z.object({
    enabled: z.boolean(),
    requiredApprovals: z.number().min(1).max(5),
    approvers: z.array(z.string())
  }),
  analyticsEnabled: z.boolean(),
  crossPostEnabled: z.boolean()
});

type SocialMediaFormValues = z.infer<typeof socialMediaSchema>;

const platformIcons = {
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube
};

const platformNames = {
  twitter: 'Twitter / X',
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  youtube: 'YouTube'
};

const SocialMediaManagement: React.FC = () => {
  const { 
    hasPermission,
    isLoading: permissionsLoading 
  } = useMarketingPermissions();

  const [activeTab, setActiveTab] = useState<'settings' | 'analytics' | 'schedule'>('settings');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const form = useForm<SocialMediaFormValues>({
    resolver: zodResolver(socialMediaSchema),
    defaultValues: {
      platforms: [
        { name: 'twitter', enabled: true, username: '@tripalfa', url: 'https://twitter.com/tripalfa', followers: 1500, engagementRate: 3.2 },
        { name: 'facebook', enabled: true, username: 'TripAlfa', url: 'https://facebook.com/tripalfa', followers: 2500, engagementRate: 2.8 },
        { name: 'instagram', enabled: false, username: '', url: '', followers: 0, engagementRate: 0 },
        { name: 'linkedin', enabled: true, username: 'TripAlfa', url: 'https://linkedin.com/company/tripalfa', followers: 800, engagementRate: 4.1 },
        { name: 'youtube', enabled: false, username: '', url: '', followers: 0, engagementRate: 0 }
      ],
      autoPostEnabled: false,
      postSchedule: {
        enabled: false,
        days: ['monday', 'wednesday', 'friday'],
        time: '10:00',
        timezone: 'UTC'
      },
      contentApproval: {
        enabled: true,
        requiredApprovals: 2,
        approvers: ['john.doe@tripalfa.com', 'jane.smith@tripalfa.com']
      },
      analyticsEnabled: true,
      crossPostEnabled: false
    }
  });

  const onSubmit = async (values: SocialMediaFormValues) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Social media settings saved successfully!", {
        icon: <CheckCircle className="h-4 w-4 text-green-600" />
      });
    } catch (error) {
      toast.error("Failed to save social media settings", {
        icon: <AlertCircle className="h-4 w-4 text-red-600" /> }); } }; const handlePlatformToggle = (platformName: string, enabled: boolean) => { const platforms = form.getValues('platforms'); const updatedPlatforms = platforms.map(platform => platform.name === platformName ? { ...platform, enabled } : platform ); form.setValue('platforms', updatedPlatforms); }; const getPlatformStats = (platform: any) => { if (!platform.followers) return 'Not connected'; return `${platform.followers.toLocaleString()} followers • ${platform.engagementRate}% engagement`; }; const getScheduleSummary = () => { const schedule = form.getValues('postSchedule'); if (!schedule.enabled) return 'Scheduling disabled'; const days = schedule.days.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', '); return `${days} at ${schedule.time} ${schedule.timezone}`; }; if (permissionsLoading) { return ( <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading social media settings...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permission="marketing:social_media:social_media_settings:view">
      <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">Social Media Management</h2>
            <p className="text-gray-500 mt-2 font-medium">Manage your social media presence and engagement.</p>
          </div>
          <div className="flex items-center gap-4">
            <PermissionStatus permission="marketing:social_media:social_media_settings:view" label="View Access" />
            <PermissionStatus permission="marketing:social_media:social_media_settings:update" label="Edit Access" />
            <PermissionStatus permission="marketing:social_media:posts:manage" label="Post Management" />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'settings', label: 'Settings', icon: Globe },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'schedule', label: 'Schedule', icon: Calendar }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Platform Configuration */}
            <Card className="lg:col-span-2 border-none shadow-lg bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-900 font-bold">Platform Configuration</CardTitle>
                    <CardDescription>Configure your social media platform connections</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {form.getValues('platforms').map((platform, index) => {
                        const Icon = platformIcons[platform.name];
                        return (
                          <Card key={platform.name} className="border border-gray-200 hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                                platform.enabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                              }`}>
                                {React.createElement(Icon, { className: "h-5 w-5" })}
                              </div>
                                  <div>
                                    <h4 className="font-bold text-gray-900">{platformNames[platform.name]}</h4>
                                    <p className="text-sm text-gray-500">{getPlatformStats(platform)}</p>
                                  </div>
                                </div>
                                <Switch
                                  checked={platform.enabled}
                                  onCheckedChange={(checked) => handlePlatformToggle(platform.name, checked)}
                                />
                              </div>

                              {platform.enabled && (
                                <div className="space-y-3">
                                  <FormField
                                    control={form.control}
                                    name={`platforms.${index}.username`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="font-bold">Username/Handle</FormLabel>
                                        <FormControl>
                                          <Input placeholder="Enter username..." {...field} className="h-10 bg-white" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name={`platforms.${index}.url`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="font-bold">Profile URL</FormLabel>
                                        <FormControl>
                                          <Input placeholder="https://..." {...field} className="h-10 bg-white" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name={`platforms.${index}.apiKey`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="font-bold">API Key (Optional)</FormLabel>
                                        <FormControl>
                                          <Input type="password" placeholder="Enter API key..." {...field} className="h-10 bg-white" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Advanced Settings */}
                    <div className="border-t border-gray-100 pt-6">
                      <h3 className="font-bold text-gray-900 mb-4">Advanced Settings</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="analyticsEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-col space-y-3">
                              <FormLabel className="font-bold">Enable Analytics</FormLabel>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                                <Label>{field.value ? 'Enabled' : 'Disabled'}</Label>
                              </div>
                              <p className="text-xs text-gray-500">Track engagement and performance metrics</p>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="crossPostEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-col space-y-3">
                              <FormLabel className="font-bold">Cross-Posting</FormLabel>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                                <Label>{field.value ? 'Enabled' : 'Disabled'}</Label>
                              </div>
                              <p className="text-xs text-gray-500">Post content across multiple platforms</p>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="border-t border-gray-100 pt-6 flex justify-between items-center">
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          onClick={() => form.reset()}
                          variant="outline"
                          className="border-gray-200 text-gray-600 hover:bg-gray-50"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reset
                        </Button>
                      </div>
                      
                      <PermissionButton
                        permission="marketing:social_media:social_media_settings:update"
                        type="submit"
                        className="bg-primary hover:bg-primary/90 text-white font-bold px-6"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Settings
                      </PermissionButton>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Platform Overview */}
            <Card className="border-none shadow-lg bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-900 font-bold">Platform Overview</CardTitle>
                    <CardDescription>Summary of your social media presence</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {form.getValues('platforms').map((platform) => (
                    platform.enabled && (
                      <div key={platform.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                {React.createElement(platformIcons[platform.name], { className: "h-4 w-4" })}
                              </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{platformNames[platform.name]}</h4>
                            <p className="text-sm text-gray-500">@{platform.username}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{platform.followers?.toLocaleString() || 0}</p>
                          <p className="text-xs text-gray-500">followers</p>
                        </div>
                      </div>
                    )
                  ))}
                  
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Total Followers</span>
                      <span className="text-lg font-bold text-gray-900">
                        {form.getValues('platforms')
                          .filter(p => p.enabled)
                          .reduce((total, p) => total + (p.followers || 0), 0)
                          .toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm font-medium text-gray-700">Avg. Engagement</span>
                      <span className="text-lg font-bold text-gray-900">
                        {(
                          form.getValues('platforms')
                            .filter(p => p.enabled && p.engagementRate)
                            .reduce((total, p) => total + (p.engagementRate || 0), 0) / 
                          Math.max(1, form.getValues('platforms').filter(p => p.enabled && p.engagementRate).length)
                        ).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'analytics' && (
          <PermissionGuard permission="marketing:social_media:analytics:view">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Engagement Metrics */}
              <Card className="lg:col-span-2 border-none shadow-lg bg-white rounded-3xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-900 font-bold">Engagement Analytics</CardTitle>
                      <CardDescription>Track your social media performance metrics</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {form.getValues('platforms').map((platform) => {
                      if (!platform.enabled) return null;
                      const Icon = (platformIcons as any)[platform.name] as React.ComponentType<any> | undefined;

                      return (
                        <Card key={platform.name} className="border border-gray-200">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                  {Icon ? <Icon className="h-4 w-4" /> : null}
                                </div>
                                <div>
                                  <h4 className="font-bold text-gray-900">{(platformNames as any)[platform.name]}</h4>
                                  <p className="text-sm text-gray-500">@{platform.username}</p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Followers</span>
                                <span className="font-medium">{platform.followers?.toLocaleString() || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Engagement Rate</span>
                                <span className="font-medium text-green-600">{platform.engagementRate || 0}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Last Post</span>
                                <span className="text-sm text-gray-500">{platform.lastPostDate || 'Never'}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Analytics Controls */}
              <Card className="border-none shadow-lg bg-white rounded-3xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                      <Eye className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-900 font-bold">Analytics Controls</CardTitle>
                      <CardDescription>Manage your analytics settings</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="analyticsEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-col space-y-3">
                            <FormLabel className="font-bold">Analytics Collection</FormLabel>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                              <Label>{field.value ? 'Active' : 'Paused'}</Label>
                            </div>
                            <p className="text-xs text-gray-500">Enable/disable data collection and reporting</p>
                          </FormItem>
                        )}
                      />

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-bold text-gray-900 mb-2">Data Points Collected</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Follower counts</li>
                          <li>• Engagement rates</li>
                          <li>• Post performance</li>
                          <li>• Best posting times</li>
                          <li>• Audience demographics</li>
                        </ul>
                      </div>

                      <PermissionButton
                        permission="marketing:social_media:analytics:update"
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Update Analytics Settings
                      </PermissionButton>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </PermissionGuard>
        )}

        {activeTab === 'schedule' && (
          <PermissionGuard permission="marketing:social_media:scheduling:manage">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Post Scheduling */}
              <Card className="lg:col-span-2 border-none shadow-lg bg-white rounded-3xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-900 font-bold">Post Scheduling</CardTitle>
                      <CardDescription>Automate your social media posting schedule</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="autoPostEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-col space-y-3">
                              <FormLabel className="font-bold">Auto-Posting</FormLabel>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                                <Label>{field.value ? 'Enabled' : 'Disabled'}</Label>
                              </div>
                              <p className="text-xs text-gray-500">Automatically post content based on schedule</p>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="postSchedule.enabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-col space-y-3">
                              <FormLabel className="font-bold">Schedule Enabled</FormLabel>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                                <Label>{field.value ? 'Active' : 'Inactive'}</Label>
                              </div>
                              <p className="text-xs text-gray-500">Enable/disable the posting schedule</p>
                            </FormItem>
                          )}
                        />
                      </div>

                      {form.watch('postSchedule.enabled') && (
                        <div className="border-t border-gray-100 pt-6">
                          <h4 className="font-bold text-gray-900 mb-4">Schedule Configuration</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="postSchedule.days"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="font-bold">Posting Days</FormLabel>
                                  <div className="grid grid-cols-2 gap-2">
                                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                                      <label key={day} className="flex items-center space-x-2 text-sm">
                                        <input
                                          type="checkbox"
                                          checked={field.value?.includes(day as any)}
                                          onChange={(e) => {
                                            const currentDays = field.value || [];
                                            if (e.target.checked) {
                                              field.onChange([...currentDays, day]);
                                            } else {
                                              field.onChange(currentDays.filter(d => d !== day));
                                            }
                                          }}
                                          className="rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <span className="capitalize">{day}</span>
                                      </label>
                                    ))}
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="space-y-4">
                              <FormField
                                control={form.control}
                                name="postSchedule.time"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="font-bold">Posting Time</FormLabel>
                                    <FormControl>
                                      <Input type="time" {...field} className="h-10 bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="postSchedule.timezone"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="font-bold">Timezone</FormLabel>
                                    <FormControl>
                                      <select {...field} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm">
                                        <option value="UTC">UTC</option>
                                        <option value="EST">EST</option>
                                        <option value="PST">PST</option>
                                        <option value="CST">CST</option>
                                      </select>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Content Approval Settings */}
                      <div className="border-t border-gray-100 pt-6">
                        <h4 className="font-bold text-gray-900 mb-4">Content Approval</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <FormField
                            control={form.control}
                            name="contentApproval.enabled"
                            render={({ field }) => (
                              <FormItem className="flex flex-col space-y-3">
                                <FormLabel className="font-bold">Approval Required</FormLabel>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                  <Label>{field.value ? 'Yes' : 'No'}</Label>
                                </div>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="contentApproval.requiredApprovals"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-bold">Required Approvals</FormLabel>
                                <FormControl>
                                  <select {...field} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm">
                                    {[1, 2, 3, 4, 5].map(num => (
                                      <option key={num} value={num}>{num}</option>
                                    ))}
                                  </select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="contentApproval.approvers"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-bold">Approvers</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Enter approver emails..." 
                                    {...field} 
                                    className="min-h-[80px] bg-white"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="border-t border-gray-100 pt-6 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          Current Schedule: {getScheduleSummary()}
                        </div>
                        
                        <PermissionButton
                          permission="marketing:social_media:scheduling:update"
                          type="submit"
                          className="bg-primary hover:bg-primary/90 text-white font-bold px-6"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Schedule
                        </PermissionButton>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Schedule Preview */}
              <Card className="border-none shadow-lg bg-white rounded-3xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-900 font-bold">Schedule Preview</CardTitle>
                      <CardDescription>Upcoming posts and schedule overview</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 mb-2">Next Scheduled Posts</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Monday, 10:00 AM</span>
                          <span className="font-medium">Twitter & Facebook</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Wednesday, 2:00 PM</span>
                          <span className="font-medium">LinkedIn</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Friday, 4:00 PM</span>
                          <span className="font-medium">Instagram</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-bold text-blue-900 mb-2">Schedule Status</h4>
                      <div className="flex items-center gap-2 text-blue-700">
                        <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">
                          {form.watch('autoPostEnabled') ? 'Auto-posting enabled' : 'Manual posting only'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-bold text-green-900 mb-2">Content Approval</h4>
                      <div className="text-green-700 text-sm">
                        {form.watch('contentApproval.enabled') 
                          ? `${form.watch('contentApproval.requiredApprovals')} approvers required`
                          : 'No approval required'
                        }
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </PermissionGuard>
        )}
      </div>
    </PermissionGuard>
  );
};

export default SocialMediaManagement;