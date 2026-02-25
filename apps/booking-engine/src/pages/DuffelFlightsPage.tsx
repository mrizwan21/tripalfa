/**
 * DuffelFlightsPage
 * 
 * A comprehensive flight search page using Duffel API integration.
 * Combines search form, results display, and detail view in one page.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Plane, Server, Zap } from 'lucide-react';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { DuffelFlightSearch } from '../components/flight/DuffelFlightSearch';
import { DuffelFlightResults } from '../components/flight/DuffelFlightResults';
import { DuffelFlightDetail } from '../components/flight/DuffelFlightDetail';
import { useDuffelFlights } from '../hooks/useDuffelFlights';
import type { FlightSearchResult, CabinClass } from '../types/duffel';

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = 'search' | 'results' | 'detail';

// ============================================================================
// COMPONENT
// ============================================================================

export function DuffelFlightsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('search');
  const [selectedFlight, setSelectedFlight] = useState<FlightSearchResult | null>(null);

  // Get initial params from URL
  const initialParams = {
    origin: searchParams.get('origin') || '',
    destination: searchParams.get('destination') || '',
    departureDate: searchParams.get('departureDate') || '',
    returnDate: searchParams.get('returnDate') || '',
    adults: parseInt(searchParams.get('adults') || '1'),
    children: parseInt(searchParams.get('children') || '0'),
    infants: parseInt(searchParams.get('infants') || '0'),
    cabinClass: (searchParams.get('cabinClass') || 'economy') as CabinClass,
    tripType: (searchParams.get('tripType') || 'roundTrip') as 'roundTrip' | 'oneWay' | 'multiCity',
  };

  // Search hook
  const { flights, loading, error, search, isCached, total, refetch } = useDuffelFlights();

  // Auto-search if URL params are present
  useEffect(() => {
    if (initialParams.origin && initialParams.destination && initialParams.departureDate) {
      search(initialParams);
      setViewMode('results');
    }
  }, []);

  // Handle search navigation
  const handleSearchNavigate = useCallback((params: URLSearchParams) => {
    // Update URL
    navigate(`/flights/duffel?${params.toString()}`, { replace: true });

    // Parse params and search
    const searchParamsObj = {
      origin: params.get('origin') || '',
      destination: params.get('destination') || '',
      departureDate: params.get('departureDate') || '',
      returnDate: params.get('returnDate') || undefined,
      adults: parseInt(params.get('adults') || '1'),
      children: parseInt(params.get('children') || '0'),
      infants: parseInt(params.get('infants') || '0'),
      cabinClass: (params.get('cabinClass') || 'economy') as CabinClass,
      tripType: (params.get('tripType') || 'roundTrip') as 'roundTrip' | 'oneWay' | 'multiCity',
    };

    search(searchParamsObj);
    setViewMode('results');
  }, [navigate, search]);

  // Handle flight selection
  const handleSelectFlight = useCallback((flight: FlightSearchResult) => {
    setSelectedFlight(flight);
    setViewMode('detail');
  }, []);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (viewMode === 'detail') {
      setViewMode('results');
      setSelectedFlight(null);
    } else if (viewMode === 'results') {
      setViewMode('search');
    }
  }, [viewMode]);

  // Handle booking
  const handleBook = useCallback((flight: FlightSearchResult) => {
    // Navigate to booking checkout
    navigate(`/booking/checkout?offerId=${flight.offerId}`, {
      state: { flight },
    });
  }, [navigate]);

  return (
    <TripLogerLayout>
      <div className="min-h-screen bg-[#F8F9FA]">
        {/* Search View */}
        {viewMode === 'search' && (
          <div className="relative">
            {/* Hero Background */}
            <div
              className="absolute inset-0 h-[600px] bg-cover bg-center z-0"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop')",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1]/80 via-[#152467]/60 to-[#A855F7]/40" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 container mx-auto px-4 pt-20 pb-32">
              <div className="text-center mb-12">
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
                  Search Flights with Duffel
                </h1>
                <p className="text-white/90 max-w-2xl mx-auto drop-shadow-md">
                  Real-time flight search powered by Duffel API. Find the best deals
                  from hundreds of airlines worldwide.
                </p>
              </div>

              {/* Search Card */}
              <div className="max-w-5xl mx-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-2xl">
                <DuffelFlightSearch
                  onNavigate={handleSearchNavigate}
                  initialTripType={initialParams.tripType}
                  initialCabinClass={initialParams.cabinClass}
                />
              </div>

              {/* Features */}
              <div className="max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="text-yellow-400" size={24} />
                  </div>
                  <h3 className="text-white font-bold mb-2">Real-time Results</h3>
                  <p className="text-white/70 text-sm">
                    Live pricing from 300+ airlines
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Server className="text-blue-400" size={24} />
                  </div>
                  <h3 className="text-white font-bold mb-2">Direct API</h3>
                  <p className="text-white/70 text-sm">
                    No middleman, direct airline content
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plane className="text-purple-400" size={24} />
                  </div>
                  <h3 className="text-white font-bold mb-2">Instant Booking</h3>
                  <p className="text-white/70 text-sm">
                    Book directly with instant confirmation
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results View */}
        {viewMode === 'results' && (
          <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 sticky top-16 z-40 -mx-4 px-4 py-4 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBack}
                    className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                  >
                    <ArrowLeft size={20} className="text-gray-400" />
                  </button>
                  <div>
                    <h1 className="text-lg font-black text-gray-900">
                      {initialParams.origin} → {initialParams.destination}
                    </h1>
                    <p className="text-xs text-gray-400">
                      {initialParams.departureDate}
                      {initialParams.returnDate && ` - ${initialParams.returnDate}`}
                      {' • '}
                      {initialParams.adults + initialParams.children + initialParams.infants}{' '}
                      traveler(s)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewMode('search')}
                  className="text-xs font-bold text-[#152467] uppercase tracking-widest hover:underline"
                >
                  Modify Search
                </button>
              </div>
            </div>

            {/* Results */}
            <DuffelFlightResults
              flights={flights}
              loading={loading}
              error={error}
              isCached={isCached}
              onSelectFlight={handleSelectFlight}
              onRefresh={refetch}
              origin={initialParams.origin}
              destination={initialParams.destination}
              departureDate={initialParams.departureDate}
            />
          </div>
        )}

        {/* Detail View */}
        {viewMode === 'detail' && selectedFlight && (
          <DuffelFlightDetail
            flight={selectedFlight}
            onBook={handleBook}
            onBack={handleBack}
          />
        )}
      </div>
    </TripLogerLayout>
  );
}

export default DuffelFlightsPage;
