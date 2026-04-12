import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@tripalfa/ui-components/ui/card';
import { Button } from '@tripalfa/ui-components/ui/button';
import { Input } from '@tripalfa/ui-components/ui/input';
import { Label } from '@tripalfa/ui-components/ui/label';
import { Switch } from '@tripalfa/ui-components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tripalfa/ui-components/ui/select';
import { Badge } from '@tripalfa/ui-components/ui/badge';
import { RefreshCw, Save } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/shared/lib/api';
import { useAccessControl } from '@/contexts/AccessControlContext';

type PaymentMethodId = 'wallet' | 'card' | 'bank_transfer' | 'upi';

interface TenantFeatureFlags {
  walletEnabled: boolean;
  walletTopupEnabled: boolean;
  flightBookingEnabled: boolean;
  hotelBookingEnabled: boolean;
  seatSelectionEnabled: boolean;
  ancillariesEnabled: boolean;
}

interface TenantPricingPolicy {
  markupPercent: number;
  markupFlat: number;
  commissionPercent: number;
  commissionFlat: number;
  commissionChargeableToCustomer: boolean;
}

interface TenantCheckoutPolicy {
  defaultPaymentMethod: PaymentMethodId;
  allowedPaymentMethods: PaymentMethodId[];
  enforceSupplierWallet: boolean;
}

interface TenantBrandingConfig {
  appName: string;
  logoUrl: string;
  defaultAvatarUrl: string;
  rtlEnabled: boolean;
}

interface TenantRuntimeConfig {
  features: TenantFeatureFlags;
  pricing: TenantPricingPolicy;
  checkout: TenantCheckoutPolicy;
  branding: TenantBrandingConfig;
}

const DEFAULT_RUNTIME_CONFIG: TenantRuntimeConfig = {
  features: {
    walletEnabled: true,
    walletTopupEnabled: true,
    flightBookingEnabled: true,
    hotelBookingEnabled: true,
    seatSelectionEnabled: true,
    ancillariesEnabled: true,
  },
  pricing: {
    markupPercent: 0,
    markupFlat: 0,
    commissionPercent: 0,
    commissionFlat: 0,
    commissionChargeableToCustomer: false,
  },
  checkout: {
    defaultPaymentMethod: 'wallet',
    allowedPaymentMethods: ['wallet'],
    enforceSupplierWallet: true,
  },
  branding: {
    appName: 'TripAlfa',
    logoUrl: '/logo.png',
    defaultAvatarUrl: '',
    rtlEnabled: true,
  },
};

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }
  return fallback;
}

function toStringValue(value: unknown, fallback = ''): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  }
  return fallback;
}

function toPaymentMethod(value: unknown, fallback: PaymentMethodId): PaymentMethodId {
  if (value === 'wallet' || value === 'card' || value === 'bank_transfer' || value === 'upi') {
    return value;
  }
  return fallback;
}

function normalizeMethods(value: unknown): PaymentMethodId[] {
  if (!Array.isArray(value)) return ['wallet'];

  const methods = value.filter(
    (method): method is PaymentMethodId =>
      method === 'wallet' || method === 'card' || method === 'bank_transfer' || method === 'upi'
  );

  return methods.length > 0 ? Array.from(new Set(methods)) : ['wallet'];
}

function normalizeRuntimeConfig(input?: Partial<TenantRuntimeConfig> | null): TenantRuntimeConfig {
  const source = input ?? {};
  const features: Partial<TenantFeatureFlags> = source.features ?? {};
  const pricing: Partial<TenantPricingPolicy> = source.pricing ?? {};
  const checkout: Partial<TenantCheckoutPolicy> = source.checkout ?? {};
  const branding: Partial<TenantBrandingConfig> = source.branding ?? {};

  return {
    features: {
      walletEnabled: toBoolean(
        features.walletEnabled,
        DEFAULT_RUNTIME_CONFIG.features.walletEnabled
      ),
      walletTopupEnabled: toBoolean(
        features.walletTopupEnabled,
        DEFAULT_RUNTIME_CONFIG.features.walletTopupEnabled
      ),
      flightBookingEnabled: toBoolean(
        features.flightBookingEnabled,
        DEFAULT_RUNTIME_CONFIG.features.flightBookingEnabled
      ),
      hotelBookingEnabled: toBoolean(
        features.hotelBookingEnabled,
        DEFAULT_RUNTIME_CONFIG.features.hotelBookingEnabled
      ),
      seatSelectionEnabled: toBoolean(
        features.seatSelectionEnabled,
        DEFAULT_RUNTIME_CONFIG.features.seatSelectionEnabled
      ),
      ancillariesEnabled: toBoolean(
        features.ancillariesEnabled,
        DEFAULT_RUNTIME_CONFIG.features.ancillariesEnabled
      ),
    },
    pricing: {
      markupPercent: toNumber(pricing.markupPercent, DEFAULT_RUNTIME_CONFIG.pricing.markupPercent),
      markupFlat: toNumber(pricing.markupFlat, DEFAULT_RUNTIME_CONFIG.pricing.markupFlat),
      commissionPercent: toNumber(
        pricing.commissionPercent,
        DEFAULT_RUNTIME_CONFIG.pricing.commissionPercent
      ),
      commissionFlat: toNumber(
        pricing.commissionFlat,
        DEFAULT_RUNTIME_CONFIG.pricing.commissionFlat
      ),
      commissionChargeableToCustomer: toBoolean(
        pricing.commissionChargeableToCustomer,
        DEFAULT_RUNTIME_CONFIG.pricing.commissionChargeableToCustomer
      ),
    },
    checkout: {
      defaultPaymentMethod: toPaymentMethod(
        checkout.defaultPaymentMethod,
        DEFAULT_RUNTIME_CONFIG.checkout.defaultPaymentMethod
      ),
      allowedPaymentMethods: normalizeMethods(checkout.allowedPaymentMethods),
      enforceSupplierWallet: toBoolean(
        checkout.enforceSupplierWallet,
        DEFAULT_RUNTIME_CONFIG.checkout.enforceSupplierWallet
      ),
    },
    branding: {
      appName: toStringValue(branding.appName, DEFAULT_RUNTIME_CONFIG.branding.appName),
      logoUrl: toStringValue(branding.logoUrl, DEFAULT_RUNTIME_CONFIG.branding.logoUrl),
      defaultAvatarUrl: toStringValue(
        branding.defaultAvatarUrl,
        DEFAULT_RUNTIME_CONFIG.branding.defaultAvatarUrl
      ),
      rtlEnabled: toBoolean(branding.rtlEnabled, DEFAULT_RUNTIME_CONFIG.branding.rtlEnabled),
    },
  };
}

function extractRuntimePayload(responseData: any): Partial<TenantRuntimeConfig> {
  if (!responseData || typeof responseData !== 'object') {
    return DEFAULT_RUNTIME_CONFIG;
  }

  const payload =
    responseData.data && typeof responseData.data === 'object' ? responseData.data : responseData;

  return {
    ...(payload as Partial<TenantRuntimeConfig>),
    features: payload.features,
    pricing: payload.pricing,
    checkout: payload.checkout,
    branding: payload.branding,
  };
}

function parseNumberInput(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return parsed;
}

const paymentMethods: PaymentMethodId[] = ['wallet', 'card', 'bank_transfer', 'upi'];

export default function BookingEngineRuntimeSettings() {
  const { canManageRoute } = useAccessControl();
  const canManageRuntime = canManageRoute('/system/runtime-settings');
  const [config, setConfig] = useState<TenantRuntimeConfig>(DEFAULT_RUNTIME_CONFIG);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasWalletInAllowedMethods = useMemo(
    () => config.checkout.allowedPaymentMethods.includes('wallet'),
    [config.checkout.allowedPaymentMethods]
  );

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await api.get('/branding/settings');
      const normalized = normalizeRuntimeConfig(extractRuntimePayload(response.data));
      setConfig(normalized);
    } catch (error) {
      console.error('Failed to load runtime settings', error);
      toast.error('Failed to load runtime settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadConfig();
  }, []);

  const updateFeature = (key: keyof TenantFeatureFlags, value: boolean) => {
    setConfig(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: value,
      },
    }));
  };

  const updatePricing = (key: keyof TenantPricingPolicy, value: number | boolean) => {
    setConfig(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [key]: value,
      },
    }));
  };

  const updateCheckout = (
    key: keyof TenantCheckoutPolicy,
    value: TenantCheckoutPolicy[keyof TenantCheckoutPolicy]
  ) => {
    setConfig(prev => ({
      ...prev,
      checkout: {
        ...prev.checkout,
        [key]: value,
      },
    }));
  };

  const updateBranding = (key: keyof TenantBrandingConfig, value: string | boolean) => {
    setConfig(prev => ({
      ...prev,
      branding: {
        ...prev.branding,
        [key]: value,
      },
    }));
  };

  const toggleAllowedMethod = (method: PaymentMethodId, enabled: boolean) => {
    setConfig(prev => {
      const nextMethods: PaymentMethodId[] = enabled
        ? Array.from(new Set([...prev.checkout.allowedPaymentMethods, method]))
        : prev.checkout.allowedPaymentMethods.filter(item => item !== method);

      const safeMethods: PaymentMethodId[] = nextMethods.length > 0 ? nextMethods : ['wallet'];

      const nextDefault: PaymentMethodId = safeMethods.includes(prev.checkout.defaultPaymentMethod)
        ? prev.checkout.defaultPaymentMethod
        : (safeMethods[0] ?? 'wallet');

      return {
        ...prev,
        checkout: {
          ...prev.checkout,
          allowedPaymentMethods: safeMethods,
          defaultPaymentMethod: nextDefault,
        },
      };
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload: TenantRuntimeConfig = normalizeRuntimeConfig(config);
      await api.post('/branding/settings', payload);
      toast.success('Runtime settings saved');
    } catch (error) {
      console.error('Failed to save runtime settings', error);
      toast.error('Failed to save runtime settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Booking Engine Runtime</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage dynamic booking engine features, pricing, checkout policy, and branding runtime
            values.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void loadConfig()} disabled={loading || saving}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Reload
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || saving || !hasWalletInAllowedMethods || !canManageRuntime}
          >
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      {!hasWalletInAllowedMethods && (
        <Badge variant="destructive" className="w-fit">
          Wallet must stay enabled in allowed payment methods.
        </Badge>
      )}

      <Card>
        <CardHeader className="space-y-0 gap-2">
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>Toggle user-facing booking engine features per tenant.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 p-6">
          <div className="flex items-center justify-between rounded-lg border p-3 gap-2">
            <Label htmlFor="flightBookingEnabled">Flight booking</Label>
            <Switch
              id="flightBookingEnabled"
              checked={config.features.flightBookingEnabled}
              onCheckedChange={value => updateFeature('flightBookingEnabled', value)}
              disabled={!canManageRuntime}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 gap-2">
            <Label htmlFor="hotelBookingEnabled">Hotel booking</Label>
            <Switch
              id="hotelBookingEnabled"
              checked={config.features.hotelBookingEnabled}
              onCheckedChange={value => updateFeature('hotelBookingEnabled', value)}
              disabled={!canManageRuntime}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 gap-2">
            <Label htmlFor="walletEnabled">Wallet</Label>
            <Switch
              id="walletEnabled"
              checked={config.features.walletEnabled}
              onCheckedChange={value => updateFeature('walletEnabled', value)}
              disabled={!canManageRuntime}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 gap-2">
            <Label htmlFor="walletTopupEnabled">Wallet top-up</Label>
            <Switch
              id="walletTopupEnabled"
              checked={config.features.walletTopupEnabled}
              onCheckedChange={value => updateFeature('walletTopupEnabled', value)}
              disabled={!canManageRuntime}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 gap-2">
            <Label htmlFor="seatSelectionEnabled">Seat selection</Label>
            <Switch
              id="seatSelectionEnabled"
              checked={config.features.seatSelectionEnabled}
              onCheckedChange={value => updateFeature('seatSelectionEnabled', value)}
              disabled={!canManageRuntime}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 gap-2">
            <Label htmlFor="ancillariesEnabled">Ancillaries</Label>
            <Switch
              id="ancillariesEnabled"
              checked={config.features.ancillariesEnabled}
              onCheckedChange={value => updateFeature('ancillariesEnabled', value)}
              disabled={!canManageRuntime}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-0 gap-2">
          <CardTitle>Pricing Policy</CardTitle>
          <CardDescription>Set tenant-level markup and commission behavior.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 p-6">
          <div className="space-y-2">
            <Label htmlFor="markupPercent">Markup percent</Label>
            <Input
              id="markupPercent"
              type="number"
              value={config.pricing.markupPercent}
              onChange={e => updatePricing('markupPercent', parseNumberInput(e.target.value))}
              disabled={!canManageRuntime}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="markupFlat">Markup flat</Label>
            <Input
              id="markupFlat"
              type="number"
              value={config.pricing.markupFlat}
              onChange={e => updatePricing('markupFlat', parseNumberInput(e.target.value))}
              disabled={!canManageRuntime}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="commissionPercent">Commission percent</Label>
            <Input
              id="commissionPercent"
              type="number"
              value={config.pricing.commissionPercent}
              onChange={e => updatePricing('commissionPercent', parseNumberInput(e.target.value))}
              disabled={!canManageRuntime}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="commissionFlat">Commission flat</Label>
            <Input
              id="commissionFlat"
              type="number"
              value={config.pricing.commissionFlat}
              onChange={e => updatePricing('commissionFlat', parseNumberInput(e.target.value))}
              disabled={!canManageRuntime}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 md:col-span-2 gap-2">
            <Label htmlFor="commissionChargeableToCustomer">Charge commission to customer</Label>
            <Switch
              id="commissionChargeableToCustomer"
              checked={config.pricing.commissionChargeableToCustomer}
              onCheckedChange={value => updatePricing('commissionChargeableToCustomer', value)}
              disabled={!canManageRuntime}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-0 gap-2">
          <CardTitle>Checkout Policy</CardTitle>
          <CardDescription>Control payment methods and checkout defaults.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <Label>Default payment method</Label>
            <Select
              value={config.checkout.defaultPaymentMethod}
              onValueChange={value =>
                updateCheckout('defaultPaymentMethod', value as PaymentMethodId)
              }
              disabled={!canManageRuntime}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select default payment method" />
              </SelectTrigger>
              <SelectContent>
                {config.checkout.allowedPaymentMethods.map(method => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Allowed payment methods</Label>
            <div className="grid gap-2 md:grid-cols-2">
              {paymentMethods.map(method => {
                const checked = config.checkout.allowedPaymentMethods.includes(method);
                const disabled = method === 'wallet';
                return (
                  <div
                    key={method}
                    className="flex items-center justify-between rounded-lg border p-3 gap-2"
                  >
                    <Label htmlFor={`allowed-${method}`}>{method}</Label>
                    <Switch
                      id={`allowed-${method}`}
                      checked={checked}
                      disabled={disabled || !canManageRuntime}
                      onCheckedChange={value => toggleAllowedMethod(method, value)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3 gap-2">
            <Label htmlFor="enforceSupplierWallet">Enforce supplier wallet</Label>
            <Switch
              id="enforceSupplierWallet"
              checked={config.checkout.enforceSupplierWallet}
              onCheckedChange={value => updateCheckout('enforceSupplierWallet', value)}
              disabled={!canManageRuntime}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-0 gap-2">
          <CardTitle>Branding Runtime</CardTitle>
          <CardDescription>Runtime branding values consumed by booking engine.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 p-6">
          <div className="space-y-2">
            <Label htmlFor="appName">App name</Label>
            <Input
              id="appName"
              value={config.branding.appName}
              onChange={e => updateBranding('appName', e.target.value)}
              disabled={!canManageRuntime}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              value={config.branding.logoUrl}
              onChange={e => updateBranding('logoUrl', e.target.value)}
              disabled={!canManageRuntime}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultAvatarUrl">Default avatar URL</Label>
            <Input
              id="defaultAvatarUrl"
              value={config.branding.defaultAvatarUrl}
              onChange={e => updateBranding('defaultAvatarUrl', e.target.value)}
              disabled={!canManageRuntime}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 gap-2">
            <Label htmlFor="rtlEnabled">RTL enabled</Label>
            <Switch
              id="rtlEnabled"
              checked={config.branding.rtlEnabled}
              onCheckedChange={value => updateBranding('rtlEnabled', value)}
              disabled={!canManageRuntime}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
