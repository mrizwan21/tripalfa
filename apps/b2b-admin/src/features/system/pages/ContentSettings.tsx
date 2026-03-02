import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@tripalfa/ui-components/ui/card";
import { Button } from "@tripalfa/ui-components/ui/button";
import { Label } from "@tripalfa/ui-components/ui/label";
import { Textarea } from "@tripalfa/ui-components/ui/textarea";
import { RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import api from "@/shared/lib/api";
import { useAccessControl } from "@/contexts/AccessControlContext";

const DEFAULT_CONTENT_CONFIG = {
  helpCenter: {
    categories: [
      {
        title: "Getting Started",
        desc: "New here? Learn the basics of booking and managing your trips.",
        icon: "🚀",
      },
      {
        title: "Trust & Safety",
        desc: "How we protect your data and ensure secure transactions.",
        icon: "🛡️",
      },
    ],
    faqs: [
      {
        q: "How do I cancel my booking and get a refund?",
        a: "You can cancel most bookings through your dashboard under My Bookings.",
      },
    ],
    contact: {
      phone: "+966 800 123 4567",
      email: "support@triploger.com",
      chatLabel: "Startup a Conversation",
    },
  },
  alerts: {
    items: [
      {
        id: "alert-1",
        type: "price_drop",
        title: "Price dropped for DXB → LHR",
        message: "Flight price dropped by $45! New price: $289",
        productType: "flight",
        status: "triggered",
        createdAt: "2024-01-15T10:00:00Z",
        triggeredAt: "2024-01-16T14:30:00Z",
        expiresAt: "2024-01-20T23:59:59Z",
        criteria: { origin: "DXB", destination: "LHR", maxPrice: 300 },
      },
    ],
    subscriptions: [
      {
        id: "price_drop",
        name: "Price Drop Alerts",
        description: "Get notified when prices drop for your saved routes",
        enabled: true,
        channels: { email: true, push: true, sms: false },
        category: "price",
      },
    ],
  },
  profile: {
    options: {
      countryCodes: ["+1", "+44", "+61", "+91", "+86"],
      countries: [
        "United States",
        "United Kingdom",
        "Australia",
        "India",
        "Canada",
      ],
      currencies: ["USD", "EUR", "GBP", "AED"],
      hotelCategories: [
        "Any",
        "1 star",
        "2 star",
        "3 star",
        "4 star",
        "5 star",
      ],
      locationPreferenceTags: [
        "Beach",
        "Snow",
        "City",
        "Cruises",
        "Mountains",
        "Citycenter",
        "Suburbs",
        "Seaside",
      ],
    },
  },
  loyalty: {
    coupons: [
      {
        id: "SAVE10",
        type: "Percentage",
        discount: "10%",
        desc: "Save 10% on your next booking",
        valid: "28 Feb 2026",
      },
      {
        id: "FLAT50",
        type: "Fixed",
        discount: "$50",
        desc: "$50 off flights above $500",
        valid: "15 Mar 2026",
      },
    ],
    transactionHistory: [
      {
        id: "txn-1",
        type: "earn",
        points: 500,
        description: "Flight booking DXB-LHR",
        date: "2024-01-15",
        status: "Completed",
      },
      {
        id: "txn-2",
        type: "redeem",
        points: -200,
        description: "Hotel discount",
        date: "2024-01-10",
        status: "Completed",
      },
    ],
  },
  searchLoading: {
    flightTips: [
      "💡 Tip: Book flights on Tuesdays for better deals",
      "💡 Tip: Compare prices across multiple dates",
    ],
    hotelTips: [
      "💡 Tip: Book hotels on weekdays for better rates",
      "💡 Tip: Check for free cancellation options",
    ],
  },
  dashboard: {
    title: "Dashboard",
    subtitle: "Overview of your travel activity, wallet and documents.",
    actions: {
      loyalty: "Loyalty",
      alerts: "Alerts",
      bookings: "Bookings",
      wallet: "Wallet",
    },
    cards: {
      totalBookings: "Total bookings",
      flights: "Flights",
      hotels: "Hotels",
      cars: "Cars",
      walletSnapshot: "Wallet snapshot",
      noWallets: "No wallets available",
      viewWallet: "View wallet",
      topUps: "Top-ups",
      documents: "Documents",
      documentsHint: "Passport, visa, residency, cards",
      manageDocuments: "Manage documents",
    },
    chart: {
      title: "Bookings by product",
      subtitle: "Last 12 months (mock)",
      snapshot: "Snapshot",
      flights: "Flights",
      hotels: "Hotels",
      cars: "Cars",
    },
    recentBookings: {
      title: "Recent bookings",
      subtitle: "Latest activity",
      empty: "No recent bookings",
      bookingFallback: "Booking",
      idPrefix: "ID:",
    },
  },
  accountSettings: {
    title: "Account settings",
    subtitle: "Manage profile, security, wallet and developer keys.",
    tabs: {
      profile: "Profile",
      security: "Security",
      payments: "Payment Methods",
      notifications: "Notifications",
      documents: "Documents",
      api: "API Keys",
    },
    profileDefaults: {
      firstName: "John",
      lastName: "Doe",
      email: "user@example.com",
      phone: "+1 555 123 4567",
    },
    paymentsDefaults: {
      savedCards: [
        {
          id: "c1",
          brand: "Visa",
          last4: "4242",
          exp: "12/26",
          currency: "USD",
          balance: 120.5,
        },
        {
          id: "c2",
          brand: "Mastercard",
          last4: "8888",
          exp: "08/25",
          currency: "USD",
        },
      ],
    },
    notificationsDefaults: {
      marketing: true,
      bookingUpdates: true,
      promoSms: false,
    },
    apiDefaults: [
      {
        id: "k1",
        label: "Default key",
        key: "sk_live_xxx...xyz",
        created: "2024-12-01",
      },
    ],
  },
  marketing: {
    home: {
      nav: {
        brandName: "TripAlfa",
        flights: "Flights",
        hotels: "Hotels",
        packages: "Packages",
        cars: "Cars",
        aiSearchLabel: "AI Search",
      },
      hero: {
        badge: "AI-Powered Travel Search",
        title: "Book flights, hotels, and experiences",
        subtitle:
          "Discover the best deals with our intelligent search technology",
      },
      tabs: {
        flights: "Flights",
        hotels: "Hotels",
        packages: "Packages",
        cars: "Cars",
      },
      searchFormLabels: {
        flight: {
          from: "From",
          originPlaceholder: "Origin",
          to: "To",
          destinationPlaceholder: "Destination",
          departure: "Departure",
          return: "Return",
          searchCtaLabel: "Search",
          disabledLabel:
            "Flight booking is currently disabled by admin settings.",
        },
        hotel: {
          destination: "Destination",
          destinationPlaceholder: "Where are you going?",
          checkIn: "Check-in",
          checkOut: "Check-out",
          searchCtaLabel: "Search",
          disabledLabel:
            "Hotel booking is currently disabled by admin settings.",
        },
      },
      packages: {
        title: "AI-Powered Package Deals",
        subtitle: "Let our AI find the perfect combination for your trip.",
        ctaLabel: "Discover Packages",
      },
      cars: {
        title: "Rent a Car",
        subtitle: "Find the perfect vehicle for your journey.",
        ctaLabel: "Search Cars",
      },
      popularDestinations: {
        title: "Popular Destinations",
        subtitle: "Explore our most visited locations",
        viewAllLabel: "View All",
        nameLabel: "Destination",
        priceLabel: "From $X/night",
        flightsFromLabel: "Flights from",
        dataSourceSuffixLabel: "from DB",
        viewDetailsLabel: "View Details",
        featuredLabel: "Featured",
      },
      featuredFlights: {
        title: "Latest Flight Deals",
        emptyLabel: "No flight deals found at the moment",
        perPersonLabel: "per person",
        directLabel: "Direct",
        stopSuffix: "Stop",
        viewDetailsLabel: "View Details",
      },
    },
    flightHome: {
      heroTitle: "Compare and book flights with ease",
      heroSubtitle: "Discover your next dream destination",
      disabledTitle: "Flight Booking Disabled",
      disabledSubtitle:
        "Flight booking is currently disabled by your admin settings.",
      backToHomeLabel: "Back to Home",
      searchFormLabels: {
        departure: "Departure",
        return: "Return",
        fromPlaceholder: "From where?",
        toPlaceholder: "To where?",
        legFromLabel: "From",
        legToLabel: "To",
        searchCtaLabel: "Search Flights",
        searchMultiCityCtaLabel: "Search Multi-City",
        removeLegLabel: "Remove",
        addLegLabel: "+ Add another leg",
      },
      tripTypeLabels: {
        oneWay: "One Way",
        roundTrip: "Round Trip",
        multiCity: "Multi City",
      },
      tabs: {
        stays: "Stays",
        flights: "Flights",
      },
      benefits: [
        {
          title: "Search a huge selection",
          subtitle:
            "Easily compare flights, airlines, and find the cheapest ones.",
        },
        {
          title: "Pay no hidden fees",
          subtitle: "Get the clearest price display with no hidden costs.",
        },
        {
          title: "Get more flexibility",
          subtitle: "Change your dates or cancel easily with select providers.",
        },
      ],
      popularFlights: {
        title: "Popular flights in top destinations",
        subtitle: "Find deals on domestic and international flights",
      },
      featuredGuide: {
        title: "Discover Your Next Destination",
        subtitle: "Travel guide from Wikivoyage",
        poweredByLabel: "Powered by Wikivoyage",
      },
      trending: {
        title: "Trending Destinations",
        tabs: ["All", "Cities", "Regions", "Countries"],
        columnLabels: {
          primary: "Most Hotels",
          secondary: "Top Destinations",
          tertiary: "More Destinations",
          quaternary: "Explore More",
          countLabel: "hotels",
        },
      },
    },
    hotelHome: {
      badge: "Best Price Guaranteed",
      heroTitle: "Find Your Perfect Stay",
      heroSubtitle: "Curated Hotels Worldwide",
      disabledTitle: "Hotel Booking Disabled",
      disabledSubtitle:
        "Hotel booking is currently disabled by your admin settings.",
      backToHomeLabel: "Back to Home",
      searchFormLabels: {
        checkIn: "Check-in",
        checkOut: "Check-out",
        destinationPlaceholder: "City, Property, District or Address",
        searchCtaLabel: "Search Hotels",
        loadingDestinationsLabel: "Loading destinations...",
        errorLoadingDestinationsLabel:
          "Unable to load destinations. Please try again later.",
        loadingHotelsLabel: "Loading hotels...",
      },
      tripTypeLabels: {
        oneWay: "One Way",
        roundTrip: "Round Trip",
        multiCity: "Multi City",
      },
      tabs: {
        stays: "Stays",
        flights: "Flights",
      },
      benefits: [
        {
          title: "Search a huge selection",
          subtitle: "Compare hotel prices from multiple sites.",
        },
        {
          title: "Pay no hidden fees",
          subtitle: "Get the clearest price display with no hidden costs.",
        },
        {
          title: "Get more flexibility",
          subtitle: "Change your dates or cancel easily.",
        },
      ],
      deals: {
        title: "Cheap Hotel deals in popular destinations",
        ctaLabel: "Read More",
        spotlightTitle: "Backpacking Sri Lanka",
        spotlightDescription:
          "Traveling is a unique experience as it's the best way to unplug from the pushes and pulls of daily life. It helps us to forget about our problems, frustrations, and fears at home. During our journey, we experience life in different ways. We explore new places, cultures, cuisines, traditions, and ways of living.",
        imageUrls: [
          "https://images.unsplash.com/photo-1546737033-07416763823d?auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1572455044327-7348c1be7267?auto=format&fit=crop&q=80",
        ],
      },
      popularDestinations: {
        title: "Popular Destinations",
        subtitle: "Explore top travel spots worldwide",
        nameLabel: "Destination",
        priceLabel: "From $X/night",
        dataSourceSuffixLabel: "from DB",
        viewDetailsLabel: "View Details",
        featuredLabel: "Featured",
      },
      featuredHotels: {
        title: "Featured Hotels",
        subtitle: "Handpicked properties for your next stay",
        emptyLabel: "No featured hotels available at the moment.",
      },
      featuredGuide: {
        title: "Discover Your Destination",
        subtitle: "Travel guide powered by Wikivoyage",
        poweredByLabel: "Powered by Wikivoyage",
      },
      trending: {
        title: "Trending Destinations",
        tabs: ["All", "Cities", "Regions", "Countries"],
        columnLabels: {
          primary: "Most Hotels",
          secondary: "Top Destinations",
          tertiary: "More Destinations",
          quaternary: "Explore More",
          countLabel: "hotels",
        },
      },
    },
  },
};

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function ContentSettings() {
  const { canManageRoute } = useAccessControl();
  const canManageContent = canManageRoute("/system/content-settings");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rawContentJson, setRawContentJson] = useState<string>(
    JSON.stringify(DEFAULT_CONTENT_CONFIG, null, 2),
  );

  const parsedPreview = useMemo(
    () => safeJsonParse(rawContentJson, DEFAULT_CONTENT_CONFIG),
    [rawContentJson],
  );

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get("/branding/settings");
      const payload =
        response?.data?.data && typeof response.data.data === "object"
          ? response.data.data
          : response.data;
      const content =
        payload?.content && typeof payload.content === "object"
          ? payload.content
          : DEFAULT_CONTENT_CONFIG;
      setRawContentJson(JSON.stringify(content, null, 2));
    } catch (error) {
      console.error("Failed to load content settings", error);
      toast.error("Failed to load content settings");
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

      const response = await api.get("/branding/settings");
      const payload =
        response?.data?.data && typeof response.data.data === "object"
          ? response.data.data
          : response.data || {};

      const nextPayload = {
        ...payload,
        content: parsedContent,
      };

      await api.post("/branding/settings", nextPayload);
      toast.success("Content settings saved");
    } catch (error) {
      console.error("Failed to save content settings", error);
      toast.error("Invalid JSON or save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Content Settings
          </h1>
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
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Reload
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || saving || !canManageContent}
          >
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-0 gap-2">
          <CardTitle>Content JSON</CardTitle>
          <CardDescription>
            Edit JSON for `helpCenter`, `alerts`, `profile`, `loyalty`,
            `searchLoading`, `dashboard`, `accountSettings`, and `marketing`.
            This configuration is loaded by the booking engine at runtime.
            Search/trip labels are under `marketing.home.searchFormLabels`,
            `marketing.flightHome.searchFormLabels`,
            `marketing.flightHome.tripTypeLabels`,
            `marketing.hotelHome.searchFormLabels`, and
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
            onChange={(e) => setRawContentJson(e.target.value)}
            className="min-h-[420px] font-mono text-xs"
            disabled={!canManageContent}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-0 gap-2">
          <CardTitle>Preview Summary</CardTitle>
          <CardDescription>
            Quick sanity check before publishing.
          </CardDescription>
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
              {Array.isArray(parsedPreview?.alerts?.items)
                ? parsedPreview.alerts.items.length
                : 0}
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
              {Array.isArray(
                parsedPreview?.accountSettings?.paymentsDefaults?.savedCards,
              )
                ? parsedPreview.accountSettings.paymentsDefaults.savedCards
                    .length
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
