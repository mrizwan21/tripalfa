import React, { useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Car, Utensils, Star, Info, ArrowRight, ArrowLeft, Clock, PartyPopper, ShieldCheck, Heart, User, Calendar, CreditCard, Check, ChevronRight, Calculator, Diamond, Tag, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { BookingStepper } from '../components/ui/BookingStepper';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';

export default function HotelAddons() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const checkin = searchParams.get('checkin') || '';
    const checkout = searchParams.get('checkout') || '';
    const adults = searchParams.get('adults') || '2';
    const children = searchParams.get('children') || '0';
    const [hotel, setHotel] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [addons, setAddons] = useState({
        refundProtect: false,
        travelInsurance: false,
    });

    const location = useLocation();
    const stateHotel = location.state?.hotel;
    const selectedUnits = location.state?.selectedUnits || {};

    React.useEffect(() => {
        if (stateHotel) {
            setHotel(stateHotel);
            setLoading(false);
            return;
        }
        if (!id) return;
        api.get(`/hotels/${id}`).then(res => {
            setHotel(res);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [id, stateHotel]);

    if (loading) return (
        <TripLogerLayout>
            <div className="container mx-auto px-4 py-40 flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-[#003B95] border-t-transparent rounded-full animate-spin"></div>
            </div>
        </TripLogerLayout>
    );

    const calculateTotal = () => {
        if (!hotel || !hotel.rooms) return 0;
        let baseTotal = 0;

        // Calculate room totals from selectedUnits
        Object.entries(selectedUnits).forEach(([key, quantity]) => {
            if (Number(quantity) <= 0) return;
            // key is format room.id_rate
            const [roomId] = key.split('_');
            const room = hotel.rooms.find((r: any) => r.id === roomId);
            if (room) {
                // Mock logic: ridx + 1 * 1500 used in HotelDetail for price fallback
                const price = room.originalPrice?.amount || 1500;
                baseTotal += price * Number(quantity);
            }
        });

        if (addons.refundProtect) baseTotal += 240;
        if (addons.travelInsurance) baseTotal += 240;
        return baseTotal;
    };

    return (
        <TripLogerLayout>
            <div className="bg-[#F9FAFB] min-h-screen pb-20 pt-32">
                {/* Stepper Restored at Top */}
                <BookingStepper currentStep={3} />

                <div className="container mx-auto px-4 max-w-6xl mt-10">
                    {/* Top Info Bar */}
                    <div className="bg-[#1e293b] text-white p-6 rounded-[2rem] flex flex-wrap items-center gap-8 mb-10 shadow-2xl relative overflow-hidden ring-1 ring-white/10">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        <div className="w-24 h-16 rounded-2xl overflow-hidden shadow-xl border-2 border-white/10 shrink-0">
                            <img src={hotel?.image || "https://images.unsplash.com/photo-1566073771259-6a8506099945"} className="w-full h-full object-cover" alt="Hotel" />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <h3 className="text-xl font-black tracking-tight">{hotel?.name || 'Loading Hotel...'}</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">{adults} Adult{Number(adults) > 1 ? 's' : ''} | {children} Child{Number(children) !== 1 ? 'ren' : ''}</p>
                        </div>
                        <div className="flex gap-10 text-[10px] font-black uppercase tracking-widest border-l border-white/10 pl-10">
                            <div>
                                <p className="text-gray-400 mb-1">Check-in</p>
                                <p className="text-lg tracking-tight text-white">{checkin ? new Date(checkin).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBD'}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 mb-1">Check-out</p>
                                <p className="text-lg tracking-tight text-white">{checkout ? new Date(checkout).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBD'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                        <div className="lg:col-span-8 space-y-10">
                            {/* Refund Protect Card */}
                            <Card className="overflow-hidden border-none shadow-xl rounded-[2.5rem] bg-white group hover:shadow-2xl transition-all duration-500">
                                <div className="relative h-56">
                                    <img src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Refund Protect" />
                                    <div className="absolute inset-0 bg-blue-900/50 backdrop-blur-md flex items-center p-10">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-[#6366F1] rounded-2xl flex items-center justify-center text-white shadow-2xl border-4 border-white/20">
                                                <ShieldCheck size={32} />
                                            </div>
                                            <div>
                                                <h2 className="text-3xl font-black text-white drop-shadow-2xl tracking-tighter">Refund Protect</h2>
                                                <p className="text-blue-100 font-bold text-xs mt-1 uppercase tracking-widest">Worry-free booking experience</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-10">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="flex-1 pr-10">
                                            <p className="text-gray-600 font-medium text-sm leading-relaxed mb-6">
                                                Receive a <span className="text-[#6366F1] font-black">FULL refund</span> if you cannot travel due to a reason listed in the T&C, including 100% refundable booking security.
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                                {[
                                                    'Sickness, accident or Injury',
                                                    'Unexpected Travel Disruption',
                                                    'Pre-existing medical conditions',
                                                    'Adverse weather conditions'
                                                ].map((text, i) => (
                                                    <div key={i} className="flex items-center gap-3 text-xs font-bold text-gray-700">
                                                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 shadow-sm shrink-0"><Check size={12} strokeWidth={4} /></div>
                                                        {text}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-[#FFD700] px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-yellow-200/50 text-black">Recommended</div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-8 pt-6 border-t border-dashed border-gray-100">
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => setAddons(p => ({ ...p, refundProtect: true }))}
                                                className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 font-black text-[9px] uppercase tracking-widest transition-all focus:scale-95 ${addons.refundProtect ? 'bg-[#6366F1] border-[#6366F1] text-white shadow-xl shadow-indigo-200' : 'bg-white border-gray-100 text-gray-500 hover:border-[#6366F1] hover:text-[#6366F1]'}`}
                                            >
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${addons.refundProtect ? 'border-white' : 'border-gray-200'}`}>
                                                    {addons.refundProtect && <div className="w-2 h-2 rounded-full bg-white" />}
                                                </div>
                                                Add to Cart
                                            </button>
                                            <button
                                                onClick={() => setAddons(p => ({ ...p, refundProtect: false }))}
                                                className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 font-black text-[9px] uppercase tracking-widest transition-all focus:scale-95 ${!addons.refundProtect ? 'bg-gray-50 border-gray-50 text-gray-900' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                            >
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${!addons.refundProtect ? 'border-gray-900' : 'border-gray-200'}`}>
                                                    {!addons.refundProtect && <div className="w-2 h-2 rounded-full bg-gray-900" />}
                                                </div>
                                                No thanks
                                            </button>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Additional Cost</p>
                                            {/* Reduced Font Size as requested */}
                                            <p className="text-xl font-black text-[#6366F1] tracking-tighter">SAR 240</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Travel Insurance Card */}
                            <Card className="overflow-hidden border-none shadow-xl rounded-[2.5rem] bg-white group hover:shadow-2xl transition-all duration-500">
                                <div className="relative h-56">
                                    <img src="https://images.unsplash.com/photo-1544006659-f0b21f04cb1d?auto=format&fit=crop&q=80" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Travel Insurance" />
                                    <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-md flex items-center p-10">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white shadow-2xl border-4 border-white/30">
                                                <Heart size={32} className="fill-current" />
                                            </div>
                                            <div>
                                                <h2 className="text-3xl font-black text-white drop-shadow-2xl tracking-tighter">Travel Insurance</h2>
                                                <p className="text-indigo-100 font-bold text-xs mt-1 uppercase tracking-widest">Global coverage & medical support</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-10">
                                    <p className="text-gray-600 font-medium text-sm mb-8 leading-relaxed">
                                        Travel Insurance will provide you with the peace of mind in case of any unexpected eventualities, including <span className="text-indigo-600 font-black">24/7 global medical assistance</span>.
                                    </p>
                                    <div className="flex flex-wrap items-center justify-between gap-8 pt-6 border-t border-dashed border-gray-100">
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => setAddons(p => ({ ...p, travelInsurance: true }))}
                                                className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 font-black text-[9px] uppercase tracking-widest transition-all focus:scale-95 ${addons.travelInsurance ? 'bg-[#6366F1] border-[#6366F1] text-white shadow-xl shadow-indigo-200' : 'bg-white border-gray-100 text-gray-500 hover:border-[#6366F1]'}`}
                                            >
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${addons.travelInsurance ? 'border-white' : 'border-gray-200'}`}>
                                                    {addons.travelInsurance && <div className="w-2 h-2 rounded-full bg-white" />}
                                                </div>
                                                Add to Cart
                                            </button>
                                            <button
                                                onClick={() => setAddons(p => ({ ...p, travelInsurance: false }))}
                                                className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 font-black text-[9px] uppercase tracking-widest transition-all focus:scale-95 ${!addons.travelInsurance ? 'bg-gray-100 border-gray-100 text-gray-900' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                            >
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${!addons.travelInsurance ? 'border-gray-900' : 'border-gray-200'}`}>
                                                    {!addons.travelInsurance && <div className="w-2 h-2 rounded-full bg-gray-900" />}
                                                </div>
                                                No thanks
                                            </button>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Additional Cost</p>
                                            {/* Reduced Font Size as requested */}
                                            <p className="text-xl font-black text-[#6366F1] tracking-tighter">SAR 240</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="lg:col-span-4 space-y-8 sticky top-32">
                            {/* Premium Fare Summary */}
                            <div className="bg-white/70 backdrop-blur-2xl border border-white/50 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-8 relative overflow-hidden ring-1 ring-gray-100">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#6366F1] via-purple-500 to-pink-500"></div>
                                <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-gray-900">
                                    <Sparkles className="text-[#6366F1]" size={20} />
                                    Booking Summary
                                </h3>

                                <div className="space-y-6">
                                    {/* Room Selection */}
                                    <div className="group p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#6366F1] shrink-0">
                                                <CreditCard size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Accommodation</p>
                                                <div className="flex justify-between items-baseline gap-4 w-full">
                                                    <div>
                                                        {Object.entries(selectedUnits).map(([key, qty]) => {
                                                            if (Number(qty) <= 0) return null;
                                                            const [roomId] = key.split('_');
                                                            const room = hotel?.rooms?.find((r: any) => r.id === roomId);
                                                            return (
                                                                <p key={key} className="text-sm font-bold text-gray-900 leading-tight mb-1 last:mb-0">
                                                                    {qty} × {room?.name || 'Room'}
                                                                </p>
                                                            );
                                                        })}
                                                    </div>
                                                    <p className="text-sm font-black text-gray-900">
                                                        {formatCurrency(calculateTotal() - (addons.refundProtect ? 240 : 0) - (addons.travelInsurance ? 240 : 0))}
                                                    </p>
                                                </div>
                                                <span className="inline-block mt-2 px-2 py-0.5 bg-green-50 text-green-600 text-[9px] font-black rounded uppercase tracking-wider">Taxes Included</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Add-ons */}
                                    <div className="group p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                                                <ShieldCheck size={18} />
                                            </div>
                                            <div className="w-full">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Extras</p>
                                                {addons.travelInsurance || addons.refundProtect ? (
                                                    <div className="space-y-1.5">
                                                        {addons.refundProtect && (
                                                            <div className="flex justify-between text-xs font-bold text-gray-700">
                                                                <span>Refund Protect</span>
                                                                <span>SAR 240</span>
                                                            </div>
                                                        )}
                                                        {addons.travelInsurance && (
                                                            <div className="flex justify-between text-xs font-bold text-gray-700">
                                                                <span>Travel Insurance</span>
                                                                <span>SAR 240</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs font-medium text-gray-400 italic">No add-ons selected</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="my-6 border-t border-dashed border-gray-200"></div>

                                    {/* Total */}
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Payable</span>
                                        <span className="text-3xl font-black text-[#6366F1] tracking-tighter">{formatCurrency(calculateTotal())}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Loyalty Program Input (New Request) */}
                            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-50 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-[#FFD700]/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
                                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Diamond size={14} className="text-[#FFD700] fill-current" />
                                    Loyalty Program
                                </h4>
                                <div className="space-y-4">
                                    <p className="text-[10px] text-gray-500 font-medium leading-tight">Enter your membership number to earn points and unlock exclusive perks.</p>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Membership Number"
                                            className="w-full h-12 bg-gray-50 border border-gray-100 px-4 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#6366F1] focus:bg-white transition-all placeholder:text-gray-300"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-300">
                                            <User size={12} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Promotional Code */}
                            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-50 group">
                                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Tag size={14} className="text-[#6366F1]" />
                                    Promo Code
                                </h4>
                                <div className="flex gap-2">
                                    <input id="hotel-voucher-code" name="hotel-voucher-code" type="text" placeholder="Voucher Code" className="flex-1 h-12 bg-gray-50 border border-gray-100 px-4 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#6366F1] transition-all uppercase placeholder:normal-case" />
                                    <button className="h-12 px-5 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-800 transition-colors">Apply</button>
                                </div>
                            </div>

                            <button
                                className="w-full h-16 bg-[#6366F1] hover:bg-[#5558E3] font-black text-xs text-white shadow-[0_20px_40px_-10px_rgba(99,102,241,0.5)] rounded-[2rem] uppercase tracking-widest flex items-center justify-center gap-3 transition-all scale-95 hover:scale-100 active:scale-90"
                                onClick={() => {
                                    const total = calculateTotal();
                                    const bookingState = {
                                        type: 'hotel',
                                        summary: {
                                            hotel: hotel,
                                            accommodation: {
                                                selectedUnits,
                                                price: total - (addons.refundProtect ? 240 : 0) - (addons.travelInsurance ? 240 : 0)
                                            },
                                            totals: {
                                                final: total
                                            }
                                        }
                                    };
                                    navigate(`/passenger-details?type=hotel&id=${id}`, { state: bookingState });
                                }}
                            >
                                Continue to Guests <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </TripLogerLayout>
    );
}
