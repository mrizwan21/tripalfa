import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    RefreshCw, ChevronDown, Hotel,
    Clock, X, User, CheckCircle2, XCircle, Info,
    MapPin, Calendar, Star, ShoppingBag, ArrowLeft
} from 'lucide-react';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { BookingAmendmentPopup } from '../components/BookingAmendmentPopup';
import { getBookingById } from '../lib/api';
import type { Booking } from '../lib/srs-types';

// Sub-components for Popups
const SupplierRemittancePopup = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
            <div className="relative bg-white w-full max-w-5xl rounded-[1rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center group">
                    <h2 className="text-xl font-black text-[#1E1B4B] group-hover:px-2 transition-all">Supplier Remittance</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><X size={20} /></button>
                </div>
                <div className="p-10 space-y-10">
                    <div className="flex justify-center items-center h-40 text-gray-400 font-bold">
                        Remittance details not available for this booking.
                    </div>
                    <div className="flex justify-start pt-4 border-t border-gray-50">
                        <button onClick={onClose} className="px-10 h-10 bg-[#FFD700] text-gray-900 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl shadow-yellow-100 transition-all active:scale-95 hover:bg-[#F4CE14]">Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

import { NotificationDetailsPopup } from '../components/NotificationDetailsPopup';
import { NotificationItem } from '../lib/notification-types';

export default function HotelBookingCard() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('General');
    const [isRemittanceOpen, setIsRemittanceOpen] = useState(false);
    const [isAmendmentOpen, setIsAmendmentOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
    const [amendmentPrefill, setAmendmentPrefill] = useState<NotificationItem | null>(null);
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const b = await getBookingById(id || '');
                setBooking(b as any);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    const tabs = ['General', 'Costing', 'Notification Manager'];

    if (loading) return (
        <TripLogerLayout>
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Loading Hotel Booking...</p>
                </div>
            </div>
        </TripLogerLayout>
    );

    if (!booking) return <div>Booking not found</div>;

    const hotel = booking.details?.hotel || {};
    const passengers = booking.details?.passengers || [];

    return (
        <TripLogerLayout>
            <div className="bg-[#F8FAFC] min-h-screen pt-20">

                {/* Purple Header */}
                <div className="bg-[#8B5CF6] h-20 flex items-center justify-between px-10 shadow-lg relative z-20">
                    <div className="flex items-center gap-4 text-white">
                        <Hotel size={24} className="fill-white" />
                        <h1 className="text-sm font-black uppercase tracking-[0.2em]">Hotel Booking Card</h1>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-white/80">
                            <Clock size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{new Date(booking.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex gap-3">
                            <button className="h-9 px-8 border border-white/30 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2 relative">
                                <RefreshCw size={12} /> Sync
                            </button>
                            <button onClick={() => navigate(-1)} className="h-9 px-8 bg-[#FFD700] text-gray-900 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-yellow-500/20 hover:-translate-y-0.5 transition-all">Back</button>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation Segment */}
                <div className="bg-white px-10 py-5 border-b border-gray-100 flex items-center gap-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-10 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab
                                ? 'bg-[#FFD700] text-gray-900 shadow-xl translate-y-[-2px]'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {tab}
                            {activeTab === tab && <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#FFD700] rotate-45" />}
                        </button>
                    ))}
                </div>

                {/* Reference Banner */}
                <div className="bg-[#FFD700] px-10 py-4 flex items-center justify-between border-y border-yellow-600/10 shadow-sm relative z-10 transition-all">
                    <div className="flex items-center divide-x divide-gray-900/10 gap-10 h-5">
                        <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Booking Ref: <span className="text-[#8B5CF6]">{booking.bookingId || booking.reference}</span></p>
                        <p className="pl-10 text-[11px] font-black text-gray-900 uppercase tracking-widest">Supplier Ref: <span className="text-[#8B5CF6]">SUP-{booking.id.slice(0, 6)}</span></p>
                        <p className="pl-10 text-[11px] font-black text-gray-900 uppercase tracking-widest">Invoice: <span className="text-[#8B5CF6]">INV-{booking.id.slice(0, 6)}</span></p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Payment Status:</span>
                            <span className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm ${booking.paymentStatus === 'Paid' ? 'bg-[#20B2AA] text-white' : 'bg-red-500 text-white'}`}>{booking.paymentStatus}</span>
                        </div>
                        <div className="flex items-center gap-4 border-l border-gray-900/10 pl-6">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Booking Status:</span>
                            <span className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm ${booking.status === 'Confirmed' ? 'bg-[#00A65A] text-white' : 'bg-yellow-500 text-white'}`}>{booking.status}</span>
                        </div>
                        <div className="relative group ml-4">
                            <button className="h-10 px-6 bg-white rounded-lg border border-gray-100 text-[11px] font-black uppercase tracking-widest text-[#1E1B4B] flex items-center gap-3 shadow-sm group-hover:bg-gray-50 transition-all min-w-[120px] justify-between">
                                Options <ChevronDown size={14} className="text-[#8B5CF6]" />
                            </button>
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all origin-top-right transform scale-95 group-hover:scale-100 z-50 p-2 pointer-events-none group-hover:pointer-events-auto">
                                {['Refund', 'Amendment', 'Cancel', 'Special Request'].map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => setIsAmendmentOpen(true)}
                                        className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-[0.1em] rounded-xl transition-all ${opt === 'Refund' || opt === 'Cancel' ? 'text-red-500 hover:bg-red-50' : 'text-[#1E1B4B] hover:bg-gray-50'
                                            }`}>
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Dashboard Area */}
                <div className="p-10">
                    {activeTab === 'General' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

                            {/* Left: Passenger and Room Tables */}
                            <div className="lg:col-span-7 space-y-10">
                                {/* Passenger Details */}
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden translate-x-0 transition-transform hover:-translate-y-1 duration-500">
                                    <div className="bg-[#8B5CF6] px-6 py-5 flex items-center gap-4 text-white">
                                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                            <User size={16} className="fill-white" />
                                        </div>
                                        <h3 className="text-sm font-black uppercase tracking-widest">Passenger Details</h3>
                                    </div>
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-[#F1F5F9] border-b border-gray-200">
                                            <tr className="text-[11px] font-black text-[#1E1B4B] uppercase tracking-widest divide-x divide-gray-200">
                                                <th className="px-6 py-5 w-24">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-4 h-4 rounded-sm border-2 border-yellow-400 flex items-center justify-center p-0.5">
                                                            <div className="w-full h-full bg-yellow-400" />
                                                        </div>
                                                        P.No
                                                    </div>
                                                </th>
                                                <th className="px-6 py-5 text-center">Room Type</th>
                                                <th className="px-6 py-5 text-center">Guests name</th>
                                                <th className="px-6 py-5 text-center">Check In</th>
                                                <th className="px-6 py-5 text-center">Check out</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 font-bold text-gray-600 bg-white">
                                            {passengers.map((p: any, i: number) => (
                                                <tr key={i} className="text-[11px] group transition-colors divide-x divide-gray-100">
                                                    <td className="px-6 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-4 h-4 rounded-sm border-2 border-gray-200 flex items-center justify-center p-0.5 group-hover:border-yellow-400 transition-colors">
                                                                <div className="w-full h-full bg-transparent group-hover:bg-yellow-400 transition-colors" />
                                                            </div>
                                                            <span className="font-black text-gray-900">{i + 1}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6 text-center whitespace-pre-line leading-relaxed">{hotel.name ? 'Standard Room' : 'N/A'}</td>
                                                    <td className="px-6 py-6 text-center text-[#8B5CF6] font-black whitespace-pre-line leading-relaxed">{p.firstName} {p.lastName}</td>
                                                    <td className="px-6 py-6 text-center text-gray-500 font-medium">{hotel.checkIn}</td>
                                                    <td className="px-6 py-6 text-center text-gray-500 font-medium">{hotel.checkOut}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Right: Hotel Card Details */}
                            <div className="lg:col-span-5 space-y-10">
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group">
                                    <div className="bg-[#8B5CF6] px-6 py-5 flex items-center justify-between text-white">
                                        <div className="flex items-center gap-4">
                                            <Hotel size={20} className="fill-white" />
                                            <h3 className="text-sm font-black uppercase tracking-widest underline decoration-[#FFD700] decoration-2 underline-offset-8">Hotel Details</h3>
                                        </div>
                                    </div>
                                    <div className="p-0 border-b border-gray-100">
                                        <div className="flex">
                                            <div className="w-[45%] h-64 overflow-hidden relative border-r border-gray-100">
                                                <img src={hotel.image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Hotel" />
                                                <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
                                            </div>
                                            <div className="flex-1 p-8 space-y-6 flex flex-col justify-center">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-1.5 mb-2">
                                                        {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={14} className={`fill-[#F4CE14] ${hotel.rating >= s ? 'text-[#F4CE14]' : 'text-gray-200'}`} />)}
                                                    </div>
                                                    <h3 className="text-xl font-black text-[#1E1B4B] leading-tight">{hotel.name || 'Hotel Name'}</h3>
                                                    <div className="flex items-start gap-2 text-gray-500 text-[11px] font-medium leading-relaxed">
                                                        <MapPin size={12} className="mt-0.5 shrink-0 text-[#8B5CF6]" />
                                                        {hotel.address || 'Address not available'}
                                                    </div>
                                                </div>

                                                <div className="space-y-4 border-t border-gray-50 pt-6 font-bold text-[11px] uppercase tracking-widest text-[#1E1B4B]">
                                                    <div className="flex items-center gap-4">
                                                        <User size={14} className="text-[#8B5CF6]" />
                                                        <span>{passengers.length} Guest(s)</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <Calendar size={14} className="text-[#8B5CF6]" />
                                                        <span>check in: {hotel.checkIn}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <Calendar size={14} className="text-[#8B5CF6]" />
                                                        <span>check out: {hotel.checkOut}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Ancillary Preview */}
                                <div className="bg-white rounded-xl border border-gray-200 shadow-xl p-8 space-y-6 border-t-[6px] border-[#8B5CF6] group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#8B5CF6] group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                                            <ShoppingBag size={20} />
                                        </div>
                                        <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400">Add On Services Summary</h4>
                                    </div>
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Refund Protect', status: 'Not Selected', color: 'text-gray-400' },
                                        ].map((svc, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                                                <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">{svc.label}</span>
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${svc.color}`}>{svc.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                    {activeTab === 'Costing' && (
                        <div className="space-y-10 animate-in slide-in-from-bottom-10 duration-700">
                            {/* Detailed Info Card */}
                            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 flex items-center justify-between group">
                                <div className="flex gap-12">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Creator</p>
                                        <p className="text-xs font-black text-[#1E1B4B]">Admin</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Authorised By</p>
                                        <p className="text-xs font-black text-[#1E1B4B]">System <span className="text-gray-400 font-bold ml-2">On: {new Date(booking.createdAt).toLocaleDateString()}</span></p>
                                    </div>
                                </div>
                                <div className="text-right space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-gray-900 uppercase text-right">On: {new Date(booking.createdAt).toLocaleString()}</p>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sales Channel: <span className="text-black">Website</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Complex Costing Table */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden group/tbl">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-[#F1F5F9] border-b border-gray-200">
                                        <tr className="text-[11px] font-black text-[#1E1B4B] uppercase tracking-widest divide-x divide-gray-200">
                                            <th className="px-6 py-6 min-w-[200px]">Description</th>
                                            <th className="px-6 py-6">Particulars</th>
                                            <th className="px-6 py-6 text-center">Base ({booking.total?.currency})</th>
                                            <th className="px-6 py-6 text-center">Taxes ({booking.total?.currency})</th>
                                            <th className="px-6 py-6 text-center">Net ({booking.total?.currency})</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-[11px] font-bold text-gray-600">
                                        <tr className="bg-white hover:bg-gray-50 transition-colors divide-x divide-gray-100">
                                            <td className="px-6 py-10 font-black text-gray-900">{hotel.name}</td>
                                            <td className="px-6 py-10 text-gray-400 italic">Hotel Booking</td>
                                            <td className="px-6 py-10 text-center text-[#8B5CF6] font-black text-xs">{((booking.total?.amount || 0) * 0.85).toFixed(2)}</td>
                                            <td className="px-6 py-10 text-center text-gray-400 font-medium">{((booking.total?.amount || 0) * 0.15).toFixed(2)}</td>
                                            <td className="px-6 py-10 text-center text-[#8B5CF6] font-black text-xs">{booking.total?.amount}</td>
                                        </tr>
                                        {/* Calculation Summary Row */}
                                        <tr className="bg-[#1E1B4B] text-white">
                                            <td colSpan={4} className="px-6 py-10 text-right text-sm font-black uppercase tracking-widest text-[#FFD700]">Total Booking Amount :</td>
                                            <td className="px-6 py-10 text-center text-2xl font-black text-white">{booking.total?.currency} {booking.total?.amount}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Notification Manager' && (
                        <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
                            {/* Header with Sync */}
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-black text-[#1E1B4B]">Notification Center</h2>
                                    <p className="text-xs text-gray-400 font-bold mt-1">Track all your hotel booking updates and requests</p>
                                </div>
                                <button
                                    onClick={() => {
                                        const btn = document.getElementById('sync-btn-hotel');
                                        if (btn) btn.classList.add('animate-spin');
                                        setTimeout(() => btn?.classList.remove('animate-spin'), 1500);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm group"
                                >
                                    <RefreshCw id="sync-btn-hotel" size={16} className="text-[#8B5CF6]" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 group-hover:text-[#8B5CF6]">Sync Updates</span>
                                </button>
                            </div>

                            {/* Timeline / Log View */}
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden p-8">
                                <div className="space-y-8 relative before:absolute before:left-[27px] before:top-8 before:bottom-8 before:w-0.5 before:bg-gray-100 before:border-l before:border-dashed before:border-gray-300">
                                    {[
                                        {
                                            id: '1',
                                            type: 'CONFIRMATION',
                                            title: 'Booking Confirmed',
                                            description: 'Your hotel booking at Splendid Shubham has been confirmed.',
                                            date: '10 Oct, 02:30 PM',
                                            status: 'CONFIRMED',
                                            icon: <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600"><CheckCircle2 size={16} /></div>,
                                            color: 'bg-green-100 text-green-600 border-green-200'
                                        },
                                        {
                                            id: '2',
                                            type: 'SSR',
                                            title: 'Early Check-in Request',
                                            description: 'Request for early check-in at 10:00 AM.',
                                            date: '10 Oct, 02:35 PM',
                                            status: 'PENDING',
                                            icon: <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600"><Clock size={16} /></div>,
                                            color: 'bg-yellow-100 text-yellow-600 border-yellow-200'
                                        },
                                        {
                                            id: '3',
                                            type: 'SSR',
                                            title: 'Room Upgrade',
                                            description: 'Upgrade to Deluxe Suite requested.',
                                            date: '10 Oct, 02:35 PM',
                                            status: 'REJECTED',
                                            icon: <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600"><XCircle size={16} /></div>,
                                            color: 'bg-red-100 text-red-600 border-red-200'
                                        },
                                        {
                                            id: '4',
                                            type: 'INFO',
                                            title: 'Pool Maintenance',
                                            description: 'The main swimming pool will be closed for maintenance during your stay.',
                                            date: '12 Oct, 09:00 AM',
                                            status: 'INFO',
                                            icon: <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Info size={16} /></div>,
                                            color: 'bg-blue-100 text-blue-600 border-blue-200'
                                        }
                                    ].map((item: any, i) => (
                                        <div key={i} className="relative pl-16 group">
                                            {/* Timeline Dot */}
                                            <div className={`absolute left-0 top-1 w-14 h-14 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center z-10 bg-white`}>
                                                {item.icon}
                                            </div>

                                            {/* Content */}
                                            <div className="bg-gray-50 hover:bg-white p-6 rounded-2xl border border-gray-100 transition-all hover:shadow-md group-hover:scale-[1.01]">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${item.color}`}>
                                                                {item.type}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-gray-400">{item.date}</span>
                                                        </div>
                                                        <h3 className="text-base font-black text-[#1E1B4B]">{item.title}</h3>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${item.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                                                        item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                            item.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                                'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-medium text-gray-500 leading-relaxed">
                                                    {item.description}
                                                </p>
                                                {/* Action Buttons if Pending/Rejected */}
                                                {(item.status === 'REJECTED' || item.type === 'SSR') && (
                                                    <div className="mt-4 pt-4 border-t border-dashed border-gray-200 flex gap-3">
                                                        {item.status === 'REJECTED' && (
                                                            <button
                                                                onClick={() => setSelectedNotification(item)}
                                                                className="text-[10px] font-black uppercase tracking-widest text-[#8B5CF6] hover:underline"
                                                            >
                                                                View Details
                                                            </button>
                                                        )}
                                                        {item.status === 'REJECTED' && (
                                                            <button
                                                                onClick={() => {
                                                                    setAmendmentPrefill(item);
                                                                    setIsAmendmentOpen(true);
                                                                }}
                                                                className="text-[10px] font-black uppercase tracking-widest text-gray-900 border-l border-gray-300 pl-3 hover:text-red-600"
                                                            >
                                                                Try Again
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <SupplierRemittancePopup isOpen={isRemittanceOpen} onClose={() => setIsRemittanceOpen(false)} />
                <NotificationDetailsPopup
                    isOpen={!!selectedNotification}
                    onClose={() => setSelectedNotification(null)}
                    notification={selectedNotification}
                />
                <BookingAmendmentPopup
                    isOpen={isAmendmentOpen}
                    onClose={() => {
                        setIsAmendmentOpen(false);
                        setAmendmentPrefill(null);
                    }}
                    bookingId={booking.bookingId || booking.reference || ''}
                    passengers={passengers}
                    productType="hotel"
                    prefillData={amendmentPrefill}
                />

            </div>
        </TripLogerLayout>
    );
}
