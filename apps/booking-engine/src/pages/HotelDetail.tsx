import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchHotelById } from '../lib/api';
import { MapPin, Star, Share2, Heart, Check, Wifi, Coffee, Waves, Car, Utensils, Info, ChevronRight, ChevronLeft, User, ShieldCheck, Mail, Phone, Globe, Lock, Clock, Navigation, Bed, MessageSquare, FileCheck, Key } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { formatCurrency } from '../lib/utils';
import { BookingStepper } from '../components/ui/BookingStepper';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { GuestReviewsModal } from '../components/hotel/GuestReviewsModal';
import { ImageGallery } from '../components/hotel/ImageGallery';
import { Facilities } from '../components/hotel/Facilities';

export default function HotelDetail(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [hotel, setHotel] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUnits, setSelectedUnits] = useState<Record<string, number>>({});
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchHotelById(id).then(h => {
        if (h) setHotel(h);
        setLoading(false);
      }).catch(console.error);
    }
  }, [id]);

  if (loading) return (
    <TripLogerLayout>
      <div className="container mx-auto px-4 py-40 flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-[#003B95] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Property Details...</p>
      </div>
    </TripLogerLayout>
  );

  if (!hotel) return <div className="p-20 text-center font-bold text-gray-400">Hotel not found</div>;

  const handleUnitChange = (rateId: string, delta: number) => {
    setSelectedUnits(prev => ({
      ...prev,
      [rateId]: Math.max(0, (prev[rateId] || 0) + delta)
    }));
  };

  const totalSelected = Object.values(selectedUnits).reduce((a, b) => a + b, 0);

  return (
    <TripLogerLayout>
      <div className="bg-[#F9FAFB] min-h-screen pb-20 font-sans pt-32">
        <BookingStepper currentStep={2} />

        <div className="container mx-auto px-4 max-w-6xl mt-8">

          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-[13px] font-medium text-gray-400 mb-6 px-2">
            <span className="hover:text-[#6366F1] cursor-pointer">Home</span>
            <ChevronRight size={14} />
            <span className="hover:text-[#6366F1] cursor-pointer">Search Result</span>
            <ChevronRight size={14} />
            <span className="text-[#6366F1] font-bold">Search Result detailed page</span>
          </div>

          {/* Hero Section Overhaul */}
          <div className="flex flex-col lg:flex-row gap-10 mb-16">
            {/* Left: Image Component */}
            <div className="lg:w-[60%] w-full">
              <ImageGallery
                images={hotel.images || [{ url: hotel.image, hero: true }]}
                hotelName={hotel.name}
              />
            </div>

            {/* Right: Hotel Summary Component */}
            <div className="lg:w-[40%] flex flex-col">
              <h1 className="text-4xl font-black text-[#1e293b] leading-tight mb-4">{hotel.name}</h1>
              <p className="text-[13px] font-bold text-gray-600 mb-6 leading-relaxed">
                {hotel.address || hotel.location || 'Address not available'}
              </p>

              <div className="flex items-center gap-3 mb-8">
                <span className="text-lg font-black text-[#1e293b]">{hotel.rating || '4.3'}</span>
                <span className="text-[#6366F1] font-bold underline cursor-pointer text-sm">({hotel.reviewCount || '420'} reviews)</span>
                <span className="text-yellow-500 font-black text-sm uppercase tracking-tighter cursor-pointer hover:text-yellow-600">Excellent Location</span>
              </div>

              <div className="space-y-4 mb-10 flex-1">
                <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                  You're eligible for a Genius discount at <span className="font-bold uppercase text-gray-900">{hotel.name}</span>! To save at this property, all you have to do is <span className="text-[#6366F1] underline cursor-pointer">sign in</span>.
                </p>
                <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                  {hotel.description || `Situated in ${hotel.location || 'a prime location'}, `}<span className="font-bold uppercase text-gray-900">{hotel.name}</span> features accommodation with free WiFi and excellent amenities.
                </p>
                <button className="text-[#6366F1] font-bold text-[13px] hover:underline">Learn More &gt;</button>
              </div>

              <Button
                className="w-full h-14 bg-[#6366F1] hover:bg-[#5558E3] shadow-xl shadow-indigo-200 text-white font-black text-sm uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                onClick={() => document.getElementById('select-room')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Choose Now <ChevronRight size={18} />
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12 sticky top-24 z-30">
            {[
              { id: 'facilities', label: 'Facilities', icon: Bed },
              { id: 'reviews', label: 'Reviews', icon: MessageSquare },
              { id: 'rules', label: 'Rules & Conditions', icon: FileCheck },
              { id: 'room-prices', label: 'Room Prices', icon: Key },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => document.getElementById(tab.id)?.scrollIntoView({ behavior: 'smooth' })}
                className="h-14 bg-[#FFD700] hover:bg-[#F4CE14] rounded-xl flex items-center justify-center gap-3 shadow-lg transition-transform active:scale-95 border-b-4 border-yellow-500"
              >
                <tab.icon size={18} className="text-[#1e293b]" />
                <span className="text-[#1e293b] font-black uppercase tracking-widest text-[10px]">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Full Amenity Grid */}
          <div id="facilities" className="bg-white rounded-[2.5rem] p-12 shadow-2xl mb-16 border border-gray-50 scroll-mt-40">
            <h2 className="text-2xl font-black text-gray-900 mb-10 tracking-tight">Main facilities</h2>
            <Facilities />
          </div>

          {/* Reviews Section */}
          <div id="reviews" className="bg-white rounded-[2.5rem] p-12 shadow-2xl mb-16 border border-gray-50 scroll-mt-40">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3"><MessageSquare className="text-[#6366F1]" /> Guest Reviews</h2>
                <div className="px-4 py-2 bg-[#6366F1] rounded-xl text-white font-black text-xl">4.3</div>
                <div>
                  <p className="font-black text-gray-900 border-b-2 border-transparent hover:border-gray-900 transition-all cursor-pointer">Excellent</p>
                  <p className="text-xs font-bold text-gray-500">4,876 reviews</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-[#6366F1] text-[#6366F1] hover:bg-[#6366F1] hover:text-white rounded-xl h-12 px-6 text-xs font-black uppercase tracking-widest"
                onClick={() => setIsReviewModalOpen(true)}
              >
                Read all reviews
              </Button>
            </div>

            {/* Reviews Slider */}
            <div className="flex gap-6 overflow-x-auto pb-8 -mx-4 px-4 snap-x custom-scrollbar">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="snap-center shrink-0 w-[400px] bg-gray-50 p-8 rounded-[2rem] border border-gray-100 hover:border-[#6366F1]/30 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-black text-[#6366F1] shadow-md border border-gray-100 text-sm">JD</div>
                      <div>
                        <span className="text-sm font-bold text-gray-900 block">John Doe</span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">United Kingdom</span>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-white rounded-lg text-xs font-black text-gray-900 shadow-sm">9.5</span>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2 line-clamp-1">"Perfect location & amazing staff!"</h4>
                  <p className="text-xs font-medium text-gray-600 leading-relaxed line-clamp-3 mb-4">"The location was absolutely perfect, right in the heart of the city. The room was spacious and clean. Will definitely come back! The breakfast was also a highlight."</p>
                  <p className="text-[10px] font-bold text-gray-400">Reviewed: Oct 2023</p>
                </div>
              ))}
            </div>
          </div>

          {/* Rules Section */}
          <div id="rules" className="bg-white rounded-[2.5rem] p-12 shadow-2xl mb-16 border border-gray-50 scroll-mt-40">
            <h2 className="text-2xl font-black text-gray-900 mb-8 tracking-tight flex items-center gap-3"><FileCheck className="text-[#6366F1]" /> House Rules</h2>
            <div className="space-y-4">
              <div className="flex justify-between py-4 border-b border-gray-100">
                <span className="text-sm font-bold text-gray-500">Check-in</span>
                <span className="text-sm font-black text-gray-900">From 14:00</span>
              </div>
              <div className="flex justify-between py-4 border-b border-gray-100">
                <span className="text-sm font-bold text-gray-500">Check-out</span>
                <span className="text-sm font-black text-gray-900">Until 12:00</span>
              </div>
              <div className="flex justify-between py-4 border-b border-gray-100">
                <span className="text-sm font-bold text-gray-500">Cancellation/Prepayment</span>
                <span className="text-sm font-black text-gray-900 text-right max-w-xs">Policies vary by room type and provider.</span>
              </div>
              <div className="flex justify-between py-4 border-b border-gray-100">
                <span className="text-sm font-bold text-gray-500">Pets</span>
                <span className="text-sm font-black text-gray-900">Pets are not allowed.</span>
              </div>
            </div>
          </div>

          {/* Rooms Selection Table with Yellow Status Bars */}
          <section id="room-prices" className="space-y-12 pt-10 scroll-mt-40">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
              <div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tight">Rooms & Add-ons</h2>
                <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mt-2">Personalize your stay with our curated rooms</p>
              </div>
            </div>

            {hotel.rooms?.map((room: any, ridx: number) => (
              <div key={room.id} className="relative mb-16 shadow-2xl rounded-[3rem] overflow-hidden bg-white border border-gray-100">
                {/* Yellow Header Bar */}
                <div className="bg-[#FFD700] px-10 py-4 flex items-center justify-between font-black text-[11px] uppercase tracking-widest text-black">
                  <div className="flex items-center gap-6">
                    <span className="flex items-center gap-2"><div className="w-2 h-2 bg-black rounded-full"></div> {room.name}</span>
                    <span className="flex items-center gap-2 text-black/60"><div className="w-2 h-2 bg-black/30 rounded-full"></div> Max {room.maxOccupancy || room.max_occupancy || 2} Guests</span>
                  </div>
                </div>

                <div className="overflow-hidden bg-white">
                  <table className="w-full text-left">
                    <thead className="bg-[#1e293b] text-white text-[10px] font-black uppercase tracking-[0.2em]">
                      <tr>
                        <th className="px-10 py-6">Room Selection</th>
                        <th className="px-10 py-6">Policies</th>
                        <th className="px-10 py-6 text-center">Select Room</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(room.rates || [room]).map((rate: any, raIdx: number) => (
                        <tr key={rate.id || raIdx} className="hover:bg-[#6366F1]/5 transition-all group">
                          <td className="px-10 py-10 w-[45%]">
                            <div className="flex gap-8 items-center">
                              <div className="w-48 h-32 rounded-3xl overflow-hidden shrink-0 shadow-2xl border-4 border-white group-hover:scale-105 transition-transform duration-500">
                                <img
                                  src={rate.image || room.image || (ridx % 2 === 0 ? "https://images.unsplash.com/photo-1611892440504-42a792e24d32" : "https://images.unsplash.com/photo-1590490360182-c33d57733427")}
                                  className="w-full h-full object-cover"
                                  alt={room.name}
                                />
                              </div>
                              <div className="space-y-3">
                                <p className="text-xl font-black text-gray-900 tracking-tight">{rate.name || room.name}</p>
                                <div className="flex flex-wrap gap-2">
                                  {rate.amenities?.slice(0, 3).map((amt: any, i: number) => (
                                    <span key={i} className="px-3 py-1 bg-gray-100 text-[10px] font-black text-gray-500 rounded-full uppercase tracking-tighter">{amt}</span>
                                  ))}
                                  {!rate.amenities && (
                                    <>
                                      <span className="px-3 py-1 bg-gray-100 text-[10px] font-black text-gray-500 rounded-full uppercase tracking-tighter">City View</span>
                                      <span className="px-3 py-1 bg-gray-100 text-[10px] font-black text-gray-500 rounded-full uppercase tracking-tighter">Wifi Included</span>
                                    </>
                                  )}
                                  {rate.board_basis && (
                                    <span className="px-3 py-1 bg-[#6366F1]/10 text-[10px] font-black text-[#6366F1] rounded-full uppercase tracking-tighter">{rate.board_basis}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-10 w-[35%]">
                            <div className="space-y-4">
                              <div className="flex flex-col gap-1">
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Pricing Policy</p>
                                <p className="text-xs font-bold text-gray-600 leading-relaxed">
                                  {rate.cancellation_policy || 'Full payment due at booking. Policies vary by provider.'}
                                </p>
                              </div>
                              {rate.is_refundable && (
                                <div className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                  <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Refundable</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-10 py-10">
                            <div className="flex flex-col items-center gap-4">
                              <p className="text-3xl font-black text-[#6366F1] tracking-tighter leading-none">
                                {formatCurrency(rate.price?.amount || rate.amount || room.price?.amount || 1500)}
                              </p>
                              <div className="flex items-center justify-center gap-4 p-2 bg-gray-50 rounded-2xl border border-gray-100 w-full group-hover:bg-white transition-colors">
                                <button
                                  onClick={() => handleUnitChange(`${room.id}_${rate.id || raIdx}`, -1)}
                                  className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-400 hover:bg-[#6366F1] hover:text-white transition-all shadow-sm border border-transparent hover:border-transparent active:scale-95"
                                >
                                  <span className="text-xl font-bold">-</span>
                                </button>
                                <span className="text-lg font-black text-gray-900 w-6 text-center">{selectedUnits[`${room.id}_${rate.id || raIdx}`] || 0}</span>
                                <button
                                  onClick={() => handleUnitChange(`${room.id}_${rate.id || raIdx}`, 1)}
                                  className="w-10 h-10 rounded-xl bg-[#6366F1] flex items-center justify-center text-white hover:bg-[#5558E3] transition-all shadow-xl shadow-indigo-100 active:scale-95"
                                >
                                  <span className="text-xl font-bold">+</span>
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </section>
        </div>

        {totalSelected > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl bg-[#1e293b] backdrop-blur-2xl border border-white/10 p-6 shadow-[0_40px_80px_rgba(0,0,0,0.5)] z-50 rounded-[3rem] animate-in slide-in-from-bottom-20 duration-500 flex items-center justify-between">
            <div className="flex items-center gap-8 pl-6">
              <div className="w-16 h-16 bg-[#FFD700] rounded-3xl flex items-center justify-center text-black shadow-2xl relative border-4 border-white/10">
                <ShoppingBag size={32} />
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-black border-4 border-[#1e293b]">{totalSelected}</div>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Reservation Summary</p>
                <div className="flex items-baseline gap-2">
                  <p className="font-black text-2xl text-white tracking-tight">{totalSelected} Units Selected</p>
                  <span className="text-gray-500 font-bold text-sm">• {formatCurrency(totalSelected * 1500)}</span>
                </div>
              </div>
            </div>
            <Button
              className="h-20 px-16 bg-[#6366F1] hover:bg-[#5558E3] font-black text-sm gap-4 shadow-2xl shadow-indigo-500/20 rounded-[2.2rem] uppercase tracking-widest transition-all scale-95 hover:scale-100 active:scale-90"
              onClick={() => navigate(`/hotels/addons?id=${id}`, { state: { hotel, selectedUnits } })}
            >
              Continue to Add-ons <ChevronRight size={24} />
            </Button>
          </div>
        )}
      </div>

      {hotel && (
        <GuestReviewsModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          hotelName={hotel.name}
          rating={4.3}
          reviewCount={4876}
        />
      )}
    </TripLogerLayout>
  );
}

// Simple internal icon for the sticky bar
function ShoppingBag({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
