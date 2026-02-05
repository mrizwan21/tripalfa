import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    RefreshCw, ArrowLeft, ChevronDown, Plane,
    CreditCard, ShoppingBag, Utensils, Info,
    CheckCircle2, XCircle, Clock, Wallet, X, User
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { getBookingById } from '../lib/api';
import type { Booking } from '../lib/srs-types';
import { Button } from '../components/ui/Button';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { BookingAmendmentPopup } from '../components/BookingAmendmentPopup';
import { NotificationDetailsPopup } from '../components/NotificationDetailsPopup';
import { NotificationItem } from '../lib/notification-types';

// Sub-components for Popups
const SupplierRemittancePopup = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
            <div className="relative bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-black text-[#1E1B4B]">Supplier Remittance</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><X size={20} /></button>
                </div>
                <div className="p-10 space-y-10">
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-gray-900">Booking Ref. QT643</h3>
                        <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <th className="px-6 py-4">Payment ID</th>
                                        <th className="px-6 py-4">Product Type</th>
                                        <th className="px-6 py-4">Supplier Name</th>
                                        <th className="px-6 py-4">Payment Date</th>
                                        <th className="px-6 py-4 text-center">Supp. Currency</th>
                                        <th className="px-6 py-4 text-center">Total Amount</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {[
                                        { id: 'ET1234567', type: 'Flight', supplier: 'Amadeus', date: '15 Sep 24', curr: 'USD. 1,000', total: 'SAR. 3,750', status: 'Paid' },
                                        { id: 'ET1234567', type: 'Hotel', supplier: 'Hotel Beds', date: '15 Sep 24', curr: 'USD. 1,500', total: 'SAR. 5,625', status: 'Paid' },
                                        { id: 'ET1234567', type: 'Others', supplier: 'Hepstar', date: '15 Sep 24', curr: 'USD. 500', total: 'SAR. 1,875', status: 'Unpaid' },
                                    ].map((row, i) => (
                                        <tr key={i} className="text-[10px] font-bold text-gray-600">
                                            <td className="px-6 py-4 text-[#8B5CF6] font-black">{row.id}</td>
                                            <td className="px-6 py-4">{row.type}</td>
                                            <td className="px-6 py-4">{row.supplier}</td>
                                            <td className="px-6 py-4">{row.date}</td>
                                            <td className="px-6 py-4 text-center text-red-500">{row.curr}</td>
                                            <td className="px-6 py-4 text-center text-[#8B5CF6]">{row.total}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-4 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest ${row.status === 'Paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                                    }`}>{row.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-gray-900">Supplier Remittance Summary</h3>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="bg-gray-50 p-6 rounded-2xl space-y-1 border border-gray-100">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Amount</p>
                                <p className="text-sm font-black text-[#8B5CF6]">SAR. 11,250</p>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-2xl space-y-1 border border-gray-100">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Amount Paid</p>
                                <p className="text-sm font-black text-gray-900">SAR. 7,500</p>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-2xl space-y-1 border border-gray-100">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Balance Due</p>
                                <p className="text-sm font-black text-red-600">SAR. 1,875</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button onClick={onClose} className="px-10 h-10 bg-[#FFD700] text-gray-900 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl shadow-yellow-100 transition-all active:scale-95">Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function BookingCard() {
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
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Loading Booking Card...</p>
                </div>
            </div>
        </TripLogerLayout>
    );

    if (!booking) return <div>Booking not found</div>;

    const flight = booking.details?.flight || {};
    const passengers = booking.details?.passengers || [];

    return (
        <TripLogerLayout>
            <div className="bg-[#F8FAFC] min-h-screen pt-20">

                {/* Purple Header */}
                <div className="bg-[#8B5CF6] h-20 flex items-center justify-between px-10 shadow-lg relative z-20">
                    <div className="flex items-center gap-4 text-white">
                        <Plane className="rotate-90" size={20} />
                        <h1 className="text-sm font-black uppercase tracking-[0.2em]">Booking Card</h1>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-white/80">
                            <Clock size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{new Date(booking.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex gap-3">
                            <button className="h-8 px-6 border border-white/30 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2 relative">
                                <RefreshCw size={12} /> Sync
                            </button>
                            <button onClick={() => navigate(-1)} className="h-8 px-6 bg-[#FFD700] text-gray-900 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-yellow-500/20 hover:-translate-y-0.5 transition-all">Back</button>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation Segment */}
                <div className="bg-gray-100 px-8 py-4 border-b border-gray-200">
                    <div className="flex gap-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-10 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                                    ? 'bg-[#FFD700] text-gray-900 shadow-md translate-y-[-1px]'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Reference Banner */}
                <div className="bg-[#FFD700] px-8 py-3 flex items-center justify-between border-y border-yellow-600/10 shadow-sm relative z-10">
                    <div className="flex items-center divide-x divide-gray-900/10 gap-8 h-4">
                        <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Booking Ref: <span className="text-[#8B5CF6]">{booking.bookingId || booking.reference}</span></p>
                        <p className="pl-8 text-[10px] font-black text-gray-900 uppercase tracking-widest">Supplier Ref: <span className="text-[#8B5CF6]">SUP-{booking.id.slice(0, 6)}</span></p>
                        <p className="pl-8 text-[10px] font-black text-gray-900 uppercase tracking-widest">Invoice: <span className="text-[#8B5CF6]">INV-{booking.id.slice(0, 6)}</span></p>
                    </div>
                    <div className="relative group">
                        <button className="h-8 px-4 bg-white rounded-lg border border-gray-100 text-[10px] font-black uppercase tracking-widest text-[#1E1B4B] flex items-center gap-3 shadow-sm group-hover:bg-gray-50 transition-all">
                            Options <ChevronDown size={14} className="text-[#8B5CF6]" />
                        </button>
                        {/* Options Dropdown Mock */}
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

                {/* Main Dashboard Area */}
                <div className="p-8">
                    {activeTab === 'General' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                            {/* Left: Passenger and Status Tables */}
                            <div className="lg:col-span-6 space-y-8">
                                {/* Passenger Details */}
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="bg-[#8B5CF6] px-6 py-4 flex items-center gap-3 text-white">
                                        <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
                                            <User size={14} className="fill-white" />
                                        </div>
                                        <h3 className="text-sm font-black uppercase tracking-widest">Passenger Details</h3>
                                    </div>
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-[#F1F5F9] border-b border-gray-200">
                                            <tr className="text-[11px] font-black text-[#1E1B4B] uppercase tracking-widest">
                                                <th className="px-6 py-4 w-24 border-r border-gray-200">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-4 h-4 rounded-sm border-2 border-yellow-400 flex items-center justify-center p-0.5">
                                                            <div className="w-full h-full bg-yellow-400" />
                                                        </div>
                                                        P No.
                                                    </div>
                                                </th>
                                                <th className="px-6 py-4 border-r border-gray-200 text-center">Ticket Number</th>
                                                <th className="px-6 py-4 text-center">Name</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {passengers.map((p: any, i: number) => (
                                                <tr key={i} className="text-[11px] font-bold text-gray-600">
                                                    <td className="px-6 py-4 border-r border-gray-200">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-4 h-4 rounded-sm border-2 border-yellow-400 flex items-center justify-center p-0.5">
                                                                <div className="w-full h-full bg-yellow-400" />
                                                            </div>
                                                            {i + 1}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 border-r border-gray-200 text-center text-gray-500 font-medium">{booking.status === 'Ticketed' ? `TKT-${booking.id.slice(-6)}-${i}` : 'Not Issued'}</td>
                                                    <td className="px-6 py-4 text-center text-[#8B5CF6] font-black">{p.firstName} {p.lastName}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Booking Status */}
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-8">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-[#F1F5F9] border-b border-gray-200">
                                            <tr className="text-[11px] font-black text-[#1E1B4B] uppercase tracking-widest">
                                                <th className="px-6 py-4 border-r border-gray-200 text-center">Type</th>
                                                <th className="px-6 py-4 border-r border-gray-200 text-center">Payment Status</th>
                                                <th className="px-6 py-4 border-r border-gray-200 text-center">Booking status</th>
                                                <th className="px-6 py-4 text-center">TKT Deadline</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {[
                                                { type: 'Flight', icon: <Plane size={14} className="text-[#8B5CF6]" />, pay: booking.paymentStatus, status: booking.status, deadline: 'N/A', color: 'text-green-600 border-green-600' },
                                            ].map((row, i) => (
                                                <tr key={i} className="text-[11px] font-bold text-gray-800">
                                                    <td className="px-6 py-4 flex items-center gap-3 border-r border-gray-200 font-black">
                                                        {row.icon} {row.type}
                                                    </td>
                                                    <td className="px-6 py-4 border-r border-gray-200 text-center text-gray-500 font-medium">{row.pay}</td>
                                                    <td className="px-6 py-4 border-r border-gray-200 text-center">
                                                        <span className={`inline-block px-5 py-1.5 rounded-lg border-2 font-black text-[10px] uppercase tracking-widest ${row.color}`}>{row.status}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center leading-tight whitespace-nowrap text-gray-500 font-medium">{row.deadline}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Right: Flight Details and Add-ons */}
                            <div className="lg:col-span-6 space-y-8">
                                {/* Flight Details List */}
                                <div className="bg-[#F1F5F9] rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="bg-[#8B5CF6] px-4 py-4 flex items-center justify-between text-white">
                                        <div className="flex items-center gap-4">
                                            <div className="w-4 h-4 rounded-sm border-2 border-yellow-400 flex items-center justify-center p-0.5">
                                                <div className="w-full h-full bg-yellow-400" />
                                            </div>
                                            <Plane className="rotate-90" size={18} />
                                            <h3 className="text-sm font-black uppercase tracking-widest">Flight Details</h3>
                                            <span className="px-4 py-1.5 bg-[#FFD700] text-gray-900 rounded-lg text-[10px] font-black uppercase">Airline Ref: {flight.segments?.[0]?.code || 'N/A'}</span>
                                        </div>
                                        <button className="px-6 h-9 bg-white text-gray-900 rounded-md text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-md">Fare Rules</button>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        {flight.segments?.map((seg: any, i: number) => (
                                            <div key={i} className="flex items-center gap-3 group">
                                                <div className="w-4 h-4 rounded-sm border-2 border-[#8B5CF6] flex items-center justify-center p-0.5 shrink-0">
                                                    <div className="w-full h-full bg-[#8B5CF6]" />
                                                </div>
                                                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex items-center justify-between flex-1 relative overflow-hidden">
                                                    <div className="space-y-4">
                                                        <div className="relative inline-block">
                                                            <p className="text-[11px] font-black text-[#1E1B4B] uppercase tracking-widest flex items-center gap-3">
                                                                {seg.from} - {seg.to}
                                                                <span className="text-green-500 font-black lowercase text-[10px]">Eco Class</span>
                                                            </p>
                                                            <div className="absolute -bottom-1.5 left-0 w-full h-[1.5px] bg-[#FFD700]" />
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-600 uppercase tracking-tighter">
                                                            <span>Carrier: {seg.carrier}</span>
                                                            <span className="text-red-500 font-black text-xs">|</span>
                                                            <span>Flight No. {seg.code}</span>
                                                            <span className="text-red-500 font-black text-xs">|</span>
                                                            <span>Dep: {seg.time.split(' - ')[0]}</span>
                                                            <span className="text-red-500 font-black text-xs">|</span>
                                                            <span>Arr: {seg.time.split(' - ')[1]}</span>
                                                            <span className="text-red-500 font-black text-xs">|</span>
                                                            <ShoppingBag size={10} className="text-[#8B5CF6]" />
                                                            <span>2PC</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-0 group-hover:scale-105 transition-transform duration-500 pr-2">
                                                        <span className="text-[20px] font-black text-gray-300 transform -rotate-12 select-none">{seg.carrier.charAt(0)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-[#8B5CF6] px-6 py-3 flex items-center gap-3 text-white">
                                        <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center p-1">
                                            <Info size={12} className="fill-white" />
                                        </div>
                                        <h3 className="text-[10px] font-black uppercase tracking-widest">Add On Services</h3>
                                    </div>
                                    <div className="p-8 bg-white border-t border-gray-100 space-y-5">
                                        {[
                                            { label: 'Refund Protect', status: booking.status === 'Ticketed' ? 'Active' : 'Not Selected' },
                                        ].map((svc, i) => (
                                            <div key={i} className="flex items-center gap-4 group">
                                                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#8B5CF6] border border-blue-100 shadow-sm group-hover:scale-110 transition-transform"><Info size={14} /></div>
                                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                                    {svc.label}: <span className={svc.status === 'Active' ? 'text-green-500' : 'text-gray-400'}>{svc.status}</span>
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Costing' && (
                        <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
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

                            {/* Costing Table */}
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-[#F8FAFC] border-b border-gray-100">
                                        <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest divide-x divide-gray-100">
                                            <th className="px-6 py-4">Description</th>
                                            <th className="px-6 py-4">Particulars</th>
                                            <th className="px-6 py-4 text-center">Base Amt. {booking.total?.currency}</th>
                                            <th className="px-6 py-4 text-center">Total Taxes {booking.total?.currency}</th>
                                            <th className="px-6 py-4 text-center">Net Amt. {booking.total?.currency}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 text-[10px] font-bold text-gray-600">
                                        <tr className="bg-gray-50/50">
                                            <td className="px-6 py-4"></td>
                                            <td className="px-6 py-4 leading-relaxed">{flight.route} - {flight.segments?.[0]?.carrier}</td>
                                            <td className="px-6 py-4 text-center text-[#8B5CF6] font-black">{((booking.total?.amount || 0) * 0.8).toFixed(2)}</td>
                                            <td className="px-6 py-4 text-center text-[#8B5CF6] font-black">{((booking.total?.amount || 0) * 0.2).toFixed(2)}</td>
                                            <td className="px-6 py-4 text-center text-[#8B5CF6] font-black">{booking.total?.amount}</td>
                                        </tr>
                                        <tr className="bg-gray-100/50">
                                            <td className="px-6 py-8 font-black uppercase text-gray-900">Total Fare</td>
                                            <td className="px-6 py-8 font-black">{passengers.length} Passenger(s)</td>
                                            <td className="px-6 py-8 text-center text-blue-500 font-black text-xs">{((booking.total?.amount || 0) * 0.8).toFixed(2)}</td>
                                            <td className="px-6 py-8 text-center text-blue-500 font-black text-xs">{((booking.total?.amount || 0) * 0.2).toFixed(2)}</td>
                                            <td className="px-6 py-8 text-center text-[#8B5CF6] font-black text-sm">{booking.total?.amount}</td>
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
                                    <p className="text-xs text-gray-400 font-bold mt-1">Track all your booking updates and requests</p>
                                </div>
                                <button
                                    onClick={() => {
                                        const btn = document.getElementById('sync-btn');
                                        if (btn) btn.classList.add('animate-spin');
                                        setTimeout(() => btn?.classList.remove('animate-spin'), 1500);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm group"
                                >
                                    <RefreshCw id="sync-btn" size={16} className="text-[#6366F1]" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 group-hover:text-[#6366F1]">Sync Updates</span>
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
                                            description: 'Your flight booking has been successfully confirmed and ticketed.',
                                            date: '15 Sep, 10:30 AM',
                                            status: 'CONFIRMED',
                                            icon: <CheckCircle2 size={16} />,
                                            color: 'bg-green-100 text-green-600 border-green-200'
                                        },
                                        {
                                            id: '2',
                                            type: 'SSR',
                                            title: 'Special Meal Request',
                                            description: 'Asian Veg-Meal requested for Nooran Alqamoudi on flight EY123.',
                                            date: '15 Sep, 10:35 AM',
                                            status: 'PENDING',
                                            icon: <Utensils size={16} />,
                                            color: 'bg-yellow-100 text-yellow-600 border-yellow-200'
                                        },
                                        {
                                            id: '3',
                                            type: 'SSR',
                                            title: 'Seat Selection',
                                            description: 'Seat 19D selected for Mohamed Jubran.',
                                            date: '15 Sep, 10:35 AM',
                                            status: 'CONFIRMED',
                                            icon: <CheckCircle2 size={16} />,
                                            color: 'bg-green-100 text-green-600 border-green-200'
                                        },
                                        {
                                            id: '4',
                                            type: 'ITINERARY',
                                            title: 'Flight Schedule Change',
                                            description: 'Flight EY123 departure time changed from 10:00 to 10:30.',
                                            date: '20 Sep, 09:00 AM',
                                            status: 'INFO',
                                            icon: <Clock size={16} />,
                                            color: 'bg-blue-100 text-blue-600 border-blue-200'
                                        },
                                        {
                                            id: '5',
                                            type: 'AMENDMENT',
                                            title: 'Date Change Request',
                                            description: 'Request to change return flight date to 25 Oct 2023 rejected due to unavailability.',
                                            date: '21 Sep, 02:20 PM',
                                            status: 'REJECTED',
                                            icon: <XCircle size={16} />,
                                            color: 'bg-red-100 text-red-600 border-red-200'
                                        }
                                    ].map((item: any, i) => (
                                        <div key={i} className="relative pl-16 group">
                                            {/* Timeline Dot */}
                                            <div className={`absolute left-0 top-1 w-14 h-14 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center z-10 ${item.color.split(' ')[0]} ${item.color.split(' ')[1]}`}>
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
                                                                className="text-[10px] font-black uppercase tracking-widest text-[#6366F1] hover:underline"
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
                    prefillData={amendmentPrefill}
                />

            </div>
        </TripLogerLayout>
    );
}
