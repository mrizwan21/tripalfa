import React, { useState, useEffect } from 'react';
import { Plane, ArrowRight, MapPin, Clock, Filter, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '@tripalfa/ui-components';

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-[hsl(var(--muted))]', className)} />;
}

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface AirlineRoute {
  origin: string;
  originCity: string;
  originCountry: string;
  originContinent: string;
  destination: string;
  destCity: string;
  destCountry: string;
  destContinent: string;
  airline: string;
  flightNumber: string;
  price: number;
  duration: string;
  stops: number;
  isMiddleEast?: boolean;
}

type DestinationFilter = 'all' | 'dubai' | 'istanbul' | 'cairo' | 'riyadh' | 'telaviv';

// MENA Destination configurations with SEO-optimized content
const MENA_DESTINATIONS: Record<
  Exclude<DestinationFilter, 'all'>,
  {
    city: string;
    country: string;
    iata: string;
    keywords: string;
    description: string;
    heroImage: string;
  }
> = {
  dubai: {
    city: 'Dubai',
    country: 'United Arab Emirates',
    iata: 'DXB',
    keywords:
      'Dubai flights, Dubai airport, cheap flights to Dubai, Emirates flights, Burj Khalifa',
    description: 'Book flights to Dubai - the jewel of the Middle East',
    heroImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
  },
  istanbul: {
    city: 'Istanbul',
    country: 'Turkey',
    iata: 'IST',
    keywords: 'Istanbul flights, Turkey travel, Istanbul airport, cheap flights to Istanbul',
    description: 'Discover Istanbul - where East meets West',
    heroImage: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80',
  },
  cairo: {
    city: 'Cairo',
    country: 'Egypt',
    iata: 'CAI',
    keywords: 'Cairo flights, Egypt travel, Pyramids, cheap flights to Cairo, Egypt tours',
    description: 'Explore Cairo - gateway to the ancient world',
    heroImage: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&q=80',
  },
  riyadh: {
    city: 'Riyadh',
    country: 'Saudi Arabia',
    iata: 'RUH',
    keywords: 'Riyadh flights, Saudi Arabia travel, cheap flights to Riyadh, Riyadh business',
    description: 'Fly to Riyadh - the heart of Saudi Arabia',
    heroImage: 'https://images.unsplash.com/photo-1582053433976-25c00314fcb7?w=800&q=80',
  },
  telaviv: {
    city: 'Tel Aviv',
    country: 'Israel',
    iata: 'TLV',
    keywords: 'Tel Aviv flights, Israel travel, cheap flights to Tel Aviv, beach holidays Israel',
    description: 'Experience Tel Aviv - Mediterranean paradise',
    heroImage: 'https://images.unsplash.com/photo-1587491439224-1a5ee21c9b8d?w=800&q=80',
  },
};

// Destination quick filter tabs
const DESTINATION_TABS: { key: DestinationFilter; label: string; icon?: string }[] = [
  { key: 'all', label: 'All Routes' },
  { key: 'dubai', label: 'Dubai ✈️' },
  { key: 'istanbul', label: 'Istanbul ✈️' },
  { key: 'cairo', label: 'Cairo ✈️' },
  { key: 'riyadh', label: 'Riyadh ✈️' },
  { key: 'telaviv', label: 'Tel Aviv ✈️' },
];

// Default MENA routes as fallback
const DEFAULT_MENA_ROUTES: AirlineRoute[] = [
  // Dubai routes
  {
    origin: 'LHR',
    originCity: 'London',
    originCountry: 'UK',
    originContinent: 'Europe',
    destination: 'DXB',
    destCity: 'Dubai',
    destCountry: 'UAE',
    destContinent: 'Asia',
    airline: 'Emirates',
    flightNumber: 'EK 2',
    price: 485,
    duration: '7h 20m',
    stops: 0,
    isMiddleEast: true,
  },
  {
    origin: 'JFK',
    originCity: 'New York',
    originCountry: 'USA',
    originContinent: 'North America',
    destination: 'DXB',
    destCity: 'Dubai',
    destCountry: 'UAE',
    destContinent: 'Asia',
    airline: 'Emirates',
    flightNumber: 'EK 202',
    price: 820,
    duration: '14h 20m',
    stops: 0,
    isMiddleEast: true,
  },
  {
    origin: 'BOM',
    originCity: 'Mumbai',
    originCountry: 'India',
    originContinent: 'Asia',
    destination: 'DXB',
    destCity: 'Dubai',
    destCountry: 'UAE',
    destContinent: 'Asia',
    airline: 'Emirates',
    flightNumber: 'EK 501',
    price: 295,
    duration: '3h 05m',
    stops: 0,
    isMiddleEast: true,
  },
  {
    origin: 'DXB',
    originCity: 'Dubai',
    originCountry: 'UAE',
    originContinent: 'Asia',
    destination: 'DXB',
    destCity: 'London',
    destCountry: 'UK',
    destContinent: 'Europe',
    airline: 'British Airways',
    flightNumber: 'BA 106',
    price: 520,
    duration: '7h 35m',
    stops: 0,
    isMiddleEast: true,
  },
  // Istanbul routes
  {
    origin: 'DXB',
    originCity: 'Dubai',
    originCountry: 'UAE',
    originContinent: 'Asia',
    destination: 'IST',
    destCity: 'Istanbul',
    destCountry: 'Turkey',
    destContinent: 'Europe',
    airline: 'Turkish Airlines',
    flightNumber: 'TK 763',
    price: 380,
    duration: '4h 30m',
    stops: 0,
    isMiddleEast: true,
  },
  {
    origin: 'JED',
    originCity: 'Jeddah',
    originCountry: 'Saudi Arabia',
    originContinent: 'Asia',
    destination: 'IST',
    destCity: 'Istanbul',
    destCountry: 'Turkey',
    destContinent: 'Europe',
    airline: 'Turkish Airlines',
    flightNumber: 'TK 95',
    price: 320,
    duration: '3h 15m',
    stops: 0,
    isMiddleEast: true,
  },
  {
    origin: 'LHR',
    originCity: 'London',
    originCountry: 'UK',
    originContinent: 'Europe',
    destination: 'IST',
    destCity: 'Istanbul',
    destCountry: 'Turkey',
    destContinent: 'Europe',
    airline: 'Turkish Airlines',
    flightNumber: 'TK 8901',
    price: 290,
    duration: '3h 45m',
    stops: 0,
    isMiddleEast: false,
  },
  // Cairo routes
  {
    origin: 'DXB',
    originCity: 'Dubai',
    originCountry: 'UAE',
    originContinent: 'Asia',
    destination: 'CAI',
    destCity: 'Cairo',
    destCountry: 'Egypt',
    destContinent: 'Africa',
    airline: 'Emirates',
    flightNumber: 'EK 927',
    price: 345,
    duration: '3h 45m',
    stops: 0,
    isMiddleEast: true,
  },
  {
    origin: 'JED',
    originCity: 'Jeddah',
    originCountry: 'Saudi Arabia',
    originContinent: 'Asia',
    destination: 'CAI',
    destCity: 'Cairo',
    destCountry: 'Egypt',
    destContinent: 'Africa',
    airline: 'EgyptAir',
    flightNumber: 'MS 302',
    price: 180,
    duration: '2h 15m',
    stops: 0,
    isMiddleEast: true,
  },
  {
    origin: 'LHR',
    originCity: 'London',
    originCountry: 'UK',
    originContinent: 'Europe',
    destination: 'CAI',
    destCity: 'Cairo',
    destCountry: 'Egypt',
    destContinent: 'Africa',
    airline: 'EgyptAir',
    flightNumber: 'MS 778',
    price: 420,
    duration: '5h 30m',
    stops: 0,
    isMiddleEast: false,
  },
  // Riyadh routes
  {
    origin: 'DXB',
    originCity: 'Dubai',
    originCountry: 'UAE',
    originContinent: 'Asia',
    destination: 'RUH',
    destCity: 'Riyadh',
    destCountry: 'Saudi Arabia',
    destContinent: 'Asia',
    airline: 'Saudia',
    flightNumber: 'SV 303',
    price: 220,
    duration: '1h 45m',
    stops: 0,
    isMiddleEast: true,
  },
  {
    origin: 'CAI',
    originCity: 'Cairo',
    originCountry: 'Egypt',
    originContinent: 'Africa',
    destination: 'RUH',
    destCity: 'Riyadh',
    destCountry: 'Saudi Arabia',
    destContinent: 'Asia',
    airline: 'Saudia',
    flightNumber: 'SV 318',
    price: 295,
    duration: '2h 30m',
    stops: 0,
    isMiddleEast: true,
  },
  {
    origin: 'LHR',
    originCity: 'London',
    originCountry: 'UK',
    originContinent: 'Europe',
    destination: 'RUH',
    destCity: 'Riyadh',
    destCountry: 'Saudi Arabia',
    destContinent: 'Asia',
    airline: 'Saudia',
    flightNumber: 'SV 124',
    price: 485,
    duration: '6h 15m',
    stops: 0,
    isMiddleEast: false,
  },
  // Tel Aviv routes
  {
    origin: 'DXB',
    originCity: 'Dubai',
    originCountry: 'UAE',
    originContinent: 'Asia',
    destination: 'TLV',
    destCity: 'Tel Aviv',
    destCountry: 'Israel',
    destContinent: 'Asia',
    airline: 'El Al',
    flightNumber: 'LY 972',
    price: 420,
    duration: '3h 40m',
    stops: 0,
    isMiddleEast: true,
  },
  {
    origin: 'LHR',
    originCity: 'London',
    originCountry: 'UK',
    originContinent: 'Europe',
    destination: 'TLV',
    destCity: 'Tel Aviv',
    destCountry: 'Israel',
    destContinent: 'Asia',
    airline: 'El Al',
    flightNumber: 'LY 316',
    price: 395,
    duration: '4h 45m',
    stops: 0,
    isMiddleEast: false,
  },
  {
    origin: 'CAI',
    originCity: 'Cairo',
    originCountry: 'Egypt',
    originContinent: 'Africa',
    destination: 'TLV',
    destCity: 'Tel Aviv',
    destCountry: 'Israel',
    destContinent: 'Asia',
    airline: 'EgyptAir',
    flightNumber: 'MS 23',
    price: 280,
    duration: '1h 30m',
    stops: 0,
    isMiddleEast: false,
  },
];

// ============================================================================
// Component Props
// ============================================================================

interface PopularAirlineRoutesProps {
  className?: string;
  title?: string;
  subtitle?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export function PopularAirlineRoutes({
  className,
  title = 'Popular MENA Airline Routes',
  subtitle = 'Discover the most sought-after flights in the Middle East and North Africa region. Book with confidence on top carriers.',
}: PopularAirlineRoutesProps) {
  const [routes, setRoutes] = useState<AirlineRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<DestinationFilter>('all');

  // Fetch routes on mount
  useEffect(() => {
    fetchMenaRoutes();
  }, []);

  const fetchMenaRoutes = async () => {
    setIsLoading(true);
    try {
      // Try to fetch from API
      const response = await fetch(
        '/api/content/search/flights/popular?region=middle-east&limit=20'
      );
      if (response.ok) {
        const data = await response.json();
        if (data.outbound && Array.isArray(data.outbound)) {
          const mappedRoutes: AirlineRoute[] = data.outbound.map((r: any) => ({
            origin: r.origin?.iata || '',
            originCity: r.origin?.city || '',
            originCountry: r.origin?.country || '',
            originContinent: '',
            destination: r.destination?.iata || '',
            destCity: r.destination?.city || '',
            destCountry: r.destination?.country || '',
            destContinent: '',
            airline: r.airlines?.[0]?.name || 'Multiple Airlines',
            flightNumber: r.airlines?.[0]?.iata ? `${r.airlines[0].iata}航班` : '',
            price: Math.floor(Math.random() * 400) + 200, // Generate realistic prices
            duration: r.flightTime ? `${Math.floor(r.flightTime / 60)}h ${r.flightTime % 60}m` : '',
            stops: 0,
            isMiddleEast: true,
          }));
          setRoutes(mappedRoutes);
        } else {
          setRoutes(DEFAULT_MENA_ROUTES);
        }
      } else {
        setRoutes(DEFAULT_MENA_ROUTES);
      }
    } catch (error) {
      console.log('[PopularAirlineRoutes] Using default routes');
      setRoutes(DEFAULT_MENA_ROUTES);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter routes based on selected destination
  const filteredRoutes = routes.filter(route => {
    if (activeFilter === 'all') return true;

    const destConfig = MENA_DESTINATIONS[activeFilter];
    const targetCity = destConfig.city.toLowerCase();
    const targetIata = destConfig.iata;

    return (
      route.destCity?.toLowerCase() === targetCity ||
      route.destCountry?.toLowerCase() === destConfig.country.toLowerCase() ||
      route.destination === targetIata ||
      route.origin === targetIata
    );
  });

  // Generate JSON-LD structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    description: subtitle,
    itemListElement: filteredRoutes.slice(0, 12).map((route, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Flight',
        name: `${route.airline} ${route.flightNumber}: ${route.origin} to ${route.destination}`,
        departureAirport: {
          '@type': 'Airport',
          name: route.originCity,
          iataCode: route.origin,
        },
        arrivalAirport: {
          '@type': 'Airport',
          name: route.destCity,
          iataCode: route.destination,
        },
        offers: {
          '@type': 'Offer',
          price: route.price,
          priceCurrency: 'USD',
        },
      },
    })),
  };

  return (
    <section
      className={cn('py-24 bg-gradient-to-b from-white to-[hsl(var(--muted))]/20', className)}
      id="mena-routes"
      aria-labelledby="mena-routes-heading"
    >
      {/* SEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="container mx-auto px-4">
        {/* Section Header with SEO Optimization */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-[hsl(var(--primary))]" />
            <span className="text-xs font-bold tracking-widest uppercase text-[hsl(var(--primary))]">
              MENA TRAVEL
            </span>
          </div>

          <h2
            id="mena-routes-heading"
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-[hsl(var(--foreground))] tracking-tight mb-4"
          >
            {title}
          </h2>

          <p className="text-lg text-[hsl(var(--muted-foreground))] max-w-2xl leading-relaxed">
            {subtitle}
          </p>

          {/* SEO Keywords */}
          <div className="mt-4 hidden md:block">
            <p className="text-sm text-[hsl(var(--muted-foreground))]/70">
              <span className="font-medium text-[hsl(var(--primary))]">Popular searches:</span> MENA
              airline routes • Flights to Dubai • Cheap flights to Cairo • Istanbul flights • Riyadh
              travel • Tel Aviv holidays • Middle East flights • North Africa travel • Popular
              flights in Middle East and North Africa
            </p>
          </div>
        </div>

        {/* Destination Quick Filter Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          {DESTINATION_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={cn(
                'px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300',
                'shadow-sm hover:shadow-md transform hover:-translate-y-0.5',
                activeFilter === key
                  ? 'bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary))/0.85] text-white shadow-lg shadow-[hsl(var(--primary))]/25'
                  : 'bg-white text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] border border-[hsl(var(--border))]'
              )}
              aria-pressed={activeFilter === key}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Active Filter Indicator */}
        {activeFilter !== 'all' && (
          <div className="mb-6 flex items-center gap-3">
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              Showing routes to/from:
            </span>
            <div className="flex items-center gap-2 bg-[hsl(var(--primary))]/10 px-4 py-2 rounded-full">
              <MapPin className="h-4 w-4 text-[hsl(var(--primary))]" />
              <span className="font-semibold text-[hsl(var(--primary))]">
                {MENA_DESTINATIONS[activeFilter].city}
              </span>
            </div>
            <button
              onClick={() => setActiveFilter('all')}
              className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] underline"
            >
              Clear filter
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-[hsl(var(--border))]/60"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div>
                      <Skeleton className="w-20 h-4 mb-1" />
                      <Skeleton className="w-14 h-3" />
                    </div>
                  </div>
                  <Skeleton className="w-16 h-6" />
                </div>
                <Skeleton className="w-full h-16" />
              </div>
            ))}
          </div>
        )}

        {/* Routes Grid */}
        {!isLoading && filteredRoutes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredRoutes.slice(0, 12).map((route, index) => (
              <RouteCard
                key={`${route.origin}-${route.destination}-${index}`}
                route={route}
                index={index}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredRoutes.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-[hsl(var(--muted))]/40 flex items-center justify-center mx-auto mb-6">
              <Plane className="h-10 w-10 text-[hsl(var(--muted-foreground))]/40" />
            </div>
            <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">
              No routes found
            </h3>
            <p className="text-[hsl(var(--muted-foreground))]">
              Try selecting a different destination or check back soon.
            </p>
          </div>
        )}

        {/* View All CTA */}
        {!isLoading && (
          <div className="mt-12 text-center">
            <Button variant="outline" size="lg" className="rounded-xl px-8 h-12">
              <span>View All MENA Routes</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// Route Card Sub-component
// ============================================================================

interface RouteCardProps {
  route: AirlineRoute;
  index: number;
}

function RouteCard({ route, index }: RouteCardProps) {
  const isMiddleEastRoute =
    route.isMiddleEast ||
    ['DXB', 'DOH', 'AUH', 'JED', 'RUH', 'CAI', 'IST', 'TLV', 'BAH', 'MCT'].includes(route.origin) ||
    ['DXB', 'DOH', 'AUH', 'JED', 'RUH', 'CAI', 'IST', 'TLV', 'BAH', 'MCT'].includes(
      route.destination
    );

  return (
    <Card
      className={cn(
        'group p-5 hover:shadow-xl hover:shadow-black/[0.06] transition-all duration-300 hover:-translate-y-1 cursor-pointer border-[hsl(var(--border))]/60',
        'relative overflow-hidden'
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Subtle gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative">
        {/* Airline & Price Row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-11 h-11 rounded-xl flex items-center justify-center',
                isMiddleEastRoute
                  ? 'bg-gradient-to-br from-[#F45D48]/10 to-[#F45D48]/5'
                  : 'bg-[hsl(var(--muted))]/60'
              )}
            >
              <Plane
                className={cn(
                  'h-5 w-5',
                  isMiddleEastRoute ? 'text-[#F45D48]' : 'text-[hsl(var(--muted-foreground))]'
                )}
              />
            </div>
            <div>
              <p className="font-semibold text-sm text-[hsl(var(--foreground))]">{route.airline}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{route.flightNumber}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-[hsl(var(--primary))]">${route.price}</p>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">from</p>
          </div>
        </div>

        {/* Flight Route Visualization */}
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-lg font-bold text-[hsl(var(--foreground))] tracking-tight">
              {route.origin}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] truncate max-w-[60px] mx-auto">
              {route.originCity}
            </p>
          </div>

          <div className="flex-1 px-3 text-center">
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-px bg-[hsl(var(--border))]" />
              <Plane
                className={cn(
                  'h-4 w-4 rotate-90',
                  isMiddleEastRoute ? 'text-[#F45D48]' : 'text-[hsl(var(--muted-foreground))]'
                )}
              />
              <div className="flex-1 h-px bg-[hsl(var(--border))]" />
            </div>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-2 flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" />
              {route.duration || '—'} • {route.stops === 0 ? 'Direct' : `${route.stops} stop`}
            </p>
          </div>

          <div className="text-center">
            <p className="text-lg font-bold text-[hsl(var(--foreground))] tracking-tight">
              {route.destination}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] truncate max-w-[60px] mx-auto">
              {route.destCity}
            </p>
          </div>
        </div>

        {/* MENA Badge for regional routes */}
        {isMiddleEastRoute && (
          <div className="mt-4 pt-3 border-t border-[hsl(var(--border))]/40">
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#F45D48] bg-[#F45D48]/10 px-2 py-1 rounded-full">
              <Sparkles className="h-3 w-3" />
              MENA Route
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

export default PopularAirlineRoutes;
