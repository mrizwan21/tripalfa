import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  RefreshCw,
  ChevronDown,
  Hotel,
  Clock,
  X,
  User,
  CheckCircle2,
  XCircle,
  Info,
  MapPin,
  Calendar,
  Star,
  ShoppingBag,
  ArrowLeft,
} from 'lucide-react';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { BookingAmendmentPopup } from '../components/BookingAmendmentPopup';
import { getBookingById } from '../lib/api';

// Sub-components for Popups
const SupplierRemittancePopup = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 gap-2">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="relative bg-card w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-border">
        <div className="p-8 border-b border-border flex justify-between items-center group gap-4">
          <h2 className="text-xl font-black text-[hsl(var(--primary))] group-hover:px-2 transition-all text-2xl font-semibold tracking-tight">
            Supplier Remittance
          </h2>
          <Button
            variant="outline"
            size="default"
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X size={20} />
          </Button>
        </div>
        <div className="p-10 space-y-10">
          <div className="flex justify-center items-center h-40 text-muted-foreground font-bold gap-4">
            Remittance details not available for this booking.
          </div>
          <div className="flex justify-start pt-4 border-t border-border gap-4">
            <Button
              variant="outline"
              size="default"
              onClick={onClose}
              className="px-10 h-10 bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl shadow-yellow-100 transition-all active:scale-95 hover:bg-[hsl(var(--secondary)/0.9)]"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

import { NotificationDetailsPopup } from '../components/NotificationDetailsPopup';
import type { Booking } from '../lib/srs-types';
import type { NotificationItem } from '../lib/notification-types';
import { Button } from '@/components/ui/button';

function HotelBookingCard() {
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
        setBooking(b as Booking);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const tabs = ['General', 'Costing', 'Notification Manager'];

  if (loading)
    return (
      <TripLogerLayout>
        <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] gap-2">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest animate-pulse">
              Loading Hotel Booking...
            </p>
          </div>
        </div>
      </TripLogerLayout>
    );

  if (!booking) return <div>Booking not found</div>;

  const hotel = booking.details?.hotel || {};
  const passengers = booking.details?.passengers || [];

  return (
    <TripLogerLayout>
      <div className="bg-[hsl(var(--background))] min-h-screen pt-20">
        {/* Purple Header */}
        <div className="bg-[hsl(var(--primary))] h-20 flex items-center justify-between px-10 shadow-lg relative z-20 gap-2">
          <div className="flex items-center gap-4 text-[hsl(var(--primary-foreground))]">
            <Hotel size={24} className="fill-[hsl(var(--primary-foreground))]" />
            <h1 className="text-sm font-black uppercase tracking-[0.2em] text-3xl font-bold tracking-tight">
              Hotel Booking Card
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[hsl(var(--primary-foreground))/0.8]">
              <Clock size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {new Date(booking.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="default"
                size="default"
                className="h-9 px-8 border border-[hsl(var(--primary-foreground))/0.3] text-[hsl(var(--primary-foreground))] rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[hsl(var(--primary-foreground))/0.1] transition-all flex items-center gap-2 relative"
              >
                <RefreshCw size={12} /> Sync
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={() => navigate(-1)}
                className="h-9 px-8 bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-yellow-500/20 hover:-translate-y-0.5 transition-all"
              >
                Back
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation Segment */}
        <div className="bg-card px-10 py-5 border-b border-border flex items-center gap-2">
          {tabs.map(tab => (
            <Button
              variant="outline"
              size="default"
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-10 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all relative ${
                activeTab === tab
                  ? 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] shadow-xl translate-y-[-2px]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[hsl(var(--secondary))] rotate-45" />
              )}
            </Button>
          ))}
        </div>

        {/* Reference Banner */}
        <div className="bg-[hsl(var(--secondary))] px-10 py-4 flex items-center justify-between border-y border-yellow-600/10 shadow-sm relative z-10 transition-all gap-2">
          <div className="flex items-center divide-x divide-border/50 gap-10 h-5">
            <p className="text-[11px] font-black text-foreground uppercase tracking-widest">
              Booking Ref:{' '}
              <span className="text-[hsl(var(--primary))]">
                {booking.bookingId || booking.reference}
              </span>
            </p>
            <p className="pl-10 text-[11px] font-black text-foreground uppercase tracking-widest">
              Supplier Ref:{' '}
              <span className="text-[hsl(var(--primary))]">SUP-{booking.id.slice(0, 6)}</span>
            </p>
            <p className="pl-10 text-[11px] font-black text-foreground uppercase tracking-widest">
              Invoice:{' '}
              <span className="text-[hsl(var(--primary))]">INV-{booking.id.slice(0, 6)}</span>
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Payment Status:
              </span>
              <span
                className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm ${booking.paymentStatus === 'Paid' ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]' : 'bg-red-500 text-background'}`}
              >
                {booking.paymentStatus}
              </span>
            </div>
            <div className="flex items-center gap-4 border-l border-border/50 pl-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Booking Status:
              </span>
              <span
                className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm ${booking.status === 'Confirmed' ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]' : 'bg-yellow-500 text-background'}`}
              >
                {booking.status}
              </span>
            </div>
            <div className="relative group ml-4">
              <Button
                variant="default"
                size="sm"
                className="h-10 px-6 bg-card rounded-lg border border-border text-[11px] font-black uppercase tracking-widest text-[hsl(var(--primary))] flex items-center gap-3 shadow-sm group-hover:bg-muted transition-all min-w-[120px] justify-between"
              >
                Options <ChevronDown size={14} className="text-[hsl(var(--primary))]" />
              </Button>
              <div className="absolute top-full right-0 mt-2 w-48 bg-card rounded-xl shadow-2xl border border-border invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all origin-top-right transform scale-95 group-hover:scale-100 z-50 p-2 pointer-events-none group-hover:pointer-events-auto">
                {['Refund', 'Amendment', 'Cancel', 'Special Request'].map(opt => (
                  <Button
                    variant="outline"
                    size="default"
                    key={opt}
                    onClick={() => setIsAmendmentOpen(true)}
                    className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-[0.1em] rounded-xl transition-all ${
                      opt === 'Refund' || opt === 'Cancel'
                        ? 'text-red-500 hover:bg-red-50'
                        : 'text-[hsl(var(--primary))] hover:bg-muted'
                    }`}
                  >
                    {opt}
                  </Button>
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
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden translate-x-0 transition-transform hover:-translate-y-1 duration-500">
                  <div className="bg-[hsl(var(--primary))] px-6 py-5 flex items-center gap-4 text-[hsl(var(--primary-foreground))]">
                    <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary-foreground))/0.2] flex items-center justify-center gap-2">
                      <User size={16} className="fill-[hsl(var(--primary-foreground))]" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-xl font-semibold tracking-tight">
                      Passenger Details
                    </h3>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[hsl(var(--muted))] border-b border-border">
                      <tr className="text-[11px] font-black text-[hsl(var(--primary))] uppercase tracking-widest divide-x divide-border">
                        <th className="px-6 py-5 w-24">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-sm border-2 border-yellow-400 flex items-center justify-center p-0.5 gap-2">
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
                    <tbody className="divide-y divide-border font-bold text-muted-foreground bg-card">
                      {passengers.map((p: any, i: number) => (
                        <tr
                          key={i}
                          className="text-[11px] group transition-colors divide-x divide-border"
                        >
                          <td className="px-6 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded-sm border-2 border-border flex items-center justify-center p-0.5 group-hover:border-yellow-400 transition-colors gap-2">
                                <div className="w-full h-full bg-transparent group-hover:bg-yellow-400 transition-colors" />
                              </div>
                              <span className="font-black text-foreground">{i + 1}</span>
                            </div>
                          </td>
                          <td className="px-6 py-6 text-center whitespace-pre-line leading-relaxed">
                            {hotel.name ? 'Standard Room' : 'N/A'}
                          </td>
                          <td className="px-6 py-6 text-center text-[hsl(var(--primary))] font-black whitespace-pre-line leading-relaxed">
                            {p.firstName} {p.lastName}
                          </td>
                          <td className="px-6 py-6 text-center text-muted-foreground font-medium">
                            {hotel.checkIn}
                          </td>
                          <td className="px-6 py-6 text-center text-muted-foreground font-medium">
                            {hotel.checkOut}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right: Hotel Card Details */}
              <div className="lg:col-span-5 space-y-10">
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden group">
                  <div className="bg-[hsl(var(--primary))] px-6 py-5 flex items-center justify-between text-[hsl(var(--primary-foreground))] gap-2">
                    <div className="flex items-center gap-4">
                      <Hotel size={20} className="fill-[hsl(var(--primary-foreground))]" />
                      <h3 className="text-sm font-black uppercase tracking-widest underline decoration-[hsl(var(--secondary))] decoration-2 underline-offset-8 text-xl font-semibold tracking-tight">
                        Hotel Details
                      </h3>
                    </div>
                  </div>
                  <div className="p-0 border-b border-border">
                    <div className="flex gap-4">
                      <div className="w-[45%] h-64 overflow-hidden relative border-r border-border">
                        <img
                          src={
                            hotel.image ||
                            'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80'
                          }
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                          alt="Hotel"
                        />
                        <div className="absolute inset-0 bg-foreground/20" />
                      </div>
                      <div className="flex-1 p-8 space-y-6 flex flex-col justify-center">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 mb-2">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star
                                key={s}
                                size={14}
                                className={`fill-[hsl(var(--secondary))] ${hotel.rating >= s ? 'text-[hsl(var(--secondary))]' : 'text-muted-foreground/40'}`}
                              />
                            ))}
                          </div>
                          <h3 className="text-xl font-black text-[hsl(var(--primary))] leading-tight">
                            {hotel.name || 'Hotel Name'}
                          </h3>
                          <div className="flex items-start gap-2 text-muted-foreground text-[11px] font-medium leading-relaxed">
                            <MapPin
                              size={12}
                              className="mt-0.5 shrink-0 text-[hsl(var(--primary))]"
                            />
                            {hotel.address || 'Address not available'}
                          </div>
                        </div>

                        <div className="space-y-4 border-t border-border pt-6 font-bold text-[11px] uppercase tracking-widest text-[hsl(var(--primary))]">
                          <div className="flex items-center gap-4">
                            <User size={14} className="text-[hsl(var(--primary))]" />
                            <span>{passengers.length} Guest(s)</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <Calendar size={14} className="text-[hsl(var(--primary))]" />
                            <span>check in: {hotel.checkIn}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <Calendar size={14} className="text-[hsl(var(--primary))]" />
                            <span>check out: {hotel.checkOut}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ancillary Preview */}
                <div className="bg-card rounded-xl border border-border shadow-xl p-8 space-y-6 border-t-[6px] border-[hsl(var(--primary))] group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[hsl(var(--primary))] group-hover:rotate-12 transition-transform duration-500 shadow-inner gap-2">
                      <ShoppingBag size={20} />
                    </div>
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                      Add On Services Summary
                    </h4>
                  </div>
                  <div className="space-y-4">
                    {[
                      {
                        label: 'Refund Protect',
                        status: 'Not Selected',
                        color: 'text-muted-foreground',
                      },
                    ].map((svc, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 rounded-xl hover:bg-muted transition-all border border-transparent hover:border-border gap-2"
                      >
                        <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                          {svc.label}
                        </span>
                        <span
                          className={`text-[10px] font-black uppercase tracking-widest ${svc.color}`}
                        >
                          {svc.status}
                        </span>
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
              <div className="bg-card rounded-xl border border-border shadow-sm p-8 flex items-center justify-between group gap-2">
                <div className="flex gap-12">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                      Creator
                    </p>
                    <p className="text-xs font-black text-[hsl(var(--primary))]">Admin</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                      Authorised By
                    </p>
                    <p className="text-xs font-black text-[hsl(var(--primary))]">
                      System{' '}
                      <span className="text-muted-foreground font-bold ml-2">
                        On: {new Date(booking.createdAt).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="text-right space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-foreground uppercase text-right">
                      On: {new Date(booking.createdAt).toLocaleString()}
                    </p>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                      Sales Channel: <span className="text-foreground">Website</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Complex Costing Table */}
              <div className="bg-card rounded-xl border border-border shadow-xl overflow-hidden group/tbl">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[hsl(var(--muted))] border-b border-border">
                    <tr className="text-[11px] font-black text-[hsl(var(--primary))] uppercase tracking-widest divide-x divide-border">
                      <th className="px-6 py-6 min-w-[200px]">Description</th>
                      <th className="px-6 py-6">Particulars</th>
                      <th className="px-6 py-6 text-center">Base ({booking.total?.currency})</th>
                      <th className="px-6 py-6 text-center">Taxes ({booking.total?.currency})</th>
                      <th className="px-6 py-6 text-center">Net ({booking.total?.currency})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-[11px] font-bold text-muted-foreground">
                    <tr className="bg-card hover:bg-muted transition-colors divide-x divide-border">
                      <td className="px-6 py-10 font-black text-foreground">{hotel.name}</td>
                      <td className="px-6 py-10 text-muted-foreground italic">Hotel Booking</td>
                      <td className="px-6 py-10 text-center text-[hsl(var(--primary))] font-black text-xs">
                        {((booking.total?.amount || 0) * 0.85).toFixed(2)}
                      </td>
                      <td className="px-6 py-10 text-center text-muted-foreground font-medium">
                        {((booking.total?.amount || 0) * 0.15).toFixed(2)}
                      </td>
                      <td className="px-6 py-10 text-center text-[hsl(var(--primary))] font-black text-xs">
                        {booking.total?.amount}
                      </td>
                    </tr>
                    {/* Calculation Summary Row */}
                    <tr className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
                      <td
                        colSpan={4}
                        className="px-6 py-10 text-right text-sm font-black uppercase tracking-widest text-[hsl(var(--secondary))]"
                      >
                        Total Booking Amount :
                      </td>
                      <td className="px-6 py-10 text-center text-2xl font-black text-background">
                        {booking.total?.currency} {booking.total?.amount}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'Notification Manager' && (
            <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
              {/* Header with Sync */}
              <div className="flex justify-between items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-[hsl(var(--primary))] text-2xl font-semibold tracking-tight">
                    Notification Center
                  </h2>
                  <p className="text-xs text-muted-foreground font-bold mt-1">
                    Track all your hotel booking updates and requests
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => {
                    const btn = document.getElementById('sync-btn-hotel');
                    if (btn) btn.classList.add('animate-spin');
                    setTimeout(() => btn?.classList.remove('animate-spin'), 1500);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl hover:bg-muted transition-colors shadow-sm group"
                >
                  <RefreshCw id="sync-btn-hotel" size={16} className="text-[hsl(var(--primary))]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-[hsl(var(--primary))]">
                    Sync Updates
                  </span>
                </Button>
              </div>

              {/* Timeline / Log View */}
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden p-8">
                <div className="space-y-8 relative before:absolute before:left-[27px] before:top-8 before:bottom-8 before:w-0.5 before:bg-border before:border-l before:border-dashed before:border-border">
                  {[
                    {
                      id: '1',
                      type: 'CONFIRMATION',
                      title: 'Booking Confirmed',
                      description: 'Your hotel booking at Splendid Shubham has been confirmed.',
                      date: '10 Oct, 02:30 PM',
                      status: 'CONFIRMED',
                      icon: (
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 gap-2">
                          <CheckCircle2 size={16} />
                        </div>
                      ),
                      color: 'bg-green-100 text-green-600 border-green-200',
                    },
                    {
                      id: '2',
                      type: 'SSR',
                      title: 'Early Check-in Request',
                      description: 'Request for early check-in at 10:00 AM.',
                      date: '10 Oct, 02:35 PM',
                      status: 'PENDING',
                      icon: (
                        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 gap-2">
                          <Clock size={16} />
                        </div>
                      ),
                      color: 'bg-yellow-100 text-yellow-600 border-yellow-200',
                    },
                    {
                      id: '3',
                      type: 'SSR',
                      title: 'Room Upgrade',
                      description: 'Upgrade to Deluxe Suite requested.',
                      date: '10 Oct, 02:35 PM',
                      status: 'REJECTED',
                      icon: (
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 gap-2">
                          <XCircle size={16} />
                        </div>
                      ),
                      color: 'bg-red-100 text-red-600 border-red-200',
                    },
                    {
                      id: '4',
                      type: 'INFO',
                      title: 'Pool Maintenance',
                      description:
                        'The main swimming pool will be closed for maintenance during your stay.',
                      date: '12 Oct, 09:00 AM',
                      status: 'INFO',
                      icon: (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 gap-2">
                          <Info size={16} />
                        </div>
                      ),
                      color: 'bg-blue-100 text-blue-600 border-blue-200',
                    },
                  ].map((item: any, i) => (
                    <div key={i} className="relative pl-16 group">
                      {/* Timeline Dot */}
                      <div className="absolute left-0 top-1 w-14 h-14 rounded-xl border-4 border-background shadow-lg flex items-center justify-center z-10 bg-card">
                        {item.icon}
                      </div>

                      {/* Content */}
                      <div className="bg-muted hover:bg-card p-6 rounded-xl border border-border transition-all hover:shadow-md group-hover:scale-[1.01]">
                        <div className="flex justify-between items-start mb-2 gap-4">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${item.color}`}
                              >
                                {item.type}
                              </span>
                              <span className="text-[10px] font-bold text-muted-foreground">
                                {item.date}
                              </span>
                            </div>
                            <h3 className="text-base font-black text-[hsl(var(--primary))] text-xl font-semibold tracking-tight">
                              {item.title}
                            </h3>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                              item.status === 'CONFIRMED'
                                ? 'bg-green-100 text-green-700'
                                : item.status === 'PENDING'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : item.status === 'REJECTED'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                        {/* Action Buttons if Pending/Rejected */}
                        {(item.status === 'REJECTED' || item.type === 'SSR') && (
                          <div className="mt-4 pt-4 border-t border-dashed border-border flex gap-3">
                            {item.status === 'REJECTED' && (
                              <Button
                                variant="outline"
                                size="default"
                                onClick={() => setSelectedNotification(item)}
                                className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--primary))] hover:underline"
                              >
                                View Details
                              </Button>
                            )}
                            {item.status === 'REJECTED' && (
                              <Button
                                variant="outline"
                                size="default"
                                onClick={() => {
                                  setAmendmentPrefill(item);
                                  setIsAmendmentOpen(true);
                                }}
                                className="text-[10px] font-black uppercase tracking-widest text-foreground border-l border-border pl-3 hover:text-red-600"
                              >
                                Try Again
                              </Button>
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

        <SupplierRemittancePopup
          isOpen={isRemittanceOpen}
          onClose={() => setIsRemittanceOpen(false)}
        />
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

export default HotelBookingCard;
