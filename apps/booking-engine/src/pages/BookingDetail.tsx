import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBookingById } from '../lib/api';
import {
  createOrderCancellation,
  confirmOrderCancellation,
  addOrderServices,
  cancelHotelBooking,
  downloadDocument,
} from '../services/duffelApiManager';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Plane,
  MapPin,
  User,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Download,
  Printer,
  RefreshCcw,
  Map,
  Luggage,
  Utensils,
  Heart,
  Shield,
  Sparkles,
  ChevronDown,
  Info,
  Hotel,
  Bed,
} from 'lucide-react';
import { formatCurrency } from '@tripalfa/ui-components';
import {
  SeatSelectionPopup,
  BaggageSelectionPopup,
  MealSelectionPopup,
  SpecialServicesPopup,
} from '../components/ancillary';
import {
  formatPassengersFromBooking,
  formatFlightSegments,
  type Passenger,
  type FlightSegmentInfo,
  type SelectedMeal,
  type SelectedSpecialService,
} from '../lib/ancillary-types';
import { useTenantRuntime } from '@/components/providers/TenantRuntimeProvider';
import { Button } from '../components/ui/button';

type Booking = Record<string, any>;

function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { config: runtimeConfig } = useTenantRuntime();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationInfo, setCancellationInfo] = useState<any>(null);

  // Toast/notification state for user feedback
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Ancillary Popups
  const [isSeatSelectionOpen, setIsSeatSelectionOpen] = useState(false);
  const [isBaggageOpen, setIsBaggageOpen] = useState(false);
  const [isMealSelectionOpen, setIsMealSelectionOpen] = useState(false);
  const [isSpecialRequestOpen, setIsSpecialRequestOpen] = useState(false);

  const refreshBooking = async () => {
    setIsRefreshing(true);
    try {
      const b = await getBookingById(id || '');
      setBooking(b as any);
    } catch (error) {
      console.error('Failed to refresh booking:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

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

  const handleCancelBooking = async () => {
    if (!booking || !id) return;
    setIsCancelling(true);
    try {
      if (isHotel) {
        // Hotel Cancellation (LiteAPI) - show confirmation dialog
        setShowCancelConfirm(true);
      } else {
        // Flight Cancellation (Duffel) - 2-step flow
        const res = await createOrderCancellation(booking.bookingId || booking.id);
        setCancellationInfo(res.data);
      }
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      setNotification({
        type: 'error',
        message: 'This booking cannot be cancelled online at this time.',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConfirmHotelCancel = async () => {
    if (!booking || !id) return;
    setShowCancelConfirm(false);
    setIsCancelling(true);
    try {
      await cancelHotelBooking(booking.bookingId || booking.id);
      await refreshBooking();
      setNotification({ type: 'success', message: 'Hotel booking cancelled successfully.' });
    } catch (error) {
      console.error('Failed to cancel hotel booking:', error);
      setNotification({
        type: 'error',
        message: 'Failed to cancel hotel booking. Please try again.',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const confirmCancellation = async () => {
    if (!cancellationInfo) return;
    setIsCancelling(true);
    try {
      await confirmOrderCancellation(cancellationInfo.id);
      await refreshBooking();
      setCancellationInfo(null);
      setNotification({ type: 'success', message: 'Booking cancelled successfully.' });
    } catch (error) {
      console.error('Failed to confirm cancellation:', error);
      setNotification({
        type: 'error',
        message: 'Failed to confirm cancellation. Please try again or contact support.',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleAddServices = async (services: any[]) => {
    if (!booking) return;
    try {
      await addOrderServices({
        order_id: booking.bookingId || booking.id,
        services: services.map(s => ({
          id: s.id,
          passenger_id: s.passengerId,
          quantity: 1,
        })),
      });
      await refreshBooking();
      setNotification({ type: 'success', message: 'Services added successfully!' });
    } catch (error) {
      console.error('Failed to add services:', error);
      setNotification({
        type: 'error',
        message: 'Failed to add services. Some services might not be available for this booking.',
      });
    }
  };

  const handleDownload = async (type: string) => {
    if (!booking) return;
    try {
      const res = await downloadDocument(booking.bookingId || booking.id, type);
      if (res && res.downloadUrl) {
        window.open(res.downloadUrl, '_blank');
      } else {
        setNotification({ type: 'error', message: 'Document is not yet available for download.' });
      }
    } catch (error) {
      console.error(`Failed to download ${type}:`, error);
      setNotification({
        type: 'error',
        message: `Failed to download ${type}. Please try again later.`,
      });
    }
  };

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Map real-time data for ancillaries
  const passengers: Passenger[] = React.useMemo(() => {
    if (!booking) return [];
    return formatPassengersFromBooking(
      booking.passengers || { adults: 1, children: 0, infants: 0 },
      booking.details?.passengers || booking.details?.flight?.passengers
    );
  }, [booking]);

  const segments: FlightSegmentInfo[] = React.useMemo(() => {
    if (!booking || !booking.details?.flight?.segments) return [];
    return formatFlightSegments(booking.details.flight.segments);
  }, [booking]);

  if (loading)
    return (
      <TripLogerLayout>
        <div className="min-h-screen flex items-center justify-center bg-white gap-2">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#003b95] border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">
              Retrieving Booking Details...
            </p>
          </div>
        </div>
      </TripLogerLayout>
    );

  if (!booking) return <div>No booking found</div>;

  // Tactical Status Logic
  const isHotel = booking.product === 'hotel' || !!booking.hotel;
  const isTicketed =
    booking.status === 'Ticketed' || booking.status === 'Issued' || booking.status === 'confirmed';
  const isLCC =
    !isHotel && (booking.details?.isLCC || booking.details?.carrierType === 'LCC' || false);
  const allowedPaymentMethods = runtimeConfig.checkout.enforceSupplierWallet
    ? ['wallet']
    : runtimeConfig.checkout.allowedPaymentMethods;
  const holdPaymentEnabled = allowedPaymentMethods.length > 0;
  const flight = booking.details?.flight || {
    route: 'San Francisco (SFO) — Dubai (DXB)',
    segments: [
      {
        from: 'SFO',
        to: 'DXB',
        carrier: 'Emirates',
        code: 'EK226',
        date: '15 Feb',
        time: '11:30 AM - 7:00 PM',
        duration: '15h 30m',
        terminal: '4',
      },
    ],
  };

  return (
    <TripLogerLayout>
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-24 right-4 z-50 p-4 rounded-lg shadow-lg animate-in slide-in-from-right ${
            notification.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-4 hover:opacity-80">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Hotel Cancellation Confirmation Dialog */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirm Cancellation</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to cancel this hotel booking? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowCancelConfirm(false)}
                className="border border-gray-200 text-gray-700 rounded-lg px-6 py-2.5 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Keep Booking
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmHotelCancel}
                disabled={isCancelling}
                className="bg-[#003b95] text-white rounded-lg px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-[#002a6e] transition-all duration-200"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div
        className="bg-gray-50 min-h-screen pb-32 font-sans"
        data-testid="booking-detail-page"
      >
        {/* Header Banner */}
        <div className="bg-[#003b95] pt-32 pb-48 relative overflow-hidden">
          <div className="absolute inset-0 bg-[#003b95]/10" />
          <div className="container mx-auto px-4 max-w-7xl relative z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/bookings')}
              className="mb-10 flex items-center gap-2 transition-colors group bg-white border-gray-200 text-gray-700 rounded-lg px-6 py-2.5 font-semibold text-sm hover:bg-gray-50"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />{' '}
              Back to Dashboard
            </Button>

            <div className="flex flex-col md:flex-row items-end justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`px-4 py-1.5 rounded-full border text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
                      isTicketed
                        ? 'bg-green-100 border-green-500 text-green-800'
                        : 'bg-yellow-100 border-yellow-500 text-yellow-800'
                    }`}
                  >
                    {isHotel ? <Hotel size={12} /> : <Plane size={12} />}
                    {booking.status}
                    <button
                      onClick={refreshBooking}
                      disabled={isRefreshing}
                      className={`hover:text-white transition-all ml-1 ${
                        isRefreshing ? 'animate-spin' : ''
                      }`}
                    >
                      <RefreshCcw size={12} />
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-white/60 uppercase tracking-widest">
                    Reference: {booking.reference || booking.bookingId}
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none">
                  {isHotel
                    ? booking.details?.hotel?.name || 'Hotel Reservation'
                    : flight.route || 'Flight Booking'}
                </h1>
                <div className="flex items-center gap-6 text-white/60">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span className="text-xs font-bold">
                      {isHotel
                        ? booking.details?.hotel?.checkIn || 'TBA'
                        : flight.segments?.[0]?.date || 'TBA'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isHotel ? <Bed size={14} /> : <User size={14} />}
                    <span className="text-xs font-bold">
                      {isHotel
                        ? booking.details?.hotel?.guests || 'N/A'
                        : booking.passengers?.adults +
                          (booking.passengers?.children || 0) +
                          ' Passengers'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {isTicketed ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleCancelBooking}
                      disabled={isCancelling}
                      className="border border-gray-200 rounded-lg px-6 py-2.5 font-semibold text-sm bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                    >
                      {isCancelling ? 'Processing...' : 'Cancel Booking'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleDownload(isHotel ? 'voucher' : 'ticket')}
                      className="bg-gray-900 text-white rounded-lg px-6 py-2.5 font-semibold text-sm hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <Download size={16} /> {isHotel ? 'Voucher' : 'E-Ticket'}
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      onClick={handleCancelBooking}
                      disabled={isCancelling}
                      className="border border-gray-200 text-gray-700 rounded-lg px-6 py-2.5 font-semibold text-sm hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (!holdPaymentEnabled) return;
                        navigate('/booking-checkout', {
                          state: {
                            bookingId: booking.bookingId || booking.id || id,
                            isHoldPayment: true,
                          },
                        });
                      }}
                      disabled={!holdPaymentEnabled}
                      className="bg-[#003b95] text-white rounded-lg px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-[#002a6e] transition-all duration-200"
                    >
                      {holdPaymentEnabled ? 'Complete Payment' : 'Payment Disabled'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-7xl -mt-16 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-8 space-y-8">
              {/* Manage Services Card */}
              {!isHotel && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#003b95]/10 flex items-center justify-center text-[#003b95]">
                          <Sparkles size={20} />
                        </div>
                        <div>
                          <h2 className="text-sm font-bold text-[#003b95] uppercase tracking-wider">
                            Manage Services
                          </h2>
                          <p className="text-xs text-gray-500">Customize your journey</p>
                        </div>
                      </div>
                      {isTicketed && (
                        <span className="bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          modifications allowed
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Button
                        variant="outline"
                        onClick={() =>
                          runtimeConfig.features.seatSelectionEnabled &&
                          setIsSeatSelectionOpen(true)
                        }
                        data-testid="seat-selection-button"
                        disabled={!runtimeConfig.features.seatSelectionEnabled}
                        className="h-auto py-6 flex flex-col items-center gap-3 active:scale-95 transition-transform border border-gray-200 text-gray-700 rounded-lg px-6 font-semibold text-sm hover:bg-gray-50"
                      >
                        <Map size={24} className="text-gray-500" />
                        <div className="text-center space-y-1">
                          <span className="block text-sm font-semibold text-gray-900">Seats</span>
                          <span className="block text-xs text-gray-500 font-normal">
                            Select / Change
                          </span>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          runtimeConfig.features.ancillariesEnabled && setIsBaggageOpen(true)
                        }
                        data-testid="baggage-modification-button"
                        disabled={!runtimeConfig.features.ancillariesEnabled}
                        className="h-auto py-6 flex flex-col items-center gap-3 active:scale-95 transition-transform border border-gray-200 text-gray-700 rounded-lg px-6 font-semibold text-sm hover:bg-gray-50"
                      >
                        <Luggage size={24} className="text-gray-500" />
                        <div className="text-center space-y-1">
                          <span className="block text-sm font-semibold text-gray-900">Baggage</span>
                          <span className="block text-xs text-gray-500 font-normal">
                            Add Weight
                          </span>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          runtimeConfig.features.ancillariesEnabled && setIsMealSelectionOpen(true)
                        }
                        disabled={!runtimeConfig.features.ancillariesEnabled}
                        className="h-auto py-6 flex flex-col items-center gap-3 active:scale-95 transition-transform border border-gray-200 text-gray-700 rounded-lg px-6 font-semibold text-sm hover:bg-gray-50"
                      >
                        <Utensils size={24} className="text-gray-500" />
                        <div className="text-center space-y-1">
                          <span className="block text-sm font-semibold text-gray-900">Meals</span>
                          <span className="block text-xs text-gray-500 font-normal">
                            Dietary Prefs
                          </span>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          runtimeConfig.features.ancillariesEnabled && setIsSpecialRequestOpen(true)
                        }
                        disabled={!runtimeConfig.features.ancillariesEnabled}
                        className="h-auto py-6 flex flex-col items-center gap-3 active:scale-95 transition-transform border border-gray-200 text-gray-700 rounded-lg px-6 font-semibold text-sm hover:bg-gray-50"
                      >
                        <Heart size={24} className="text-gray-500" />
                        <div className="text-center space-y-1">
                          <span className="block text-sm font-semibold text-gray-900">Needs</span>
                          <span className="block text-xs text-gray-500 font-normal">
                            Assistance
                          </span>
                        </div>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Product Summary (Flight or Hotel) */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                {isHotel ? (
                  <>
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
                          <Hotel size={20} />
                        </div>
                        <div>
                          <h2 className="text-sm font-bold text-[#003b95] uppercase tracking-wider">
                            Hotel Details
                          </h2>
                          <p className="text-xs text-gray-500">Stay Information</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 space-y-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-2xl font-bold text-[#1d1d1f]">
                            {booking.details?.hotel?.name || 'Premium Hotel Stay'}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {booking.details?.hotel?.address || 'City Center, Selection'}
                          </p>
                        </div>
                        <div className="px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center">
                          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Rating
                          </span>
                          <span className="text-lg font-bold text-[#1d1d1f]">
                            {booking.details?.hotel?.stars || '4.5'} ★
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-gray-100">
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Check-In
                          </p>
                          <p className="font-bold text-gray-900">
                            {booking.details?.hotel?.checkIn || 'TBA'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Check-Out
                          </p>
                          <p className="font-bold text-gray-900">
                            {booking.details?.hotel?.checkOut || 'TBA'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Guests
                          </p>
                          <p className="font-bold text-gray-900">
                            {booking.details?.hotel?.guests || '2 Adults'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Rooms
                          </p>
                          <p className="font-bold text-gray-900">1 Superior Room</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#003b95]/10 flex items-center justify-center text-[#003b95]">
                          <Plane size={20} />
                        </div>
                        <div>
                          <h2 className="text-sm font-bold text-[#003b95] uppercase tracking-wider">
                            Flight Segments
                          </h2>
                          <p className="text-xs text-gray-500">Journey Details</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      {flight.segments?.map((seg: any, i: number) => (
                        <div
                          key={i}
                          className="bg-gray-50 rounded-xl p-6 relative overflow-hidden border border-gray-100"
                        >
                          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                            <div className="flex items-center gap-4 min-w-[150px]">
                              <div className="w-10 h-10 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center text-xl font-bold text-gray-900">
                                {seg.carrier.charAt(0)}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{seg.carrier}</h3>
                                <p className="text-xs text-gray-500 font-medium">
                                  {seg.code} • Business Class
                                </p>
                              </div>
                            </div>
                            <div className="flex-1 flex items-center justify-center gap-6 w-full md:w-auto mt-4 md:mt-0">
                              <div className="text-center w-24">
                                <p className="text-xl font-bold text-gray-900">
                                  {seg.time.split(' - ')[0]}
                                </p>
                                <p className="text-xs font-semibold text-gray-500 mt-1 border border-gray-200 bg-white rounded-full px-2 py-0.5 inline-block">
                                  {seg.from} T{seg.terminal || '1'}
                                </p>
                              </div>
                              <div className="flex flex-col items-center gap-1.5 flex-1 max-w-[120px]">
                                <p className="text-xs font-medium text-gray-500 whitespace-nowrap">
                                  {seg.duration}
                                </p>
                                <div className="flex items-center w-full gap-1">
                                  <div className="w-1.5 h-1.5 rounded-full border border-[#003b95] bg-white" />
                                  <div className="flex-1 h-px bg-[#003b95]/30 relative">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#003b95]/50">
                                      <Plane size={12} />
                                    </div>
                                  </div>
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#003b95]" />
                                </div>
                                <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">
                                  Confirmed
                                </p>
                              </div>
                              <div className="text-center w-24">
                                <p className="text-xl font-bold text-gray-900">
                                  {seg.time.split(' - ')[1]}
                                </p>
                                <p className="text-xs font-semibold text-gray-500 mt-1 border border-gray-200 bg-white rounded-full px-2 py-0.5 inline-block">
                                  {seg.to}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Sidebar: Payment Summary */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 sticky top-32">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                      <CreditCard size={18} />
                    </div>
                    <h3 className="text-sm font-bold text-[#003b95] uppercase tracking-wider">
                      Payment Summary
                    </h3>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center text-sm gap-4">
                    <span className="text-gray-600">Base Fare</span>
                    <span className="font-medium text-gray-900">{formatCurrency(3220)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm gap-4">
                    <span className="text-gray-600">Taxes & Fees</span>
                    <span className="font-medium text-gray-900">{formatCurrency(240)}</span>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="flex justify-between items-center gap-4">
                    <span className="font-semibold text-gray-900">Total Paid</span>
                    <span className="text-2xl font-bold text-[#003b95] tracking-tight">
                      {formatCurrency(booking.total?.amount || 0)}
                    </span>
                  </div>

                  {!isTicketed && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-6 flex items-start gap-3">
                      <AlertCircle size={16} className="text-yellow-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-yellow-800 uppercase tracking-widest mb-1">
                          Payment Required
                        </p>
                        <p className="text-xs text-yellow-700/80 leading-relaxed">
                          This booking is currently on hold. Confirm your payment to issue
                          e-tickets.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Service Popups */}
        <SeatSelectionPopup
          isOpen={isSeatSelectionOpen}
          onClose={() => setIsSeatSelectionOpen(false)}
          isLCC={isLCC}
          passengers={passengers.filter(p => p.type !== 'Infant')}
          segments={segments}
          onConfirm={seats => {
            handleAddServices(seats);
            setIsSeatSelectionOpen(false);
          }}
        />
        <BaggageSelectionPopup
          isOpen={isBaggageOpen}
          onClose={() => setIsBaggageOpen(false)}
          isLCC={isLCC}
          passengers={passengers.filter(p => p.type !== 'Infant')}
          segments={segments}
          onConfirm={baggage => {
            handleAddServices(baggage);
            setIsBaggageOpen(false);
          }}
        />
        <MealSelectionPopup
          isOpen={isMealSelectionOpen}
          onClose={() => setIsMealSelectionOpen(false)}
          isLCC={isLCC}
          passengers={passengers}
          segments={segments}
          onConfirm={meals => {
            handleAddServices(meals);
            setIsMealSelectionOpen(false);
          }}
        />
        <SpecialServicesPopup
          isOpen={isSpecialRequestOpen}
          onClose={() => setIsSpecialRequestOpen(false)}
          passengers={passengers}
          segments={segments}
          onConfirm={services => {
            handleAddServices(services);
            setIsSpecialRequestOpen(false);
          }}
        />

        {/* Cancellation Confirmation Modal */}
        {cancellationInfo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-8">
              <div className="flex flex-col items-center text-center gap-6">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                  <AlertCircle size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#1d1d1f] tracking-tight">
                    Confirm Cancellation
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Are you sure you want to cancel this booking? This action cannot be undone.
                  </p>
                </div>

                <div className="w-full bg-gray-50 rounded-xl p-6 space-y-3 border border-gray-100">
                  <div className="flex justify-between items-center text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                    <span>Refund Amount</span>
                    <span className="text-gray-900 text-sm">
                      {formatCurrency(Number(cancellationInfo.refund_amount || 0))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                    <span>Currency</span>
                    <span className="text-gray-900">{cancellationInfo.refund_currency}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                  <Button
                    variant="outline"
                    onClick={() => setCancellationInfo(null)}
                    className="w-full border border-gray-200 text-gray-700 rounded-lg px-6 py-2.5 font-semibold text-sm hover:bg-gray-50 transition-colors"
                  >
                    Keep Booking
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={confirmCancellation}
                    disabled={isCancelling}
                    className="w-full bg-[#003b95] text-white rounded-lg px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-[#002a6e] transition-all duration-200"
                  >
                    {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TripLogerLayout>
  );
}

export default BookingDetail;
