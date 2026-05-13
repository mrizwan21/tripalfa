import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Check,
  Mail,
  Share2,
  Printer,
  ArrowRight,
  Bell,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Plane,
  Search,
  CreditCard,
  Hotel,
  ChevronRight,
  Globe,
  Info,
  Calendar,
  Sparkles,
  MapPin,
  Download,
  CheckCircle2,
  Shield,
  Star,
  Clock,
  Wallet,
  FileText,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { formatCurrency } from '@tripalfa/ui-components';
import { fetchDestinationsDB, getBookingById, api, searchFlights } from '../lib/api';
import { usePopularDestinations } from '../hooks/useStaticData';
import { useTenantRuntime } from '@/components/providers/TenantRuntimeProvider';

// Types for cross-selling
interface HotelOffer {
  id: string;
  name: string;
  location: string;
  price: number;
  currency: string;
  rating: number;
  image: string;
  description: string;
}

interface FlightOffer {
  id: string;
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  price: number;
  currency: string;
  airline: string;
  departureDate: string;
  duration: string;
}

function BookingConfirmation() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { config: runtimeConfig } = useTenantRuntime();

  const allowedPaymentMethods = runtimeConfig.checkout.enforceSupplierWallet
    ? ['wallet']
    : runtimeConfig.checkout.allowedPaymentMethods;
  const canPayWithWallet =
    runtimeConfig.features.walletEnabled && allowedPaymentMethods.includes('wallet');
  const canPayWithCard = allowedPaymentMethods.includes('card');
  const holdPaymentEnabled = canPayWithWallet || canPayWithCard;

  // Determine mode from state
  const paymentMode = state?.paymentMode || runtimeConfig.checkout.defaultPaymentMethod;
  const bookingState = state?.bookingState;
  const bookingId =
    state?.bookingId || bookingState?.bookingId || bookingState?.bookingReference || '';
  const passengerName = state?.passengerName || 'Guest';
  const totalPaid = state?.totalPaid || 0;
  const flight = bookingState?.summary?.flight;

  // Extract documents and workflowId from bookingState (passed from hold booking)
  const documentsFromState = bookingState?.documents || null;
  const workflowId = bookingState?.workflowId || null;
  const isHold = paymentMode === 'hold';
  const isHotel = bookingState?.summary?.type === 'hotel';
  const hotelSummary = bookingState?.summary?.hotel;
  const paymentModeLabel =
    paymentMode === 'hold'
      ? 'Pay later'
      : paymentMode === 'wallet'
        ? 'Wallet'
        : paymentMode === 'card'
          ? 'Card'
          : paymentMode;

  // Dynamic booking data from API
  const [bookingData, setBookingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Record<string, any>>({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Cross-selling data
  const [crossSellHotels, setCrossSellHotels] = useState<HotelOffer[]>([]);
  const [crossSellFlights, setCrossSellFlights] = useState<FlightOffer[]>([]);
  const [userLocation, setUserLocation] = useState<{
    city: string;
    country: string;
    countryCode: string;
  } | null>(null);

  // Fetch user IP location
  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        setUserLocation({
          city: data.city || 'Dubai',
          country: data.country_name || 'UAE',
          countryCode: data.country_code || 'AE',
        });
      } catch (error) {
        console.error('Failed to fetch user location:', error);
        setUserLocation({ city: 'Dubai', country: 'UAE', countryCode: 'AE' });
      }
    };
    fetchUserLocation();
  }, []);

  // Fetch booking data from API
  useEffect(() => {
    const fetchBookingData = async () => {
      if (!bookingId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getBookingById(bookingId);
        setBookingData(data);

        // Fetch available documents
        try {
          const docs = await api.get(`/bookings/${bookingId}/documents`);
          setDocuments(docs?.data?.documents || {});
        } catch (docError) {
          console.error('Failed to fetch documents:', docError);
        }
      } catch (error) {
        console.error('Failed to fetch booking:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookingData();
  }, [bookingId]);

  // Fetch popular destinations for Elite Stays section
  const { data: recommendedDestinations = [] } = usePopularDestinations(4) as unknown as {
    data: any[];
  };

  // Get destination city for cross-selling
  const getDestinationCity = () => {
    if (isHotel && hotelSummary) {
      return hotelSummary.location?.split(',')[0] || hotelSummary.city || 'Dubai';
    }
    if (flight?.segments?.length > 0) {
      const lastSegment = flight.segments[flight.segments.length - 1];
      return lastSegment.to || lastSegment.arrivalCity || 'New York';
    }
    return 'Dubai';
  };

  const destinationCity = getDestinationCity();

  // Fetch cross-selling data based on booking type
  useEffect(() => {
    const fetchCrossSellData = async () => {
      try {
        if (!isHotel && flight) {
          // Flight booking: fetch hotels at destination
          const hotels = await fetchDestinationsDB({
            type: 'hotel',
            search: destinationCity,
          });
          const hotelOffers: HotelOffer[] = hotels.slice(0, 3).map((dest: any, i: number) => ({
            id: `hotel-${dest.code || i}`,
            name: `${dest.name || destinationCity} Premium Hotel`,
            location: dest.name || destinationCity,
            price: dest.avgPrice || undefined,
            currency: 'USD',
            rating: dest.averageRating || undefined,
            image:
              dest.imageUrl ||
              [
                'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80',
              ][i % 3],
            description: `Special rate at ${dest.name || destinationCity}`,
          }));
          setCrossSellHotels(hotelOffers);
        } else if (isHotel && hotelSummary) {
          // Hotel booking: search for flights from user location to destination using Duffel
          const originCode =
            userLocation?.countryCode === 'AE'
              ? 'DXB'
              : userLocation?.countryCode === 'GB'
                ? 'LHR'
                : 'DXB';

          // Extract destination code from hotel summary or use default
          const destinationCode = hotelSummary?.code || hotelSummary?.destination || 'DXB';

          // Perform Duffel flight search
          try {
            const searchParams = {
              origin: originCode,
              destination: destinationCode,
              departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0],
              passengers: 1,
              cabinClass: 'economy',
            };

            const flightResults = await searchFlights(searchParams);

            // Map Duffel results to FlightOffer interface
            const flightOffers: FlightOffer[] = (Array.isArray(flightResults) ? flightResults : [])
              .slice(0, 3)
              .map((flight: any, i: number) => ({
                id: flight.id || `flight-${i}`,
                origin: flight.slices?.[0]?.origin_airport?.iata_code || originCode,
                originCity: userLocation?.city || 'Dubai',
                destination: flight.slices?.[0]?.destination_airport?.iata_code || destinationCode,
                destinationCity: hotelSummary?.city || hotelSummary?.name || 'Dubai',
                price: flight.total_amount || undefined,
                currency: flight.total_currency || 'USD',
                airline:
                  flight.slices?.[0]?.segments?.[0]?.operating_carrier?.iata_code || 'Airline',
                departureDate:
                  flight.slices?.[0]?.departure_date_time?.split('T')[0] ||
                  searchParams.departureDate,
                duration: flight.slices?.[0]?.duration || undefined,
              }));

            setCrossSellFlights(flightOffers);
          } catch (error) {
            console.error('Failed to fetch Duffel flights for cross-sell:', error);
            setCrossSellFlights([]); // Empty array on failure, section will be omitted
          }
        }
      } catch (error) {
        console.error('Failed to fetch cross-sell data:', error);
      }
    };

    fetchCrossSellData();
  }, [isHotel, flight, hotelSummary, destinationCity, userLocation]);

  // Handle document download - use documents from state if available, otherwise fetch from API
  const handleDownloadDocument = async (docType: string) => {
    // If we have documents in state (from hold booking), use them directly
    if (documentsFromState && documentsFromState[docType]) {
      const docContent = documentsFromState[docType];
      // Open document in new window
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(docContent);
        newWindow.document.close();
      }
      return;
    }

    // Otherwise, try to fetch from API
    try {
      const response = await api.get(
        `/bookings/${bookingId}/documents/${docType}/download?bookingType=${isHotel ? 'hotel' : 'flight'}`
      );
      if (response?.data?.content) {
        // Open document in new window
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(response.data.content);
          newWindow.document.close();
        }
      }
    } catch (error) {
      console.error('Failed to download document:', error);
    }
  };

  // Handle view invoice
  const handleViewInvoice = (invoice: any) => {
    // If we have invoice document in state, use it directly
    if (documents?.invoice) {
      setSelectedInvoice({ type: 'invoice', content: documents.invoice });
      setShowInvoiceModal(true);
      // Also open in new window
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(documents.invoice);
        newWindow.document.close();
      }
      return;
    }

    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
    handleDownloadDocument('invoice');
  };

  // Handle pay for hold booking
  const handlePayNow = () => {
    if (!holdPaymentEnabled) {
      return;
    }
    setShowPaymentModal(true);
  };

  const itinerary = flight
    ? flight.segments.map((seg: any) => ({
        route: `${seg.from} - ${seg.to}`,
        airport: `${seg.from} International - ${seg.to} International`,
        airline: seg.carrier,
        flight: seg.code,
        date: seg.date,
        time: seg.time,
        duration: seg.duration,
        terminal: seg.departureTerminal || seg.terminal || null,
      }))
    : [];

  // Dynamic hotel deals from recommended destinations
  const hotelDeals =
    recommendedDestinations.length > 0
      ? recommendedDestinations.map((dest: any, i: number) => ({
          name: `Premium Hotels in ${dest.city || dest.name}`,
          price: dest.avgPrice ? `$${dest.avgPrice.toLocaleString()}` : 'Price on request',
          image:
            dest.imageUrl ||
            [
              'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80',
            ][i % 3],
          desc: `${dest.hotelCount || '500+'} hotels available in ${dest.city || dest.name}, ${dest.country || ''}`,
        }))
      : [];

  return (
    <TripLogerLayout>
      <div className="bg-white min-h-screen pb-32" data-testid="confirmation-page">
        {/* Success Header Banner - OTA Style */}
        <div
          className="bg-[#003b95] text-white pt-24 pb-48 relative overflow-hidden"
          data-testid="booking-confirmation"
        >
          <div className="absolute inset-0 bg-[rgba(0,0,0,0.1)]" />
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-300 rounded-full blur-[100px]" />
          </div>

          <div className="container mx-auto px-4 max-w-7xl relative z-10 text-center space-y-10">
            <div className="relative inline-block">
              <div className="w-28 h-28 rounded-2xl bg-white/20 backdrop-blur-sm mx-auto flex items-center justify-center shadow-lg">
                <CheckCircle2 size={56} strokeWidth={2.5} />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#1d1d1f] flex items-center justify-center text-white shadow-lg">
                <Shield size={16} fill="currentColor" />
              </div>
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                {isHold ? 'Booking Held.' : 'Journey Secured.'}
              </h1>
              <div className="flex flex-col items-center gap-4">
                <p className="text-xs font-bold text-white/60 uppercase tracking-widest">
                  {isHold ? 'Hold Reference Identifier' : 'Elite Booking Identifier'}
                </p>
                <div className="px-8 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                  <span
                    className="text-2xl font-bold tracking-widest"
                    data-testid="booking-reference"
                  >
                    {bookingId}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              {isHold ? (
                <button
                  onClick={handlePayNow}
                  disabled={!holdPaymentEnabled}
                  className="bg-[#003b95] text-white rounded-lg px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-[#002a6e] transition-all duration-200 disabled:opacity-50"
                >
                  {holdPaymentEnabled ? 'Pay for Booking' : 'Payment Unavailable'}
                </button>
              ) : (
                <button
                  onClick={() => handleDownloadDocument('ticket')}
                  className="bg-gray-900 text-white rounded-lg px-6 py-2.5 font-semibold text-sm hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <Download size={18} /> E-Ticket
                </button>
              )}
              <button
                onClick={() => handleDownloadDocument('invoice')}
                className="border border-white/30 text-white rounded-lg px-6 py-2.5 font-semibold text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <FileText size={18} /> View Invoice
              </button>
              <button
                onClick={() => handleDownloadDocument('itinerary')}
                className="border border-white/30 text-white rounded-lg px-6 py-2.5 font-semibold text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <MapPin size={18} /> View Itinerary
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-7xl -mt-24 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Main Content */}
            <div className="lg:col-span-8 space-y-8">
              {/* Welcome Message Card */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-8 relative overflow-hidden">
                <div className="relative z-10 space-y-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-xl bg-[#003b95]/10 flex items-center justify-center text-[#003b95]">
                      <Sparkles size={32} />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-2xl md:text-3xl font-bold text-[#1d1d1f] tracking-tight">
                        Bonjour, {passengerName}!
                      </h2>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Premium Access Confirmed
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-100">
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        Total Amount
                      </p>
                      <p className="text-xl font-bold text-[#1d1d1f]">{formatCurrency(totalPaid)}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        Status
                      </p>
                      <p className="text-xl font-bold">
                        {isHold ? (
                          <span className="bg-yellow-100 text-yellow-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                            On Hold
                          </span>
                        ) : (
                          <span className="bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                            Authorized
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        Method
                      </p>
                      <p className="text-xl font-bold text-[#1d1d1f]">{paymentModeLabel}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed max-w-2xl bg-gray-50 p-6 rounded-xl border border-gray-100">
                    {isHold
                      ? 'Your booking is currently on hold. Please finalize your payment within the next 24 hours to secure this fare and receive your e-tickets.'
                      : "Your premium itinerary has been dispatched to your registered address. We've unlocked priority check-in and lounge access for your upcoming journey."}
                  </p>
                </div>
              </div>

              {/* Itinerary Visualization */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-8 space-y-8">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-bold text-[#1d1d1f] tracking-tight">
                    {isHotel ? 'Accommodation Details' : 'Flight Itinerary'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-green-600 uppercase tracking-wider">
                      Live Sync Alpha
                    </span>
                  </div>
                </div>
                <div className="space-y-8">
                  {isHotel && hotelSummary ? (
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-sm transition-all duration-300">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100">
                          <Hotel size={32} className="text-[#1d1d1f]" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-[#1d1d1f] leading-none mb-2">
                            {hotelSummary.name}
                          </p>
                          <div className="flex items-center gap-3">
                            <MapPin size={12} className="text-gray-400" />
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                              {hotelSummary.location}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                          Check-in Status
                        </p>
                        <span className="bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          Confirmed
                        </span>
                      </div>
                    </div>
                  ) : (
                    itinerary.map((seg: any, i: number) => (
                      <div key={i} className="relative">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-sm transition-all duration-300">
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100">
                              <Plane size={32} className="text-[#1d1d1f]" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-[#1d1d1f] leading-none mb-2">
                                {seg.airline}
                              </p>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                  {seg.flight}
                                </span>
                                {seg.terminal && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                      Terminal {seg.terminal}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-1 items-center justify-center gap-8">
                            <div className="text-center">
                              <p className="text-3xl font-bold text-[#1d1d1f] leading-none">
                                {seg.route.split(' - ')[0]}
                              </p>
                              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-2">
                                Source
                              </p>
                            </div>
                            <div className="flex-1 flex flex-col items-center px-2 max-w-[160px]">
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                {seg.duration}
                              </p>
                              <div className="w-full h-0.5 bg-gray-200 relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#003b95] shadow-sm" />
                              </div>
                              <p className="text-[11px] font-bold text-[#003b95] uppercase tracking-wider mt-1">
                                Business
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-3xl font-bold text-[#1d1d1f] leading-none">
                                {seg.route.split(' - ')[1]}
                              </p>
                              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-2">
                                Destination
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-2xl font-bold text-[#1d1d1f] leading-none mb-2">
                              {seg.time.split(' - ')[0]}
                            </p>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                              {seg.date}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Intelligent Cross-Selling Banner */}
              {((!isHotel && crossSellHotels.length > 0) ||
                (isHotel && crossSellFlights.length > 0)) && (
                <div className="bg-[#1d1d1f] rounded-xl p-8 shadow-lg space-y-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        {isHotel ? (
                          <Plane size={24} className="text-white" />
                        ) : (
                          <Hotel size={24} className="text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold uppercase tracking-wider">
                          {isHotel
                            ? `Flights from ${userLocation?.city || 'your location'} to ${destinationCity}`
                            : `Hotels in ${destinationCity}`}
                        </h3>
                        <p className="text-xs font-bold text-white/60 uppercase tracking-wider">
                          Special offers for you
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Cross-selling hotels for flight bookings */}
                      {!isHotel &&
                        crossSellHotels.map((hotel, i) => (
                          <div
                            key={hotel.id}
                            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all cursor-pointer group border border-white/10"
                          >
                            <div className="h-32 rounded-lg overflow-hidden mb-4 border border-white/10">
                              <img
                                src={hotel.image}
                                alt={hotel.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            </div>
                            <h4 className="text-sm font-bold mb-1 truncate text-white">
                              {hotel.name}
                            </h4>
                            <div className="flex items-center gap-2 mb-3">
                              <Star size={12} className="text-yellow-400 fill-current" />
                              <span className="text-xs font-bold text-white/60">
                                {hotel.rating.toFixed(1)}
                              </span>
                              <span className="text-xs text-white/40">| {hotel.location}</span>
                            </div>
                            <div className="flex items-end justify-between">
                              <div>
                                <p className="text-xs text-white/60">From</p>
                                <p className="text-xl font-bold text-white">${hotel.price}</p>
                              </div>
                              <button className="bg-white text-[#003b95] rounded-lg px-4 py-2 text-xs font-semibold hover:bg-gray-100 transition-colors">
                                View
                              </button>
                            </div>
                          </div>
                        ))}

                      {/* Cross-selling flights for hotel bookings */}
                      {isHotel &&
                        crossSellFlights.map((flightOffer, i) => (
                          <div
                            key={flightOffer.id}
                            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all cursor-pointer group border border-white/10"
                          >
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center text-lg font-bold text-white">
                                {flightOffer.airline.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white">
                                  {flightOffer.airline}
                                </h4>
                                <p className="text-xs text-white/60">{flightOffer.duration}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mb-4 gap-2">
                              <div className="text-center">
                                <p className="text-xl font-bold text-white">
                                  {flightOffer.origin}
                                </p>
                                <p className="text-xs text-white/60">{flightOffer.originCity}</p>
                              </div>
                              <div className="flex-1 flex flex-col items-center px-2">
                                <div className="w-full h-0.5 bg-white/20 relative">
                                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white" />
                                </div>
                                <p className="text-[10px] text-white/40 mt-1">
                                  {flightOffer.duration}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-xl font-bold text-white">
                                  {flightOffer.destination}
                                </p>
                                <p className="text-xs text-white/60">
                                  {flightOffer.destinationCity}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-end justify-between">
                              <div>
                                <p className="text-xs text-white/60">
                                  {flightOffer.departureDate}
                                </p>
                                <p className="text-xl font-bold text-white">
                                  ${flightOffer.price}
                                </p>
                              </div>
                              <button className="bg-white text-[#003b95] rounded-lg px-4 py-2 text-xs font-semibold hover:bg-gray-100 transition-colors">
                                Book
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Recommendations Sidebar */}
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-8 sticky top-32">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-[#003b95] uppercase tracking-wider">
                      Elite Stays
                    </h3>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                      Curated for your destination
                    </p>
                  </div>

                  <div className="space-y-6">
                    {hotelDeals.slice(0, 2).map((hotel, i) => (
                      <div key={i} className="group cursor-pointer">
                        <div className="h-48 relative overflow-hidden rounded-xl mb-4 border border-gray-100">
                          <img
                            src={hotel.image}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            alt={hotel.name}
                          />
                          <div className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg shadow-sm">
                            <p className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wider">
                              {hotel.price}
                            </p>
                          </div>
                        </div>
                        <h4 className="text-sm font-bold text-[#1d1d1f] tracking-tight group-hover:text-[#003b95] transition-colors">
                          {hotel.name}
                        </h4>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider leading-relaxed mt-2 line-clamp-2">
                          {hotel.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full h-12 border border-gray-200 rounded-lg text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
                  >
                    View All Stays
                  </Button>
                </div>
              </div>

              <div className="bg-[#003b95] rounded-xl p-8 shadow-lg space-y-6 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-[60px]" />
                <div className="relative z-10 space-y-6">
                  <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Bell size={24} className="text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold uppercase tracking-wider leading-tight">
                      Stay Informed
                    </h3>
                    <p className="text-xs font-bold text-white/60 uppercase tracking-wider leading-relaxed">
                      Push notifications for gate changes and boarding calls now active.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    className="w-full h-12 bg-white text-[#003b95] rounded-lg font-semibold text-sm hover:bg-gray-100 transition-all"
                  >
                    Manage Alerts
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hold Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowPaymentModal(false)}
            />
            <div className="relative bg-white w-full max-w-md rounded-xl border border-gray-100 shadow-lg p-8">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                ✕
              </button>

              <div className="text-center space-y-6">
                <div className="w-20 h-20 rounded-xl bg-yellow-50 flex items-center justify-center mx-auto">
                  <Clock size={40} className="text-yellow-600" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-[#1d1d1f]">Complete Your Payment</h2>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">
                    Booking #{bookingId}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 space-y-4 border border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </span>
                    <span className="text-2xl font-bold text-[#1d1d1f]">
                      {formatCurrency(totalPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Expires
                    </span>
                    <span className="text-sm font-bold text-yellow-600">24 hours</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {canPayWithCard && (
                    <button
                      onClick={() => {
                        setShowPaymentModal(false);
                        navigate('/booking-checkout', {
                          state: { bookingId, isHoldPayment: true },
                        });
                      }}
                      className="w-full h-14 bg-[#003b95] text-white rounded-lg font-semibold text-sm shadow-md hover:bg-[#002a6e] transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <CreditCard size={18} /> Pay with Card
                    </button>
                  )}
                  {canPayWithWallet && (
                    <button
                      onClick={() => {
                        setShowPaymentModal(false);
                        navigate('/booking-checkout', {
                          state: { bookingId, isHoldPayment: true },
                        })
                      }}
                      className="w-full h-14 bg-gray-900 text-white rounded-lg font-semibold text-sm hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Wallet size={18} /> Pay with Wallet
                    </button>
                  )}
                  {!holdPaymentEnabled && (
                    <p className="text-xs text-center text-gray-500">
                      Hold payments are disabled by admin settings.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TripLogerLayout>
  );
}

export default BookingConfirmation;
