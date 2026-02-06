import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Wallet, ChevronDown, Check, X, Plane, CreditCard, ShieldCheck,
  ArrowRight, Lock, CheckCircle2, Info, User, MapPin, Sparkles,
  Shield, RefreshCw, Luggage, Plus
} from 'lucide-react';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { formatCurrency } from '../lib/utils';
import { api, confirmFlightBooking, confirmHotelBooking, fetchWallets } from '../lib/api';
import { useQuery } from '@tanstack/react-query';

export default function BookingCheckout() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Extract booking data and summary from state
  const bookingData = state?.bookingData;
  const summary = state?.summary;
  const passengers = bookingData?.passengers || [{ firstName: 'Guest', lastName: 'User' }];
  const billingAddress = bookingData?.billingAddress;
  const addOns = bookingData?.addOns || {};

  const flightPrice = summary?.flight?.price || 0;
  const taxes = summary?.flight?.taxes || 0;
  const ancillariesTotal = (summary?.ancillaries?.seats || 0) +
    (summary?.ancillaries?.baggage || 0) +
    (summary?.ancillaries?.meals || 0);

  const addOnsPrices = {
    travelInsurance: 45,
    refundProtect: 29,
    baggageTrace: 15
  };

  const selectedAddOns = Object.entries(addOns)
    .filter(([_, selected]) => selected)
    .map(([id]) => ({
      id,
      label: id === 'travelInsurance' ? 'Travel Insurance' :
        id === 'refundProtect' ? 'Refund Protect' : 'Baggage Trace',
      price: addOnsPrices[id as keyof typeof addOnsPrices] || 0
    }));

  const addOnsTotal = selectedAddOns.reduce((sum, item) => sum + item.price, 0);
  const totalPayable = summary?.totals?.final || (flightPrice + taxes + addOnsTotal + ancillariesTotal);

  // Fetch actual wallet balance
  const { data: wallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: fetchWallets
  });

  const walletBalance = wallets?.[0]?.balance || 0;
  const hasInsufficientBalance = walletBalance < totalPayable;

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    try {
      let result;
      const paymentDetails = {
        amount: totalPayable,
        currency: 'USD',
        method: 'wallet'
      };

      // Determine if it's a flight or hotel booking based on summary type
      if (summary?.type === 'hotel') {
        // For hotels, we expect a bookingId if it was already held, or we might need to hold it.
        // Assuming bookingData contains necessary info. 
        // If we have a booking ID in state, use it. Otherwise, this might fail if we skip Hold step.
        // Ideally, previous steps should have created a booking ID (Hold).
        const bookingId = bookingData?.id || state?.bookingId;
        if (bookingId) {
          result = await confirmHotelBooking(bookingId, paymentDetails);
        } else {
          // Fallback or Error: 'Booking session expired' or similar. 
          // For migration safety, we can try to "Hold" here if we had `holdHotelBooking` ready with full data.
          // But let's assume ID is passed for now or throw error.
          throw new Error("Missing booking reference. Please restart booking.");
        }
      } else {
        // Flight Booking
        const bookingId = bookingData?.id || state?.bookingId;
        if (bookingId) {
          result = await confirmFlightBooking(bookingId, paymentDetails);
        } else {
          // For flights, often we hold right before payment.
          // If ID is missing, we might need to call holdFlightBooking(bookingData) first.
          throw new Error("Missing booking reference. Please restart booking.");
        }
      }

      if (result && (result.success || result.status === 'confirmed' || result.data?.status === 'confirmed')) {
        navigate('/confirmation', {
          state: {
            ...state,
            bookingId: result.bookingId || result.id || bookingData?.id,
            paymentMode: 'wallet',
            passengerName: passengers[0].firstName,
            totalPaid: totalPayable,
            status: 'confirmed'
          }
        });
      } else {
        throw new Error('Payment confirmation failed.');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      alert(err.message || 'An error occurred during payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <TripLogerLayout>
      <div className="bg-[#F8F9FA] min-h-screen pb-24 font-sans" data-testid="checkout-page">

        {/* Confirmation Modal - Elite Style */}
        {showConfirmation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#111827]/80 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setShowConfirmation(false)} />
            <div className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-12 flex flex-col items-center animate-in zoom-in-95 duration-300 border border-gray-100">
              <div className="w-24 h-24 rounded-full bg-purple-50 flex items-center justify-center text-[#8B5CF6] mb-8 shadow-xl shadow-purple-50">
                <Wallet size={40} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight text-center mb-4">Confirm Payment</h2>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center mb-10 leading-relaxed max-w-xs">You are about to authorize a payment of {formatCurrency(totalPayable)} from your TripLoger Wallet.</p>

              <div className="w-full bg-gray-50 rounded-3xl p-8 mb-10 space-y-4">
                <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">
                  <span>Available Balance</span>
                  <span className="text-gray-900">{formatCurrency(walletBalance)}</span>
                </div>
                <div className="h-px bg-gray-200/50" />
                <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">
                  <span>Transaction Amount</span>
                  <span className="text-red-500">{formatCurrency(totalPayable)}</span>
                </div>
                <div className="h-px bg-gray-200/50" />
                <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">
                  <span>Remaining Balance</span>
                  <span className="text-green-600 font-black">{formatCurrency(walletBalance - totalPayable)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="h-14 rounded-2xl border-2 border-gray-100 text-gray-500 font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95"
                >
                  Cancel
                </button>
                {hasInsufficientBalance ? (
                  <button
                    onClick={() => navigate('/wallet/topup')}
                    className="h-14 rounded-2xl bg-[#FFD700] text-black font-black text-[10px] uppercase tracking-widest shadow-xl shadow-yellow-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Top-up Wallet <Plus size={16} strokeWidth={3} />
                  </button>
                ) : (
                  <button
                    onClick={handleConfirmPayment}
                    disabled={isProcessing}
                    data-testid="confirm-pay-button"
                    className="h-14 rounded-2xl bg-[#8B5CF6] text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-purple-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Confirm & Pay <Check size={16} strokeWidth={3} /></>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 max-w-7xl pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

            {/* Left Col: Review & Payment */}
            <div className="lg:col-span-8 space-y-10">
              <div className="space-y-2">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Review & Pay</h1>
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Securely complete your premium booking</p>
              </div>

              {/* Booking Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 space-y-6">
                  <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500"><User size={24} /></div>
                    <div>
                      <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Travelers</h3>
                      <p className="text-[9px] font-bold text-gray-400">{passengers.length} Passenger(s)</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {passengers.map((p: any, i: number) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-900">{p.firstName} {p.lastName}</span>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{i === 0 ? 'Primary' : 'Adult'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 space-y-6">
                  <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
                    <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-500"><MapPin size={24} /></div>
                    <div>
                      <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Billing Address</h3>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{billingAddress?.city}, {billingAddress?.country}</p>
                    </div>
                  </div>
                  <p className="text-[11px] font-bold text-gray-600 leading-relaxed uppercase tracking-tighter">
                    {billingAddress?.street}<br />
                    {billingAddress?.city}, {billingAddress?.zipCode}<br />
                    {billingAddress?.country}
                  </p>
                </div>
              </div>

              {/* Payment Banner */}
              <div className="bg-[#FFD700] rounded-[3.5rem] p-1 shadow-2xl shadow-yellow-500/10">
                <div className="bg-[#111827] rounded-[3.4rem] p-12 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-[3s]" />

                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex-1 space-y-10">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-[#FFD700] flex items-center justify-center text-[#111827]">
                          <Wallet size={32} />
                        </div>
                        <div className="space-y-1">
                          <h2 className="text-xl font-black text-white tracking-tight">TripLoger Wallet</h2>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Authorized for Elite Access</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Balance Available</p>
                        <p className={`text-5xl font-black tracking-tighter ${hasInsufficientBalance ? 'text-red-500' : 'text-white'}`}>
                          {formatCurrency(walletBalance)}
                        </p>
                        {hasInsufficientBalance && (
                          <div className="flex items-center gap-2 text-red-500/80">
                            <Info size={12} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Insufficient funds for this booking</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="w-full md:w-64">
                      {hasInsufficientBalance ? (
                        <button
                          onClick={() => navigate('/wallet/topup')}
                          className="w-full h-16 bg-[#FFD700] hover:bg-yellow-400 text-black rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
                        >
                          Top-up Wallet <Plus size={16} strokeWidth={3} />
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowConfirmation(true)}
                          data-testid="complete-booking-button"
                          className="w-full h-16 bg-[#FFD700] hover:bg-yellow-400 text-black rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
                        >
                          Complete Booking <ArrowRight size={16} strokeWidth={3} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><Lock size={20} /></div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-gray-900 tracking-tight">Shielded Payments</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">256-bit AES protection active</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <CheckCircle2 size={24} className="text-green-500" />
                </div>
              </div>
            </div>

            {/* Right Col: Summary Sidebar */}
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden p-8 sticky top-32">
                <div className="space-y-10">
                  <p className="text-[10px] font-black text-[#8B5CF6] uppercase tracking-[0.3em]">Final Summary</p>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight leading-tight">
                    {summary?.type === 'hotel' ? summary?.hotel?.name : 'Elite Business Class'}
                  </h3>

                  <div className="bg-gray-50 rounded-[2rem] p-6 space-y-6">
                    <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">
                      <span>{summary?.type === 'hotel' ? 'Accommodation' : 'Fare & Taxes'}</span>
                      <span className="text-gray-900">{formatCurrency(summary?.type === 'hotel' ? summary?.hotel?.price || 0 : flightPrice + taxes)}</span>
                    </div>
                    {selectedAddOns.length > 0 && (
                      <div className="space-y-3">
                        <div className="h-px bg-gray-200/50" />
                        <p className="text-[9px] font-black text-[#8B5CF6] uppercase tracking-widest">Specialized Services</p>
                        {selectedAddOns.map(item => (
                          <div key={item.id} className="flex justify-between text-[10px] font-bold text-gray-600">
                            <span>{item.label}</span>
                            <span>{formatCurrency(item.price)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="h-px bg-gray-900/10" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Total Due</span>
                      <span className="text-3xl font-black text-[#8B5CF6] tracking-tighter">{formatCurrency(totalPayable)}</span>
                    </div>
                  </div>

                  <div className="p-5 bg-purple-50 rounded-2xl flex gap-3 border border-purple-100/50">
                    <Sparkles size={16} className="text-[#8B5CF6] shrink-0" />
                    <p className="text-[10px] font-bold text-purple-700 leading-relaxed uppercase tracking-wider">
                      {summary?.type === 'hotel' ? 'Early check-in and breakfast included.' : 'Premium booking perks applied. Priority boarding included.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </TripLogerLayout>
  );
}
