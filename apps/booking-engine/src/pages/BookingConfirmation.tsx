import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Check, Mail, Share2, Printer, ArrowRight, Bell,
  Instagram, Facebook, Twitter, Linkedin, Plane,
  Search, CreditCard, Hotel, ChevronRight, Globe, Info,
  Calendar, Sparkles, MapPin, Download, CheckCircle2,
  Shield
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { formatCurrency } from '../lib/utils';

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

  const itinerary = flight ? flight.segments.map((seg: any) => ({
    route: `${seg.from} - ${seg.to}`,
    airport: `${seg.from} International - ${seg.to} International`,
    airline: seg.carrier,
    flight: seg.code,
    date: seg.date,
    time: seg.time,
    duration: seg.duration,
    terminal: '4' // Mock terminal
  })) : [];

  const hotelDeals = [
    { name: 'Burj Al Arab Jumeirah', price: '$1,290', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80', desc: 'Experience world-class luxury at the sail-shaped icon.' },
    { name: 'Atlantis The Royal', price: '$850', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80', desc: 'A new landmark of luxury and entertainment.' },
    { name: 'Palazzo Versace Dubai', price: '$450', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80', desc: 'Fashion-inspired luxury on the Jaddaf Waterfront.' }
  ];

  return (
    <TripLogerLayout>
      <div className="bg-[#F8F9FA] min-h-screen pb-32 font-sans">

        {/* Success Header Banner */}
        <div className="bg-[#111827] text-white pt-24 pb-48 relative overflow-hidden">
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
                  <span className="text-2xl font-black text-[#FFD700] tracking-widest">{bookingId}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 pt-4">
              {!isHold && (
                <button className="h-14 px-10 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-3 group">
                  <Download size={18} className="group-hover:translate-y-0.5 transition-transform" /> E-Ticket
                </button>
              )}
              <button className="h-14 px-10 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3">
                <Printer size={18} /> {isHold ? 'Booking Summary' : 'Receipt'}
              </button>
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
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span className="text-[10px] font-black text-[#8B5CF6] uppercase tracking-widest">Premium Terminal {seg.terminal}</span>
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
      </div>
    </TripLogerLayout>
  );
}
