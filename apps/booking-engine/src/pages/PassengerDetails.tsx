import React, { useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
// @ts-ignore
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
// @ts-ignore
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    User, Mail, Phone, Calendar, Globe, ArrowRight, ArrowLeft,
    MapPin, Edit3, ShieldCheck, Heart, ChevronRight, CreditCard,
    Sparkles, LogIn, Lock, Info, CheckCircle2, Luggage, Briefcase,
    Plus, Plane, ChevronDown, UserCheck, Shield, RefreshCw,
    Utensils, Clock, Map
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { formatCurrency } from '../lib/utils';
import { api, fetchLoyaltyPrograms } from '../lib/api';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { FareRulesPopup } from '../components/FareRulesPopup';
import { SeatSelectionPopup } from '../components/SeatSelectionPopup';
import { AdditionalBaggagePopup } from '../components/AdditionalBaggagePopup';
import { MealSelectionPopup } from '../components/MealSelectionPopup';
import { SpecialRequestPopup } from '../components/SpecialRequestPopup';
import { PassengerForm, passengerSchema } from '../components/booking/PassengerForm';

// Determine parent schema
const formSchema = z.object({
    passengers: z.array(passengerSchema).min(1, "At least one passenger required"),
    billingAddress: z.object({
        street: z.string().min(5, "Street address is required"),
        city: z.string().min(2, "City is required"),
        zipCode: z.string().min(4, "Zip code is required"),
        country: z.string().min(1, "Country is required")
    }),
    discountCoupon: z.string().optional(),
    addOns: z.object({
        travelInsurance: z.boolean().default(false),
        refundProtect: z.boolean().default(false),
        baggageTrace: z.boolean().default(false)
    })
});

type FormValues = z.infer<typeof formSchema>;

export default function PassengerDetails() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const [isFareRulesOpen, setIsFareRulesOpen] = useState(false);
    const [isSeatSelectionOpen, setIsSeatSelectionOpen] = useState(false);
    const [isBaggageOpen, setIsBaggageOpen] = useState(false);
    const [isMealSelectionOpen, setIsMealSelectionOpen] = useState(false);
    const [isSpecialRequestOpen, setIsSpecialRequestOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Ancillary state totals
    const [seatsTotal, setSeatsTotal] = useState(0);
    const [baggageTotal, setBaggageTotal] = useState(0);
    const [mealsTotal, setMealsTotal] = useState(0);
    const [ssrRequests, setSsrRequests] = useState<any[]>([]);
    const [paymentModeState, setPaymentModeState] = useState<'wallet' | 'hold'>('wallet');

    // Initialize Form
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            passengers: [
                {
                    firstName: '', lastName: '', nationality: '', dob: '', gender: 'Male',
                    passportNumber: '', passportExpiry: '', residencyCountry: '',
                    frequentFlyerProgram: '', frequentFlyerNumber: ''
                }
            ],
            billingAddress: {
                street: '',
                city: '',
                zipCode: '',
                country: ''
            },
            discountCoupon: '',
            addOns: {
                travelInsurance: false,
                refundProtect: false,
                baggageTrace: false
            }
        }
    });

    const { control, handleSubmit, formState: { errors } } = methods;
    const { fields } = useFieldArray({
        control,
        name: "passengers"
    });

    const onSubmit = async (data: FormValues) => {
        // Handle valid submission
        console.log("Form Submitted:", data);

        try {
            let bookingId = '';

            // For real integration, we MUST hold the booking first to get a reference
            if (paymentModeState === 'wallet' || paymentModeState === 'hold') {
                const holdPayload = {
                    ...data,
                    flight: passedFlight,
                    hotel: hotelSummary,
                    ancillaries: {
                        seats: seatsTotal,
                        baggage: baggageTotal,
                        meals: mealsTotal,
                        ssr: ssrRequests
                    }
                };

                if (isHotel) {
                    const res = await api.post('/bookings/hotel/hold', holdPayload);
                    if (res) bookingId = res.bookingId || res.id;
                } else {
                    const res = await api.post('/bookings/flight/hold', holdPayload);
                    if (res) bookingId = res.bookingId || res.id;
                }

                if (!bookingId) {
                    throw new Error("Unable to create booking reference. Please try again.");
                }
            }

            const bookingState = {
                bookingData: data,
                bookingId: bookingId,
                summary: {
                    type: isHotel ? 'hotel' : 'flight',
                    hotel: hotelSummary,
                    flight: isHotel ? null : flightSummary,
                    ancillaries: {
                        seats: seatsTotal,
                        baggage: baggageTotal,
                        meals: mealsTotal,
                        ssr: ssrRequests
                    },
                    totals: {
                        subtotal,
                        discount: discountAmount,
                        final: finalTotal
                    }
                }
            };

            if (paymentModeState === 'wallet') {
                navigate('/checkout', { state: bookingState });
            } else {
                navigate('/confirmation', {
                    state: {
                        paymentMode: 'hold',
                        bookingId: bookingId || `TL-${Math.floor(100000 + Math.random() * 900000)}`,
                        passengerName: data.passengers[0].firstName,
                        totalPaid: finalTotal,
                        bookingState
                    }
                });
            }
        } catch (err: any) {
            console.error("Booking failed:", err);
            alert(err.message || "Failed to process booking. Please try again.");
        }
    };

    const handleFormSubmit = (mode: 'wallet' | 'hold') => {
        setPaymentModeState(mode);
        handleSubmit(onSubmit)();
    };

    const [couponCode, setCouponCode] = useState('');
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [couponError, setCouponError] = useState('');

    const summary = location.state?.summary || location.state;
    const isHotel = summary?.type === 'hotel' || !!summary?.hotel;

    const passedFlight = location.state?.flight;

    const flightSummary = passedFlight ? {
        cabin: passedFlight.cabin || 'Economy',
        route: `${passedFlight.origin} — ${passedFlight.destination}`,
        price: passedFlight.amount,
        taxes: passedFlight.taxes || 0,
        isLCC: passedFlight.isLCC,
        airlineLogo: passedFlight.airlineLogo,
        airlineName: passedFlight.airline,
        segments: passedFlight.segments.map((s: any) => ({
            from: s.from,
            to: s.to,
            carrier: s.carrier || passedFlight.airline,
            code: `${s.carrierCode || passedFlight.carrierCode}${s.flightNumber || passedFlight.flightNumber}`,
            date: s.depart ? format(new Date(s.depart), 'dd MMM') : 'N/A',
            time: (s.depart && s.arrive) ?
                `${format(new Date(s.depart), 'hh:mm a')} - ${format(new Date(s.arrive), 'hh:mm a')}` : 'N/A',
            duration: passedFlight.duration || 'N/A'
        }))
    } : (summary?.flight || {
        cabin: 'Business Class',
        route: 'San Francisco (SFO) — Dubai (DXB)',
        price: 3220,
        taxes: 240,
        isLCC: false,
        airlineName: 'Emirates',
        segments: [
            { from: 'SFO', to: 'DXB', carrier: 'Emirates', code: 'EK226', date: '15 Feb', time: '11:30 AM - 7:00 PM', duration: '15h 30m' },
        ]
    });

    const hotelSummary = summary?.hotel ? {
        name: summary.hotel.name,
        location: summary.hotel.location,
        price: summary.accommodation?.price || 5500,
        taxes: 0,
        image: summary.hotel.image
    } : null;

    // Dynamic Calculations
    const addOns = methods.watch('addOns');
    const addOnsPrices = {
        travelInsurance: 45,
        refundProtect: 29,
        baggageTrace: 15
    };

    const addOnsTotal = Object.entries(addOns).reduce((sum, [key, selected]) => {
        return selected ? sum + (addOnsPrices[key as keyof typeof addOnsPrices] || 0) : sum;
    }, 0);

    const subtotal = isHotel ? (hotelSummary?.price || 0) + addOnsTotal : flightSummary.price + flightSummary.taxes + addOnsTotal + seatsTotal + baggageTotal + mealsTotal;
    const discountAmount = (subtotal * couponDiscount) / 100;
    const finalTotal = subtotal - discountAmount;

    const handleApplyCoupon = () => {
        const input = methods.getValues('discountCoupon');
        if (input === 'DISCOUNT10') {
            setCouponDiscount(10);
            setCouponError('');
        } else {
            setCouponDiscount(0);
            setCouponError('Invalid coupon');
        }
    };

    return (
        <TripLogerLayout>
            <div className="bg-[#F8F9FA] min-h-screen pb-24">
                <div className="container mx-auto px-4 max-w-7xl pt-12">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-400 hover:text-[#8B5CF6] font-black text-[10px] uppercase tracking-[0.2em] mb-10 transition-colors group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> {summary?.type === 'hotel' ? 'Back to Add-ons' : 'Back to Itinerary'}
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Left: Detailed Forms */}
                        <div className="lg:col-span-8 space-y-10">

                            {/* Membership Banner */}
                            {!isLoggedIn && (
                                <div className="bg-[#111827] rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000" />
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                                        <div className="space-y-4 text-center md:text-left">
                                            <div className="flex items-center justify-center md:justify-start gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-[#FFD700] flex items-center justify-center text-[#111827] shadow-xl">
                                                    <UserCheck size={24} />
                                                </div>
                                                <h3 className="text-xl font-black text-white tracking-tight">Elite Member Rewards</h3>
                                            </div>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed max-w-md">Sign in now to sync your personal details, earn reward points, and access member-only flight deals.</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <button className="px-10 h-12 rounded-xl bg-[#FFD700] hover:bg-[#F4CE14] text-black font-black text-[10px] uppercase tracking-widest transition-all hover:-translate-y-1 shadow-xl shadow-yellow-500/10">Log In</button>
                                            <button className="px-10 h-12 rounded-xl border border-white/20 text-white font-black text-[10px] uppercase tracking-widest transition-all hover:bg-white/5">Register</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Main Form Area */}
                            <FormProvider {...methods}>
                                <form className="space-y-10">
                                    {fields.map((field: any, index: number) => (
                                        <div key={field.id} className="relative">
                                            <PassengerForm index={index} />
                                            {index > 0 && (
                                                <button type="button" className="absolute top-6 right-6 text-red-400 hover:text-red-500 text-xs font-bold">Remove</button>
                                            )}
                                        </div>
                                    ))}
                                </form>
                            </FormProvider>

                            {/* Specialized Travel Services */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#8B5CF6]">
                                        <Shield size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-gray-900 tracking-tight uppercase">Specialized Travel Services</h3>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Protect your journey with premium add-ons</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[
                                        { id: 'travelInsurance', label: 'Travel Insurance', icon: <ShieldCheck />, price: 45, desc: 'Medical & cancellation coverage' },
                                        { id: 'refundProtect', label: 'Refund Protect', icon: <RefreshCw />, price: 29, desc: '100% refund for any reason' },
                                        { id: 'baggageTrace', label: 'Baggage Trace Me', icon: <Luggage />, price: 15, desc: 'Smart tracking for your bags' }
                                    ].map((service) => {
                                        const fieldId = String(service.id);
                                        const isSelected = methods.watch(`addOns.${fieldId}` as any);
                                        return (
                                            <div
                                                key={service.id}
                                                onClick={() => methods.setValue(`addOns.${fieldId}` as any, !isSelected)}
                                                className={`cursor-pointer bg-white rounded-[2rem] border-2 p-8 transition-all hover:shadow-xl group ${isSelected ? 'border-[#8B5CF6] ring-4 ring-purple-50' : 'border-gray-100 hover:border-gray-200'}`}
                                            >
                                                <div className="flex flex-col gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isSelected ? 'bg-[#8B5CF6] text-white' : 'bg-gray-50 text-gray-400 group-hover:text-[#8B5CF6]'}`}>
                                                        {React.cloneElement(service.icon as React.ReactElement<any>, { size: 24 })}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">{service.label}</h4>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-1">{service.desc}</p>
                                                    </div>
                                                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                                        <span className="text-xs font-black text-gray-900">{formatCurrency(service.price)}</span>
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-green-500 text-white' : 'bg-gray-100'}`}>
                                                            {isSelected && <CheckCircle2 size={14} />}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Tactical Ancillary Buttons */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <button
                                    onClick={() => setIsSeatSelectionOpen(true)}
                                    className="p-6 bg-white border-2 border-gray-100 hover:border-[#8B5CF6] rounded-[2rem] transition-all group flex flex-col items-center gap-3 text-center"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#8B5CF6] flex items-center justify-center group-hover:bg-[#8B5CF6] group-hover:text-white transition-all">
                                        <Map size={20} />
                                    </div>
                                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Select Seats</span>
                                    {seatsTotal > 0 && <span className="text-[9px] font-bold text-green-600">+{formatCurrency(seatsTotal)}</span>}
                                </button>

                                <button
                                    onClick={() => setIsBaggageOpen(true)}
                                    className="p-6 bg-white border-2 border-gray-100 hover:border-[#8B5CF6] rounded-[2rem] transition-all group flex flex-col items-center gap-3 text-center"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#8B5CF6] flex items-center justify-center group-hover:bg-[#8B5CF6] group-hover:text-white transition-all">
                                        <Luggage size={20} />
                                    </div>
                                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Add Baggage</span>
                                    {baggageTotal > 0 && <span className="text-[9px] font-bold text-green-600">+{formatCurrency(baggageTotal)}</span>}
                                </button>

                                <button
                                    onClick={() => setIsMealSelectionOpen(true)}
                                    className="p-6 bg-white border-2 border-gray-100 hover:border-[#8B5CF6] rounded-[2rem] transition-all group flex flex-col items-center gap-3 text-center"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#8B5CF6] flex items-center justify-center group-hover:bg-[#8B5CF6] group-hover:text-white transition-all">
                                        <Utensils size={20} />
                                    </div>
                                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Meals</span>
                                    {mealsTotal > 0 && <span className="text-[9px] font-bold text-green-600">+{formatCurrency(mealsTotal)}</span>}
                                </button>

                                <button
                                    onClick={() => setIsSpecialRequestOpen(true)}
                                    className="p-6 bg-white border-2 border-gray-100 hover:border-[#8B5CF6] rounded-[2rem] transition-all group flex flex-col items-center gap-3 text-center"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#8B5CF6] flex items-center justify-center group-hover:bg-[#8B5CF6] group-hover:text-white transition-all">
                                        <Heart size={20} />
                                    </div>
                                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Special RR</span>
                                    {ssrRequests.length > 0 && <span className="text-[9px] font-bold text-orange-500 uppercase tracking-widest italic flex items-center gap-1"><Clock size={8} /> Pending</span>}
                                </button>
                            </div>

                            {/* Billing Address Section */}
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10 space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-900">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-gray-900 tracking-tight uppercase">Billing Information</h3>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Invoice details for your transaction</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2 space-y-2 group/field">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Street Address*</label>
                                        <input
                                            {...methods.register('billingAddress.street')}
                                            placeholder="Building, Street Name, District"
                                            className={`w-full h-14 px-6 bg-gray-50/50 border-2 hover:bg-gray-50 focus:bg-white focus:border-[#8B5CF6]/30 rounded-2xl text-[11px] font-bold outline-none transition-all placeholder:text-gray-300 ${methods.formState.errors.billingAddress?.street ? 'border-red-500/50' : 'border-transparent'}`}
                                        />
                                    </div>
                                    <div className="space-y-2 group/field">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">City*</label>
                                        <input
                                            {...methods.register('billingAddress.city')}
                                            placeholder="City"
                                            className={`w-full h-14 px-6 bg-gray-50/50 border-2 hover:bg-gray-50 focus:bg-white focus:border-[#8B5CF6]/30 rounded-2xl text-[11px] font-bold outline-none transition-all placeholder:text-gray-300 ${methods.formState.errors.billingAddress?.city ? 'border-red-500/50' : 'border-transparent'}`}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2 group/field">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Zip Code*</label>
                                            <input
                                                {...methods.register('billingAddress.zipCode')}
                                                placeholder="Zip"
                                                className={`w-full h-14 px-6 bg-gray-50/50 border-2 hover:bg-gray-50 focus:bg-white focus:border-[#8B5CF6]/30 rounded-2xl text-[11px] font-bold outline-none transition-all placeholder:text-gray-300 ${methods.formState.errors.billingAddress?.zipCode ? 'border-red-500/50' : 'border-transparent'}`}
                                            />
                                        </div>
                                        <div className="space-y-2 group/field">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Country*</label>
                                            <select
                                                {...methods.register('billingAddress.country')}
                                                className={`w-full h-14 px-6 bg-gray-50/50 border-2 hover:bg-gray-50 focus:bg-white focus:border-[#8B5CF6]/30 rounded-2xl text-[11px] font-bold appearance-none outline-none cursor-pointer ${methods.formState.errors.billingAddress?.country ? 'border-red-500/50' : 'border-transparent'}`}
                                            >
                                                <option value="">Select</option>
                                                <option value="US">USA</option>
                                                <option value="AE">UAE</option>
                                                <option value="GB">UK</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600"><CheckCircle2 size={20} /></div>
                                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Secure Booking with 256-bit SSL Encryption</p>
                                </div>
                                <div className="flex -space-x-2">
                                    {[1, 2, 3, 4].map(i => <div key={i} className="w-10 h-6 bg-gray-50 border border-gray-100 rounded-md" />)}
                                </div>
                            </div>
                        </div>

                        {/* Right: Summary Sidebar */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden p-8 sticky top-32">
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-[#8B5CF6] uppercase tracking-[0.3em]">{isHotel ? 'Hotel Summary' : 'Trip Summary'}</p>
                                        <h3 className="text-xl font-black text-gray-900 tracking-tight leading-tight">{isHotel ? hotelSummary?.name : flightSummary.route}</h3>
                                    </div>

                                    {isHotel ? (
                                        <div className="bg-gray-50 rounded-[2rem] p-4 overflow-hidden shadow-inner group">
                                            <img src={hotelSummary?.image} alt="Hotel" className="w-full h-32 object-cover rounded-xl mb-4 group-hover:scale-105 transition-transform" />
                                            <div className="flex items-center gap-2">
                                                <MapPin size={12} className="text-[#8B5CF6]" />
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{hotelSummary?.location}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 rounded-[2rem] p-6 space-y-6">
                                            {flightSummary.segments.map((seg: any, i: number) => (
                                                <div key={i} className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-2 shadow-sm"><Plane size={16} className="text-[#8B5CF6]" /></div>
                                                            <div>
                                                                <p className="text-[11px] font-black text-gray-900">{seg.carrier}</p>
                                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{seg.code}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[11px] font-black text-gray-900 leading-none mb-1">{seg.time}</p>
                                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">{seg.date}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">
                                            <span>{isHotel ? 'Accommodation' : 'Base Fare'}</span>
                                            <span className="text-gray-900">{formatCurrency(isHotel ? hotelSummary?.price || 0 : flightSummary.price)}</span>
                                        </div>
                                        {!isHotel && (
                                            <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">
                                                <span>Fees & Taxes</span>
                                                <span className="text-gray-900">{formatCurrency(flightSummary.taxes)}</span>
                                            </div>
                                        )}
                                        {addOnsTotal > 0 && (
                                            <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">
                                                <span>Services & Coverage</span>
                                                <span className="text-gray-900">+{formatCurrency(addOnsTotal)}</span>
                                            </div>
                                        )}
                                        {(seatsTotal > 0 || baggageTotal > 0 || mealsTotal > 0) && (
                                            <div className="flex justify-between items-center text-[10px] font-black text-[#8B5CF6] uppercase tracking-widest px-2 group">
                                                <div className="flex items-center gap-1">
                                                    <span>Ancillary Fees</span>
                                                    <Info size={10} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <span className="">+{formatCurrency(seatsTotal + baggageTotal + mealsTotal)}</span>
                                            </div>
                                        )}
                                        {couponDiscount > 0 && (
                                            <div className="flex justify-between items-center text-[10px] font-black text-green-600 uppercase tracking-widest px-2">
                                                <span>Discount (10%)</span>
                                                <span className="">-{formatCurrency(discountAmount)}</span>
                                            </div>
                                        )}
                                        <div className="h-px bg-gray-100" />
                                        <div className="flex justify-between items-center px-2">
                                            <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Total</span>
                                            <span className="text-2xl font-black text-[#8B5CF6] tracking-tighter">{formatCurrency(finalTotal)}</span>
                                        </div>
                                    </div>

                                    {/* Discount Coupon */}
                                    <div className="pt-2">
                                        <div className="relative group/coupon">
                                            <input
                                                {...methods.register('discountCoupon')}
                                                placeholder="ENTER COUPON CODE"
                                                className={`w-full h-14 px-6 bg-gray-50 border-2 focus:border-[#8B5CF6]/30 focus:bg-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] outline-none transition-all placeholder:text-gray-300 ${couponError ? 'border-red-500/50' : 'border-transparent'}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleApplyCoupon}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 h-8 px-4 bg-[#111827] text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-black transition-colors"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                        {couponError && <p className="text-[9px] font-bold text-red-500 mt-2 ml-2 uppercase tracking-widest animate-pulse">{couponError}</p>}
                                        {couponDiscount > 0 && <p className="text-[9px] font-bold text-green-600 mt-2 ml-2 uppercase tracking-widest">Coupon Applied Successfully!</p>}
                                    </div>

                                    <div className="flex flex-col gap-4 pt-4">
                                        <button
                                            onClick={() => handleFormSubmit('wallet')}
                                            className="h-14 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-purple-100 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 group"
                                        >
                                            Pay with Wallet <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                        <button
                                            onClick={() => handleFormSubmit('hold')}
                                            className="h-14 bg-white border-2 border-gray-100 hover:border-[#8B5CF6] hover:text-[#8B5CF6] text-gray-500 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all"
                                        >
                                            Hold Booking
                                        </button>
                                        {(Object.keys(errors).length > 0) && (
                                            <p className="text-center text-red-500 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                                                Please fix errors above to proceed
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <FareRulesPopup
                isOpen={isFareRulesOpen}
                onClose={() => setIsFareRulesOpen(false)}
                flight={passedFlight || flightSummary}
            />
            <SeatSelectionPopup
                isOpen={isSeatSelectionOpen}
                onClose={() => setIsSeatSelectionOpen(false)}
                isLCC={flightSummary.isLCC}
                offerId={passedFlight?.id}
                onConfirm={(seats) => {
                    setSeatsTotal(seats.reduce((sum: number, s: any) => sum + s.price, 0));
                    setIsSeatSelectionOpen(false);
                }}
            />
            <AdditionalBaggagePopup
                isOpen={isBaggageOpen}
                onClose={() => setIsBaggageOpen(false)}
                isLCC={flightSummary.isLCC}
                availableServices={passedFlight?.available_services}
                onConfirm={(bags) => {
                    setBaggageTotal(bags.reduce((sum: number, b: any) => sum + b.price, 0));
                    setIsBaggageOpen(false);
                }}
            />
            <MealSelectionPopup
                isOpen={isMealSelectionOpen}
                onClose={() => setIsMealSelectionOpen(false)}
                isLCC={flightSummary.isLCC}
                availableServices={passedFlight?.available_services}
                onConfirm={(meals) => {
                    // Logic to calculate meal total could be more complex, but for mock:
                    setMealsTotal(meals.reduce((sum: number, m: any) => sum + m.price, 0));
                    setIsMealSelectionOpen(false);
                }}
            />
            <SpecialRequestPopup
                isOpen={isSpecialRequestOpen}
                onClose={() => setIsSpecialRequestOpen(false)}
                onConfirm={(reqs) => {
                    setSsrRequests(Object.values(reqs).flat() as any[]);
                    setIsSpecialRequestOpen(false);
                }}
            />
        </TripLogerLayout>
    );
}
