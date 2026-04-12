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

// Move DEFAULT_CONTENT_CONFIG above normalizeContentConfig for hoisting
export const DEFAULT_CONTENT_CONFIG: TenantContentConfig = {
  helpCenter: {
    categories: [
      {
        title: 'Getting Started',
        desc: 'New here? Learn the basics of booking and managing your trips.',
        icon: '🚀',
      },
      {
        title: 'Trust & Safety',
        desc: 'How we protect your data and ensure secure transactions.',
        icon: '🛡️',
      },
      {
        title: 'Travel Policies',
        desc: 'Understanding refunds, cancellations, and visa requirements.',
        icon: '📜',
      },
      {
        title: 'TripLoger Elite',
        desc: 'Exclusive perks and loyalty program benefits for our members.',
        icon: '✨',
      },
    ],
    faqs: [
      {
        q: 'How do I cancel my booking and get a refund?',
        a: 'You can cancel most bookings through your dashboard under My Bookings.',
      },
      {
        q: 'Can I change my flight dates after booking?',
        a: 'Yes, date changes are possible for most tickets, though fare differences may apply.',
      },
    ],
    contact: {
      phone: '+966 800 123 4567',
      email: 'support@triploger.com',
      chatLabel: 'Startup a Conversation',
    },
  },
  alerts: {
    subscriptions: [
      {
        id: 'sub-1',
        name: 'Price Drop Alerts',
        description: 'Get notified when prices drop for your saved routes',
        enabled: true,
        channels: { email: true, push: true, sms: false },
        category: 'price',
      },
    ],
    items: [
      {
        id: 'alert-1',
        type: 'price_drop',
        title: 'Price dropped for DXB → LHR',
        message: 'Flight price dropped by $45! New price: $289',
        productType: 'flight',
        status: 'triggered',
        createdAt: '2024-01-15T10:00:00Z',
        triggeredAt: '2024-01-16T14:30:00Z',
        expiresAt: '2024-01-20T23:59:59Z',
        criteria: { origin: 'DXB', destination: 'LHR', maxPrice: 300 },
      },
      {
        id: 'alert-2',
        type: 'price_drop',
        title: 'Price alert for Paris hotels',
        message: 'Hotel prices in Paris dropped below $150/night',
        productType: 'hotel',
        status: 'active',
        createdAt: '2024-01-18T08:00:00Z',
        expiresAt: '2024-01-25T23:59:59Z',
        criteria: { destination: 'Paris', maxPrice: 150 },
      },
      {
        id: 'alert-3',
        type: 'booking_status',
        title: 'Booking confirmed - TL-000101',
        message: 'Your flight booking has been confirmed',
        productType: 'flight',
        status: 'triggered',
        createdAt: '2024-01-10T12:00:00Z',
        triggeredAt: '2024-01-10T12:05:00Z',
      },
      {
        id: 'alert-4',
        type: 'reminder',
        title: 'Flight departure reminder',
        message: 'Your flight to London departs in 48 hours',
        productType: 'flight',
        status: 'active',
        createdAt: '2024-01-19T10:00:00Z',
        expiresAt: '2024-01-21T10:00:00Z',
      },
      {
        id: 'alert-5',
        type: 'price_increase',
        title: 'Price increased for NYC → SFO',
        message: 'Flight price increased by $80. Current price: $420',
        productType: 'flight',
        status: 'expired',
        createdAt: '2024-01-05T09:00:00Z',
        triggeredAt: '2024-01-17T16:00:00Z',
      },
    ],
  },
  profile: {
    options: {
      countryCodes: ['+1', '+44', '+61', '+91', '+86'],
      countries: ['United States', 'United Kingdom', 'Australia', 'India', 'Canada'],
      currencies: ['USD', 'EUR', 'GBP', 'AED'],
      hotelCategories: ['Any', '1 star', '2 star', '3 star', '4 star', '5 star'],
      locationPreferenceTags: [
        'Beach',
        'Snow',
        'City',
        'Cruises',
        'Mountains',
        'Citycenter',
        'Suburbs',
        'Seaside',
      ],
    },
  },
  loyalty: {
    coupons: [
      {
        id: 'SAVE10',
        type: 'Percentage',
        discount: '10%',
        desc: 'Save 10% on your next booking',
        valid: '28 Feb 2026',
      },
      {
        id: 'FLAT50',
        type: 'Fixed',
        discount: '$50',
        desc: '$50 off flights above $500',
        valid: '15 Mar 2026',
      },
    ],
    transactionHistory: [
      {
        id: 'txn-1',
        type: 'earn',
        points: 500,
        description: 'Flight booking DXB-LHR',
        date: '2024-01-15',
        status: 'Completed',
      },
      {
        id: 'txn-2',
        type: 'redeem',
        points: -200,
        description: 'Hotel discount',
        date: '2024-01-10',
        status: 'Completed',
      },
      {
        id: 'txn-3',
        type: 'earn',
        points: 150,
        description: 'Hotel booking Paris',
        date: '2024-01-05',
        status: 'Completed',
      },
    ],
  },
  searchLoading: {
    flightTips: [
      '💡 Tip: Book flights on Tuesdays for better deals',
      '💡 Tip: Clear your browser cookies for lower prices',
      '💡 Tip: Use incognito mode for flight searches',
      '💡 Tip: Compare prices across multiple dates',
      '💡 Tip: Consider nearby airports for savings',
      '💡 Tip: Book 6-8 weeks in advance for best prices',
    ],
    hotelTips: [
      '💡 Tip: Book hotels on weekdays for better rates',
      '💡 Tip: Check for free cancellation options',
      '💡 Tip: Compare prices across different dates',
      '💡 Tip: Look for hotels with free breakfast',
      '💡 Tip: Consider staying slightly outside city center',
      '💡 Tip: Read recent guest reviews before booking',
    ],
  },
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Overview of your travel activity, wallet and documents.',
    actions: {
      loyalty: 'Loyalty',
      alerts: 'Alerts',
      bookings: 'Bookings',
      wallet: 'Wallet',
    },
    cards: {
      totalBookings: 'Total bookings',
      flights: 'Flights',
      hotels: 'Hotels',
      cars: 'Cars',
      walletSnapshot: 'Wallet snapshot',
      noWallets: 'No wallets available',
      viewWallet: 'View wallet',
      topUps: 'Top-ups',
      documents: 'Documents',
      documentsHint: 'Passport, visa, residency, cards',
      manageDocuments: 'Manage documents',
    },
    chart: {
      title: 'Bookings by product',
      subtitle: 'Last 12 months (mock)',
      snapshot: 'Snapshot',
      flights: 'Flights',
      hotels: 'Hotels',
      cars: 'Cars',
    },
    recentBookings: {
      title: 'Recent bookings',
      subtitle: 'Latest activity',
      empty: 'No recent bookings',
      bookingFallback: 'Booking',
      idPrefix: 'ID:',
    },
  },
  accountSettings: {
    title: 'Account settings',
    subtitle: 'Manage profile, security, wallet and developer keys.',
    tabs: {
      profile: 'Profile',
      security: 'Security',
      payments: 'Payment Methods',
      notifications: 'Notifications',
      documents: 'Documents',
      api: 'API Keys',
    },
    profileDefaults: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'user@example.com',
      phone: '+1 555 123 4567',
    },
    paymentsDefaults: {
      savedCards: [
        {
          id: 'c1',
          brand: 'Visa',
          last4: '4242',
          exp: '12/26',
          currency: 'USD',
          balance: 120.5,
        },
        {
          id: 'c2',
          brand: 'Mastercard',
          last4: '8888',
          exp: '08/25',
          currency: 'USD',
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
        id: 'k1',
        label: 'Default key',
        key: 'sk_live_xxx...xyz',
        created: '2024-12-01',
      },
    ],
  },
  marketing: {
    home: {
      nav: {
        brandName: 'TripAlfa',
        flights: 'Flights',
        hotels: 'Hotels',
        packages: 'Packages',
        cars: 'Cars',
        aiSearchLabel: 'AI Search',
      },
      hero: {
        badge: 'AI-Powered Travel Search',
        title: 'Book flights, hotels, and experiences',
        subtitle: 'Discover the best deals with our intelligent search technology',
      },
      tabs: {
        flights: 'Flights',
        hotels: 'Hotels',
        packages: 'Packages',
        cars: 'Cars',
      },
      searchFormLabels: {
        flight: {
          from: 'From',
          originPlaceholder: 'Origin',
          to: 'To',
          destinationPlaceholder: 'Destination',
          departure: 'Departure',
          return: 'Return',
          searchCtaLabel: 'Search',
          disabledLabel: 'Flight booking is currently disabled by admin settings.',
        },
        hotel: {
          destination: 'Destination',
          destinationPlaceholder: 'Where are you going?',
          checkIn: 'Check-in',
          checkOut: 'Check-out',
          searchCtaLabel: 'Search',
          disabledLabel: 'Hotel booking is currently disabled by admin settings.',
        },
      },
      packages: {
        title: 'AI-Powered Package Deals',
        subtitle: 'Let our AI find the perfect combination for your trip.',
        ctaLabel: 'Discover Packages',
      },
      cars: {
        title: 'Rent a Car',
        subtitle: 'Find the perfect vehicle for your journey.',
        ctaLabel: 'Search Cars',
      },
      popularDestinations: {
        title: 'Popular Destinations',
        subtitle: 'Explore our most visited locations',
        viewAllLabel: 'View All',
        nameLabel: 'Destination',
        priceLabel: 'From $X/night',
        flightsFromLabel: 'Flights from',
        dataSourceSuffixLabel: 'from DB',
        viewDetailsLabel: 'View Details',
        featuredLabel: 'Featured',
      },
      featuredFlights: {
        title: 'Latest Flight Deals',
        emptyLabel: 'No flight deals found at the moment',
        perPersonLabel: 'per person',
        directLabel: 'Direct',
        stopSuffix: 'Stop',
        viewDetailsLabel: 'View Details',
      },
    },
    hotelHome: {
      searchFormLabels: {
        checkIn: 'Check-in',
        checkOut: 'Check-out',
        destinationPlaceholder: 'City, Property, District or Address',
        searchCtaLabel: 'Search',
        loadingDestinationsLabel: 'Loading destinations...',
        errorLoadingDestinationsLabel: 'Unable to load destinations. Please try again later.',
        loadingHotelsLabel: 'Loading hotels...',
      },
      tripTypeLabels: {
        oneWay: 'One Way',
        roundTrip: 'Round Trip',
        multiCity: 'Multi City',
      },
      badge: 'Hotel Deals',
      heroTitle: 'Find the perfect place to stay',
      heroSubtitle: 'Explore our best hotel offers',
      disabledTitle: 'Hotel Booking Disabled',
      disabledSubtitle: 'Hotel booking is currently disabled by your admin settings.',
      backToHomeLabel: 'Back to Home',
      tabs: {
        stays: 'Stays',
        flights: 'Flights',
      },
      benefits: [
        {
          title: 'Search a huge selection',
          subtitle: 'Easily compare hotels, prices, and find the best deals.',
        },
        {
          title: 'Pay no hidden fees',
          subtitle: 'Get the clearest price display with no hidden costs.',
        },
        {
          title: 'Get more flexibility',
          subtitle: 'Change your dates or cancel easily with select providers.',
        },
      ],
      deals: {
        title: 'Cheap Hotel deals in popular destinations',
        ctaLabel: 'Read More',
        spotlightTitle: 'Backpacking Sri Lanka',
        spotlightDescription:
          "Traveling is a unique experience as it's the best way to unplug from the pushes and pulls of daily life. It helps us to forget about our problems, frustrations, and fears at home. During our journey, we experience life in different ways. We explore new places, cultures, cuisines, traditions, and ways of living.",
        imageUrls: [
          'https://images.unsplash.com/photo-1546737033-07416763823d?auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1572455044327-7348c1be7267?auto=format&fit=crop&q=80',
        ],
      },
      popularDestinations: {
        title: 'Popular Destinations',
        subtitle: 'Explore top travel spots worldwide',
        nameLabel: 'Destination',
        priceLabel: 'From $X/night',
        dataSourceSuffixLabel: 'from DB',
        viewDetailsLabel: 'View Details',
        featuredLabel: 'Featured',
      },
      featuredHotels: {
        title: 'Featured Hotels',
        subtitle: 'Handpicked properties for your next stay',
        emptyLabel: 'No featured hotels available at the moment.',
      },
      featuredGuide: {
        title: 'Discover Your Destination',
        subtitle: 'Travel guide powered by Wikivoyage',
        poweredByLabel: 'Powered by Wikivoyage',
      },
      trending: {
        title: 'Trending Destinations',
        tabs: ['All', 'Cities', 'Regions', 'Countries'],
        columnLabels: {
          primary: 'Most Hotels',
          secondary: 'Top Destinations',
          tertiary: 'More Destinations',
          quaternary: 'Explore More',
          countLabel: 'hotels',
        },
      },
    },
    flightHome: {
      heroTitle: 'Compare and book flights with ease',
      heroSubtitle: 'Discover your next dream destination',
      disabledTitle: 'Flight Booking Disabled',
      disabledSubtitle: 'Flight booking is currently disabled by your admin settings.',
      backToHomeLabel: 'Back to Home',
      tabs: {
        stays: 'Stays',
        flights: 'Flights',
      },
      benefits: [
        {
          title: 'Search a huge selection',
          subtitle: 'Easily compare flights, airlines, and find the cheapest ones.',
        },
        {
          title: 'Pay no hidden fees',
          subtitle: 'Get the clearest price display with no hidden costs.',
        },
        {
          title: 'Get more flexibility',
          subtitle: 'Change your dates or cancel easily with select providers.',
        },
      ],
      searchFormLabels: {
        departure: 'Departure',
        return: 'Return',
        fromPlaceholder: 'From where?',
        toPlaceholder: 'To where?',
        legFromLabel: 'From',
        legToLabel: 'To',
        searchCtaLabel: 'Search',
        searchMultiCityCtaLabel: 'Search',
        removeLegLabel: 'Remove',
        addLegLabel: '+ Add another leg',
      },
      tripTypeLabels: {
        oneWay: 'One Way',
        roundTrip: 'Round Trip',
        multiCity: 'Multi City',
      },
      popularFlights: {
        title: 'Popular flights in top destinations',
        subtitle: 'Find deals on domestic and international flights',
      },
      featuredGuide: {
        title: 'Discover Your Next Destination',
        subtitle: 'Travel guide from Wikivoyage',
        poweredByLabel: 'Powered by Wikivoyage',
      },
      trending: {
        title: 'Trending Destinations',
        tabs: ['All', 'Cities', 'Regions', 'Countries'],
        columnLabels: {
          primary: 'Most Hotels',
          secondary: 'Top Destinations',
          tertiary: 'More Destinations',
          quaternary: 'Explore More',
          countLabel: 'hotels',
        },
      },
    },
  },
};
