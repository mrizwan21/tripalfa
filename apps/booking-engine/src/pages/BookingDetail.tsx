import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBookingById } from '../lib/api';
import type { Booking } from '../lib/srs-types';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import {
  ArrowLeft, Calendar, Clock, Plane, MapPin, User,
  CreditCard, CheckCircle2, AlertCircle, Download, Printer,
  Map, Luggage, Utensils, Heart, Shield, Sparkles,
  ChevronDown, ChevronRight, Info
} from 'lucide-react';
import { formatCurrency } from '@tripalfa/ui-components';
import { SeatSelectionPopup } from '../components/SeatSelectionPopup';
import { AdditionalBaggagePopup } from '../components/AdditionalBaggagePopup';
import { MealSelectionPopup } from '../components/MealSelectionPopup';
import { SpecialRequestPopup } from '../components/SpecialRequestPopup';

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);

  // Ancillary Popups
  const [isSeatSelectionOpen, setIsSeatSelectionOpen] = useState(false);
  const [isBaggageOpen, setIsBaggageOpen] = useState(false);
  const [isMealSelectionOpen, setIsMealSelectionOpen] = useState(false);
  const [isSpecialRequestOpen, setIsSpecialRequestOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const b = await getBookingById(id || '');
        setBooking(b as any);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return (
    <TripLogerLayout>
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#152467] border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Retrieving Booking Details...</p>
        </div>
      </div>
    </TripLogerLayout>
  );

  if (!booking) return <div>No booking found</div>;

  // Tactical Status Logic
  const isTicketed = booking.status === 'Ticketed' || booking.status === 'Issued';
  const isLCC = booking.details?.isLCC || false; // Mock LCC logic persistence
  const flight = booking.details?.flight || {
    route: 'San Francisco (SFO) — Dubai (DXB)',
    segments: [
      { from: 'SFO', to: 'DXB', carrier: 'Emirates', code: 'EK226', date: '15 Feb', time: '11:30 AM - 7:00 PM', duration: '15h 30m', terminal: '4' }
    ]
  };

  return (
    <TripLogerLayout>
      <div className="bg-[#F8F9FA] min-h-screen pb-32 font-sans" data-testid="booking-detail-page">
        {/* Header Banner */}
        <div className="bg-[#111827] pt-32 pb-48 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#152467]/10 to-transparent" />
          <div className="container mx-auto px-4 max-w-7xl relative z-10">
            <button
              onClick={() => navigate('/bookings')}
              className="flex items-center gap-2 text-white/50 hover:text-white font-black text-[10px] uppercase tracking-[0.2em] mb-10 transition-colors group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
            </button>

            <div className="flex flex-col md:flex-row items-end justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-1.5 rounded-full border ${isTicketed ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-orange-500/10 border-orange-500 text-orange-400'} text-[10px] font-black uppercase tracking-widest`}>
                    {booking.status}
                  </div>
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Reference: {booking.reference || booking.bookingId}</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none">
                  {flight.route || 'Flight Booking'}
                </h1>
                <div className="flex items-center gap-6 text-white/60">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span className="text-xs font-bold">15 Feb 2026</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={14} />
                    <span className="text-xs font-bold">2 Passengers</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {isTicketed && (
                  <>
                    <button className="h-12 px-6 rounded-xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                      <Download size={16} /> E-Ticket
                    </button>
                    <button className="h-12 px-6 rounded-xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                      <Printer size={16} /> Receipt
                    </button>
                  </>
                )}
                {!isTicketed && (
                  <button className="h-12 px-8 rounded-xl bg-[#152467] text-white font-black text-[10px] uppercase tracking-widest hover:bg-[#0A1C50] shadow-xl shadow-purple-900/20 transition-all">
                    Complete Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-7xl -mt-24 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-8 space-y-10">

              {/* Manage Services Card */}
              <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-[#152467]">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900 tracking-tight">Manage Services</h2>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customize your journey</p>
                    </div>
                  </div>
                  {isTicketed && <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">modifications allowed</span>}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button onClick={() => setIsSeatSelectionOpen(true)} data-testid="seat-selection-button" className="group p-6 rounded-[2rem] border-2 border-gray-50 hover:border-[#152467] transition-all bg-white hover:shadow-xl flex flex-col items-center gap-4 text-center relative overflow-hidden">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#152467] group-hover:text-white transition-all">
                      <Map size={24} />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Seats</h3>
                      <p className="text-[9px] font-bold text-gray-400 mt-1">Select / Change</p>
                    </div>
                  </button>
                  <button onClick={() => setIsBaggageOpen(true)} data-testid="baggage-modification-button" className="group p-6 rounded-[2rem] border-2 border-gray-50 hover:border-[#152467] transition-all bg-white hover:shadow-xl flex flex-col items-center gap-4 text-center relative overflow-hidden">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#152467] group-hover:text-white transition-all">
                      <Luggage size={24} />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Baggage</h3>
                      <p className="text-[9px] font-bold text-gray-400 mt-1">Add Extra Weight</p>
                    </div>
                  </button>
                  <button onClick={() => setIsMealSelectionOpen(true)} className="group p-6 rounded-[2rem] border-2 border-gray-50 hover:border-[#152467] transition-all bg-white hover:shadow-xl flex flex-col items-center gap-4 text-center relative overflow-hidden">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#152467] group-hover:text-white transition-all">
                      <Utensils size={24} />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Meals</h3>
                      <p className="text-[9px] font-bold text-gray-400 mt-1">Dietary Prefs</p>
                    </div>
                  </button>
                  <button onClick={() => setIsSpecialRequestOpen(true)} className="group p-6 rounded-[2rem] border-2 border-gray-50 hover:border-[#152467] transition-all bg-white hover:shadow-xl flex flex-col items-center gap-4 text-center relative overflow-hidden">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#152467] group-hover:text-white transition-all">
                      <Heart size={24} />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Special RR</h3>
                      <p className="text-[9px] font-bold text-gray-400 mt-1">Assistance</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Flight Summary */}
              <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Plane size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Flight Segments</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Journey Details</p>
                  </div>
                </div>
                <div className="space-y-6">
                  {flight.segments?.map((seg: any, i: number) => (
                    <div key={i} className="bg-gray-50 rounded-[2rem] p-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white/50 to-transparent" />
                      <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl font-black text-gray-900">{seg.carrier.charAt(0)}</div>
                          <div>
                            <h3 className="text-lg font-black text-gray-900">{seg.carrier}</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{seg.code} • Business Class</p>
                          </div>
                        </div>
                        <div className="flex-1 flex items-center justify-center gap-8">
                          <div className="text-center">
                            <p className="text-2xl font-black text-gray-900">{seg.time.split(' - ')[0]}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{seg.from} T{seg.terminal || '1'}</p>
                          </div>
                          <div className="flex flex-col items-center gap-2">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{seg.duration}</p>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-gray-300" />
                              <div className="w-16 h-0.5 bg-gray-300" />
                              <div className="w-2 h-2 rounded-full bg-gray-300" />
                            </div>
                            <p className="text-[9px] font-black text-green-500 uppercase tracking-widest">Confimed</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-black text-gray-900">{seg.time.split(' - ')[1]}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{seg.to}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar: Payment Summary */}
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 sticky top-32">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900 tracking-tight uppercase">Payment Summary</h3>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-50">
                    <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <span>Base Fare</span>
                      <span className="text-gray-900">{formatCurrency(3220)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <span>Taxes & Fees</span>
                      <span className="text-gray-900">{formatCurrency(240)}</span>
                    </div>
                    <div className="h-px bg-gray-100" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Total Paid</span>
                      <span className="text-2xl font-black text-[#152467] tracking-tighter">{formatCurrency(booking.total?.amount || 0)}</span>
                    </div>
                  </div>

                  {!isTicketed && (
                    <div className="bg-orange-50 rounded-2xl p-4 flex items-start gap-3">
                      <AlertCircle size={16} className="text-orange-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] font-black text-orange-700 uppercase tracking-widest mb-1">Payment Required</p>
                        <p className="text-[11px] font-bold text-orange-600/80 leading-relaxed">This booking is currently on hold. Confirm your payment to issue e-tickets.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Popups */}
      <SeatSelectionPopup isOpen={isSeatSelectionOpen} onClose={() => setIsSeatSelectionOpen(false)} isLCC={isLCC} onConfirm={() => setIsSeatSelectionOpen(false)} />
      <AdditionalBaggagePopup isOpen={isBaggageOpen} onClose={() => setIsBaggageOpen(false)} isLCC={isLCC} onConfirm={() => setIsBaggageOpen(false)} />
      <MealSelectionPopup isOpen={isMealSelectionOpen} onClose={() => setIsMealSelectionOpen(false)} isLCC={isLCC} onConfirm={() => setIsMealSelectionOpen(false)} />
      <SpecialRequestPopup isOpen={isSpecialRequestOpen} onClose={() => setIsSpecialRequestOpen(false)} onConfirm={() => setIsSpecialRequestOpen(false)} />

    </TripLogerLayout>
  );
}