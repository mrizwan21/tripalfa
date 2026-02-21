import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Check, Mail, Share2, Printer, ArrowRight, Bell,
  Instagram, Facebook, Twitter, Linkedin, Plane,
  Search, CreditCard, Hotel, ChevronRight, Globe, Info,
  Calendar, Sparkles, MapPin, Download, CheckCircle2,
  Shield, Star, Clock, Wallet, FileText
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { formatCurrency } from '@tripalfa/ui-components';
import { fetchDestinationsDB, getBookingById, api, searchFlights } from '../lib/api';
import { usePopularDestinations } from '../hooks/useHotelStaticData';

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

export default function BookingConfirmation() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // Determine mode from state
  const paymentMode = state?.paymentMode || 'wallet';
  const bookingId = state?.bookingId || 'TL-882931';
  const passengerName = state?.passengerName || 'Guest';
  const totalPaid = state?.totalPaid || 0;
  const bookingState = state?.bookingState;
  const flight = bookingState?.summary?.flight;

  const isHold = paymentMode === 'hold';
  const isHotel = bookingState?.summary?.type === 'hotel';
  const hotelSummary = bookingState?.summary?.hotel;

  // Dynamic booking data from API
  const [bookingData, setBookingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Cross-selling data
  const [crossSellHotels, setCrossSellHotels] = useState<HotelOffer[]>([]);
  const [crossSellFlights, setCrossSellFlights] = useState<FlightOffer[]>([]);
  const [userLocation, setUserLocation] = useState<{ city: string; country: string; countryCode: string } | null>(null);

  // Fetch user IP location
  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        setUserLocation({
          city: data.city || 'Dubai',
          country: data.country_name || 'UAE',
          countryCode: data.country_code || 'AE'
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
      try {
        setLoading(true);
        const data = await getBookingById(bookingId);
        setBookingData(data);
        
        // Fetch available documents
        try {
          const docs = await api.get(`/bookings/${bookingId}/documents`);
          setDocuments(docs?.data?.documents || []);
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
  const { data: recommendedDestinations = [] } = usePopularDestinations(4);

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
          const hotels = await fetchDestinationsDB({ type: 'hotel', search: destinationCity });
          const hotelOffers: HotelOffer[] = hotels.slice(0, 3).map((dest: any, i: number) => ({
            id: `hotel-${dest.code || i}`,
            name: `${dest.name || destinationCity} Premium Hotel`,
            location: dest.name || destinationCity,
            price: dest.avgPrice || undefined,
            currency: 'USD',
            rating: dest.averageRating || undefined,
            image: dest.imageUrl || [
              'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80'
            ][i % 3],
            description: `Special rate at ${dest.name || destinationCity}`
          }));
          setCrossSellHotels(hotelOffers);
        } else if (isHotel && hotelSummary) {
          // Hotel booking: search for flights from user location to destination using Duffel
          const originCode = userLocation?.countryCode === 'AE' ? 'DXB' : 
                            userLocation?.countryCode === 'GB' ? 'LHR' : 'DXB';
          
          // Extract destination code from hotel summary or use default
          const destinationCode = hotelSummary?.code || hotelSummary?.destination || 'DXB';
          
          // Perform Duffel flight search
          try {
            const searchParams = {
              origin: originCode,
              destination: destinationCode,
              departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              passengers: 1,
              cabinClass: 'economy'
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
                airline: flight.slices?.[0]?.segments?.[0]?.operating_carrier?.iata_code || 'Airline',
                departureDate: flight.slices?.[0]?.departure_date_time?.split('T')[0] || searchParams.departureDate,
                duration: flight.slices?.[0]?.duration || undefined
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

  // Remove duplicate useEffect - keep only one

  // Handle document download
  const handleDownloadDocument = async (docType: string) => {
    try {
      const response = await api.get(`/bookings/${bookingId}/documents/${docType}/download?bookingType=${isHotel ? 'hotel' : 'flight'}`);
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
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
    handleDownloadDocument(invoice.type);
  };

  // Handle pay for hold booking
  const handlePayNow = () => {
    setShowPaymentModal(true);
  };

  const itinerary = flight ? flight.segments.map((seg: any) => ({
    route: `${seg.from} - ${seg.to}`,
    airport: `${seg.from} International - ${seg.to} International`,
    airline: seg.carrier,
    flight: seg.code,
    date: seg.date,
    time: seg.time,
    duration: seg.duration,
    terminal: seg.departureTerminal || seg.terminal || null
  })) : [];

  // Dynamic hotel deals from recommended destinations
  const hotelDeals = recommendedDestinations.length > 0 
    ? recommendedDestinations.map((dest, i) => ({
        name: `Premium Hotels in ${dest.city || dest.name}`,
        price: dest.avgPrice ? `$${dest.avgPrice.toLocaleString()}` : 'Price on request',
        image: dest.imageUrl || [
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80'
        ][i % 3],
        desc: `${dest.hotelCount || '500+'} hotels available in ${dest.city || dest.name}, ${dest.country || ''}`
      }))
    : [];

  return (
    <TripLogerLayout>
      <div className="bg-[#F8F9FA] min-h-screen pb-32 font-sans" data-testid="confirmation-page">

        {/* Success Header Banner */}
        <div className="bg-[#111827] text-white pt-24 pb-48 relative overflow-hidden" data-testid="booking-confirmation">
          <div className="absolute inset-0 bg-gradient-to-b from-[#8B5CF6]/20 to-transparent" />
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#8B5CF6] rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FFD700] rounded-full blur-[100px]" />
          </div>

          <div className="container mx-auto px-4 max-w-7xl relative z-10 text-center space-y-10">
            <div className="relative inline-block">
              <div className="w-28 h-28 rounded-[2.5rem] bg-[#FFD700] mx-auto flex items-center justify-center text-black shadow-[0_20px_50px_rgba(255,215,0,0.3)] animate-bounce-subtle">
                <CheckCircle2 size={56} strokeWidth={2.5} />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#8B5CF6] shadow-xl">
                <Shield size={16} fill="currentColor" />
              </div>
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-none">
                {isHold ? 'Booking Held.' : 'Journey Secured.'}
              </h1>
              <div className="flex flex-col items-center gap-4">
                <p className="text-[11px] font-black text-white/50 uppercase tracking-[0.5em]">
                  {isHold ? 'Hold Reference Identifier' : 'Elite Booking Identifier'}
                </p>
                <div className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <span className="text-2xl font-black text-[#FFD700] tracking-widest" data-testid="booking-reference">{bookingId}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 pt-4">
              {isHold ? (
                <button 
                  onClick={handlePayNow}
                  className="h-14 px-10 rounded-2xl bg-[#FFD700] text-black font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-3 group animate-pulse"
                >
                  <Wallet size={18} className="group-hover:translate-y-0.5 transition-transform" /> Pay Now to Confirm
                </button>
              ) : (
                <button 
                  onClick={() => handleDownloadDocument('ticket')}
                  className="h-14 px-10 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-3 group"
                >
                  <Download size={18} className="group-hover:translate-y-0.5 transition-transform" /> E-Ticket
                </button>
              )}
              <button 
                onClick={() => handleDownloadDocument('receipt')}
                className="h-14 px-10 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3"
              >
                <Printer size={18} /> {isHold ? 'Booking Summary' : 'Receipt'}
              </button>
              {!isHold && (
                <button 
                  onClick={() => handleDownloadDocument('invoice')}
                  className="h-14 px-10 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3"
                >
                  <FileText size={18} /> View Invoice
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-7xl -mt-24 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

            {/* Left: Main Content */}
            <div className="lg:col-span-8 space-y-12">

              {/* Welcome Message Card */}
              <div className="bg-white rounded-[3.5rem] p-12 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] border border-gray-100 relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-purple-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 space-y-10">
                  <div className="flex items-center gap-8">
                    <div className="w-20 h-20 rounded-[2rem] bg-purple-50 flex items-center justify-center text-[#8B5CF6] shadow-inner">
                      <Sparkles size={40} />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-black text-gray-900 tracking-tight">Bonjour, {passengerName}!</h2>
                      <p className="text-[10px] font-black text-[#8B5CF6] uppercase tracking-[0.3em]">Premium Access Confirmed</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-gray-100">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Amount</p>
                      <p className="text-xl font-black text-gray-900 uppercase tracking-tight">{formatCurrency(totalPaid)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">status</p>
                      <p className={`text-xl font-black uppercase tracking-tight ${isHold ? 'text-amber-500' : 'text-green-600'}`}>
                        {isHold ? 'On Hold' : 'Authorized'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Method</p>
                      <p className="text-xl font-black text-gray-900 uppercase tracking-tight">{paymentMode === 'hold' ? 'Pay later' : 'TL-Wallet'}</p>
                    </div>
                  </div>
                  <p className="text-[12px] font-bold text-gray-500 leading-relaxed max-w-2xl bg-gray-50 p-6 rounded-2xl italic border-l-4 border-[#8B5CF6]">
                    {isHold
                      ? "Your booking is currently on hold. Please finalize your payment within the next 24 hours to secure this fare and receive your e-tickets."
                      : "Your premium itinerary has been dispatched to your registered address. We've unlocked priority check-in and lounge access for your upcoming journey."}
                  </p>
                </div>
              </div>

              {/* Itinerary Visualization */}
              <div className="bg-white rounded-[3.5rem] p-12 shadow-sm border border-gray-100 space-y-12">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em] leading-none">{isHotel ? 'Accommodation Details' : 'Flight Itinerary'}</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Live Sync Alpha</span>
                  </div>
                </div>

                <div className="space-y-12">
                  {isHotel && hotelSummary ? (
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 bg-gray-50/50 rounded-[3rem] p-12 group hover:bg-white hover:shadow-2xl transition-all duration-700 border-2 border-transparent hover:border-[#8B5CF6]/5">
                      <div className="flex items-center gap-8">
                        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform duration-500"><Hotel size={32} className="text-[#8B5CF6]" /></div>
                        <div>
                          <p className="text-2xl font-black text-gray-900 leading-none mb-2">{hotelSummary.name}</p>
                          <div className="flex items-center gap-3">
                            <MapPin size={12} className="text-gray-400" />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{hotelSummary.location}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Check-in Status</p>
                        <span className="px-4 py-1.5 bg-green-100 text-green-600 rounded-lg text-[9px] font-black uppercase tracking-widest">Confirmed</span>
                      </div>
                    </div>
                  ) : (
                    itinerary.map((seg: any, i: number) => (
                      <div key={i} className="relative">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 bg-gray-50/50 rounded-[3rem] p-12 group hover:bg-white hover:shadow-2xl transition-all duration-700 border-2 border-transparent hover:border-[#8B5CF6]/5">
                          <div className="flex items-center gap-8">
                            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform duration-500"><Plane size={32} className="text-[#8B5CF6]" /></div>
                            <div>
                              <p className="text-2xl font-black text-gray-900 leading-none mb-2">{seg.airline}</p>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{seg.flight}</span>
                                {seg.terminal && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                                    <span className="text-[10px] font-black text-[#8B5CF6] uppercase tracking-widest">Premium Terminal {seg.terminal}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-1 items-center justify-center gap-12">
                            <div className="text-center group-hover:scale-110 transition-transform">
                              <p className="text-3xl font-black text-gray-900 leading-none">{seg.route.split(' - ')[0]}</p>
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">Source</p>
                            </div>
                            <div className="flex-1 flex flex-col items-center gap-3">
                              <p className="text-[10px] font-black text-[#8B5CF6] uppercase tracking-[0.4em]">{seg.duration}</p>
                              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-[#8B5CF6] shadow-xl" />
                              </div>
                              <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Business</p>
                            </div>
                            <div className="text-center group-hover:scale-110 transition-transform">
                              <p className="text-3xl font-black text-gray-900 leading-none">{seg.route.split(' - ')[1]}</p>
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">Destination</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-2xl font-black text-[#8B5CF6] leading-none mb-2">{seg.time.split(' - ')[0]}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{seg.date}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Intelligent Cross-Selling Banner */}
              {(!isHotel && crossSellHotels.length > 0) || (isHotel && crossSellFlights.length > 0) ? (
                <div className="bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] rounded-[3.5rem] p-12 shadow-2xl space-y-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                        {isHotel ? <Plane size={24} /> : <Hotel size={24} />}
                      </div>
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-widest">
                          {isHotel 
                            ? `Flights from ${userLocation?.city || 'your location'} to ${destinationCity}`
                            : `Hotels in ${destinationCity}`
                          }
                        </h3>
                        <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Special offers for you</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Cross-selling hotels for flight bookings */}
                      {!isHotel && crossSellHotels.map((hotel, i) => (
                        <div key={hotel.id} className="bg-white/10 backdrop-blur-sm rounded-[2rem] p-6 hover:bg-white/20 transition-all cursor-pointer group">
                          <div className="h-32 rounded-2xl overflow-hidden mb-4">
                            <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          </div>
                          <h4 className="text-sm font-black mb-1 truncate">{hotel.name}</h4>
                          <div className="flex items-center gap-2 mb-3">
                            <Star size={12} className="text-[#FFD700] fill-current" />
                            <span className="text-[10px] font-bold">{hotel.rating.toFixed(1)}</span>
                            <span className="text-[10px] text-white/60">| {hotel.location}</span>
                          </div>
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-[10px] text-white/60">From</p>
                              <p className="text-xl font-black text-[#FFD700]">${hotel.price}</p>
                            </div>
                            <button className="h-10 px-4 rounded-xl bg-white text-[#8B5CF6] text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform">
                              View
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Cross-selling flights for hotel bookings */}
                      {isHotel && crossSellFlights.map((flightOffer, i) => (
                        <div key={flightOffer.id} className="bg-white/10 backdrop-blur-sm rounded-[2rem] p-6 hover:bg-white/20 transition-all cursor-pointer group">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-lg font-black">
                              {flightOffer.airline.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-sm font-black">{flightOffer.airline}</h4>
                              <p className="text-[10px] text-white/60">{flightOffer.duration}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="text-center">
                              <p className="text-xl font-black">{flightOffer.origin}</p>
                              <p className="text-[10px] text-white/60">{flightOffer.originCity}</p>
                            </div>
                            <div className="flex-1 flex flex-col items-center px-2">
                              <div className="w-full h-0.5 bg-white/20 relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white" />
                              </div>
                              <p className="text-[8px] text-white/40 mt-1">{flightOffer.duration}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xl font-black">{flightOffer.destination}</p>
                              <p className="text-[10px] text-white/60">{flightOffer.destinationCity}</p>
                            </div>
                          </div>
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-[10px] text-white/60">{flightOffer.departureDate}</p>
                              <p className="text-xl font-black text-[#FFD700]">${flightOffer.price}</p>
                            </div>
                            <button className="h-10 px-4 rounded-xl bg-white text-[#8B5CF6] text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform">
                              Book
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Right: Recommendations Sidebar */}
            <div className="lg:col-span-4 space-y-12">
              <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm space-y-8">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Elite Stays</h3>
                  <p className="text-[9px] font-black text-[#8B5CF6] uppercase tracking-[0.3em]">Curated for your destination</p>
                </div>

                <div className="space-y-10">
                  {hotelDeals.slice(0, 2).map((hotel, i) => (
                    <div key={i} className="group cursor-pointer">
                      <div className="h-48 relative overflow-hidden rounded-[2rem] mb-6">
                        <img src={hotel.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={hotel.name} />
                        <div className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-xl shadow-xl">
                          <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{hotel.price}</p>
                        </div>
                      </div>
                      <h4 className="text-sm font-black text-gray-900 tracking-tight group-hover:text-[#8B5CF6] transition-colors">{hotel.name}</h4>
                      <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest line-clamp-2">{hotel.desc}</p>
                    </div>
                  ))}
                </div>
                <button className="w-full h-14 rounded-2xl border-2 border-gray-50 hover:border-[#8B5CF6] hover:text-[#8B5CF6] text-[10px] font-black uppercase tracking-widest transition-all">View All Stays</button>
              </div>

              <div className="bg-[#111827] rounded-[3rem] p-10 shadow-2xl space-y-8 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#8B5CF6]/20 rounded-full blur-[60px]" />
                <div className="relative z-10 space-y-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#FFD700]">
                    <Bell size={24} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-black uppercase tracking-widest leading-tight">Stay Informed</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Push notifications for gate changes and boarding calls now active.</p>
                  </div>
                  <button className="w-full h-12 rounded-xl bg-[#8B5CF6] text-white font-black text-[10px] uppercase tracking-widest hover:bg-[#7C3AED] transition-colors">Manage Alerts</button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Hold Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#111827]/80 backdrop-blur-md" onClick={() => setShowPaymentModal(false)} />
            <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95 duration-300">
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
              >
                ×
              </button>
              
              <div className="text-center space-y-6">
                <div className="w-20 h-20 rounded-[2rem] bg-amber-50 flex items-center justify-center mx-auto">
                  <Clock size={40} className="text-amber-500" />
                </div>
                
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Complete Your Payment</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Booking #{bookingId}</p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Total Amount</span>
                    <span className="text-2xl font-black text-gray-900">{formatCurrency(totalPaid)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Expires</span>
                    <span className="text-sm font-black text-amber-500">24 hours</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => {
                      setShowPaymentModal(false);
                      navigate('/booking-checkout', { state: { bookingId, isHoldPayment: true } });
                    }}
                    className="w-full h-14 rounded-2xl bg-[#8B5CF6] text-white font-black text-[10px] uppercase tracking-widest hover:bg-[#7C3AED] transition-colors flex items-center justify-center gap-3"
                  >
                    <CreditCard size={18} /> Pay with Card
                  </button>
                  <button 
                    onClick={() => {
                      setShowPaymentModal(false);
                      navigate('/booking-checkout', { state: { bookingId, isHoldPayment: true } });
                    }}
                    className="w-full h-14 rounded-2xl bg-gray-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center justify-center gap-3"
                  >
                    <Wallet size={18} /> Pay with Wallet
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TripLogerLayout>
  );
}
