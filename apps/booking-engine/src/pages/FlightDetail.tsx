import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  Plane,
  ArrowLeft,
  Clock,
  Luggage,
  ShieldCheck,
  Info,
  ChevronRight,
  Check,
  AlertCircle,
  Share2,
  Heart,
  MapPin,
  Calendar,
  Users,
  Loader2,
  Map,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { fetchFlightById } from '../lib/api';
import { getOfferDetails } from '../services/duffelApiManager';
import { formatCurrency } from '@tripalfa/shared-utils/utils';
import { FareCard } from '../components/flight/FareCard';
import { FlightMap } from '../components/map';
import type { FlightMapMarker, FlightPath } from '../components/map';
import { useTenantRuntime } from '@/components/providers/TenantRuntimeProvider';

function FlightDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { config: runtimeConfig } = useTenantRuntime();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const offerId = searchParams.get('offerId');

  // Get passenger counts from search params
  const adults = searchParams.get('adults') || '1';
  const children = searchParams.get('children') || '0';

  const [flight, setFlight] = useState<any>(location.state?.flight || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('segments');

  useEffect(() => {
    if (!runtimeConfig.features.flightBookingEnabled) {
      setFlight(null);
      setLoading(false);
      setError('Flight booking is currently disabled by admin settings.');
      return;
    }

    // If we have a Duffel offerId, fetch offer details
    if (offerId && !flight) {
      setLoading(true);
      getOfferDetails(offerId)
        .then(offerData => {
          // Map Duffel offer to flight format
          const mappedFlight = mapDuffelOfferToFlight(offerData);
          setFlight(mappedFlight);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch offer details:', err);
          setError('Failed to load flight details');
          setLoading(false);
        });
    } else if (!flight && id && !offerId) {
      // Fallback to original fetchFlightById for backward compatibility
      setLoading(true);
      fetchFlightById(id)
        .then(res => {
          setFlight(res);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setError('Failed to load flight details');
          setLoading(false);
        });
    }
  }, [id, offerId, flight, runtimeConfig.features.flightBookingEnabled]);

  if (!runtimeConfig.features.flightBookingEnabled) {
    return (
      <TripLogerLayout>
        <div className="flex flex-col items-center justify-center min-h-screen pb-32 gap-4">
          <h2 className="text-2xl font-black text-gray-900 mb-2">Flight Booking Disabled</h2>
          <p className="text-gray-500 mb-6">
            Your admin has currently disabled flight booking for this tenant.
          </p>
          <Button
            onClick={() => navigate('/')}
            className="bg-[#003b95] text-white rounded-xl px-6 py-3 font-bold uppercase tracking-widest text-xs shadow-lg shadow-purple-100 hover:bg-[#002a6e]"
          >
            Back to Home
          </Button>
        </div>
      </TripLogerLayout>
    );
  }

  // Helper: ISO 8601 duration to human-readable (PT2H30M → 2h 30m)
  const fmtDuration = (d?: string) => {
    if (!d) return '--';
    const h = d.match(/(\d+)H/)?.[1] || '0';
    const m = d.match(/(\d+)M/)?.[1] || '0';
    return `${h}h ${m}m`;
  };

  // Helper function to map Duffel offer to flight details format
  const mapDuffelOfferToFlight = (offer: any) => {
    // Get all slices (supports multi-city with multiple legs)
    const slices = offer.slices || [];

    // Determine trip type based on number of slices
    const tripType =
      slices.length === 1 ? 'one-way' : slices.length === 2 ? 'round-trip' : 'multi-city';

    // For the header, use the first segment of the first slice
    const firstSlice = slices[0];
    const firstSegments = firstSlice?.segments || [];
    const firstSeg = firstSegments[0];
    const lastSegOfFirstSlice = firstSegments[firstSegments.length - 1];

    // For destination, use the last segment of the last slice
    const lastSlice = slices[slices.length - 1];
    const lastSegments = lastSlice?.segments || [];
    const lastSegOfLastSlice = lastSegments[lastSegments.length - 1];

    // Derive refund/change conditions from Duffel conditions object
    const conditions = offer.conditions ?? {};
    const refundCond = conditions.refund_before_departure ?? {};
    const changeCond = conditions.change_before_departure ?? {};
    const isRefundable = refundCond.allowed === true;

    // Build human-readable fare rules from API data
    const fareRules: string[] = [];
    if (refundCond.allowed === true) {
      fareRules.push(
        `Refundable — ${refundCond.penalty_amount ? `cancellation penalty: ${refundCond.penalty_currency} ${refundCond.penalty_amount}` : 'no penalty'}`
      );
    } else {
      fareRules.push('Non-refundable — ticket cannot be cancelled for a refund.');
    }
    if (changeCond.allowed === true) {
      fareRules.push(
        `Date changes allowed${changeCond.penalty_amount ? ` — change fee: ${changeCond.penalty_currency} ${changeCond.penalty_amount}` : ' at no extra charge'}.`
      );
    } else if (changeCond.allowed === false) {
      fareRules.push('Date changes are not permitted on this fare.');
    } else {
      fareRules.push('Date change policy: contact support at least 24h before departure.');
    }
    fareRules.push('Name changes are not permitted after ticket issuance.');
    fareRules.push(
      'No-show: ticket value is forfeited. Please cancel before departure if plans change.'
    );
    fareRules.push('Partially used tickets are non-refundable.');

    // Add changeable flag to flight object
    const isChangeable = changeCond.allowed === true;

    // Build all slices with their segments for multi-city display
    const allSlices = slices.map((slice: any, sliceIdx: number) => {
      const segs = slice?.segments || [];
      return {
        sliceIndex: sliceIdx,
        sliceLabel: sliceIdx === 0 ? 'Outbound' : `Leg ${sliceIdx + 1}`,
        departureDate: slice?.departure_date || segs[0]?.departing_at?.split('T')[0],
        segments: segs.map((seg: any, idx: number) => {
          const nextSeg = segs[idx + 1];
          const depAt = seg.departing_at || seg.departure_time;
          const arrAt = seg.arriving_at || seg.arrival_time;
          const layover = nextSeg
            ? (() => {
                const diff =
                  new Date(nextSeg.departing_at || nextSeg.departure_time).getTime() -
                  new Date(arrAt).getTime();
                const h = Math.floor(diff / 3_600_000);
                const m = Math.floor((diff % 3_600_000) / 60_000);
                return `${h}h ${m}m`;
              })()
            : null;
          return {
            from: seg.origin?.iata_code || seg.origin_iata,
            to: seg.destination?.iata_code || seg.destination_iata,
            originCity: seg.origin?.city_name || seg.origin?.name,
            destinationCity: seg.destination?.city_name || seg.destination?.name,
            depart: depAt,
            arrive: arrAt,
            airline: seg.operating_carrier?.name || seg.marketing_carrier?.name,
            number: `${seg.marketing_carrier?.iata_code ?? ''}${seg.marketing_carrier_flight_number ?? ''}`,
            aircraft: seg.aircraft?.name || seg.aircraft?.iata_code || null,
            duration: fmtDuration(seg.duration),
            layover,
            departureTerminal: seg.origin_terminal ?? null,
            arrivalTerminal: seg.destination_terminal ?? null,
          };
        }),
        // Calculate total duration for this slice
        totalDuration: fmtDuration(slice?.duration),
      };
    });

    // Flatten all segments for backward compatibility (single segment list)
    const allSegments = allSlices.flatMap((s: any) => s.segments);

    return {
      id: offer.id,
      tripType,
      origin: firstSeg?.origin?.iata_code || firstSeg?.origin_iata || 'N/A',
      destination:
        lastSegOfLastSlice?.destination?.iata_code || lastSegOfLastSlice?.destination_iata || 'N/A',
      airline: firstSeg?.operating_carrier?.name || firstSeg?.marketing_carrier?.name || 'Unknown',
      flightNumber: `${firstSeg?.marketing_carrier?.iata_code ?? ''}${firstSeg?.marketing_carrier_flight_number ?? ''}`,
      cabin:
        offer.passengers?.[0]?.fare_brand_name || offer.passengers?.[0]?.cabin_class || 'Economy',
      amount: parseFloat(offer.total_amount),
      baseAmount: parseFloat(offer.base_amount ?? offer.total_amount),
      taxAmount: parseFloat(offer.tax_amount ?? '0'),
      currency: offer.total_currency || 'USD',
      refundable: isRefundable,
      changeable: isChangeable,
      fareRules,
      includedBags:
        offer.passengers?.[0]?.baggages?.map((b: any) => ({
          quantity: b.quantity ?? 1,
          weight: b.maximum_weight_kg,
          unit: 'kg',
          type: b.type, // 'checked' | 'carry_on'
        })) ?? [],
      // All slices for multi-city display
      slices: allSlices,
      // Flattened segments for backward compatibility
      segments: allSegments,
      rawOffer: offer,
    };
  };

  if (loading) {
    return (
      <TripLogerLayout>
        <div className="flex flex-col items-center justify-center min-h-screen pb-32 gap-4">
          <Loader2 size={48} className="text-[#003b95] animate-spin mb-4" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
            Loading Flight Details...
          </p>
        </div>
      </TripLogerLayout>
    );
  }

  if (error || (!flight && !loading)) {
    return (
      <TripLogerLayout>
        <div className="flex flex-col items-center justify-center min-h-screen pb-32 gap-4">
          <h2 className="text-2xl font-black text-gray-900 mb-2">Flight Not Found</h2>
          <p className="text-gray-500 mb-6">
            We couldn't find the flight details you requested.
          </p>
          <Button
            onClick={() => navigate('/flights')}
            className="bg-[#003b95] text-white rounded-xl px-6 py-3 font-bold uppercase tracking-widest text-xs shadow-lg shadow-purple-100 hover:bg-[#002a6e]"
          >
            Back to Search
          </Button>
        </div>
      </TripLogerLayout>
    );
  }

  return (
    <TripLogerLayout>
      <div className="bg-gray-50 min-h-screen pb-32 font-sans">
        {/* Elite Header */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl h-20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate(-1)}
                className="w-12 h-12 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#003b95] hover:border-[#003b95] transition-all duration-200"
                aria-label="Go back"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-lg font-bold text-[#1d1d1f] tracking-tight">
                  {flight.tripType === 'multi-city'
                    ? `${flight.origin} → ... → ${flight.destination}`
                    : `${flight.origin} to ${flight.destination}`}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {flight.tripType === 'multi-city' && flight.slices?.length > 0
                    ? `${flight.slices.length} legs • `
                    : ''}
                  {flight.airline} • {flight.flightNumber} • {flight.cabin}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {}}
                className="w-12 h-12 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#003b95] hover:border-[#003b95] transition-all duration-200"
                aria-label="Share flight"
              >
                <Share2 size={18} />
              </button>
              <button
                onClick={() => {}}
                className="w-12 h-12 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#003b95] hover:border-[#003b95] transition-all duration-200"
                aria-label="Save flight"
              >
                <Heart size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl mt-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
            {/* Main Content */}
            <div className="lg:col-span-8 space-y-6">
              {/* Tabs */}
              <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-0">
                {[
                  { key: 'segments', label: 'Segments' },
                  { key: 'route', label: 'Route' },
                  { key: 'baggage', label: 'Baggage' },
                  { key: 'rules', label: 'Fare Rules' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider transition-all relative whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'text-[#003b95]'
                        : 'text-gray-500 hover:text-[#1d1d1f]'
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.key && (
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#003b95] rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 lg:p-10">
                {activeTab === 'segments' && (
                  <div className="space-y-12">
                    {/* Show slices for multi-city, or just segments for one-way/round-trip */}
                    {flight.slices?.map((slice: any, sliceIdx: number) => (
                      <div key={sliceIdx} className="relative">
                        {/* Slice Header - Show for multi-city */}
                        {flight.tripType === 'multi-city' && (
                          <div className="mb-6 pb-4 border-b border-dashed border-gray-200">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div>
                                <h3 className="text-lg font-bold text-[#003b95] tracking-tight">
                                  {slice.sliceLabel}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">
                                  {slice.departureDate} • {slice.segments?.length} flight(s) •
                                  Total: {slice.totalDuration}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                  Route:
                                </span>
                                <span className="text-sm font-semibold text-[#1d1d1f]">
                                  {slice.segments?.[0]?.from} →{' '}
                                  {slice.segments?.[slice.segments?.length - 1]?.to}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Segments in this slice */}
                        {slice.segments?.map((segment: any, idx: number) => (
                          <div key={`${sliceIdx}-${idx}`} className="relative mb-8 last:mb-0">
                            {idx > 0 && (
                              <div className="absolute -top-6 left-6 h-6 border-l-2 border-dashed border-gray-200" />
                            )}
                            <div className="flex gap-6">
                              <div className="w-12 h-12 rounded-xl bg-[#003b95]/5 flex items-center justify-center shrink-0">
                                <Plane
                                  className={`${idx % 2 === 0 ? '-rotate-45' : 'rotate-45'} text-[#003b95]`}
                                  size={20}
                                />
                              </div>
                              <div className="flex-1 gap-4">
                                <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
                                  <div>
                                    <h3 className="text-lg font-bold text-[#1d1d1f] tracking-tight">
                                      {segment.from} → {segment.to}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {segment.number} • {segment.airline}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <span className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-100">
                                      Confirmed
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                    <div className="flex gap-4">
                                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                        <Clock className="text-gray-400" size={16} />
                                      </div>
                                      <div>
                                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                                          Departure
                                        </p>
                                        <p className="text-sm font-semibold text-[#1d1d1f]">
                                          {new Date(segment.depart).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex gap-4">
                                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                        <MapPin className="text-gray-400" size={16} />
                                      </div>
                                      <div>
                                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                                          Arrival
                                        </p>
                                        <p className="text-sm font-semibold text-[#1d1d1f]">
                                          {new Date(segment.arrive).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <div className="flex gap-4">
                                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                        <Users className="text-gray-400" size={16} />
                                      </div>
                                      <div>
                                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                                          Aircraft
                                        </p>
                                        <p className="text-sm font-semibold text-[#1d1d1f]">
                                          {segment.aircraft || 'Information unavailable'}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex gap-4">
                                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                        <ShieldCheck className="text-gray-400" size={16} />
                                      </div>
                                      <div>
                                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                                          Duration
                                        </p>
                                        <p className="text-sm font-semibold text-[#1d1d1f]">
                                          {segment.duration}
                                        </p>
                                      </div>
                                    </div>
                                    {segment.layover && (
                                      <div className="mt-4 px-4 py-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-3">
                                        <Clock size={14} className="text-amber-500 shrink-0" />
                                        <span className="text-xs font-semibold text-amber-700">
                                          Layover: {segment.layover}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'route' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-[#003b95]/5 flex items-center justify-center">
                        <Map className="text-[#003b95]" size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#1d1d1f]">Flight Route</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Interactive route map
                        </p>
                      </div>
                    </div>

                    {/* Flight Route Map */}
                    <FlightMap
                      segments={flight.segments?.map((s: any) => ({
                        from: s.from,
                        to: s.to,
                        depart: s.depart,
                        arrive: s.arrive,
                        airline: s.airline,
                        duration: s.duration,
                      }))}
                      airports={{
                        // Major airport coordinates - in production, these would come from a database
                        DXB: {
                          code: 'DXB',
                          name: 'Dubai International Airport',
                          city: 'Dubai',
                          latitude: 25.2532,
                          longitude: 55.3657,
                        },
                        AUH: {
                          code: 'AUH',
                          name: 'Abu Dhabi International Airport',
                          city: 'Abu Dhabi',
                          latitude: 24.433,
                          longitude: 54.6511,
                        },
                        JED: {
                          code: 'JED',
                          name: 'King Abdulaziz International Airport',
                          city: 'Jeddah',
                          latitude: 21.6796,
                          longitude: 39.1565,
                        },
                        RUH: {
                          code: 'RUH',
                          name: 'King Khalid International Airport',
                          city: 'Riyadh',
                          latitude: 24.9576,
                          longitude: 46.6988,
                        },
                        LHR: {
                          code: 'LHR',
                          name: 'London Heathrow',
                          city: 'London',
                          latitude: 51.47,
                          longitude: -0.4543,
                        },
                        CDG: {
                          code: 'CDG',
                          name: 'Paris Charles de Gaulle',
                          city: 'Paris',
                          latitude: 49.0097,
                          longitude: 2.5479,
                        },
                        JFK: {
                          code: 'JFK',
                          name: 'John F. Kennedy International Airport',
                          city: 'New York',
                          latitude: 40.6413,
                          longitude: -73.7781,
                        },
                        LAX: {
                          code: 'LAX',
                          name: 'Los Angeles International Airport',
                          city: 'Los Angeles',
                          latitude: 33.9425,
                          longitude: -118.4081,
                        },
                        SIN: {
                          code: 'SIN',
                          name: 'Singapore Changi Airport',
                          city: 'Singapore',
                          latitude: 1.3644,
                          longitude: 103.9915,
                        },
                        HKG: {
                          code: 'HKG',
                          name: 'Hong Kong International Airport',
                          city: 'Hong Kong',
                          latitude: 22.308,
                          longitude: 113.9185,
                        },
                        BKK: {
                          code: 'BKK',
                          name: 'Suvarnabhumi Airport',
                          city: 'Bangkok',
                          latitude: 13.69,
                          longitude: 100.7501,
                        },
                        DEL: {
                          code: 'DEL',
                          name: 'Indira Gandhi International Airport',
                          city: 'Delhi',
                          latitude: 28.5562,
                          longitude: 77.1,
                        },
                        BOM: {
                          code: 'BOM',
                          name: 'Chhatrapati Shivaji International Airport',
                          city: 'Mumbai',
                          latitude: 19.0896,
                          longitude: 72.8656,
                        },
                        DOH: {
                          code: 'DOH',
                          name: 'Hamad International Airport',
                          city: 'Doha',
                          latitude: 25.2609,
                          longitude: 51.6138,
                        },
                        KWI: {
                          code: 'KWI',
                          name: 'Kuwait International Airport',
                          city: 'Kuwait City',
                          latitude: 29.2266,
                          longitude: 47.9689,
                        },
                        BAH: {
                          code: 'BAH',
                          name: 'Bahrain International Airport',
                          city: 'Bahrain',
                          latitude: 26.2708,
                          longitude: 50.6336,
                        },
                        MNL: {
                          code: 'MNL',
                          name: 'Ninoy Aquino International Airport',
                          city: 'Manila',
                          latitude: 14.5086,
                          longitude: 121.0195,
                        },
                        CGK: {
                          code: 'CGK',
                          name: 'Soekarno-Hatta International Airport',
                          city: 'Jakarta',
                          latitude: -6.1256,
                          longitude: 106.6559,
                        },
                        KUL: {
                          code: 'KUL',
                          name: 'Kuala Lumpur International Airport',
                          city: 'Kuala Lumpur',
                          latitude: 2.7456,
                          longitude: 101.7072,
                        },
                        AMS: {
                          code: 'AMS',
                          name: 'Amsterdam Schiphol',
                          city: 'Amsterdam',
                          latitude: 52.3105,
                          longitude: 4.7683,
                        },
                        FRA: {
                          code: 'FRA',
                          name: 'Frankfurt Airport',
                          city: 'Frankfurt',
                          latitude: 50.0379,
                          longitude: 8.5622,
                        },
                        IST: {
                          code: 'IST',
                          name: 'Istanbul Airport',
                          city: 'Istanbul',
                          latitude: 41.2753,
                          longitude: 28.7519,
                        },
                        CAI: {
                          code: 'CAI',
                          name: 'Cairo International Airport',
                          city: 'Cairo',
                          latitude: 30.1219,
                          longitude: 31.4056,
                        },
                        AMM: {
                          code: 'AMM',
                          name: 'Queen Alia International Airport',
                          city: 'Amman',
                          latitude: 31.7226,
                          longitude: 35.9932,
                        },
                        BEY: {
                          code: 'BEY',
                          name: 'Beirut Rafic Hariri International Airport',
                          city: 'Beirut',
                          latitude: 33.8209,
                          longitude: 35.4884,
                        },
                      }}
                      height="400px"
                      showFlightInfo={true}
                    />
                  </div>
                )}

                {activeTab === 'baggage' && (
                  <div className="space-y-6">
                    <div className="flex items-start gap-5 p-6 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="p-3 bg-white rounded-xl shadow-sm shrink-0">
                        <Luggage className="text-[#003b95]" size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-[#1d1d1f] mb-2">
                          Check-in Baggage
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Your fare include {flight.includedBags?.[0]?.quantity} bags (
                          {flight.includedBags?.[0]?.weight}
                          {flight.includedBags?.[0]?.unit} each). Maximum dimensions: 158cm (length
                          + width + height).
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-5 p-6 border border-gray-100 rounded-xl">
                      <div className="p-3 bg-gray-50 rounded-xl shrink-0">
                        <ShieldCheck className="text-gray-400" size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-[#1d1d1f] mb-2">Cabin Baggage</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          1 piece of 7kg (55 x 35 x 25 cm) plus one small personal item (laptop bag
                          or handbag).
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'rules' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h4 className="text-lg font-bold text-[#1d1d1f]">
                        Fare Rules & Conditions
                      </h4>
                      {flight.refundable !== undefined && (
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${flight.refundable ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}
                        >
                          {flight.refundable ? 'Refundable' : 'Non-Refundable'}
                        </span>
                      )}
                      {flight.changeable !== undefined && (
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${flight.changeable ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
                        >
                          {flight.changeable ? 'Changes Allowed' : 'No Changes'}
                        </span>
                      )}
                    </div>
                    <div className="grid gap-4">
                      {(flight.fareRules && flight.fareRules.length > 0
                        ? flight.fareRules
                        : [
                            flight.refundable
                              ? 'This fare is fully refundable before departure.'
                              : 'Non-refundable — ticket cannot be cancelled for a refund.',
                            'Date change policy: contact support at least 24 h before departure.',
                            'Name changes are not permitted after ticket issuance.',
                            'No-show: ticket value is forfeited. Please cancel before departure if plans change.',
                            'Partially used tickets are non-refundable.',
                          ]
                      ).map((rule: string, i: number) => (
                        <div
                          key={i}
                          className="flex gap-4 items-start p-4 bg-gray-50 rounded-xl border border-gray-100"
                        >
                          <AlertCircle
                            size={16}
                            className="text-[#003b95] mt-0.5 shrink-0"
                          />
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {rule}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Summary */}
            <div className="lg:col-span-4">
              <FareCard
                amount={flight.amount}
                currency={flight.currency || 'SAR'}
                onSelect={() =>
                  navigate(
                    `/seat-selection?offerId=${flight.id}&adults=${adults}&children=${children}`,
                    {
                      state: { offer: flight.rawOffer, flight },
                    }
                  )
                }
              />
            </div>
          </div>
        </div>
      </div>
    </TripLogerLayout>
  );
}

export default FlightDetail;
