/// <reference lib="dom" />
import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Users, ArrowRight, ShoppingCart, Sparkles, Plane, Hotel, Car, Camera, Heart, Star, Globe } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { api } from '../lib/api';


interface CartSummaryResponse {
  data: {
    itemCount: number;
  };
}

type Suggestion =
  | { type: 'city'; name: string; country: string; image: string }
  | { type: 'airport'; name: string; city: string; image: string };

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
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [featuredFlights, setFeaturedFlights] = useState<Flight[]>([]);

  // Fetch featured flights on component mount
  useEffect(() => {
    fetchFeaturedFlights();
    fetchCartSummary();
  }, []);

  const fetchFeaturedFlights = async () => {
    try {
      // Fetch popular flight deals from the API
      const response = await api.get('/search/flights/popular');
      if (response && Array.isArray(response)) {
        setFeaturedFlights(response.slice(0, 4)); // Show top 4 deals
      }
    } catch (error) {
      console.error('Failed to fetch featured flights:', error);
      // Fallback to empty array if API fails
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
    // ensure we're running in a browser-like environment before touching globals
    if (typeof globalThis === 'undefined' || !(globalThis as any).addEventListener) return;
    const handleScroll = () => setIsScrolled((globalThis as any).scrollY > 50);
    (globalThis as any).addEventListener('scroll', handleScroll);
    return () => (globalThis as any).removeEventListener('scroll', handleScroll);
  }, []);

  // Mock search suggestions
  const mockSuggestions: Suggestion[] = [
    { type: 'city', name: 'Dubai, UAE', country: 'United Arab Emirates', image: '🇦🇪' },
    { type: 'city', name: 'Paris, France', country: 'France', image: '🇫🇷' },
    { type: 'city', name: 'Tokyo, Japan', country: 'Japan', image: '🇯🇵' },
    { type: 'city', name: 'New York, USA', country: 'United States', image: '🇺🇸' },
    { type: 'airport', name: 'John F. Kennedy (JFK)', city: 'New York', image: '✈️' },
    { type: 'airport', name: 'Heathrow (LHR)', city: 'London', image: '✈️' },
  ];

  useEffect(() => {
    if (searchQuery.length > 2) {
      setSuggestions(mockSuggestions.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Floating Cart */}
      <div className="fixed top-4 right-4 z-50">
        <button className="relative bg-white/90 backdrop-blur-lg border border-white/20 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <ShoppingCart className="h-6 w-6 text-slate-700" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
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
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TravelAI
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#flights" className="text-slate-600 hover:text-blue-600 transition-colors">Flights</a>
              <a href="#hotels" className="text-slate-600 hover:text-blue-600 transition-colors">Hotels</a>
              <a href="#packages" className="text-slate-600 hover:text-blue-600 transition-colors">Packages</a>
              <a href="#cars" className="text-slate-600 hover:text-blue-600 transition-colors">Cars</a>
            </div>
            <div className="flex items-center gap-4">
              <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:shadow-lg transition-all duration-300 hover:scale-105">
                <Sparkles className="h-4 w-4" />
                AI Search
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-pink-900/20" />
          <div className="absolute inset-0">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white/10 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 3}s`
                }}
              />
            ))}
          </div>
        </div>

        <div className="container relative z-10 px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Hero Content */}
            <Card className="text-center mb-8 bg-white/80 shadow-lg p-6">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full px-4 py-2 mb-4 justify-center">
                <Sparkles className="h-4 w-4 text-yellow-400" />
                <span className="text-slate-900 text-sm font-medium">AI-Powered Travel Search</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-bold text-slate-900 mb-2 leading-snug">
                Book flights, hotels, and experiences with confidence.
              </h1>
            </Card>

            {/* Advanced Search Interface */}
            <div className="max-w-3xl mx-auto">
              <Card className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-6">
                {/* Tab Navigation */}
                <div className="flex border-b border-slate-200/50">
                  {[
                    { id: 'flights', label: 'Flights', icon: Plane },
                    { id: 'hotels', label: 'Hotels', icon: Hotel },
                    { id: 'packages', label: 'Packages', icon: Sparkles },
                    { id: 'cars', label: 'Cars', icon: Car }
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-5 text-sm font-semibold transition-all duration-300",
                        activeTab === id
                          ? "text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg"
                          : "text-slate-600 hover:text-blue-600 hover:bg-blue-50/50"
                      )}
                      onClick={() => setActiveTab(id)}
                    >
                      <Icon className="h-5 w-5" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Search Form */}
                <div className="p-8">
                  {activeTab === 'flights' && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                      <div className="relative">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">From</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Origin city or airport"
                            className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 text-slate-900 placeholder-slate-400"
                            value={searchQuery}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.currentTarget.value)}
                          />
                          {suggestions.length > 0 && (
                            <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-10 max-h-60 overflow-y-auto">
                              {suggestions.map((suggestion, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0">
                                  <span className="text-2xl">{suggestion.image}</span>
                                  <div>
                                    <p className="font-semibold text-slate-900">{suggestion.name}</p>
                                    <p className="text-sm text-slate-500">
                                      {suggestion.type === 'city' ? suggestion.country : suggestion.city}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">To</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Destination"
                            className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Depart</label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <input
                            type="date"
                            className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Return</label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <input
                            type="date"
                            className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                          />
                        </div>
                      </div>

                      <div className="flex items-end">
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold flex items-center justify-center gap-2">
                          <Search className="h-5 w-5" />
                          Search
                        </Button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'hotels' && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Destination</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Where are you going?"
                            className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Check-in</label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <input
                            type="date"
                            className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Check-out</label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <input
                            type="date"
                            className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Guests</label>
                        <div className="relative">
                          <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <select id="home-travelers" name="home-travelers" className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 appearance-none">
                            <option>2 adults</option>
                            <option>1 adult</option>
                            <option>2 adults, 1 child</option>
                            <option>2 adults, 2 children</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-end">
                        <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold flex items-center justify-center gap-2">
                          <Search className="h-5 w-5" />
                          Search
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'packages' && (
                    <div className="text-center py-8">
                      <Sparkles className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-slate-900 mb-2">AI-Powered Package Deals</h3>
                      <p className="text-slate-600 mb-6">Let our AI find the perfect combination of flights, hotels, and activities for your trip.</p>
                      <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-12 rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold">
                        Discover Packages
                      </button>
                    </div>
                  )}

                  {activeTab === 'cars' && (
                    <div className="text-center py-8">
                      <Car className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Rent a Car</h3>
                      <p className="text-slate-600 mb-6">Find the perfect vehicle for your journey.</p>
                      <button className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 px-12 rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold">
                        Search Cars
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            </div>
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
            <button className="flex items-center text-blue-600 font-medium hover:text-blue-700">
              View All <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Dubai', image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRjNFNUYxIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzAwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkR1YmFpIENpdHkgSW1hZ2U8L3RleHQ+PC9zdmc+', price: 450 },
              { name: 'London', image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRjNFNUYxIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzAwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvbmRvbiBDaXR5IEltYWdlPC90ZXh0Pjwvc3ZnPg==', price: 620 },
              { name: 'Paris', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80', price: 580 },
              { name: 'New York', image: 'https://images.unsplash.com/photo-1496442226666-8d4a0e62e6e9?auto=format&fit=crop&q=80', price: 750 },
            ].map((dest) => (
              <div key={dest.name} className="group relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer">
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
              <div key={flight.id} className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <img src={flight.airlineLogo} alt={flight.airline} className="h-10 w-10 object-contain" />
                    <div>
                      <h3 className="font-semibold text-slate-900">{flight.airline}</h3>
                      <p className="text-sm text-slate-500">{flight.flightNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(flight.price, flight.currency)}</p>
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

                <button className="w-full mt-6 btn btn-outline btn-sm">
                  View Detail
                </button>
              </div>
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
