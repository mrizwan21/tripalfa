import { api } from '@/lib/api';
import {
  DEFAULT_CONTENT_CONFIG,
  type TenantContentConfig,
  type AlertsItemConfig,
} from '@tripalfa/shared-types';

export { DEFAULT_CONTENT_CONFIG };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeContentConfig(value: unknown): TenantContentConfig {
  if (!isObject(value)) return DEFAULT_CONTENT_CONFIG;

  const helpCenter = isObject(value.helpCenter) ? value.helpCenter : {};
  const alerts = isObject(value.alerts) ? value.alerts : {};

  const categories = Array.isArray(helpCenter.categories)
    ? helpCenter.categories
        .filter(isObject)
        .map(item => ({
          title: typeof item.title === 'string' ? item.title : '',
          desc: typeof item.desc === 'string' ? item.desc : '',
          icon: typeof item.icon === 'string' && item.icon.trim() ? item.icon : '❔',
        }))
        .filter(item => item.title && item.desc)
    : DEFAULT_CONTENT_CONFIG.helpCenter.categories;

  const faqs = Array.isArray(helpCenter.faqs)
    ? helpCenter.faqs
        .filter(isObject)
        .map(item => ({
          q: typeof item.q === 'string' ? item.q : '',
          a: typeof item.a === 'string' ? item.a : '',
        }))
        .filter(item => item.q && item.a)
    : DEFAULT_CONTENT_CONFIG.helpCenter.faqs;

  const contact = isObject(helpCenter.contact) ? helpCenter.contact : {};
  const profile = isObject(value.profile) ? value.profile : {};
  const profileOptions = isObject(profile.options) ? profile.options : {};
  const loyalty = isObject(value.loyalty) ? value.loyalty : {};
  const searchLoading = isObject(value.searchLoading) ? value.searchLoading : {};
  const dashboard = isObject(value.dashboard) ? value.dashboard : {};
  const dashboardActions = isObject(dashboard.actions) ? dashboard.actions : {};
  const dashboardCards = isObject(dashboard.cards) ? dashboard.cards : {};
  const dashboardChart = isObject(dashboard.chart) ? dashboard.chart : {};
  const dashboardRecentBookings = isObject(dashboard.recentBookings)
    ? dashboard.recentBookings
    : {};
  const accountSettings = isObject(value.accountSettings) ? value.accountSettings : {};
  const accountSettingsTabs = isObject(accountSettings.tabs) ? accountSettings.tabs : {};
  const accountSettingsProfileDefaults = isObject(accountSettings.profileDefaults)
    ? accountSettings.profileDefaults
    : {};
  const accountSettingsPaymentsDefaults = isObject(accountSettings.paymentsDefaults)
    ? accountSettings.paymentsDefaults
    : {};
  const accountSettingsNotificationsDefaults = isObject(accountSettings.notificationsDefaults)
    ? accountSettings.notificationsDefaults
    : {};
  const marketing = isObject(value.marketing) ? value.marketing : {};
  const marketingHome = isObject(marketing.home) ? marketing.home : {};
  const marketingHomeNav = isObject(marketingHome.nav) ? marketingHome.nav : {};
  const marketingHomeHero = isObject(marketingHome.hero) ? marketingHome.hero : {};
  const marketingHomeTabs = isObject(marketingHome.tabs) ? marketingHome.tabs : {};
  const marketingHomeSearchFormLabels = isObject(marketingHome.searchFormLabels)
    ? marketingHome.searchFormLabels
    : {};
  const marketingHomePackages = isObject(marketingHome.packages) ? marketingHome.packages : {};
  const marketingHomeCars = isObject(marketingHome.cars) ? marketingHome.cars : {};
  const marketingHomePopularDestinations = isObject(marketingHome.popularDestinations)
    ? marketingHome.popularDestinations
    : {};
  // Declare after marketingHotelHome is defined (only once)
  // Already declared below after marketingHotelHome
  const marketingHomeFeaturedFlights = isObject(marketingHome.featuredFlights)
    ? marketingHome.featuredFlights
    : {};
  const marketingFlightHome = isObject(marketing.flightHome) ? marketing.flightHome : {};
  const marketingFlightTabs = isObject(marketingFlightHome.tabs) ? marketingFlightHome.tabs : {};
  const marketingFlightPopularFlights = isObject(marketingFlightHome.popularFlights)
    ? marketingFlightHome.popularFlights
    : {};
  const marketingFlightFeaturedGuide = isObject(marketingFlightHome.featuredGuide)
    ? marketingFlightHome.featuredGuide
    : {};
  const marketingFlightTrending = isObject(marketingFlightHome.trending)
    ? marketingFlightHome.trending
    : {};
  const marketingFlightTrendingColumns = isObject(marketingFlightTrending.columnLabels)
    ? marketingFlightTrending.columnLabels
    : {};
  const marketingFlightTrendingTabs = Array.isArray(marketingFlightTrending.tabs)
    ? marketingFlightTrending.tabs
    : [];
  const marketingHotelHome = isObject(marketing.hotelHome) ? marketing.hotelHome : {};
  const marketingHotelTabs = isObject(marketingHotelHome.tabs) ? marketingHotelHome.tabs : {};
  const marketingHotelDeals = isObject(marketingHotelHome.deals) ? marketingHotelHome.deals : {};
  const marketingHotelDealsImages = Array.isArray(marketingHotelDeals.imageUrls)
    ? marketingHotelDeals.imageUrls
    : [];
  const marketingHotelPopularDestinations = isObject(marketingHotelHome.popularDestinations)
    ? marketingHotelHome.popularDestinations
    : {};
  const marketingHotelFeaturedHotels = isObject(marketingHotelHome.featuredHotels)
    ? marketingHotelHome.featuredHotels
    : {};
  const marketingHotelFeaturedGuide = isObject(marketingHotelHome.featuredGuide)
    ? marketingHotelHome.featuredGuide
    : {};
  const marketingHotelTrending = isObject(marketingHotelHome.trending)
    ? marketingHotelHome.trending
    : {};
  const marketingHotelTrendingColumns = isObject(marketingHotelTrending.columnLabels)
    ? marketingHotelTrending.columnLabels
    : {};
  const marketingHotelTrendingTabs = Array.isArray(marketingHotelTrending.tabs)
    ? marketingHotelTrending.tabs
    : [];

  const subscriptions = Array.isArray(alerts.subscriptions)
    ? alerts.subscriptions
        .filter(isObject)
        .map(item => ({
          id: typeof item.id === 'string' ? item.id : '',
          name: typeof item.name === 'string' ? item.name : '',
          description: typeof item.description === 'string' ? item.description : '',
          enabled: item.enabled !== false,
          channels: {
            email: isObject(item.channels) ? item.channels.email !== false : true,
            push: isObject(item.channels) ? item.channels.push !== false : true,
            sms: isObject(item.channels) ? item.channels.sms === true : false,
          },
          category: typeof item.category === 'string' ? item.category : 'system',
        }))
        .filter(item => item.id && item.name)
    : DEFAULT_CONTENT_CONFIG.alerts.subscriptions;

  const alertTypes = [
    'price_drop',
    'price_increase',
    'booking_status',
    'reminder',
    'promotion',
    'system',
  ] as const;
  const alertProductTypes = ['flight', 'hotel', 'car', 'all'] as const;
  const alertStatuses = ['active', 'paused', 'triggered', 'expired'] as const;

  const items: AlertsItemConfig[] = Array.isArray(alerts.items)
    ? alerts.items
        .filter(isObject)
        .map(item => {
          const type =
            typeof item.type === 'string' && (alertTypes as readonly string[]).includes(item.type)
              ? (item.type as AlertsItemConfig['type'])
              : ('system' as AlertsItemConfig['type']);
          const productType =
            typeof item.productType === 'string' &&
            (alertProductTypes as readonly string[]).includes(item.productType)
              ? (item.productType as AlertsItemConfig['productType'])
              : ('all' as AlertsItemConfig['productType']);
          const status =
            typeof item.status === 'string' &&
            (alertStatuses as readonly string[]).includes(item.status)
              ? (item.status as AlertsItemConfig['status'])
              : ('active' as AlertsItemConfig['status']);

          const criteria = isObject(item.criteria) ? item.criteria : {};

          return {
            id: typeof item.id === 'string' ? item.id : '',
            type,
            title: typeof item.title === 'string' ? item.title : '',
            message: typeof item.message === 'string' ? item.message : '',
            productType,
            status,
            createdAt: typeof item.createdAt === 'string' ? item.createdAt : '',
            triggeredAt: typeof item.triggeredAt === 'string' ? item.triggeredAt : undefined,
            expiresAt: typeof item.expiresAt === 'string' ? item.expiresAt : undefined,
            criteria: {
              origin: typeof criteria.origin === 'string' ? criteria.origin : undefined,
              destination:
                typeof criteria.destination === 'string' ? criteria.destination : undefined,
              maxPrice: typeof criteria.maxPrice === 'number' ? criteria.maxPrice : undefined,
              minPrice: typeof criteria.minPrice === 'number' ? criteria.minPrice : undefined,
            },
          };
        })
        .filter(item => item.id && item.title && item.message)
    : DEFAULT_CONTENT_CONFIG.alerts.items;

  const parseStringList = (raw: unknown, fallback: string[]) => {
    if (!Array.isArray(raw)) return fallback;
    const values = raw
      .filter((item): item is string => typeof item === 'string')
      .map(item => item.trim())
      .filter(Boolean);
    return values.length ? values : fallback;
  };

  const parseBenefits = (raw: unknown, fallback: Array<{ title: string; subtitle: string }>) => {
    if (!Array.isArray(raw)) return fallback;
    const values = raw
      .filter(isObject)
      .map(item => ({
        title: typeof item.title === 'string' ? item.title : '',
        subtitle: typeof item.subtitle === 'string' ? item.subtitle : '',
      }))
      .filter(item => item.title && item.subtitle);
    return values.length ? values : fallback;
  };

  const parseColumnLabels = (
    raw: Record<string, unknown>,
    fallback: {
      primary: string;
      secondary: string;
      tertiary: string;
      quaternary: string;
      countLabel: string;
    }
  ) => ({
    primary: typeof raw.primary === 'string' ? raw.primary : fallback.primary,
    secondary: typeof raw.secondary === 'string' ? raw.secondary : fallback.secondary,
    tertiary: typeof raw.tertiary === 'string' ? raw.tertiary : fallback.tertiary,
    quaternary: typeof raw.quaternary === 'string' ? raw.quaternary : fallback.quaternary,
    countLabel: typeof raw.countLabel === 'string' ? raw.countLabel : fallback.countLabel,
  });

  const coupons = Array.isArray(loyalty.coupons)
    ? loyalty.coupons
        .filter(isObject)
        .map(item => ({
          id: typeof item.id === 'string' ? item.id : '',
          type: typeof item.type === 'string' ? item.type : '',
          discount: typeof item.discount === 'string' ? item.discount : '',
          desc: typeof item.desc === 'string' ? item.desc : '',
          valid: typeof item.valid === 'string' ? item.valid : '',
        }))
        .filter(item => item.id && item.desc)
    : DEFAULT_CONTENT_CONFIG.loyalty.coupons;

  const transactionHistory = Array.isArray(loyalty.transactionHistory)
    ? loyalty.transactionHistory
        .filter(isObject)
        .map(item => ({
          id: typeof item.id === 'string' ? item.id : '',
          type: typeof item.type === 'string' ? item.type : 'earn',
          points: typeof item.points === 'number' ? item.points : 0,
          description: typeof item.description === 'string' ? item.description : '',
          date: typeof item.date === 'string' ? item.date : '',
          status: typeof item.status === 'string' ? item.status : 'Completed',
        }))
        .filter(item => item.id && item.description)
    : DEFAULT_CONTENT_CONFIG.loyalty.transactionHistory;

  const accountSavedCards = Array.isArray(accountSettingsPaymentsDefaults.savedCards)
    ? accountSettingsPaymentsDefaults.savedCards
        .filter(isObject)
        .map(item => ({
          id: typeof item.id === 'string' ? item.id : '',
          brand: typeof item.brand === 'string' ? item.brand : '',
          last4: typeof item.last4 === 'string' ? item.last4 : '',
          exp: typeof item.exp === 'string' ? item.exp : '',
          currency: typeof item.currency === 'string' ? item.currency : 'USD',
          balance: typeof item.balance === 'number' ? item.balance : undefined,
        }))
        .filter(item => item.id && item.brand && item.last4)
    : DEFAULT_CONTENT_CONFIG.accountSettings.paymentsDefaults.savedCards;

  const accountApiDefaults = Array.isArray(accountSettings.apiDefaults)
    ? accountSettings.apiDefaults
        .filter(isObject)
        .map(item => ({
          id: typeof item.id === 'string' ? item.id : '',
          label: typeof item.label === 'string' ? item.label : '',
          key: typeof item.key === 'string' ? item.key : '',
          created: typeof item.created === 'string' ? item.created : '',
        }))
        .filter(item => item.id && item.label && item.key)
    : DEFAULT_CONTENT_CONFIG.accountSettings.apiDefaults;

  return {
    helpCenter: {
      categories: categories.length ? categories : DEFAULT_CONTENT_CONFIG.helpCenter.categories,
      faqs: faqs.length ? faqs : DEFAULT_CONTENT_CONFIG.helpCenter.faqs,
      contact: {
        phone:
          typeof contact.phone === 'string'
            ? contact.phone
            : DEFAULT_CONTENT_CONFIG.helpCenter.contact.phone,
        email:
          typeof contact.email === 'string'
            ? contact.email
            : DEFAULT_CONTENT_CONFIG.helpCenter.contact.email,
        chatLabel:
          typeof contact.chatLabel === 'string'
            ? contact.chatLabel
            : DEFAULT_CONTENT_CONFIG.helpCenter.contact.chatLabel,
      },
    },
    alerts: {
      subscriptions: subscriptions.length
        ? subscriptions
        : DEFAULT_CONTENT_CONFIG.alerts.subscriptions,
      items: items.length ? items : DEFAULT_CONTENT_CONFIG.alerts.items,
    },
    profile: {
      options: {
        countryCodes: parseStringList(
          profileOptions.countryCodes,
          DEFAULT_CONTENT_CONFIG.profile.options.countryCodes
        ),
        countries: parseStringList(
          profileOptions.countries,
          DEFAULT_CONTENT_CONFIG.profile.options.countries
        ),
        currencies: parseStringList(
          profileOptions.currencies,
          DEFAULT_CONTENT_CONFIG.profile.options.currencies
        ),
        hotelCategories: parseStringList(
          profileOptions.hotelCategories,
          DEFAULT_CONTENT_CONFIG.profile.options.hotelCategories
        ),
        locationPreferenceTags: parseStringList(
          profileOptions.locationPreferenceTags,
          DEFAULT_CONTENT_CONFIG.profile.options.locationPreferenceTags
        ),
      },
    },
    loyalty: {
      coupons: coupons.length ? coupons : DEFAULT_CONTENT_CONFIG.loyalty.coupons,
      transactionHistory: transactionHistory.length
        ? transactionHistory
        : DEFAULT_CONTENT_CONFIG.loyalty.transactionHistory,
    },
    searchLoading: {
      flightTips: parseStringList(
        searchLoading.flightTips,
        DEFAULT_CONTENT_CONFIG.searchLoading.flightTips
      ),
      hotelTips: parseStringList(
        searchLoading.hotelTips,
        DEFAULT_CONTENT_CONFIG.searchLoading.hotelTips
      ),
    },
    dashboard: {
      title:
        typeof dashboard.title === 'string'
          ? dashboard.title
          : DEFAULT_CONTENT_CONFIG.dashboard.title,
      subtitle:
        typeof dashboard.subtitle === 'string'
          ? dashboard.subtitle
          : DEFAULT_CONTENT_CONFIG.dashboard.subtitle,
      actions: {
        loyalty:
          typeof dashboardActions.loyalty === 'string'
            ? dashboardActions.loyalty
            : DEFAULT_CONTENT_CONFIG.dashboard.actions.loyalty,
        alerts:
          typeof dashboardActions.alerts === 'string'
            ? dashboardActions.alerts
            : DEFAULT_CONTENT_CONFIG.dashboard.actions.alerts,
        bookings:
          typeof dashboardActions.bookings === 'string'
            ? dashboardActions.bookings
            : DEFAULT_CONTENT_CONFIG.dashboard.actions.bookings,
        wallet:
          typeof dashboardActions.wallet === 'string'
            ? dashboardActions.wallet
            : DEFAULT_CONTENT_CONFIG.dashboard.actions.wallet,
      },
      cards: {
        totalBookings:
          typeof dashboardCards.totalBookings === 'string'
            ? dashboardCards.totalBookings
            : DEFAULT_CONTENT_CONFIG.dashboard.cards.totalBookings,
        flights:
          typeof dashboardCards.flights === 'string'
            ? dashboardCards.flights
            : DEFAULT_CONTENT_CONFIG.dashboard.cards.flights,
        hotels:
          typeof dashboardCards.hotels === 'string'
            ? dashboardCards.hotels
            : DEFAULT_CONTENT_CONFIG.dashboard.cards.hotels,
        cars:
          typeof dashboardCards.cars === 'string'
            ? dashboardCards.cars
            : DEFAULT_CONTENT_CONFIG.dashboard.cards.cars,
        walletSnapshot:
          typeof dashboardCards.walletSnapshot === 'string'
            ? dashboardCards.walletSnapshot
            : DEFAULT_CONTENT_CONFIG.dashboard.cards.walletSnapshot,
        noWallets:
          typeof dashboardCards.noWallets === 'string'
            ? dashboardCards.noWallets
            : DEFAULT_CONTENT_CONFIG.dashboard.cards.noWallets,
        viewWallet:
          typeof dashboardCards.viewWallet === 'string'
            ? dashboardCards.viewWallet
            : DEFAULT_CONTENT_CONFIG.dashboard.cards.viewWallet,
        topUps:
          typeof dashboardCards.topUps === 'string'
            ? dashboardCards.topUps
            : DEFAULT_CONTENT_CONFIG.dashboard.cards.topUps,
        documents:
          typeof dashboardCards.documents === 'string'
            ? dashboardCards.documents
            : DEFAULT_CONTENT_CONFIG.dashboard.cards.documents,
        documentsHint:
          typeof dashboardCards.documentsHint === 'string'
            ? dashboardCards.documentsHint
            : DEFAULT_CONTENT_CONFIG.dashboard.cards.documentsHint,
        manageDocuments:
          typeof dashboardCards.manageDocuments === 'string'
            ? dashboardCards.manageDocuments
            : DEFAULT_CONTENT_CONFIG.dashboard.cards.manageDocuments,
      },
      chart: {
        title:
          typeof dashboardChart.title === 'string'
            ? dashboardChart.title
            : DEFAULT_CONTENT_CONFIG.dashboard.chart.title,
        subtitle:
          typeof dashboardChart.subtitle === 'string'
            ? dashboardChart.subtitle
            : DEFAULT_CONTENT_CONFIG.dashboard.chart.subtitle,
        snapshot:
          typeof dashboardChart.snapshot === 'string'
            ? dashboardChart.snapshot
            : DEFAULT_CONTENT_CONFIG.dashboard.chart.snapshot,
        flights:
          typeof dashboardChart.flights === 'string'
            ? dashboardChart.flights
            : DEFAULT_CONTENT_CONFIG.dashboard.chart.flights,
        hotels:
          typeof dashboardChart.hotels === 'string'
            ? dashboardChart.hotels
            : DEFAULT_CONTENT_CONFIG.dashboard.chart.hotels,
        cars:
          typeof dashboardChart.cars === 'string'
            ? dashboardChart.cars
            : DEFAULT_CONTENT_CONFIG.dashboard.chart.cars,
      },
      recentBookings: {
        title:
          typeof dashboardRecentBookings.title === 'string'
            ? dashboardRecentBookings.title
            : DEFAULT_CONTENT_CONFIG.dashboard.recentBookings.title,
        subtitle:
          typeof dashboardRecentBookings.subtitle === 'string'
            ? dashboardRecentBookings.subtitle
            : DEFAULT_CONTENT_CONFIG.dashboard.recentBookings.subtitle,
        empty:
          typeof dashboardRecentBookings.empty === 'string'
            ? dashboardRecentBookings.empty
            : DEFAULT_CONTENT_CONFIG.dashboard.recentBookings.empty,
        bookingFallback:
          typeof dashboardRecentBookings.bookingFallback === 'string'
            ? dashboardRecentBookings.bookingFallback
            : DEFAULT_CONTENT_CONFIG.dashboard.recentBookings.bookingFallback,
        idPrefix:
          typeof dashboardRecentBookings.idPrefix === 'string'
            ? dashboardRecentBookings.idPrefix
            : DEFAULT_CONTENT_CONFIG.dashboard.recentBookings.idPrefix,
      },
    },
    accountSettings: {
      title:
        typeof accountSettings.title === 'string'
          ? accountSettings.title
          : DEFAULT_CONTENT_CONFIG.accountSettings.title,
      subtitle:
        typeof accountSettings.subtitle === 'string'
          ? accountSettings.subtitle
          : DEFAULT_CONTENT_CONFIG.accountSettings.subtitle,
      tabs: {
        profile:
          typeof accountSettingsTabs.profile === 'string'
            ? accountSettingsTabs.profile
            : DEFAULT_CONTENT_CONFIG.accountSettings.tabs.profile,
        security:
          typeof accountSettingsTabs.security === 'string'
            ? accountSettingsTabs.security
            : DEFAULT_CONTENT_CONFIG.accountSettings.tabs.security,
        payments:
          typeof accountSettingsTabs.payments === 'string'
            ? accountSettingsTabs.payments
            : DEFAULT_CONTENT_CONFIG.accountSettings.tabs.payments,
        notifications:
          typeof accountSettingsTabs.notifications === 'string'
            ? accountSettingsTabs.notifications
            : DEFAULT_CONTENT_CONFIG.accountSettings.tabs.notifications,
        documents:
          typeof accountSettingsTabs.documents === 'string'
            ? accountSettingsTabs.documents
            : DEFAULT_CONTENT_CONFIG.accountSettings.tabs.documents,
        api:
          typeof accountSettingsTabs.api === 'string'
            ? accountSettingsTabs.api
            : DEFAULT_CONTENT_CONFIG.accountSettings.tabs.api,
      },
      profileDefaults: {
        firstName:
          typeof accountSettingsProfileDefaults.firstName === 'string'
            ? accountSettingsProfileDefaults.firstName
            : DEFAULT_CONTENT_CONFIG.accountSettings.profileDefaults.firstName,
        lastName:
          typeof accountSettingsProfileDefaults.lastName === 'string'
            ? accountSettingsProfileDefaults.lastName
            : DEFAULT_CONTENT_CONFIG.accountSettings.profileDefaults.lastName,
        email:
          typeof accountSettingsProfileDefaults.email === 'string'
            ? accountSettingsProfileDefaults.email
            : DEFAULT_CONTENT_CONFIG.accountSettings.profileDefaults.email,
        phone:
          typeof accountSettingsProfileDefaults.phone === 'string'
            ? accountSettingsProfileDefaults.phone
            : DEFAULT_CONTENT_CONFIG.accountSettings.profileDefaults.phone,
      },
      paymentsDefaults: {
        savedCards: accountSavedCards.length
          ? accountSavedCards
          : DEFAULT_CONTENT_CONFIG.accountSettings.paymentsDefaults.savedCards,
      },
      notificationsDefaults: {
        marketing:
          typeof accountSettingsNotificationsDefaults.marketing === 'boolean'
            ? accountSettingsNotificationsDefaults.marketing
            : DEFAULT_CONTENT_CONFIG.accountSettings.notificationsDefaults.marketing,
        bookingUpdates:
          typeof accountSettingsNotificationsDefaults.bookingUpdates === 'boolean'
            ? accountSettingsNotificationsDefaults.bookingUpdates
            : DEFAULT_CONTENT_CONFIG.accountSettings.notificationsDefaults.bookingUpdates,
        promoSms:
          typeof accountSettingsNotificationsDefaults.promoSms === 'boolean'
            ? accountSettingsNotificationsDefaults.promoSms
            : DEFAULT_CONTENT_CONFIG.accountSettings.notificationsDefaults.promoSms,
      },
      apiDefaults: accountApiDefaults.length
        ? accountApiDefaults
        : DEFAULT_CONTENT_CONFIG.accountSettings.apiDefaults,
    },
    marketing: {
      home: {
        nav: {
          brandName:
            typeof marketingHomeNav.brandName === 'string'
              ? marketingHomeNav.brandName
              : DEFAULT_CONTENT_CONFIG.marketing.home.nav.brandName,
          flights:
            typeof marketingHomeNav.flights === 'string'
              ? marketingHomeNav.flights
              : DEFAULT_CONTENT_CONFIG.marketing.home.nav.flights,
          hotels:
            typeof marketingHomeNav.hotels === 'string'
              ? marketingHomeNav.hotels
              : DEFAULT_CONTENT_CONFIG.marketing.home.nav.hotels,
          packages:
            typeof marketingHomeNav.packages === 'string'
              ? marketingHomeNav.packages
              : DEFAULT_CONTENT_CONFIG.marketing.home.nav.packages,
          cars:
            typeof marketingHomeNav.cars === 'string'
              ? marketingHomeNav.cars
              : DEFAULT_CONTENT_CONFIG.marketing.home.nav.cars,
          aiSearchLabel:
            typeof marketingHomeNav.aiSearchLabel === 'string'
              ? marketingHomeNav.aiSearchLabel
              : DEFAULT_CONTENT_CONFIG.marketing.home.nav.aiSearchLabel,
        },
        hero: {
          badge:
            typeof marketingHomeHero.badge === 'string'
              ? marketingHomeHero.badge
              : DEFAULT_CONTENT_CONFIG.marketing.home.hero.badge,
          title:
            typeof marketingHomeHero.title === 'string'
              ? marketingHomeHero.title
              : DEFAULT_CONTENT_CONFIG.marketing.home.hero.title,
          subtitle:
            typeof marketingHomeHero.subtitle === 'string'
              ? marketingHomeHero.subtitle
              : DEFAULT_CONTENT_CONFIG.marketing.home.hero.subtitle,
        },
        tabs: {
          flights:
            typeof marketingHomeTabs.flights === 'string'
              ? marketingHomeTabs.flights
              : DEFAULT_CONTENT_CONFIG.marketing.home.tabs.flights,
          hotels:
            typeof marketingHomeTabs.hotels === 'string'
              ? marketingHomeTabs.hotels
              : DEFAULT_CONTENT_CONFIG.marketing.home.tabs.hotels,
          packages:
            typeof marketingHomeTabs.packages === 'string'
              ? marketingHomeTabs.packages
              : DEFAULT_CONTENT_CONFIG.marketing.home.tabs.packages,
          cars:
            typeof marketingHomeTabs.cars === 'string'
              ? marketingHomeTabs.cars
              : DEFAULT_CONTENT_CONFIG.marketing.home.tabs.cars,
        },
        searchFormLabels: {
          flight: isObject(marketingHomeSearchFormLabels.flight)
            ? {
                from:
                  typeof marketingHomeSearchFormLabels.flight.from === 'string'
                    ? marketingHomeSearchFormLabels.flight.from
                    : DEFAULT_CONTENT_CONFIG.marketing.home.searchFormLabels.flight.from,
                originPlaceholder:
                  typeof marketingHomeSearchFormLabels.flight.originPlaceholder === 'string'
                    ? marketingHomeSearchFormLabels.flight.originPlaceholder
                    : DEFAULT_CONTENT_CONFIG.marketing.home.searchFormLabels.flight
                        .originPlaceholder,
                to:
                  typeof marketingHomeSearchFormLabels.flight.to === 'string'
                    ? marketingHomeSearchFormLabels.flight.to
                    : DEFAULT_CONTENT_CONFIG.marketing.home.searchFormLabels.flight.to,
                destinationPlaceholder:
                  typeof marketingHomeSearchFormLabels.flight.destinationPlaceholder === 'string'
                    ? marketingHomeSearchFormLabels.flight.destinationPlaceholder
                    : DEFAULT_CONTENT_CONFIG.marketing.home.searchFormLabels.flight
                        .destinationPlaceholder,
                departure:
                  typeof marketingHomeSearchFormLabels.flight.departure === 'string'
                    ? marketingHomeSearchFormLabels.flight.departure
                    : DEFAULT_CONTENT_CONFIG.marketing.home.searchFormLabels.flight.departure,
                return:
                  typeof marketingHomeSearchFormLabels.flight.return === 'string'
                    ? marketingHomeSearchFormLabels.flight.return
                    : DEFAULT_CONTENT_CONFIG.marketing.home.searchFormLabels.flight.return,
                searchCtaLabel:
                  typeof marketingHomeSearchFormLabels.flight.searchCtaLabel === 'string'
                    ? marketingHomeSearchFormLabels.flight.searchCtaLabel
                    : DEFAULT_CONTENT_CONFIG.marketing.home.searchFormLabels.flight.searchCtaLabel,
                disabledLabel:
                  typeof marketingHomeSearchFormLabels.flight.disabledLabel === 'string'
                    ? marketingHomeSearchFormLabels.flight.disabledLabel
                    : DEFAULT_CONTENT_CONFIG.marketing.home.searchFormLabels.flight.disabledLabel,
              }
            : DEFAULT_CONTENT_CONFIG.marketing.home.searchFormLabels.flight,
          hotel: isObject(marketingHomeSearchFormLabels.hotel)
            ? {
                destination:
                  typeof marketingHomeSearchFormLabels.hotel.destination === 'string'
                    ? marketingHomeSearchFormLabels.hotel.destination
                    : DEFAULT_CONTENT_CONFIG.marketing.home.searchFormLabels.hotel.destination,
                destinationPlaceholder:
                  typeof marketingHomeSearchFormLabels.hotel.destinationPlaceholder === 'string'
                    ? marketingHomeSearchFormLabels.hotel.destinationPlaceholder
                    : DEFAULT_CONTENT_CONFIG.marketing.home.searchFormLabels.hotel
                        .destinationPlaceholder,
                checkIn:
                  typeof marketingHomeSearchFormLabels.hotel.checkIn === 'string'
                    ? marketingHomeSearchFormLabels.hotel.checkIn
                    : DEFAULT_CONTENT_CONFIG.marketing.home.searchFormLabels.hotel.checkIn,
                checkOut:
                  typeof marketingHomeSearchFormLabels.hotel.checkOut === 'string'
                    ? marketingHomeSearchFormLabels.hotel.checkOut
                    : DEFAULT_CONTENT_CONFIG.marketing.home.searchFormLabels.hotel.checkOut,
                searchCtaLabel:
                  typeof marketingHomeSearchFormLabels.hotel.searchCtaLabel === 'string'
                    ? marketingHomeSearchFormLabels.hotel.searchCtaLabel
                    : DEFAULT_CONTENT_CONFIG.marketing.home.searchFormLabels.hotel.searchCtaLabel,
                disabledLabel:
                  typeof marketingHomeSearchFormLabels.hotel.disabledLabel === 'string'
                    ? marketingHomeSearchFormLabels.hotel.disabledLabel
                    : DEFAULT_CONTENT_CONFIG.marketing.home.searchFormLabels.hotel.disabledLabel,
              }
            : DEFAULT_CONTENT_CONFIG.marketing.home.searchFormLabels.hotel,
        },
        packages: {
          title:
            typeof marketingHomePackages.title === 'string'
              ? marketingHomePackages.title
              : DEFAULT_CONTENT_CONFIG.marketing.home.packages.title,
          subtitle:
            typeof marketingHomePackages.subtitle === 'string'
              ? marketingHomePackages.subtitle
              : DEFAULT_CONTENT_CONFIG.marketing.home.packages.subtitle,
          ctaLabel:
            typeof marketingHomePackages.ctaLabel === 'string'
              ? marketingHomePackages.ctaLabel
              : DEFAULT_CONTENT_CONFIG.marketing.home.packages.ctaLabel,
        },
        cars: {
          title:
            typeof marketingHomeCars.title === 'string'
              ? marketingHomeCars.title
              : DEFAULT_CONTENT_CONFIG.marketing.home.cars.title,
          subtitle:
            typeof marketingHomeCars.subtitle === 'string'
              ? marketingHomeCars.subtitle
              : DEFAULT_CONTENT_CONFIG.marketing.home.cars.subtitle,
          ctaLabel:
            typeof marketingHomeCars.ctaLabel === 'string'
              ? marketingHomeCars.ctaLabel
              : DEFAULT_CONTENT_CONFIG.marketing.home.cars.ctaLabel,
        },
        popularDestinations: {
          title:
            typeof marketingHomePopularDestinations.title === 'string'
              ? marketingHomePopularDestinations.title
              : DEFAULT_CONTENT_CONFIG.marketing.home.popularDestinations.title,
          subtitle:
            typeof marketingHomePopularDestinations.subtitle === 'string'
              ? marketingHomePopularDestinations.subtitle
              : DEFAULT_CONTENT_CONFIG.marketing.home.popularDestinations.subtitle,
          viewAllLabel:
            typeof marketingHomePopularDestinations.viewAllLabel === 'string'
              ? marketingHomePopularDestinations.viewAllLabel
              : DEFAULT_CONTENT_CONFIG.marketing.home.popularDestinations.viewAllLabel,
          nameLabel:
            typeof marketingHomePopularDestinations.nameLabel === 'string'
              ? marketingHomePopularDestinations.nameLabel
              : DEFAULT_CONTENT_CONFIG.marketing.home.popularDestinations.nameLabel,
          priceLabel:
            typeof marketingHomePopularDestinations.priceLabel === 'string'
              ? marketingHomePopularDestinations.priceLabel
              : DEFAULT_CONTENT_CONFIG.marketing.home.popularDestinations.priceLabel,
          flightsFromLabel:
            typeof marketingHomePopularDestinations.flightsFromLabel === 'string'
              ? marketingHomePopularDestinations.flightsFromLabel
              : DEFAULT_CONTENT_CONFIG.marketing.home.popularDestinations.flightsFromLabel,
          dataSourceSuffixLabel:
            typeof marketingHomePopularDestinations.dataSourceSuffixLabel === 'string'
              ? marketingHomePopularDestinations.dataSourceSuffixLabel
              : DEFAULT_CONTENT_CONFIG.marketing.home.popularDestinations.dataSourceSuffixLabel,
          viewDetailsLabel:
            typeof marketingHomePopularDestinations.viewDetailsLabel === 'string'
              ? marketingHomePopularDestinations.viewDetailsLabel
              : DEFAULT_CONTENT_CONFIG.marketing.home.popularDestinations.viewDetailsLabel,
          featuredLabel:
            typeof marketingHomePopularDestinations.featuredLabel === 'string'
              ? marketingHomePopularDestinations.featuredLabel
              : DEFAULT_CONTENT_CONFIG.marketing.home.popularDestinations.featuredLabel,
        },
        featuredFlights: {
          title:
            typeof marketingHomeFeaturedFlights.title === 'string'
              ? marketingHomeFeaturedFlights.title
              : DEFAULT_CONTENT_CONFIG.marketing.home.featuredFlights.title,
          emptyLabel:
            typeof marketingHomeFeaturedFlights.emptyLabel === 'string'
              ? marketingHomeFeaturedFlights.emptyLabel
              : DEFAULT_CONTENT_CONFIG.marketing.home.featuredFlights.emptyLabel,
          perPersonLabel:
            typeof marketingHomeFeaturedFlights.perPersonLabel === 'string'
              ? marketingHomeFeaturedFlights.perPersonLabel
              : DEFAULT_CONTENT_CONFIG.marketing.home.featuredFlights.perPersonLabel,
          directLabel:
            typeof marketingHomeFeaturedFlights.directLabel === 'string'
              ? marketingHomeFeaturedFlights.directLabel
              : DEFAULT_CONTENT_CONFIG.marketing.home.featuredFlights.directLabel,
          stopSuffix:
            typeof marketingHomeFeaturedFlights.stopSuffix === 'string'
              ? marketingHomeFeaturedFlights.stopSuffix
              : DEFAULT_CONTENT_CONFIG.marketing.home.featuredFlights.stopSuffix,
          viewDetailsLabel:
            typeof marketingHomeFeaturedFlights.viewDetailsLabel === 'string'
              ? marketingHomeFeaturedFlights.viewDetailsLabel
              : DEFAULT_CONTENT_CONFIG.marketing.home.featuredFlights.viewDetailsLabel,
        },
      },
      flightHome: {
        heroTitle:
          typeof marketingFlightHome.heroTitle === 'string'
            ? marketingFlightHome.heroTitle
            : DEFAULT_CONTENT_CONFIG.marketing.flightHome.heroTitle,
        heroSubtitle:
          typeof marketingFlightHome.heroSubtitle === 'string'
            ? marketingFlightHome.heroSubtitle
            : DEFAULT_CONTENT_CONFIG.marketing.flightHome.heroSubtitle,
        disabledTitle:
          typeof marketingFlightHome.disabledTitle === 'string'
            ? marketingFlightHome.disabledTitle
            : DEFAULT_CONTENT_CONFIG.marketing.flightHome.disabledTitle,
        disabledSubtitle:
          typeof marketingFlightHome.disabledSubtitle === 'string'
            ? marketingFlightHome.disabledSubtitle
            : DEFAULT_CONTENT_CONFIG.marketing.flightHome.disabledSubtitle,
        backToHomeLabel:
          typeof marketingFlightHome.backToHomeLabel === 'string'
            ? marketingFlightHome.backToHomeLabel
            : DEFAULT_CONTENT_CONFIG.marketing.flightHome.backToHomeLabel,
        tabs: {
          stays:
            typeof marketingFlightTabs.stays === 'string'
              ? marketingFlightTabs.stays
              : DEFAULT_CONTENT_CONFIG.marketing.flightHome.tabs.stays,
          flights:
            typeof marketingFlightTabs.flights === 'string'
              ? marketingFlightTabs.flights
              : DEFAULT_CONTENT_CONFIG.marketing.flightHome.tabs.flights,
        },
        benefits: parseBenefits(
          marketingFlightHome.benefits,
          DEFAULT_CONTENT_CONFIG.marketing.flightHome.benefits
        ),
        searchFormLabels: isObject(marketingFlightHome.searchFormLabels)
          ? {
              departure:
                typeof marketingFlightHome.searchFormLabels.departure === 'string'
                  ? marketingFlightHome.searchFormLabels.departure
                  : DEFAULT_CONTENT_CONFIG.marketing.flightHome.searchFormLabels.departure,
              return:
                typeof marketingFlightHome.searchFormLabels.return === 'string'
                  ? marketingFlightHome.searchFormLabels.return
                  : DEFAULT_CONTENT_CONFIG.marketing.flightHome.searchFormLabels.return,
              fromPlaceholder:
                typeof marketingFlightHome.searchFormLabels.fromPlaceholder === 'string'
                  ? marketingFlightHome.searchFormLabels.fromPlaceholder
                  : DEFAULT_CONTENT_CONFIG.marketing.flightHome.searchFormLabels.fromPlaceholder,
              toPlaceholder:
                typeof marketingFlightHome.searchFormLabels.toPlaceholder === 'string'
                  ? marketingFlightHome.searchFormLabels.toPlaceholder
                  : DEFAULT_CONTENT_CONFIG.marketing.flightHome.searchFormLabels.toPlaceholder,
              legFromLabel:
                typeof marketingFlightHome.searchFormLabels.legFromLabel === 'string'
                  ? marketingFlightHome.searchFormLabels.legFromLabel
                  : DEFAULT_CONTENT_CONFIG.marketing.flightHome.searchFormLabels.legFromLabel,
              legToLabel:
                typeof marketingFlightHome.searchFormLabels.legToLabel === 'string'
                  ? marketingFlightHome.searchFormLabels.legToLabel
                  : DEFAULT_CONTENT_CONFIG.marketing.flightHome.searchFormLabels.legToLabel,
              searchCtaLabel:
                typeof marketingFlightHome.searchFormLabels.searchCtaLabel === 'string'
                  ? marketingFlightHome.searchFormLabels.searchCtaLabel
                  : DEFAULT_CONTENT_CONFIG.marketing.flightHome.searchFormLabels.searchCtaLabel,
              searchMultiCityCtaLabel:
                typeof marketingFlightHome.searchFormLabels.searchMultiCityCtaLabel === 'string'
                  ? marketingFlightHome.searchFormLabels.searchMultiCityCtaLabel
                  : DEFAULT_CONTENT_CONFIG.marketing.flightHome.searchFormLabels
                      .searchMultiCityCtaLabel,
              removeLegLabel:
                typeof marketingFlightHome.searchFormLabels.removeLegLabel === 'string'
                  ? marketingFlightHome.searchFormLabels.removeLegLabel
                  : DEFAULT_CONTENT_CONFIG.marketing.flightHome.searchFormLabels.removeLegLabel,
              addLegLabel:
                typeof marketingFlightHome.searchFormLabels.addLegLabel === 'string'
                  ? marketingFlightHome.searchFormLabels.addLegLabel
                  : DEFAULT_CONTENT_CONFIG.marketing.flightHome.searchFormLabels.addLegLabel,
            }
          : DEFAULT_CONTENT_CONFIG.marketing.flightHome.searchFormLabels,
        tripTypeLabels: isObject(marketingFlightHome.tripTypeLabels)
          ? {
              oneWay:
                typeof marketingFlightHome.tripTypeLabels.oneWay === 'string'
                  ? marketingFlightHome.tripTypeLabels.oneWay
                  : DEFAULT_CONTENT_CONFIG.marketing.flightHome.tripTypeLabels.oneWay,
              roundTrip:
                typeof marketingFlightHome.tripTypeLabels.roundTrip === 'string'
                  ? marketingFlightHome.tripTypeLabels.roundTrip
                  : DEFAULT_CONTENT_CONFIG.marketing.flightHome.tripTypeLabels.roundTrip,
              multiCity:
                typeof marketingFlightHome.tripTypeLabels.multiCity === 'string'
                  ? marketingFlightHome.tripTypeLabels.multiCity
                  : DEFAULT_CONTENT_CONFIG.marketing.flightHome.tripTypeLabels.multiCity,
            }
          : DEFAULT_CONTENT_CONFIG.marketing.flightHome.tripTypeLabels,
        popularFlights: {
          title:
            typeof marketingFlightPopularFlights.title === 'string'
              ? marketingFlightPopularFlights.title
              : DEFAULT_CONTENT_CONFIG.marketing.flightHome.popularFlights.title,
          subtitle:
            typeof marketingFlightPopularFlights.subtitle === 'string'
              ? marketingFlightPopularFlights.subtitle
              : DEFAULT_CONTENT_CONFIG.marketing.flightHome.popularFlights.subtitle,
        },
        featuredGuide: {
          title:
            typeof marketingFlightFeaturedGuide.title === 'string'
              ? marketingFlightFeaturedGuide.title
              : DEFAULT_CONTENT_CONFIG.marketing.flightHome.featuredGuide.title,
          subtitle:
            typeof marketingFlightFeaturedGuide.subtitle === 'string'
              ? marketingFlightFeaturedGuide.subtitle
              : DEFAULT_CONTENT_CONFIG.marketing.flightHome.featuredGuide.subtitle,
          poweredByLabel:
            typeof marketingFlightFeaturedGuide.poweredByLabel === 'string'
              ? marketingFlightFeaturedGuide.poweredByLabel
              : DEFAULT_CONTENT_CONFIG.marketing.flightHome.featuredGuide.poweredByLabel,
        },
        trending: {
          title:
            typeof marketingFlightTrending.title === 'string'
              ? marketingFlightTrending.title
              : DEFAULT_CONTENT_CONFIG.marketing.flightHome.trending.title,
          tabs: parseStringList(
            marketingFlightTrendingTabs,
            DEFAULT_CONTENT_CONFIG.marketing.flightHome.trending.tabs
          ),
          columnLabels: parseColumnLabels(
            marketingFlightTrendingColumns,
            DEFAULT_CONTENT_CONFIG.marketing.flightHome.trending.columnLabels
          ),
        },
      },
      hotelHome: {
        searchFormLabels: isObject(marketingHotelHome.searchFormLabels)
          ? {
              checkIn:
                typeof marketingHotelHome.searchFormLabels.checkIn === 'string'
                  ? marketingHotelHome.searchFormLabels.checkIn
                  : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.searchFormLabels.checkIn,
              checkOut:
                typeof marketingHotelHome.searchFormLabels.checkOut === 'string'
                  ? marketingHotelHome.searchFormLabels.checkOut
                  : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.searchFormLabels.checkOut,
              destinationPlaceholder:
                typeof marketingHotelHome.searchFormLabels.destinationPlaceholder === 'string'
                  ? marketingHotelHome.searchFormLabels.destinationPlaceholder
                  : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.searchFormLabels
                      .destinationPlaceholder,
              searchCtaLabel:
                typeof marketingHotelHome.searchFormLabels.searchCtaLabel === 'string'
                  ? marketingHotelHome.searchFormLabels.searchCtaLabel
                  : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.searchFormLabels.searchCtaLabel,
              loadingDestinationsLabel:
                typeof marketingHotelHome.searchFormLabels.loadingDestinationsLabel === 'string'
                  ? marketingHotelHome.searchFormLabels.loadingDestinationsLabel
                  : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.searchFormLabels
                      .loadingDestinationsLabel,
              errorLoadingDestinationsLabel:
                typeof marketingHotelHome.searchFormLabels.errorLoadingDestinationsLabel ===
                'string'
                  ? marketingHotelHome.searchFormLabels.errorLoadingDestinationsLabel
                  : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.searchFormLabels
                      .errorLoadingDestinationsLabel,
              loadingHotelsLabel:
                typeof marketingHotelHome.searchFormLabels.loadingHotelsLabel === 'string'
                  ? marketingHotelHome.searchFormLabels.loadingHotelsLabel
                  : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.searchFormLabels.loadingHotelsLabel,
            }
          : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.searchFormLabels,
        tripTypeLabels: isObject(marketingHotelHome.tripTypeLabels)
          ? {
              oneWay:
                typeof marketingHotelHome.tripTypeLabels.oneWay === 'string'
                  ? marketingHotelHome.tripTypeLabels.oneWay
                  : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.tripTypeLabels.oneWay,
              roundTrip:
                typeof marketingHotelHome.tripTypeLabels.roundTrip === 'string'
                  ? marketingHotelHome.tripTypeLabels.roundTrip
                  : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.tripTypeLabels.roundTrip,
              multiCity:
                typeof marketingHotelHome.tripTypeLabels.multiCity === 'string'
                  ? marketingHotelHome.tripTypeLabels.multiCity
                  : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.tripTypeLabels.multiCity,
            }
          : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.tripTypeLabels,
        badge:
          typeof marketingHotelHome.badge === 'string'
            ? marketingHotelHome.badge
            : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.badge,
        heroTitle:
          typeof marketingHotelHome.heroTitle === 'string'
            ? marketingHotelHome.heroTitle
            : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.heroTitle,
        heroSubtitle:
          typeof marketingHotelHome.heroSubtitle === 'string'
            ? marketingHotelHome.heroSubtitle
            : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.heroSubtitle,
        disabledTitle:
          typeof marketingHotelHome.disabledTitle === 'string'
            ? marketingHotelHome.disabledTitle
            : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.disabledTitle,
        disabledSubtitle:
          typeof marketingHotelHome.disabledSubtitle === 'string'
            ? marketingHotelHome.disabledSubtitle
            : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.disabledSubtitle,
        backToHomeLabel:
          typeof marketingHotelHome.backToHomeLabel === 'string'
            ? marketingHotelHome.backToHomeLabel
            : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.backToHomeLabel,
        tabs: {
          stays:
            typeof marketingHotelTabs.stays === 'string'
              ? marketingHotelTabs.stays
              : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.tabs.stays,
          flights:
            typeof marketingHotelTabs.flights === 'string'
              ? marketingHotelTabs.flights
              : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.tabs.flights,
        },
        benefits: parseBenefits(
          marketingHotelHome.benefits,
          DEFAULT_CONTENT_CONFIG.marketing.hotelHome.benefits
        ),
        // ...existing code...
        deals: {
          title:
            typeof marketingHotelDeals.title === 'string'
              ? marketingHotelDeals.title
              : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.deals.title,
          ctaLabel:
            typeof marketingHotelDeals.ctaLabel === 'string'
              ? marketingHotelDeals.ctaLabel
              : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.deals.ctaLabel,
          spotlightTitle:
            typeof marketingHotelDeals.spotlightTitle === 'string'
              ? marketingHotelDeals.spotlightTitle
              : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.deals.spotlightTitle,
          spotlightDescription:
            typeof marketingHotelDeals.spotlightDescription === 'string'
              ? marketingHotelDeals.spotlightDescription
              : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.deals.spotlightDescription,
          imageUrls: parseStringList(
            marketingHotelDealsImages,
            DEFAULT_CONTENT_CONFIG.marketing.hotelHome.deals.imageUrls
          ),
        },
        popularDestinations: {
          title:
            typeof marketingHotelPopularDestinations.title === 'string'
              ? marketingHotelPopularDestinations.title
              : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.popularDestinations.title,
          subtitle:
            typeof marketingHotelPopularDestinations.subtitle === 'string'
              ? marketingHotelPopularDestinations.subtitle
              : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.popularDestinations.subtitle,
          nameLabel:
            typeof marketingHotelPopularDestinations.nameLabel === 'string'
              ? marketingHotelPopularDestinations.nameLabel
              : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.popularDestinations.nameLabel,
          priceLabel:
            typeof marketingHotelPopularDestinations.priceLabel === 'string'
              ? marketingHotelPopularDestinations.priceLabel
              : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.popularDestinations.priceLabel,
          dataSourceSuffixLabel:
            typeof marketingHotelPopularDestinations.dataSourceSuffixLabel === 'string'
              ? marketingHotelPopularDestinations.dataSourceSuffixLabel
              : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.popularDestinations
                  .dataSourceSuffixLabel,
          viewDetailsLabel:
            typeof marketingHotelPopularDestinations.viewDetailsLabel === 'string'
              ? marketingHotelPopularDestinations.viewDetailsLabel
              : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.popularDestinations.viewDetailsLabel,
          featuredLabel:
            typeof marketingHotelPopularDestinations.featuredLabel === 'string'
              ? marketingHotelPopularDestinations.featuredLabel
              : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.popularDestinations.featuredLabel,
        },
        featuredHotels: {
          title:
            typeof marketingHotelFeaturedHotels.title === 'string'
              ? marketingHotelFeaturedHotels.title
              : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.featuredHotels.title,
          subtitle:
            typeof marketingHotelFeaturedHotels.subtitle === 'string'
              ? marketingHotelFeaturedHotels.subtitle
              : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.featuredHotels.subtitle,
          emptyLabel:
            typeof marketingHotelFeaturedHotels.emptyLabel === 'string'
              ? marketingHotelFeaturedHotels.emptyLabel
              : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.featuredHotels.emptyLabel,
        },
        featuredGuide: {
          title:
            typeof marketingHotelFeaturedGuide.title === 'string'
              ? marketingHotelFeaturedGuide.title
              : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.featuredGuide.title,
          subtitle:
            typeof marketingHotelFeaturedGuide.subtitle === 'string'
              ? marketingHotelFeaturedGuide.subtitle
              : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.featuredGuide.subtitle,
          poweredByLabel:
            typeof marketingHotelFeaturedGuide.poweredByLabel === 'string'
              ? marketingHotelFeaturedGuide.poweredByLabel
              : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.featuredGuide.poweredByLabel,
        },
        trending: {
          title:
            typeof marketingHotelTrending.title === 'string'
              ? marketingHotelTrending.title
              : DEFAULT_CONTENT_CONFIG.marketing.hotelHome.trending.title,
          tabs: parseStringList(
            marketingHotelTrendingTabs,
            DEFAULT_CONTENT_CONFIG.marketing.hotelHome.trending.tabs
          ),
          columnLabels: parseColumnLabels(
            marketingHotelTrendingColumns,
            DEFAULT_CONTENT_CONFIG.marketing.hotelHome.trending.columnLabels
          ),
        },
      },
    },
  };
}

export async function loadTenantContentConfig(): Promise<TenantContentConfig> {
  try {
    const response = await api.get('/branding/settings');
    const payload = isObject(response?.data?.data) ? response.data.data : response?.data;
    const content = isObject(payload) ? payload.content : null;
    return normalizeContentConfig(content);
  } catch {
    return DEFAULT_CONTENT_CONFIG;
  }
}
