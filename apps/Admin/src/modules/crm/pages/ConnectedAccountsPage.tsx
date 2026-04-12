import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../../shared/lib/api';
import {
  Plus,
  Search,
  Link2,
  Trash2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from '@tripalfa/ui-components/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/optics';
import { Button } from '@/components/optics';
import { Input } from '@/components/optics';
import { Badge } from '@/components/optics';
import { StatusBadge } from '@tripalfa/ui-components/optics';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/optics';
import { cn } from '@tripalfa/shared-utils/utils';

interface ConnectedAccount {
  id: string;
  name: string;
  providerType:
    | 'GMAIL'
    | 'OUTLOOK'
    | 'SLACK'
    | 'STRIPE'
    | 'ZAPIER'
    | 'DUFFEL'
    | 'LITEAPI'
    | 'OTROS';
  status: 'CONNECTED' | 'CONNECTING' | 'ERROR' | 'DISCONNECTED';
  email?: string;
  lastSyncedAt?: string;
  syncStatus?: 'IDLE' | 'SYNCING' | 'ERROR';
  features?: string[];
  connectedAt: string;
  disconnectedAt?: string;
  errorMessage?: string;
  settings?: Record<string, any>;
}

export function ConnectedAccountsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CONNECTED' | 'ERROR'>('ALL');
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<ConnectedAccount | null>(null);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

  const {
    data: accounts,
    isLoading,
    refetch,
  } = useQuery<ConnectedAccount[]>({
    queryKey: ['connected-accounts', searchTerm, selectedFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedFilter !== 'ALL') params.append('status', selectedFilter);
      const response = await api.get(`/crm/connected-accounts?${params}`);
      return response.data;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/crm/connected-accounts/${id}/disconnect`);
    },
    onSuccess: () => {
      refetch();
      setSelectedAccount(null);
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/crm/connected-accounts/${id}/sync`);
      return response.data;
    },
    onSuccess: () => {
      refetch();
    },
  });

  const authorizeAccountMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await api.post('/crm/connected-accounts/authorize', {
        provider,
      });
      return response.data;
    },
    onSuccess: data => {
      if (data.authUrl) {
        window.open(data.authUrl, '_blank');
        setIsConnectOpen(false);
      }
    },
  });

  const getProviderStatus = (
    provider: string
  ): 'primary' | 'info' | 'warning' | 'success' | 'default' => {
    const statusMap = {
      GMAIL: 'info' as const,
      OUTLOOK: 'info' as const,
      SLACK: 'info' as const,
      STRIPE: 'warning' as const,
      ZAPIER: 'warning' as const,
      DUFFEL: 'info' as const,
      LITEAPI: 'success' as const,
      OTROS: 'default' as const,
    };
    return statusMap[provider as keyof typeof statusMap] || 'default';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'ERROR':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'CONNECTING':
        return <RefreshCw className="w-5 h-5 text-yellow-600 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const availableProviders = [
    {
      id: 'GMAIL',
      name: 'Gmail',
      description: 'Sync emails and contacts',
      icon: '📧',
      status: accounts?.some(a => a.providerType === 'GMAIL' && a.status === 'CONNECTED')
        ? 'connected'
        : 'available',
    },
    {
      id: 'OUTLOOK',
      name: 'Outlook',
      description: 'Connect your Outlook account',
      icon: '📨',
      status: accounts?.some(a => a.providerType === 'OUTLOOK' && a.status === 'CONNECTED')
        ? 'connected'
        : 'available',
    },
    {
      id: 'SLACK',
      name: 'Slack',
      description: 'Send notifications to Slack',
      icon: '💬',
      status: accounts?.some(a => a.providerType === 'SLACK' && a.status === 'CONNECTED')
        ? 'connected'
        : 'available',
    },
    {
      id: 'STRIPE',
      name: 'Stripe',
      description: 'Payment processing integration',
      icon: '💳',
      status: accounts?.some(a => a.providerType === 'STRIPE' && a.status === 'CONNECTED')
        ? 'connected'
        : 'available',
    },
    {
      id: 'DUFFEL',
      name: 'Duffel API',
      description: 'Flight booking integration',
      icon: '✈️',
      status: accounts?.some(a => a.providerType === 'DUFFEL' && a.status === 'CONNECTED')
        ? 'connected'
        : 'available',
    },
    {
      id: 'LITEAPI',
      name: 'LiteAPI',
      description: 'Hotel booking integration',
      icon: '🏨',
      status: accounts?.some(a => a.providerType === 'LITEAPI' && a.status === 'CONNECTED')
        ? 'connected'
        : 'available',
    },
    {
      id: 'ZAPIER',
      name: 'Zapier',
      description: 'Connect with 1000s of apps',
      icon: '⚡',
      status: accounts?.some(a => a.providerType === 'ZAPIER' && a.status === 'CONNECTED')
        ? 'connected'
        : 'available',
    },
  ];

  const connectedAccounts = accounts?.filter(a => a.status === 'CONNECTED') || [];
  const errorAccounts = accounts?.filter(a => a.status === 'ERROR') || [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="action-row">
        <div>
          <h1 className="text-page-title">Integrations</h1>
          <p className="text-caption mt-1">
            Connect external services and manage your integrations
          </p>
        </div>
        <Button onClick={() => setIsConnectOpen(true)} className="gap-2">
          <Plus size={18} />
          Connect Account
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 flex-col md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
              <Input
                placeholder="Search connected accounts..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {(['ALL', 'CONNECTED', 'ERROR'] as const).map(filter => (
              <Badge
                key={filter}
                variant={selectedFilter === filter ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedFilter(filter)}
              >
                {filter === 'ALL'
                  ? 'All Accounts'
                  : filter === 'CONNECTED'
                    ? `Connected (${connectedAccounts.length})`
                    : `Errors (${errorAccounts.length})`}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      {connectedAccounts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">✅ Connected Accounts</h2>
          <div className="space-y-3">
            {connectedAccounts.map(account => (
              <Card key={account.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(account.status)}
                        <div>
                          <h3 className="font-semibold text-sm">{account.name}</h3>
                          {account.email && (
                            <p className="text-xs text-muted-foreground">{account.email}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <StatusBadge
                          status={getProviderStatus(account.providerType)}
                          label={account.providerType}
                          size="sm"
                        />
                        {account.lastSyncedAt && (
                          <span className="text-xs text-muted-foreground">
                            Last synced: {new Date(account.lastSyncedAt).toLocaleString()}
                          </span>
                        )}
                      </div>

                      {account.features && account.features.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {account.features.map(feature => (
                            <Badge key={feature} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => syncMutation.mutate(account.id)}
                        disabled={syncMutation.isPending}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedAccount(account)}
                      >
                        Details
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => disconnectMutation.mutate(account.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Error Accounts */}
      {errorAccounts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-red-600">⚠️ Connection Errors</h2>
          <div className="space-y-3">
            {errorAccounts.map(account => (
              <Card key={account.id} className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(account.status)}
                        <div>
                          <h3 className="font-semibold text-sm">{account.name}</h3>
                          {account.errorMessage && (
                            <p className="text-xs text-red-700 mt-1">{account.errorMessage}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => disconnectMutation.mutate(account.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available Integrations */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Available Integrations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {availableProviders.map(provider => (
            <Card
              key={provider.id}
              className={cn(
                'cursor-pointer hover:shadow-md transition-shadow',
                provider.status === 'connected' && 'border-green-200 bg-green-50'
              )}
            >
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl mb-2">{provider.icon}</div>
                  <h3 className="font-semibold text-sm">{provider.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{provider.description}</p>
                  {provider.status === 'connected' ? (
                    <div className="mt-4 text-xs text-green-700">✓ Connected</div>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full mt-4"
                      onClick={() => {
                        setConnectingProvider(provider.id);
                        authorizeAccountMutation.mutate(provider.id);
                      }}
                      disabled={authorizeAccountMutation.isPending}
                    >
                      <Link2 className="w-3 h-3 mr-1" />
                      Connect
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Account Detail Modal */}
      {selectedAccount && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedAccount.name}</span>
              <Button variant="ghost" onClick={() => setSelectedAccount(null)}>
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Provider</label>
              <StatusBadge
                status={getProviderStatus(selectedAccount.providerType)}
                label={selectedAccount.providerType}
                size="sm"
              />
            </div>

            {selectedAccount.email && (
              <div>
                <label className="text-sm font-medium">Email</label>
                <p className="text-sm text-muted-foreground">{selectedAccount.email}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Status</label>
              <div className="flex items-center gap-2 text-sm">
                {getStatusIcon(selectedAccount.status)}
                {selectedAccount.status}
              </div>
            </div>

            {selectedAccount.lastSyncedAt && (
              <div>
                <label className="text-sm font-medium">Last Synced</label>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedAccount.lastSyncedAt).toLocaleString()}
                </p>
              </div>
            )}

            {selectedAccount.features && (
              <div>
                <label className="text-sm font-medium">Features</label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedAccount.features.map(f => (
                    <Badge key={f} variant="secondary">
                      {f}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button variant="outline" className="w-full" onClick={() => setSelectedAccount(null)}>
              Close
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Connect Dialog */}
      <Dialog open={isConnectOpen} onOpenChange={setIsConnectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect New Account</DialogTitle>
            <DialogDescription>Choose a service to connect</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto py-4">
            {availableProviders
              .filter(p => p.status !== 'connected')
              .map(provider => (
                <Button
                  key={provider.id}
                  variant="outline"
                  className="h-auto flex flex-col items-center gap-2 py-4"
                  onClick={() => {
                    setConnectingProvider(provider.id);
                    authorizeAccountMutation.mutate(provider.id);
                  }}
                  disabled={authorizeAccountMutation.isPending}
                >
                  <span className="text-2xl">{provider.icon}</span>
                  <span className="text-xs font-medium text-center">{provider.name}</span>
                </Button>
              ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConnectOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
