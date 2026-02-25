/**
 * DuffelFlightDetail Component
 * 
 * Displays detailed information about a selected flight offer
 * including segments, baggage, fare rules, and booking actions.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { formatCurrency } from '@tripalfa/ui-components';
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
  Ticket,
  CreditCard,
  BaggageClaim,
  Utensils,
  Armchair,
} from 'lucide-react';
import { Button } from '../ui/button';
import { FlightMap } from '../map';
import duffelFlightService from '../../services/duffelFlightService';
import type { DuffelOffer, FlightSearchResult, FlightSegment } from '../../types/duffel';

// ============================================================================
// TYPES
// ============================================================================

interface DuffelFlightDetailProps {
  /** Flight offer ID */
  offerId?: string;
  /** Pre-loaded flight data */
  flight?: FlightSearchResult | null;
  /** Callback when booking is initiated */
  onBook?: (flight: FlightSearchResult) => void;
  /** Callback to go back */
  onBack?: () => void;
  /** Additional className */
  className?: string;
}

interface FareRule {
  icon: React.ReactNode;
  text: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDuration(isoDuration: string | null | undefined): string {
  if (!isoDuration) return '--';
  const hours = isoDuration.match(/(\d+)H/)?.[1] || '0';
  const minutes = isoDuration.match(/(\d+)M/)?.[1] || '0';
  return `${hours}h ${minutes}m`;
}

function formatDateTime(isoDatetime: string | null | undefined): {
  date: string;
  time: string;
  full: string;
} {
  if (!isoDatetime) return { date: '--', time: '--:--', full: '--' };
  try {
    const dt = new Date(isoDatetime);
    return {
      date: format(dt, 'd MMM yyyy'),
      time: format(dt, 'HH:mm'),
      full: format(dt, 'd MMM yyyy, HH:mm'),
    };
  } catch {
    return { date: '--', time: '--:--', full: '--' };
  }
}

function calculateLayover(arrival: string, departure: string): string {
  const arr = new Date(arrival);
  const dep = new Date(departure);
  const diffMs = dep.getTime() - arr.getTime();
  if (diffMs <= 0) return '0h 0m';

  const diffHrs = Math.floor(diffMs / 3600000);
  const diffMins = Math.floor((diffMs % 3600000) / 60000);
  return `${diffHrs}h ${diffMins}m`;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface SegmentCardProps {
  segment: FlightSegment;
  index: number;
  isLast: boolean;
}

const SegmentCard: React.FC<SegmentCardProps> = ({ segment, index, isLast }) => {
  const dep = formatDateTime(segment.departureTime);
  const arr = formatDateTime(segment.arrivalTime);

  return (
    <div className="relative">
      {/* Connector Line */}
      {!isLast && (
        <div className="absolute left-6 top-16 h-full w-0.5 bg-gray-100" />
      )}

      <div className="flex gap-6 p-6 bg-gray-50/50 rounded-2xl">
        {/* Flight Icon */}
        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-gray-100">
          <Plane className="rotate-45" size={20} />
        </div>

        {/* Segment Details */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-black text-gray-900">
                {segment.origin} → {segment.destination}
              </h4>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                Flight Leg {index + 1}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-[#152467] uppercase tracking-widest px-3 py-1 bg-purple-50 rounded-full">
                Confirmed
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Departure */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <Clock className="text-gray-300" size={16} />
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Departure
                  </p>
                  <p className="text-sm font-bold text-gray-900">{dep.full}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="text-gray-300" size={16} />
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    From
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {segment.originCity || segment.origin}
                    {segment.departureTerminal && (
                      <span className="ml-2 text-[9px] bg-gray-200 px-1.5 py-0.5 rounded">
                        T{segment.departureTerminal}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Arrival */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <Clock className="text-gray-300" size={16} />
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Arrival
                  </p>
                  <p className="text-sm font-bold text-gray-900">{arr.full}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="text-gray-300" size={16} />
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    To
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {segment.destinationCity || segment.destination}
                    {segment.arrivalTerminal && (
                      <span className="ml-2 text-[9px] bg-gray-200 px-1.5 py-0.5 rounded">
                        T{segment.arrivalTerminal}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Flight Info */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-6 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Plane size={12} />
              {segment.airline}
            </span>
            <span className="flex items-center gap-1">
              <Ticket size={12} />
              {segment.flightNumber}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {segment.duration}
            </span>
            {segment.aircraft && (
              <span className="flex items-center gap-1">
                <Info size={12} />
                {segment.aircraft}
              </span>
            )}
          </div>

          {/* Layover Info */}
          {segment.layoverDuration && (
            <div className="mt-4 px-4 py-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-3">
              <Clock size={14} className="text-amber-500 shrink-0" />
              <span className="text-[11px] font-bold text-amber-700">
                Layover: {segment.layoverDuration}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DuffelFlightDetail({
  offerId,
  flight: initialFlight,
  onBook,
  onBack,
  className = '',
}: DuffelFlightDetailProps) {
  const navigate = useNavigate();

  // State
  const [flight, setFlight] = useState<FlightSearchResult | null>(initialFlight || null);
  const [loading, setLoading] = useState(!initialFlight);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'segments' | 'route' | 'baggage' | 'rules'>(
    'segments'
  );

  // Fetch offer details if not provided
  useEffect(() => {
    if (!flight && offerId) {
      setLoading(true);
      duffelFlightService
        .getOfferDetails(offerId)
        .then((result) => {
          if (result.success && result.offer) {
            // Map offer to flight result
            // This would use the same mapping logic as in duffelFlightService
            setFlight({
              id: result.offer.id,
              offerId: result.offer.id,
              tripType: 'one-way',
              airline: result.offer.owner?.name || 'Unknown',
              carrierCode: result.offer.owner?.iata_code || '',
              flightNumber: '',
              departureTime: '',
              origin: '',
              arrivalTime: '',
              destination: '',
              duration: '',
              stops: 0,
              amount: parseFloat(result.offer.total_amount),
              currency: result.offer.total_currency,
              refundable: result.offer.conditions?.refund_before_departure?.allowed || false,
              includedBags: [],
              segments: [],
              rawOffer: result.offer,
            });
          } else {
            setError(result.error || 'Failed to load flight details');
          }
        })
        .finally(() => setLoading(false));
    }
  }, [flight, offerId]);

  // Derived data
  const fareRules = useMemo((): FareRule[] => {
    if (!flight) return [];

    const rules: FareRule[] = [];

    // Refund policy
    if (flight.refundable) {
      rules.push({
        icon: <ShieldCheck size={14} className="text-green-500" />,
        text: 'This fare is refundable before departure',
        type: 'success',
      });
    } else {
      rules.push({
        icon: <AlertCircle size={14} className="text-red-500" />,
        text: 'Non-refundable — ticket cannot be cancelled for a refund',
        type: 'error',
      });
    }

    // Change policy
    rules.push({
      icon: <Clock size={14} className="text-blue-500" />,
      text: 'Date change policy: contact support at least 24h before departure',
      type: 'info',
    });

    // Name changes
    rules.push({
      icon: <AlertCircle size={14} className="text-amber-500" />,
      text: 'Name changes are not permitted after ticket issuance',
      type: 'warning',
    });

    // No-show policy
    rules.push({
      icon: <AlertCircle size={14} className="text-red-500" />,
      text: 'No-show: ticket value is forfeited. Please cancel before departure if plans change',
      type: 'error',
    });

    return rules;
  }, [flight]);

  // Handle booking
  const handleBook = () => {
    if (flight) {
      if (onBook) {
        onBook(flight);
      } else {
        navigate(`/booking/checkout?offerId=${flight.offerId}`);
      }
    }
  };

  // Handle back
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen pb-32 ${className}`}>
        <Loader2 size={48} className="text-[#152467] animate-spin mb-4" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
          Loading Flight Details...
        </p>
      </div>
    );
  }

  // Error state
  if (error || !flight) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen pb-32 ${className}`}>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Flight Not Found</h2>
        <p className="text-gray-500 mb-6">
          {error || "We couldn't find the flight details you requested."}
        </p>
        <Button
          onClick={handleBack}
          className="bg-[#152467] text-white rounded-xl px-6 py-3 font-bold uppercase tracking-widest text-xs shadow-lg shadow-purple-100 hover:bg-[#0A1C50]"
        >
          Back to Search
        </Button>
      </div>
    );
  }

  return (
    <div className={`bg-[#F8F9FA] min-h-screen pb-32 font-sans ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 max-w-7xl h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={handleBack}
              className="w-12 h-12 rounded-2xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#152467] hover:border-[#152467] transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                {flight.origin} to {flight.destination}
              </h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                {flight.airline} • {flight.flightNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="w-12 h-12 rounded-2xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#152467] transition-all">
              <Share2 size={18} />
            </button>
            <button className="w-12 h-12 rounded-2xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
              <Heart size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Tabs */}
            <div className="flex items-center gap-8 border-b border-gray-100">
              {(['segments', 'route', 'baggage', 'rules'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
                    activeTab === tab
                      ? 'text-[#152467]'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#152467]" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 p-10">
              {/* Segments Tab */}
              {activeTab === 'segments' && (
                <div className="space-y-6">
                  {flight.segments?.map((segment, idx) => (
                    <SegmentCard
                      key={segment.id || idx}
                      segment={segment}
                      index={idx}
                      isLast={idx === (flight.segments?.length || 0) - 1}
                    />
                  ))}
                </div>
              )}

              {/* Route Tab */}
              {activeTab === 'route' && (
                <div className="space-y-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Map className="text-[#152467]" size={24} />
                    <div>
                      <h3 className="text-lg font-black text-gray-900">Flight Route</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Interactive route map
                      </p>
                    </div>
                  </div>

                  <FlightMap
                    segments={flight.segments?.map((s) => {
                      // Parse duration string "2h 30m" to minutes
                      const hours = parseInt(s.duration?.match(/(\d+)h/)?.[1] || '0');
                      const mins = parseInt(s.duration?.match(/(\d+)m/)?.[1] || '0');
                      return {
                        from: s.origin,
                        to: s.destination,
                        depart: s.departureTime,
                        arrive: s.arrivalTime,
                        airline: s.airline,
                        duration: hours * 60 + mins,
                      };
                    })}
                    airports={{}}
                    height="400px"
                    showFlightInfo={true}
                  />
                </div>
              )}

              {/* Baggage Tab */}
              {activeTab === 'baggage' && (
                <div className="space-y-8">
                  {/* Checked Baggage */}
                  <div className="flex items-start gap-6 p-8 bg-gray-50 rounded-3xl border border-gray-100">
                    <div className="p-4 bg-white rounded-2xl shadow-sm">
                      <Luggage className="text-[#152467]" size={32} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-gray-900 mb-2">
                        Check-in Baggage
                      </h4>
                      <p className="text-sm font-bold text-gray-500 leading-relaxed">
                        Your fare includes{' '}
                        {flight.includedBags?.[0]?.quantity || 0} bags (
                        {flight.includedBags?.[0]?.weight || 0}
                        {flight.includedBags?.[0]?.unit || 'kg'} each). Maximum
                        dimensions: 158cm (length + width + height).
                      </p>
                    </div>
                  </div>

                  {/* Cabin Baggage */}
                  <div className="flex items-start gap-6 p-8 border border-gray-100 rounded-3xl">
                    <div className="p-4 bg-gray-50 rounded-2xl">
                      <BaggageClaim className="text-gray-400" size={32} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-gray-900 mb-2">
                        Cabin Baggage
                      </h4>
                      <p className="text-sm font-bold text-gray-500 leading-relaxed">
                        1 piece of 7kg (55 x 35 x 25 cm) plus one small personal
                        item (laptop bag or handbag).
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Rules Tab */}
              {activeTab === 'rules' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-black text-gray-900">
                      Fare Rules & Conditions
                    </h4>
                    <span
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        flight.refundable
                          ? 'bg-green-50 text-green-600 border-green-100'
                          : 'bg-red-50 text-red-500 border-red-100'
                      }`}
                    >
                      {flight.refundable ? 'Refundable' : 'Non-Refundable'}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {fareRules.map((rule, i) => (
                      <div
                        key={i}
                        className="flex gap-4 items-start p-4 bg-gray-50 rounded-2xl border border-gray-100"
                      >
                        {rule.icon}
                        <p className="text-sm font-bold text-gray-600 leading-relaxed">
                          {rule.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Booking Card */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 p-8 sticky top-32">
              {/* Price */}
              <div className="text-center mb-8">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Total Price
                </p>
                <p className="text-4xl font-black text-[#152467] tracking-tighter">
                  {formatCurrency(flight.amount, flight.currency)}
                </p>
                <p className="text-xs text-gray-400 mt-1">per passenger</p>
              </div>

              {/* Quick Info */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-500">Trip Type</span>
                  <span className="text-xs font-black text-gray-900 uppercase">
                    {flight.tripType}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-500">Stops</span>
                  <span className="text-xs font-black text-gray-900">
                    {flight.stops === 0 ? 'Direct' : `${flight.stops} stop(s)`}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-500">Duration</span>
                  <span className="text-xs font-black text-gray-900">
                    {flight.duration}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-xs font-bold text-gray-500">Baggage</span>
                  <span className="text-xs font-black text-gray-900">
                    {flight.includedBags?.[0]?.weight || 0}kg included
                  </span>
                </div>
              </div>

              {/* Book Button */}
              <Button
                onClick={handleBook}
                className="w-full h-14 bg-[#152467] hover:bg-[#0A1C50] text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-purple-100 transition-all"
              >
                <CreditCard size={16} className="mr-2" />
                Continue to Booking
              </Button>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <ShieldCheck size={14} className="text-green-500" />
                  <span>Secure payment</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Check size={14} className="text-green-500" />
                  <span>Instant confirmation</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock size={14} className="text-blue-500" />
                  <span>24/7 customer support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DuffelFlightDetail;
