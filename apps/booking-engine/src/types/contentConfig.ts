export interface HelpCategoryConfig {
  title: string;
  desc: string;
  icon?: string;
}

export interface HelpFaqConfig {
  q: string;
  a: string;
}

export interface HelpContactConfig {
  phone: string;
  email: string;
  chatLabel: string;
}

export interface AlertsSubscriptionConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  channels: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  category: string;
}

export interface AlertsItemConfig {
  id: string;
  type:
    | "price_drop"
    | "price_increase"
    | "booking_status"
    | "reminder"
    | "promotion"
    | "system";
  title: string;
  message: string;
  productType: "flight" | "hotel" | "car" | "all";
  status: "active" | "paused" | "triggered" | "expired";
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

export interface ProfileOptionsConfig {
  countryCodes: string[];
  countries: string[];
  currencies: string[];
  hotelCategories: string[];
  locationPreferenceTags: string[];
}

export interface LoyaltyCouponConfig {
  id: string;
  type: string;
  discount: string;
  desc: string;
  valid: string;
}

export interface LoyaltyTransactionConfig {
  id: string;
  type: string;
  points: number;
  description: string;
  date: string;
  status: string;
}

export interface LoyaltyContentConfig {
  coupons: LoyaltyCouponConfig[];
  transactionHistory: LoyaltyTransactionConfig[];
}

export interface SearchLoadingContentConfig {
  flightTips: string[];
  hotelTips: string[];
}

export interface DashboardContentConfig {
  title: string;
  subtitle: string;
  actions: {
    loyalty: string;
    alerts: string;
    bookings: string;
    wallet: string;
  };
  cards: {
    totalBookings: string;
    flights: string;
    hotels: string;
    cars: string;
    walletSnapshot: string;
    noWallets: string;
    viewWallet: string;
    topUps: string;
    documents: string;
    documentsHint: string;
    manageDocuments: string;
  };
  chart: {
    title: string;
    subtitle: string;
    snapshot: string;
    flights: string;
    hotels: string;
    cars: string;
  };
  recentBookings: {
    title: string;
    subtitle: string;
    empty: string;
    bookingFallback: string;
    idPrefix: string;
  };
}

export interface AccountSettingsContentConfig {
  title: string;
  subtitle: string;
  tabs: {
    profile: string;
    security: string;
    payments: string;
    notifications: string;
    documents: string;
    api: string;
  };
  profileDefaults: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  paymentsDefaults: {
    savedCards: Array<{
      id: string;
      brand: string;
      last4: string;
      exp: string;
      currency: string;
      balance?: number;
    }>;
  };
  notificationsDefaults: {
    marketing: boolean;
    bookingUpdates: boolean;
    promoSms: boolean;
  };
  apiDefaults: Array<{
    id: string;
    label: string;
    key: string;
    created: string;
  }>;
}

export interface HomeMarketingContentConfig {
  nav: {
    brandName: string;
    flights: string;
    hotels: string;
    packages: string;
    cars: string;
    aiSearchLabel: string;
  };
  hero: {
    badge: string;
    title: string;
    subtitle: string;
  };
  tabs: {
    flights: string;
    hotels: string;
    packages: string;
    cars: string;
  };
  searchFormLabels: {
    flight: {
      from: string;
      originPlaceholder: string;
      to: string;
      destinationPlaceholder: string;
      departure: string;
      return: string;
      searchCtaLabel: string;
      disabledLabel: string;
    };
    hotel: {
      destination: string;
      destinationPlaceholder: string;
      checkIn: string;
      checkOut: string;
      searchCtaLabel: string;
      disabledLabel: string;
    };
  };
  packages: {
    title: string;
    subtitle: string;
    ctaLabel: string;
  };
  cars: {
    title: string;
    subtitle: string;
    ctaLabel: string;
  };
  popularDestinations: {
    title: string;
    subtitle: string;
    viewAllLabel: string;
    nameLabel: string;
    priceLabel: string;
    flightsFromLabel: string;
    dataSourceSuffixLabel: string;
    viewDetailsLabel: string;
    featuredLabel: string;
  };
  featuredFlights: {
    title: string;
    emptyLabel: string;
    perPersonLabel: string;
    directLabel: string;
    stopSuffix: string;
    viewDetailsLabel: string;
  };
}

export interface FlightHomeMarketingContentConfig {
  searchFormLabels: {
    departure: string;
    return: string;
    fromPlaceholder: string;
    toPlaceholder: string;
    legFromLabel: string;
    legToLabel: string;
    searchCtaLabel: string;
    searchMultiCityCtaLabel: string;
    removeLegLabel: string;
    addLegLabel: string;
  };
  tripTypeLabels: {
    oneWay: string;
    roundTrip: string;
    multiCity: string;
  };
  heroTitle: string;
  heroSubtitle: string;
  disabledTitle: string;
  disabledSubtitle: string;
  backToHomeLabel: string;
  tabs: {
    stays: string;
    flights: string;
  };
  benefits: Array<{
    title: string;
    subtitle: string;
  }>;
  popularFlights: {
    title: string;
    subtitle: string;
  };
  featuredGuide: {
    title: string;
    subtitle: string;
    poweredByLabel: string;
  };
  trending: {
    title: string;
    tabs: string[];
    columnLabels: {
      primary: string;
      secondary: string;
      tertiary: string;
      quaternary: string;
      countLabel: string;
    };
  };
}

export interface HotelHomeMarketingContentConfig {
  searchFormLabels: {
    checkIn: string;
    checkOut: string;
    destinationPlaceholder: string;
    searchCtaLabel: string;
    loadingDestinationsLabel: string;
    errorLoadingDestinationsLabel: string;
    loadingHotelsLabel: string;
  };
  tripTypeLabels: {
    oneWay: string;
    roundTrip: string;
    multiCity: string;
  };
  badge: string;
  heroTitle: string;
  heroSubtitle: string;
  disabledTitle: string;
  disabledSubtitle: string;
  backToHomeLabel: string;
  tabs: {
    stays: string;
    flights: string;
  };
  benefits: Array<{
    title: string;
    subtitle: string;
  }>;
  deals: {
    title: string;
    ctaLabel: string;
    spotlightTitle: string;
    spotlightDescription: string;
    imageUrls: string[];
  };
  popularDestinations: {
    title: string;
    subtitle: string;
    nameLabel: string;
    priceLabel: string;
    dataSourceSuffixLabel: string;
    viewDetailsLabel: string;
    featuredLabel: string;
  };
  featuredHotels: {
    title: string;
    subtitle: string;
    emptyLabel: string;
  };
  featuredGuide: {
    title: string;
    subtitle: string;
    poweredByLabel: string;
  };
  trending: {
    title: string;
    tabs: string[];
    columnLabels: {
      primary: string;
      secondary: string;
      tertiary: string;
      quaternary: string;
      countLabel: string;
    };
  };
}

export interface MarketingContentConfig {
  home: HomeMarketingContentConfig;
  flightHome: FlightHomeMarketingContentConfig;
  hotelHome: HotelHomeMarketingContentConfig;
}

export interface TenantContentConfig {
  helpCenter: {
    categories: HelpCategoryConfig[];
    faqs: HelpFaqConfig[];
    contact: HelpContactConfig;
  };
  alerts: {
    subscriptions: AlertsSubscriptionConfig[];
    items: AlertsItemConfig[];
  };
  profile: {
    options: ProfileOptionsConfig;
  };
  loyalty: LoyaltyContentConfig;
  searchLoading: SearchLoadingContentConfig;
  dashboard: DashboardContentConfig;
  accountSettings: AccountSettingsContentConfig;
  marketing: MarketingContentConfig;
}
