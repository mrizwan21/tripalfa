import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Wallet,
  ChevronDown,
  Check,
  X,
  Plane,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  Lock,
  CheckCircle2,
  Info,
  User,
  MapPin,
  Sparkles,
  Shield,
  RefreshCw,
  Luggage,
  Plus,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { formatCurrency } from '@tripalfa/ui-components';
import { api, fetchAddonPrices, fetchWallets, confirmFlightBooking, confirmHotelBooking } from '../lib/api';
import {
  createPaymentIntent,
  confirmFlightOrder,
  getPaymentMethods,
  getOrderPaymentMethods,
  confirmPayment,
} from '../services/duffelBookingApi';
import { createFlightOrder } from '../services/duffelApiManager';
import { processSupplierPayment } from '../services/supplierPaymentApi';
import { useQuery } from '@tanstack/react-query';
import { useTenantRuntime } from '@/components/providers/TenantRuntimeProvider';
import { calculatePricingBreakdown } from '@/lib/tenantRuntimeConfig';

function BookingCheckout() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { config: runtimeConfig } = useTenantRuntime();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(
    runtimeConfig.checkout.defaultPaymentMethod
  );
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [walletInfo, setWalletInfo] = useState<any>(null);
  const [addonPrices, setAddonPrices] = useState<Record<string, number>>({});
  const [holdPaymentDeadline, setHoldPaymentDeadline] = useState<string | null>(null);

  // Extract booking data and summary from state
  const bookingData = state?.bookingData;
  const summary = state?.summary;
  const offer = state?.offer; // Duffel offer from FlightDetail
  const flight = state?.flight; // Flight display data
  const passengers = bookingData?.passengers || [{ firstName: 'Guest', lastName: 'User' }];
  const billingAddress = bookingData?.billingAddress;
  const addOns = state?.addOns || bookingData?.addOns || {};
  const passedAddonPrices = state?.addonPrices || {};

  // Consume passed addon prices from HotelAddons, or fetch if not available
  useEffect(() => {
    const loadAddonPrices = async () => {
      try {
        // If prices were passed from HotelAddons, use those; otherwise fetch
        if (Object.keys(passedAddonPrices).length > 0) {
          setAddonPrices(passedAddonPrices);
        } else {
          const prices = await fetchAddonPrices();
          setAddonPrices(prices);
        }
      } catch (error) {
        console.warn('Failed to load addon prices:', error);
        setAddonPrices(passedAddonPrices || {});
      }
    };
    loadAddonPrices();
  }, [passedAddonPrices]);

  // Calculate prices
  const flightPrice = summary?.flight?.price || offer?.total_amount || flight?.amount || 0;
  const taxes = summary?.flight?.taxes || 0;
  const ancillariesTotal =
    (summary?.ancillaries?.seats || 0) +
    (summary?.ancillaries?.baggage || 0) +
    (summary?.ancillaries?.meals || 0);

  const selectedAddOns = Object.entries(addOns)
    .filter(([_, selected]) => selected)
    .map(([id]) => ({
      id,
      label:
        id === 'travelInsurance'
          ? 'Travel Insurance'
          : id === 'refundProtect'
            ? 'Refund Protect'
            : 'Baggage Trace',
      price: addonPrices[id as keyof typeof addonPrices] ?? 0,
    }));

  const addOnsTotal = selectedAddOns.reduce((sum, item) => sum + item.price, 0);
  const baseTotal = summary?.totals?.final || flightPrice + taxes + addOnsTotal + ancillariesTotal;
  const pricingBreakdown = calculatePricingBreakdown(baseTotal, runtimeConfig.pricing);
  const totalPayable = pricingBreakdown.finalTotal;

  // Fetch actual wallet balance
  const { data: wallets } = useQuery<any[]>({
    queryKey: ['wallets'],
    queryFn: () => fetchWallets() as Promise<any[]>,
  });

  // Get the Duffel supplier wallet
  const supplierWallet = wallets?.find((w: any) => w.type === 'duffel' || w.provider === 'duffel');
  const walletBalance = supplierWallet?.balance || wallets?.[0]?.balance || 0;
  const effectivePaymentMethod = runtimeConfig.checkout.enforceSupplierWallet
    ? 'wallet'
    : selectedPaymentMethod;
  const requiresWalletBalance = effectivePaymentMethod === 'wallet';
  const hasInsufficientBalance = requiresWalletBalance && walletBalance < totalPayable;
  const holdDeadlineDate = holdPaymentDeadline ? new Date(holdPaymentDeadline) : null;
  const holdDeadlineLabel = holdDeadlineDate ? holdDeadlineDate.toLocaleString() : null;
  const holdDeadlineExpired = holdDeadlineDate ? holdDeadlineDate.getTime() <= Date.now() : false;

  useEffect(() => {
    if (supplierWallet) {
      setWalletInfo(supplierWallet);
      console.log('[Checkout] Using Duffel supplier wallet:', {
        balance: supplierWallet.balance,
        currency: supplierWallet.currency,
        provider: supplierWallet.provider,
      });
    }
  }, [supplierWallet]);

  useEffect(() => {
    const allowedMethods = runtimeConfig.checkout.allowedPaymentMethods;
    if (allowedMethods.length === 0) {
      setSelectedPaymentMethod(runtimeConfig.checkout.defaultPaymentMethod);
      return;
    }

    if (!allowedMethods.includes(selectedPaymentMethod as any)) {
      const fallbackMethod = allowedMethods.includes(runtimeConfig.checkout.defaultPaymentMethod)
        ? runtimeConfig.checkout.defaultPaymentMethod
        : allowedMethods[0];
      setSelectedPaymentMethod(fallbackMethod);
    }
  }, [runtimeConfig.checkout, selectedPaymentMethod]);

  // Fetch available payment methods when component mounts or offer changes
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setLoadingPaymentMethods(true);
        await getPaymentMethods('duffel', 'test');

        const allowedMethods = runtimeConfig.checkout.enforceSupplierWallet
          ? ['wallet']
          : runtimeConfig.checkout.allowedPaymentMethods;

        setPaymentMethods(
          allowedMethods.map(methodId => ({
            id: methodId,
            name:
              methodId === 'wallet'
                ? 'Supplier Wallet'
                : methodId === 'bank_transfer'
                  ? 'Bank Transfer'
                  : methodId === 'upi'
                    ? 'UPI'
                    : 'Card',
            type: methodId,
          }))
        );

        const nextDefault = allowedMethods.includes(runtimeConfig.checkout.defaultPaymentMethod)
          ? runtimeConfig.checkout.defaultPaymentMethod
          : allowedMethods[0] || 'wallet';
        setSelectedPaymentMethod(nextDefault);
        setLoadingPaymentMethods(false);
      } catch (error) {
        console.error('Failed to fetch payment methods:', error);
        setLoadingPaymentMethods(false);
        const fallbackMethods = runtimeConfig.checkout.enforceSupplierWallet
          ? ['wallet']
          : runtimeConfig.checkout.allowedPaymentMethods;
        setPaymentMethods(
          fallbackMethods.map(methodId => ({
            id: methodId,
            name: methodId === 'wallet' ? 'Supplier Wallet' : methodId,
            type: methodId,
          }))
        );
        setSelectedPaymentMethod(
          fallbackMethods.includes(runtimeConfig.checkout.defaultPaymentMethod)
            ? runtimeConfig.checkout.defaultPaymentMethod
            : fallbackMethods[0] || 'wallet'
        );
      }
    };

    if (offer) {
      fetchPaymentMethods();
    }
  }, [offer, runtimeConfig.checkout]);

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    try {
      let result;

      if (!runtimeConfig.features.flightBookingEnabled && summary?.type !== 'hotel') {
        throw new Error('Flight booking is currently disabled by your admin settings.');
      }

      if (!runtimeConfig.features.hotelBookingEnabled && summary?.type === 'hotel') {
        throw new Error('Hotel booking is currently disabled by your admin settings.');
      }

      if (effectivePaymentMethod === 'wallet' && !runtimeConfig.features.walletEnabled) {
        throw new Error('Wallet payments are currently disabled by your admin settings.');
      }

      const paymentDetails = {
        amount: totalPayable,
        currency: offer?.total_currency || 'USD',
        method: effectivePaymentMethod,
      };

      // If we have a Duffel offer, use the Duffel booking flow
      if (offer) {
        try {
          if (offer?.payment_requirements?.requires_instant_payment === true) {
            throw new Error('Selected offer requires instant payment and cannot be held.');
          }

          console.log('[Checkout] Starting Duffel booking flow with wallet payment');
          // Step 1: Create flight order with passenger details
          const createOrderParams = {
            selectedOffers: [offer.id],
            orderType: 'hold' as const,
            passengers: passengers.map((p: any) => ({
              id: p.id || `passenger_${Math.random().toString(36).substr(2, 9)}`,
              email: p.email || '',
              type: 'adult',
              given_name: p.firstName || p.given_name,
              family_name: p.lastName || p.family_name,
              phone_number: p.phone || '',
              born_at: p.dob ? new Date(p.dob).toISOString().split('T')[0] : '',
              gender: p.gender?.charAt(0).toUpperCase() || 'M',
            })),
          };

          // Create the order
          const orderResult = await createFlightOrder(createOrderParams);
          const orderId = orderResult.id || orderResult.data?.id;
          const paymentRequiredBy =
            orderResult.payment_required_by || orderResult.data?.payment_required_by || null;

          setHoldPaymentDeadline(paymentRequiredBy);

          if (!orderId) {
            throw new Error('Failed to create flight order');
          }

          // Step 2: Create payment intent
          const paymentIntentParams = {
            order_id: orderId,
            amount: {
              amount: Math.round(totalPayable * 100), // Convert to cents
              currency: offer.total_currency || 'USD',
            },
          };

          const paymentIntentResult = await createPaymentIntent(paymentIntentParams);
          const paymentIntentId = paymentIntentResult.id || paymentIntentResult.data?.id;

          if (!paymentIntentId) {
            throw new Error('Failed to create payment intent');
          }

          // Step 3: Confirm the payment using Duffel API with wallet
          console.log('[Checkout] Step 3: Confirming Duffel payment with wallet');

          const confirmPaymentParams = {
            paymentIntentId,
            orderId,
            amount: totalPayable,
            currency: offer.total_currency || 'USD',
            paymentMethodId: effectivePaymentMethod,
            provider: 'duffel',
            environment: 'test',
          };

          const paymentConfirmResult = await confirmPayment(confirmPaymentParams);
          console.log('[Checkout] Duffel payment confirmed:', paymentConfirmResult);

          // Step 4: Process payment through supplier wallet (TripAlfa system)
          console.log('[Checkout] Step 4: Processing supplier wallet payment for order:', orderId);

          const supplierPaymentResult = await processSupplierPayment(
            orderId,
            totalPayable,
            effectivePaymentMethod
          );

          console.log('[Checkout] Supplier wallet payment processed:', supplierPaymentResult);

          // Step 5: Confirm the order after successful payment
          console.log('[Checkout] Step 5: Confirming flight order:', orderId);

          const confirmResult = await confirmFlightOrder(orderId);

          if (
            confirmResult &&
            (confirmResult.success ||
              confirmResult.status === 'confirmed' ||
              confirmResult.data?.status === 'confirmed')
          ) {
            navigate('/confirmation', {
              state: {
                ...state,
                bookingId: orderId,
                bookingType: 'flight',
                orderStatus: 'confirmed',
                paymentMethod: effectivePaymentMethod,
                paymentConfirmed: true,
                supplierPaymentProcessed: true,
                walletInfo: walletInfo,
                paymentRequiredBy,
              },
            });
          } else {
            throw new Error('Failed to confirm flight order');
          }
        } catch (duffelError) {
          console.error('Duffel booking error:', duffelError);
          throw duffelError;
        }
      } else {
        // Fall back to original logic for non-Duffel bookings
        // Determine if it's a flight or hotel booking based on summary type
        if (summary?.type === 'hotel') {
          const bookingId = bookingData?.id || state?.bookingId;
          if (bookingId) {
            result = await confirmHotelBooking(bookingId, paymentDetails);
          } else {
            throw new Error('Missing booking reference. Please restart booking.');
          }
        } else {
          const bookingId = bookingData?.id || state?.bookingId;
          if (bookingId) {
            result = await confirmFlightBooking(bookingId, paymentDetails);
          } else {
            throw new Error('Missing booking reference. Please restart booking.');
          }
        }

        if (
          result &&
          (result.success || result.status === 'confirmed' || result.data?.status === 'confirmed')
        ) {
          navigate('/confirmation', {
            state: {
              ...state,
              bookingId: result.bookingId || result.id || bookingData?.id,
              paymentMode: selectedPaymentMethod,
              passengerName: passengers[0].firstName,
              totalPaid: totalPayable,
              status: 'confirmed',
            },
          });
        } else {
          throw new Error('Payment confirmation failed.');
        }
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
      <div className="bg-gray-50 min-h-screen pb-24" data-testid="checkout-page">
        {/* Confirmation Modal - OTA Style */}
        {showConfirmation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowConfirmation(false)}
            />
            <div className="relative bg-white w-full max-w-lg rounded-xl border border-gray-100 shadow-lg p-8 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-[#003b95]/10 flex items-center justify-center text-[#003b95] mb-8">
                <Wallet size={40} />
              </div>
              <h2 className="text-2xl font-bold text-[#1d1d1f] mb-4 text-center">
                Confirm Payment
              </h2>
              <p className="text-sm text-gray-600 text-center mb-10 leading-relaxed max-w-xs">
                You are about to authorize a payment of {formatCurrency(totalPayable)} from your
                TripLoger Wallet.
              </p>

              <div className="w-full bg-gray-50 rounded-xl p-6 mb-10 space-y-4 border border-gray-100">
                <div className="flex justify-between text-sm text-gray-600 px-2">
                  <span>Available Balance</span>
                  <span className="text-[#1d1d1f] font-semibold">{formatCurrency(walletBalance)}</span>
                </div>
                <div className="h-px bg-gray-200" />
                <div className="flex justify-between text-sm text-gray-600 px-2">
                  <span>Transaction Amount</span>
                  <span className="text-red-600 font-semibold">{formatCurrency(totalPayable)}</span>
                </div>
                <div className="h-px bg-gray-200" />
                <div className="flex justify-between text-sm text-gray-600 px-2">
                  <span>Remaining Balance</span>
                  <span className="text-green-600 font-semibold">
                    {formatCurrency(walletBalance - totalPayable)}
                  </span>
                </div>
                {holdDeadlineLabel && (
                  <>
                    <div className="h-px bg-gray-200" />
                    <div
                      className={`flex justify-between text-sm px-2 ${
                        holdDeadlineExpired ? 'text-red-600' : 'text-yellow-600'
                      }`}
                    >
                      <span>Hold Expires</span>
                      <span>{holdDeadlineLabel}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="h-12 border border-gray-200 rounded-lg text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                {hasInsufficientBalance && runtimeConfig.features.walletTopupEnabled ? (
                  <button
                    onClick={() => navigate('/wallet/topup')}
                    className="h-12 bg-gray-900 text-white rounded-lg font-semibold text-sm hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                  >
                    Top-up Wallet <Plus size={16} strokeWidth={3} />
                  </button>
                ) : hasInsufficientBalance ? (
                  <button
                    disabled
                    className="h-12 bg-gray-100 text-gray-400 rounded-lg font-semibold text-sm cursor-not-allowed"
                  >
                    Insufficient Balance
                  </button>
                ) : (
                  <button
                    onClick={handleConfirmPayment}
                    disabled={isProcessing}
                    className="h-12 bg-[#003b95] text-white rounded-lg font-semibold text-sm shadow-md hover:bg-[#002a6e] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        Confirm & Pay <Check size={16} strokeWidth={3} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 max-w-7xl pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Col: Review & Payment */}
            <div className="lg:col-span-8 space-y-8">
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold text-[#1d1d1f] tracking-tight">
                  Review & Pay
                </h1>
                <p className="text-sm font-bold text-[#003b95] uppercase tracking-widest">
                  Securely complete your premium booking
                </p>
              </div>

              {/* Booking Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-6 space-y-6">
                  <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#003b95]/10 flex items-center justify-center text-[#003b95]">
                      <User size={24} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#003b95] uppercase tracking-wider">
                        Travelers
                      </h3>
                      <p className="text-xs text-gray-500">{passengers.length} Passenger(s)</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {passengers.map((p: any, i: number) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">
                          {p.firstName} {p.lastName}
                        </span>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          {i === 0 ? 'Primary' : 'Adult'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-6 space-y-6">
                  <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#003b95] uppercase tracking-wider">
                        Billing Address
                      </h3>
                      <p className="text-xs text-gray-500">
                        {billingAddress?.city}, {billingAddress?.country}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {billingAddress?.street}
                    <br />
                    {billingAddress?.city}, {billingAddress?.zipCode}
                    <br />
                    {billingAddress?.country}
                  </p>
                </div>
              </div>

              {/* Payment Banner - OTA Style */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                <div className="bg-[#003b95] p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex-1 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                          <Wallet size={32} />
                        </div>
                        <div className="space-y-1">
                          <h2 className="text-xl font-bold text-white tracking-tight">
                            TripLoger Wallet
                          </h2>
                          <p className="text-xs font-bold text-white/60 uppercase tracking-widest">
                            Authorized for Elite Access
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-bold text-white/60 uppercase tracking-widest">
                          Balance Available
                        </p>
                        <p
                          className={`text-4xl font-bold tracking-tighter ${
                            hasInsufficientBalance ? 'text-red-300' : 'text-white'
                          }`}
                        >
                          {formatCurrency(walletBalance)}
                        </p>
                        {hasInsufficientBalance && (
                          <div className="flex items-center gap-2 text-red-300">
                            <Info size={12} />
                            <span className="text-xs font-bold uppercase tracking-widest">
                              Insufficient funds for this booking
                            </span>
                          </div>
                        )}
                        {holdDeadlineLabel && (
                          <div
                            className={`flex items-center gap-2 ${
                              holdDeadlineExpired ? 'text-red-300' : 'text-yellow-300'
                            }`}
                          >
                            <Info size={12} />
                            <span className="text-xs font-bold uppercase tracking-widest">
                              Hold payment required by {holdDeadlineLabel}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="w-full md:w-auto">
                      {hasInsufficientBalance && runtimeConfig.features.walletTopupEnabled ? (
                        <button
                          onClick={() => navigate('/wallet/topup')}
                          className="w-full h-14 bg-white text-[#003b95] rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 shadow-md"
                        >
                          Top-up Wallet <Plus size={16} strokeWidth={3} />
                        </button>
                      ) : hasInsufficientBalance ? (
                        <button
                          disabled
                          className="w-full h-14 bg-white/10 text-white/40 rounded-lg font-semibold text-sm cursor-not-allowed"
                        >
                          Insufficient Balance
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowConfirmation(true)}
                          data-testid="complete-booking-button"
                          className="w-full h-14 bg-white text-[#003b95] rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 shadow-md"
                        >
                          Complete Booking <ArrowRight size={16} strokeWidth={3} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#003b95]/10 flex items-center justify-center text-[#003b95]">
                    <Lock size={20} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-gray-900 tracking-tight">
                      Shielded Payments
                    </p>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-none">
                      256-bit AES protection active
                    </p>
                  </div>
                </div>
                <CheckCircle2 size={24} className="text-green-600" />
              </div>
            </div>

            {/* Right Col: Summary Sidebar */}
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-8 sticky top-8">
                <div className="space-y-6">
                  <p className="text-sm font-bold text-[#003b95] uppercase tracking-widest">
                    Final Summary
                  </p>
                  <h3 className="text-xl font-bold text-[#1d1d1f] tracking-tight leading-tight">
                    {summary?.type === 'hotel' ? summary?.hotel?.name : 'Elite Business Class'}
                  </h3>

                  <div className="bg-gray-50 rounded-xl p-6 space-y-4 border border-gray-100">
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>{summary?.type === 'hotel' ? 'Accommodation' : 'Fare & Taxes'}</span>
                      <span className="text-gray-900 font-semibold">
                        {formatCurrency(
                          summary?.type === 'hotel'
                            ? summary?.hotel?.price || 0
                            : flightPrice + taxes
                        )}
                      </span>
                    </div>
                    {selectedAddOns.length > 0 && (
                      <div className="space-y-2">
                        <div className="h-px bg-gray-200" />
                        <p className="text-xs font-bold text-[#003b95] uppercase tracking-widest">
                          Specialized Services
                        </p>
                        {selectedAddOns.map(item => (
                          <div key={item.id} className="flex justify-between text-sm text-gray-600">
                            <span>{item.label}</span>
                            <span className="font-semibold">{formatCurrency(item.price)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {pricingBreakdown.markupAmount > 0 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Markup</span>
                        <span className="font-semibold">
                          {formatCurrency(pricingBreakdown.markupAmount)}
                        </span>
                      </div>
                    )}
                    {pricingBreakdown.commissionAmount > 0 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Commission</span>
                        <span className="font-semibold">
                          {formatCurrency(pricingBreakdown.commissionAmount)}
                        </span>
                      </div>
                    )}
                    <div className="h-px bg-gray-200" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-900 uppercase tracking-widest">
                        Total Due
                      </span>
                      <span className="text-3xl font-bold text-[#003b95] tracking-tight">
                        {formatCurrency(totalPayable)}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 bg-[#003b95]/10 rounded-xl flex gap-3 border border-[#003b95]/20">
                    <Sparkles size={16} className="text-[#003b95] shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-[#1d1d1f] leading-relaxed">
                      {summary?.type === 'hotel'
                        ? 'Early check-in and breakfast included.'
                        : 'Premium booking perks applied. Priority boarding included.'}
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

export default BookingCheckout;
