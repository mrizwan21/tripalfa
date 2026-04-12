import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@tripalfa/ui-components/ui/card';
import { Button } from '@tripalfa/ui-components/ui/button';
import { Label } from '@tripalfa/ui-components/ui/label';
import { Textarea } from '@tripalfa/ui-components/ui/textarea';
import { RefreshCw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { DEFAULT_CONTENT_CONFIG } from '@tripalfa/shared-types';
import api from '@/shared/lib/api';
import { useAccessControl } from '@/contexts/AccessControlContext';

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function ContentSettings() {
  const { canManageRoute } = useAccessControl();
  const canManageContent = canManageRoute('/system/content-settings');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rawContentJson, setRawContentJson] = useState<string>(
    JSON.stringify(DEFAULT_CONTENT_CONFIG, null, 2)
  );

  const parsedPreview = useMemo(
    () => safeJsonParse(rawContentJson, DEFAULT_CONTENT_CONFIG),
    [rawContentJson]
  );

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/branding/settings');
      const payload =
        response?.data?.data && typeof response.data.data === 'object'
          ? response.data.data
          : response.data;
      const content =
        payload?.content && typeof payload.content === 'object'
          ? payload.content
          : DEFAULT_CONTENT_CONFIG;
      setRawContentJson(JSON.stringify(content, null, 2));
    } catch (error) {
      console.error('Failed to load content settings', error);
      toast.error('Failed to load content settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const parsedContent = JSON.parse(rawContentJson);

      const response = await api.get('/branding/settings');
      const payload =
        response?.data?.data && typeof response.data.data === 'object'
          ? response.data.data
          : response.data || {};

      const nextPayload = {
        ...payload,
        content: parsedContent,
      };

      await api.post('/branding/settings', nextPayload);
      toast.success('Content settings saved');
    } catch (error) {
      console.error('Failed to save content settings', error);
      toast.error('Invalid JSON or save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Content Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage dynamic Booking Engine content from admin.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => void loadSettings()}
            disabled={loading || saving}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Reload
          </Button>
          <Button onClick={handleSave} disabled={loading || saving || !canManageContent}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-0 gap-2">
          <CardTitle>Content JSON</CardTitle>
          <CardDescription>
            Edit JSON for `helpCenter`, `alerts`, `profile`, `loyalty`, `searchLoading`,
            `dashboard`, `accountSettings`, and `marketing`. This configuration is loaded by the
            booking engine at runtime. Search/trip labels are under
            `marketing.home.searchFormLabels`, `marketing.flightHome.searchFormLabels`,
            `marketing.flightHome.tripTypeLabels`, `marketing.hotelHome.searchFormLabels`, and
            `marketing.hotelHome.tripTypeLabels`.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-6">
          <Label htmlFor="contentJson">Configuration</Label>
          <pre className="rounded-md bg-muted p-3 font-mono text-xs overflow-x-auto">
            {`"marketing": {
  "home": {
    "searchFormLabels": {
      "flight": {
        "from": "From",
        "originPlaceholder": "Origin",
        "to": "To",
        "destinationPlaceholder": "Destination",
        "departure": "Departure",
        "return": "Return",
        "searchCtaLabel": "Search",
        "disabledLabel": "Flight booking is currently disabled by admin settings."
      },
      "hotel": {
        "destination": "Destination",
        "destinationPlaceholder": "Where are you going?",
        "checkIn": "Check-in",
        "checkOut": "Check-out",
        "searchCtaLabel": "Search",
        "disabledLabel": "Hotel booking is currently disabled by admin settings."
      }
    }
  },
  "flightHome": {
    "searchFormLabels": { "departure": "Departure", "return": "Return", "fromPlaceholder": "From where?", "toPlaceholder": "To where?", "legFromLabel": "From", "legToLabel": "To", "searchCtaLabel": "Search Flights", "searchMultiCityCtaLabel": "Search Multi-City", "removeLegLabel": "Remove" },
    "tripTypeLabels": { "oneWay": "One Way", "roundTrip": "Round Trip", "multiCity": "Multi City" }
  },
  "hotelHome": {
    "searchFormLabels": { "checkIn": "Check-in", "checkOut": "Check-out", "destinationPlaceholder": "City, Property, District or Address", "searchCtaLabel": "Search Hotels", "loadingDestinationsLabel": "Loading destinations...", "loadingHotelsLabel": "Loading hotels..." },
    "tripTypeLabels": { "oneWay": "One Way", "roundTrip": "Round Trip", "multiCity": "Multi City" }
  }
}`}
          </pre>
          <Textarea
            id="contentJson"
            value={rawContentJson}
            onChange={e => setRawContentJson(e.target.value)}
            className="min-h-[420px] font-mono text-xs"
            disabled={!canManageContent}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-0 gap-2">
          <CardTitle>Preview Summary</CardTitle>
          <CardDescription>Quick sanity check before publishing.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 p-6">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Help categories</p>
            <p className="text-2xl font-semibold">
              {Array.isArray(parsedPreview?.helpCenter?.categories)
                ? parsedPreview.helpCenter.categories.length
                : 0}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">FAQ items</p>
            <p className="text-2xl font-semibold">
              {Array.isArray(parsedPreview?.helpCenter?.faqs)
                ? parsedPreview.helpCenter.faqs.length
                : 0}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Alert items</p>
            <p className="text-2xl font-semibold">
              {Array.isArray(parsedPreview?.alerts?.items) ? parsedPreview.alerts.items.length : 0}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Alert subscriptions</p>
            <p className="text-2xl font-semibold">
              {Array.isArray(parsedPreview?.alerts?.subscriptions)
                ? parsedPreview.alerts.subscriptions.length
                : 0}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Profile countries</p>
            <p className="text-2xl font-semibold">
              {Array.isArray(parsedPreview?.profile?.options?.countries)
                ? parsedPreview.profile.options.countries.length
                : 0}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Loyalty coupons</p>
            <p className="text-2xl font-semibold">
              {Array.isArray(parsedPreview?.loyalty?.coupons)
                ? parsedPreview.loyalty.coupons.length
                : 0}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Loading tips</p>
            <p className="text-2xl font-semibold">
              {(Array.isArray(parsedPreview?.searchLoading?.flightTips)
                ? parsedPreview.searchLoading.flightTips.length
                : 0) +
                (Array.isArray(parsedPreview?.searchLoading?.hotelTips)
                  ? parsedPreview.searchLoading.hotelTips.length
                  : 0)}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Dashboard actions</p>
            <p className="text-2xl font-semibold">
              {Object.keys(parsedPreview?.dashboard?.actions || {}).length}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Dashboard cards</p>
            <p className="text-2xl font-semibold">
              {Object.keys(parsedPreview?.dashboard?.cards || {}).length}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Account tabs</p>
            <p className="text-2xl font-semibold">
              {Object.keys(parsedPreview?.accountSettings?.tabs || {}).length}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Account seed cards</p>
            <p className="text-2xl font-semibold">
              {Array.isArray(parsedPreview?.accountSettings?.paymentsDefaults?.savedCards)
                ? parsedPreview.accountSettings.paymentsDefaults.savedCards.length
                : 0}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Home tabs</p>
            <p className="text-2xl font-semibold">
              {Object.keys(parsedPreview?.marketing?.home?.tabs || {}).length}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Flight benefits</p>
            <p className="text-2xl font-semibold">
              {Array.isArray(parsedPreview?.marketing?.flightHome?.benefits)
                ? parsedPreview.marketing.flightHome.benefits.length
                : 0}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Hotel benefits</p>
            <p className="text-2xl font-semibold">
              {Array.isArray(parsedPreview?.marketing?.hotelHome?.benefits)
                ? parsedPreview.marketing.hotelHome.benefits.length
                : 0}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
