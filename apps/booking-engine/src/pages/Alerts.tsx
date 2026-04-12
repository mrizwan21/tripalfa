import React, { useEffect, useState, useMemo } from 'react';
import {
  Bell,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  Search,
  Filter,
  Plus,
  Minus,
  Settings,
  Mail,
  MessageSquare,
  Phone,
  Eye,
  Plane,
  Building2 as Building,
  Car,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { cn } from '@tripalfa/ui-components';
import PageHeader from '../components/layout/PageHeader';
import { DEFAULT_CONTENT_CONFIG, loadTenantContentConfig } from '../lib/tenantContentConfig';
import type { TenantContentConfig } from '@tripalfa/shared-types';

// Types
interface Alert {
  id: string;
  type: 'price_drop' | 'price_increase' | 'booking_status' | 'reminder' | 'promotion' | 'system';
  title: string;
  message: string;
  productType: 'flight' | 'hotel' | 'car' | 'all';
  status: 'active' | 'paused' | 'triggered' | 'expired';
  createdAt: string;
  triggeredAt?: string;
  expiresAt?: string;
  criteria?: {
    origin?: string;
    destination?: string;
    maxPrice?: number;
    minPrice?: number;
  };
}

interface AlertSubscription {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  channels: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  category: 'price' | 'booking' | 'reminder' | 'promotion' | 'system';
}

function normalizeCategory(category: string): AlertSubscription['category'] {
  if (
    category === 'price' ||
    category === 'booking' ||
    category === 'reminder' ||
    category === 'promotion' ||
    category === 'system'
  ) {
    return category;
  }
  return 'system';
}

function getSubscriptionIcon(category: AlertSubscription['category']): React.ReactNode {
  switch (category) {
    case 'price':
      return <TrendingDown className="w-5 h-5 text-green-600" />;
    case 'booking':
      return <CheckCircle2 className="w-5 h-5 text-blue-600" />;
    case 'reminder':
      return <Calendar className="w-5 h-5 text-purple-600" />;
    case 'promotion':
      return <DollarSign className="w-5 h-5 text-amber-600" />;
    case 'system':
    default:
      return <Bell className="w-5 h-5 text-muted-foreground" />;
  }
}

function toAlertSubscription(contentSubscription: {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  channels: { email: boolean; push: boolean; sms: boolean };
  category: string;
}): AlertSubscription {
  const category = normalizeCategory(contentSubscription.category);

  return {
    id: contentSubscription.id,
    name: contentSubscription.name,
    description: contentSubscription.description,
    icon: getSubscriptionIcon(category),
    enabled: contentSubscription.enabled,
    channels: contentSubscription.channels,
    category,
  };
}

function toAlertItem(contentAlert: TenantContentConfig['alerts']['items'][number]): Alert {
  return {
    id: contentAlert.id,
    type: contentAlert.type,
    title: contentAlert.title,
    message: contentAlert.message,
    productType: contentAlert.productType,
    status: contentAlert.status,
    createdAt: contentAlert.createdAt,
    triggeredAt: contentAlert.triggeredAt,
    expiresAt: contentAlert.expiresAt,
    criteria: contentAlert.criteria,
  };
}

const defaultAlerts: Alert[] = DEFAULT_CONTENT_CONFIG.alerts.items.map(toAlertItem);

const defaultSubscriptions: AlertSubscription[] =
  DEFAULT_CONTENT_CONFIG.alerts.subscriptions.map(toAlertSubscription);

type TabType = 'alerts' | 'subscriptions' | 'settings';

function Alerts(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>('alerts');
  const [alerts, setAlerts] = useState<Alert[]>(defaultAlerts);
  const [subscriptions, setSubscriptions] = useState<AlertSubscription[]>(defaultSubscriptions);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadContent = async () => {
      setLoading(true);
      try {
        const contentConfig = await loadTenantContentConfig();
        if (!active) return;
        setAlerts(contentConfig.alerts.items.map(toAlertItem));
        setSubscriptions(contentConfig.alerts.subscriptions.map(toAlertSubscription));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadContent();

    return () => {
      active = false;
    };
  }, []);

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const matchesSearch =
        alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.message.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
      const matchesType = typeFilter === 'all' || alert.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [alerts, searchQuery, statusFilter, typeFilter]);

  // Toggle subscription
  const toggleSubscription = (id: string) => {
    setSubscriptions(prev =>
      prev.map(sub => (sub.id === id ? { ...sub, enabled: !sub.enabled } : sub))
    );
  };

  // Toggle channel
  const toggleChannel = (subscriptionId: string, channel: 'email' | 'push' | 'sms') => {
    setSubscriptions(prev =>
      prev.map(sub =>
        sub.id === subscriptionId
          ? {
              ...sub,
              channels: { ...sub.channels, [channel]: !sub.channels[channel] },
            }
          : sub
      )
    );
  };

  // Delete alert
  const deleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  // Get status badge
  const getStatusBadge = (status: Alert['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
            <Bell className="w-3 h-3" /> Active
          </span>
        );
      case 'triggered':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle2 className="w-3 h-3" /> Triggered
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            <Pause className="w-3 h-3" /> Paused
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            <XCircle className="w-3 h-3" /> Expired
          </span>
        );
    }
  };

  // Get type icon
  const getTypeIcon = (type: Alert['type']) => {
    switch (type) {
      case 'price_drop':
        return <TrendingDown className="w-4 h-4 text-green-600" />;
      case 'price_increase':
        return <TrendingUp className="w-4 h-4 text-red-600" />;
      case 'booking_status':
        return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
      case 'reminder':
        return <Clock className="w-4 h-4 text-purple-600" />;
      case 'promotion':
        return <DollarSign className="w-4 h-4 text-amber-600" />;
      case 'system':
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // Get product icon
  const getProductIcon = (productType: Alert['productType']) => {
    switch (productType) {
      case 'flight':
        return <Plane className="w-4 h-4" />;
      case 'hotel':
        return <Building className="w-4 h-4" />;
      case 'car':
        return <Car className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const activeCount = alerts.filter(a => a.status === 'active').length;
  const triggeredCount = alerts.filter(a => a.status === 'triggered').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Alert Management"
        subtitle="Manage your price alerts, subscriptions, and notification preferences"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-semibold">{alerts.length}</div>
              <div className="text-xs text-muted-foreground">Total Alerts</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold">{triggeredCount}</div>
              <div className="text-xs text-muted-foreground">Triggered</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <AlertTriangle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-semibold">{activeCount}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <Settings className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold">
                {subscriptions.filter(s => s.enabled).length}
              </div>
              <div className="text-xs text-muted-foreground">Subscriptions</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-muted rounded-lg w-fit">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab('alerts')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-all',
            activeTab === 'alerts'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          My Alerts
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab('subscriptions')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-all',
            activeTab === 'subscriptions'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Subscriptions
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab('settings')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-all',
            activeTab === 'settings'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Settings
        </Button>
      </div>

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative gap-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-border bg-background rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="triggered">Triggered</option>
              <option value="paused">Paused</option>
              <option value="expired">Expired</option>
            </select>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-border bg-background rounded-lg text-sm"
            >
              <option value="all">All Types</option>
              <option value="price_drop">Price Drop</option>
              <option value="price_increase">Price Increase</option>
              <option value="booking_status">Booking Status</option>
              <option value="reminder">Reminder</option>
              <option value="promotion">Promotion</option>
            </select>
          </div>

          {/* Alert List */}
          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <Card className="p-8 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-medium text-foreground">No alerts found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a new alert or adjust your filters
                </p>
              </Card>
            ) : (
              filteredAlerts.map(alert => (
                <Card key={alert.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'p-2 rounded-lg',
                        alert.type === 'price_drop'
                          ? 'bg-green-50'
                          : alert.type === 'price_increase'
                            ? 'bg-red-50'
                            : alert.type === 'booking_status'
                              ? 'bg-primary/10 text-primary'
                              : alert.type === 'reminder'
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-muted'
                      )}
                    >
                      {getTypeIcon(alert.type)}
                    </div>
                    <div className="flex-1 min-w-0 gap-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground">{alert.title}</h4>
                        {getProductIcon(alert.productType)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Created: {new Date(alert.createdAt).toLocaleDateString()}</span>
                        {alert.triggeredAt && (
                          <span>Triggered: {new Date(alert.triggeredAt).toLocaleDateString()}</span>
                        )}
                        {alert.expiresAt && (
                          <span>Expires: {new Date(alert.expiresAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(alert.status)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAlert(alert.id)}
                        className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          {loading && (
            <Card className="p-4 text-sm text-muted-foreground">Loading subscriptions...</Card>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscriptions.map(sub => (
              <Card key={sub.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">{sub.icon}</div>
                    <div>
                      <h4 className="font-medium text-foreground">{sub.name}</h4>
                      <p className="text-xs text-muted-foreground">{sub.description}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSubscription(sub.id)}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      sub.enabled
                        ? 'bg-purple-100 text-purple-600'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {sub.enabled ? <Eye className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>

                {/* Channels */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground mr-2">Channels:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleChannel(sub.id, 'email')}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors',
                      sub.channels.email
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <Mail className="w-3 h-3" />
                    Email
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleChannel(sub.id, 'push')}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors',
                      sub.channels.push
                        ? 'bg-green-100 text-green-700'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <Phone className="w-3 h-3" />
                    Push
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleChannel(sub.id, 'sms')}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors',
                      sub.channels.sms
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <MessageSquare className="w-3 h-3" />
                    SMS
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Notification Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg gap-2">
                <div>
                  <h4 className="font-medium text-foreground">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-background after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg gap-2">
                <div>
                  <h4 className="font-medium text-foreground">Push Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications in browser
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-background after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg gap-2">
                <div>
                  <h4 className="font-medium text-foreground">SMS Notifications</h4>
                  <p className="text-sm text-muted-foreground">Receive important alerts via SMS</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-background after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Quiet Hours</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  defaultValue="22:00"
                  className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  defaultValue="08:00"
                  className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              During quiet hours, non-urgent notifications will be paused. Urgent notifications
              (like security alerts) will still be sent.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}

// Simple Pause icon component
function Pause(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

export default Alerts;
