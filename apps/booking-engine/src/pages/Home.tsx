import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Users, ArrowRight, ShoppingCart, Sparkles, Plane, Hotel, Car } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { api, fetchAirports } from '../lib/api';

interface CartSummaryResponse {
  data: {
    itemCount: number;
  };
}

interface AirportResult {
  type: 'AIRPORT';
  icon: string;
  title: string;
  subtitle: string;
  code: string;
  city?: string;
  country?: string;
  countryCode?: string;
}

interface Flight {
  id: string;
  airline: string;
  airlineLogo: string;
  flightNumber: string;
  price: number;
  currency: string;
  departureTime: string;
  arrivalTime: string;
  origin: string;
  destination: string;
  duration: string;
  stops: number;
}

export default function Home() {
  const [activeTab, setActiveTab] = React.useState('flights');
  const [cartCount, setCartCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [airports, setAirports] = useState<AirportResult[]>([]);
  const [featuredFlights, setFeaturedFlights] = useState<Flight[]>([]);

  // Fetch featured flights on component mount
  useEffect(() => {
    fetchFeaturedFlights();
    fetchCartSummary();
  }, []);

  const fetchFeaturedFlights = async () => {
    try {
      const response = await api.get('/search/flights/popular');
      if (response && Array.isArray(response)) {
        setFeaturedFlights(response.slice(0, 4));
      }
    } catch (error) {
      console.error('Failed to fetch featured flights:', error);
      setFeaturedFlights([]);
    }
  };

  const fetchCartSummary = async () => {
    try {
      const response = await (globalThis as any).fetch?.('/api/cart/summary?sessionId=guest-session');
      if (response && response.ok) {
        const { data } = await response.json() as CartSummaryResponse;
        setCartCount(data.itemCount);
      }
    } catch (error) {
      (globalThis as any).console?.log('Cart not available');
    }
  };

  useEffect(() => {
    if (typeof globalThis === 'undefined' || !(globalThis as any).addEventListener) return;
    const handleScroll = () => setIsScrolled((globalThis as any).scrollY > 50);
    (globalThis as any).addEventListener('scroll', handleScroll);
    return () => (globalThis as any).removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (searchQuery.length > 1) {
      const fetchAirportData = async () => {
        try {
          const results = await fetchAirports(searchQuery);
          setAirports((results || []) as AirportResult[]);
        } catch (error) {
          console.error('[Home] Failed to fetch airports:', error);
          setAirports([]);
        }
      };
      fetchAirportData();
    } else {
      setAirports([]);
    }
  }, [searchQuery]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Floating Cart */}
      <div className="fixed top-4 right-4 z-50">
        <button className="relative bg-white/90 backdrop-blur-lg border border-slate-200 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <ShoppingCart className="h-6 w-6 text-slate-700" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#8B5CF6] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className={cn(
        "fixed top-0 w-full z-40 transition-all duration-500",
        isScrolled ? "bg-white/95 backdrop-blur-lg shadow-lg" : "bg-transparent"
      )}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#8B5CF6] rounded-lg flex items-center justify-center">
                <Plane className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">
                TripAlfa
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#flights" className="text-slate-600 hover:text-[#8B5CF6] transition-colors font-medium">Flights</a>
              <a href="#hotels" className="text-slate-600 hover:text-[#8B5CF6] transition-colors font-medium">Hotels</a>
              <a href="#packages" className="text-slate-600 hover:text-[#8B5CF6] transition-colors font-medium">Packages</a>
              <a href="#cars" className="text-slate-600 hover:text-[#8B5CF6] transition-colors font-medium">Cars</a>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="primary" size="sm" className="hidden md:flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI Search
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6]/10 via-purple-50/10 to-blue-50/20" />
        
        <div className="container relative z-10 px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Hero Content */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 mb-4 justify-center shadow-sm">
                <Sparkles className="h-4 w-4 text-[#8B5CF6]" />
                <span className="text-slate-700 text-sm font-medium">AI-Powered Travel Search</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">
                Book flights, hotels, and experiences
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Discover the best deals with our intelligent search technology
              </p>
            </div>

            {/* Search Widget */}
            <Card className="bg-white shadow-2xl overflow-hidden border-0">
              {/* Tab Navigation */}
              <div className="flex border-b border-slate-200">
                {[
                  { id: 'flights', label: 'Flights', icon: Plane },
                  { id: 'hotels', label: 'Hotels', icon: Hotel },
                  { id: 'packages', label: 'Packages', icon: Sparkles },
                  { id: 'cars', label: 'Cars', icon: Car }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all duration-200",
                      activeTab === id
                        ? "text-white bg-[#8B5CF6]"
                        : "text-slate-600 hover:text-[#8B5CF6] hover:bg-slate-50"
                    )}
                    onClick={() => setActiveTab(id)}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Search Form */}
              <div className="p-6">
                {activeTab === 'flights' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="lg:col-span-1">
                      <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">From</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          type="text"
                          placeholder="Origin"
                          className="pl-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {airports.length > 0 && (
                          <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                            {airports.map((airport, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0">
                                <span className="text-lg">✈️</span>
                                <div>
                                  <p className="font-medium text-slate-900">{airport.title}</p>
                                  <p className="text-xs text-slate-500">{airport.subtitle}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="lg:col-span-1">
                      <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">To</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          type="text"
                          placeholder="Destination"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-1">
                      <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Departure</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          type="date"
                          placeholder="Departure"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-1">
                      <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Return</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          type="date"
                          placeholder="Return"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-1">
                      <Button className="w-full h-[2.75rem]">
                        <Search className="h-4 w-4 mr-2" />
                        Search
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === 'hotels' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="lg:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Destination</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          type="text"
                          placeholder="Where are you going?"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-1">
                      <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Check-in</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          type="date"
                          placeholder="Check-in"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-1">
                      <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Check-out</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          type="date"
                          placeholder="Check-out"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-1">
                      <Button className="w-full h-[2.75rem]">
                        <Search className="h-4 w-4 mr-2" />
                        Search
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === 'packages' && (
                  <div className="text-center py-8">
                    <Sparkles className="h-12 w-12 text-[#8B5CF6] mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 mb-2">AI-Powered Package Deals</h3>
                    <p className="text-slate-600 mb-6">Let our AI find the perfect combination for your trip.</p>
                    <Button>Discover Packages</Button>
                  </div>
                )}

                {activeTab === 'cars' && (
                  <div className="text-center py-8">
                    <Car className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Rent a Car</h3>
                    <p className="text-slate-600 mb-6">Find the perfect vehicle for your journey.</p>
                    <Button variant="outline">Search Cars</Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Popular Destinations */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Popular Destinations</h2>
              <p className="text-slate-500 mt-2">Explore our most visited locations</p>
            </div>
            <Button variant="ghost" className="flex items-center gap-2">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Dubai', image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRjNFNUYxIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzAwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkR1YmFpIENpdHkgSW1hZ2U8L3RleHQ+PC9zdmc+', price: 450 },
              { name: 'London', image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRjNFNUYxIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzAwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvbmRvbiBDaXR5IEltYWdlPC90ZXh0Pjwvc3ZnPg==', price: 620 },
              { name: 'Paris', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80', price: 580 },
              { name: 'New York', image: 'https://images.unsplash.com/photo-1496442226666-8d4a0e62e6e9?auto=format&fit=crop&q=80', price: 750 },
            ].map((dest) => (
              <div key={dest.name} className="group relative rounded-xl overflow-hidden aspect-[3/4] cursor-pointer shadow-lg hover:shadow-xl transition-shadow">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="text-xl font-bold">{dest.name}</h3>
                  <p className="text-sm text-white/80 mt-1">Flights from ${dest.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Flights */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-12">Latest Flight Deals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredFlights.length > 0 ? featuredFlights.map((flight) => (
              <Card key={flight.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <img src={flight.airlineLogo} alt={flight.airline} className="h-10 w-10 object-contain" />
                    <div>
                      <h3 className="font-semibold text-slate-900">{flight.airline}</h3>
                      <p className="text-sm text-slate-500">{flight.flightNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#8B5CF6]">{formatCurrency(flight.price, flight.currency)}</p>
                    <p className="text-xs text-slate-500">per person</p>
                  </div>
                </div>

                <div className="flex items-center justify-between relative">
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-900">{flight.departureTime}</p>
                    <p className="text-sm text-slate-500">{flight.origin}</p>
                  </div>
                  <div className="flex-1 px-8 text-center relative">
                    <p className="text-xs text-slate-500 mb-1">{flight.duration}</p>
                    <div className="w-full h-px bg-slate-200 relative mb-1">
                      <div className="absolute left-1/2 -translate-x-1/2 -top-1.5 bg-slate-50 px-1">
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">{flight.stops === 0 ? 'Direct' : `${flight.stops} Stop`}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-900">{flight.arrivalTime}</p>
                    <p className="text-sm text-slate-500">{flight.destination}</p>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-6" size="sm">
                  View Details
                </Button>
              </Card>
            )) : (
              <div className="md:col-span-2 text-center py-12 text-slate-500">
                No flight deals found at the moment
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
