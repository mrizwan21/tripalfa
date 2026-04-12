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
import {
  api,
  confirmFlightBooking,
  confirmHotelBooking,
  fetchWallets,
  confirmFlightOrder,
  createPaymentIntent,
  getPaymentMethods,
  getOrderPaymentMethods,
  confirmPayment,
  processSupplierPayment,
  fetchAddonPrices,
} from '../lib/api';
import { createFlightOrder } from '../services/duffelApiManager';
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
      <div
        className="bg-[hsl(var(--background))] min-h-screen pb-24 font-sans"
        data-testid="checkout-page"
      >
        {/* Confirmation Modal - Elite Style */}
        {showConfirmation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 gap-2">
            <div
              className="absolute inset-0 bg-[hsl(var(--primary)/0.8)] backdrop-blur-md animate-in fade-in duration-500"
              onClick={() => setShowConfirmation(false)}
            />
            <div className="relative bg-card w-full max-w-lg rounded-[3rem] shadow-2xl p-12 flex flex-col items-center animate-in zoom-in-95 duration-300 border border-border">
              <div className="w-24 h-24 rounded-full bg-purple-50 flex items-center justify-center text-foreground mb-8 shadow-xl shadow-purple-50 gap-2">
                <Wallet size={40} />
              </div>
              <h2 className="text-2xl font-black text-foreground tracking-tight text-center mb-4">
                Confirm Payment
              </h2>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-center mb-10 leading-relaxed max-w-xs">
                You are about to authorize a payment of {formatCurrency(totalPayable)} from your
                TripLoger Wallet.
              </p>

              <div className="w-full bg-muted rounded-3xl p-8 mb-10 space-y-4">
                <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2 gap-4">
                  <span>Available Balance</span>
                  <span className="text-foreground">{formatCurrency(walletBalance)}</span>
                </div>
                <div className="h-px bg-border/50" />
                <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2 gap-4">
                  <span>Transaction Amount</span>
                  <span className="text-red-500">{formatCurrency(totalPayable)}</span>
                </div>
                <div className="h-px bg-border/50" />
                <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2 gap-4">
                  <span>Remaining Balance</span>
                  <span className="text-green-600 font-black">
                    {formatCurrency(walletBalance - totalPayable)}
                  </span>
                </div>
                {holdDeadlineLabel && (
                  <>
                    <div className="h-px bg-border/50" />
                    <div
                      className={`flex justify-between text-[10px] font-black uppercase tracking-widest px-2 gap-4 ${holdDeadlineExpired ? 'text-red-500' : 'text-amber-600'}`}
                    >
                      <span>Hold Expires</span>
                      <span>{holdDeadlineLabel}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmation(false)}
                  className="h-14 rounded-2xl border-2 border-border text-muted-foreground font-black text-[10px] uppercase tracking-widest hover:bg-muted transition-all active:scale-95"
                >
                  Cancel
                </Button>
                {hasInsufficientBalance && runtimeConfig.features.walletTopupEnabled ? (
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/wallet/topup')}
                    className="h-14 rounded-2xl text-foreground font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Top-up Wallet <Plus size={16} strokeWidth={3} />
                  </Button>
                ) : hasInsufficientBalance ? (
                  <Button
                    variant="secondary"
                    disabled
                    className="h-14 rounded-2xl text-muted-foreground font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Insufficient Balance
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleConfirmPayment}
                    disabled={isProcessing}
                    data-testid="confirm-pay-button"
                    className="h-14 rounded-2xl text-primary-foreground font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <div className="w-5 h-5 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <>
                        Confirm & Pay <Check size={16} strokeWidth={3} />
                      </>
                    )}
                  </Button>
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
                <h1 className="text-4xl font-black text-foreground tracking-tight">Review & Pay</h1>
                <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em]">
                  Securely complete your premium booking
                </p>
              </div>

              {/* Booking Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-card rounded-[2.5rem] border border-border p-10 space-y-6">
                  <div className="flex items-center gap-4 border-b border-border/50 pb-6">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 gap-2">
                      <User size={24} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-foreground uppercase tracking-widest text-xl font-semibold tracking-tight">
                        Travelers
                      </h3>
                      <p className="text-[9px] font-bold text-muted-foreground">
                        {passengers.length} Passenger(s)
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {passengers.map((p: any, i: number) => (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-foreground">
                          {p.firstName} {p.lastName}
                        </span>
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                          {i === 0 ? 'Primary' : 'Adult'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card rounded-[2.5rem] border border-border p-10 space-y-6">
                  <div className="flex items-center gap-4 border-b border-border/50 pb-6">
                    <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-500 gap-2">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-foreground uppercase tracking-widest text-xl font-semibold tracking-tight">
                        Billing Address
                      </h3>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                        {billingAddress?.city}, {billingAddress?.country}
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] font-bold text-muted-foreground leading-relaxed uppercase tracking-tighter">
                    {billingAddress?.street}
                    <br />
                    {billingAddress?.city}, {billingAddress?.zipCode}
                    <br />
                    {billingAddress?.country}
                  </p>
                </div>
              </div>

              {/* Payment Banner */}
              <div className="bg-secondary rounded-[3.5rem] p-1 shadow-2xl shadow-yellow-500/10">
                <div className="bg-[hsl(var(--primary))] rounded-[3.4rem] p-12 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-primary-foreground/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-[3s]" />

                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex-1 space-y-10">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-secondary flex items-center justify-center text-secondary-foreground gap-2">
                          <Wallet size={32} />
                        </div>
                        <div className="space-y-2">
                          <h2 className="text-xl font-black text-primary-foreground tracking-tight text-2xl font-semibold tracking-tight">
                            TripLoger Wallet
                          </h2>
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                            Authorized for Elite Access
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          Balance Available
                        </p>
                        <p
                          className={`text-5xl font-black tracking-tighter ${hasInsufficientBalance ? 'text-red-500' : 'text-primary-foreground'}`}
                        >
                          {formatCurrency(walletBalance)}
                        </p>
                        {hasInsufficientBalance && (
                          <div className="flex items-center gap-2 text-red-500/80">
                            <Info size={12} />
                            <span className="text-[9px] font-black uppercase tracking-widest">
                              Insufficient funds for this booking
                            </span>
                          </div>
                        )}
                        {holdDeadlineLabel && (
                          <div
                            className={`flex items-center gap-2 ${holdDeadlineExpired ? 'text-red-500' : 'text-amber-500'}`}
                          >
                            <Info size={12} />
                            <span className="text-[9px] font-black uppercase tracking-widest">
                              Hold payment required by {holdDeadlineLabel}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="w-full md:w-64">
                      {hasInsufficientBalance && runtimeConfig.features.walletTopupEnabled ? (
                        <Button
                          variant="secondary"
                          onClick={() => navigate('/wallet/topup')}
                          className="w-full h-16 text-secondary-foreground rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
                        >
                          Top-up Wallet <Plus size={16} strokeWidth={3} />
                        </Button>
                      ) : hasInsufficientBalance ? (
                        <Button
                          variant="secondary"
                          disabled
                          className="w-full h-16 text-muted-foreground rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                          Insufficient Balance
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={() => setShowConfirmation(true)}
                          data-testid="complete-booking-button"
                          className="w-full h-16 text-secondary-foreground rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
                        >
                          Complete Booking <ArrowRight size={16} strokeWidth={3} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-[2.5rem] border border-border p-8 flex items-center justify-between gap-2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 gap-2">
                    <Lock size={20} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-foreground tracking-tight">
                      Shielded Payments
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                      256-bit AES protection active
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <CheckCircle2 size={24} className="text-green-500" />
                </div>
              </div>
            </div>

            {/* Right Col: Summary Sidebar */}
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-card rounded-[3rem] border border-border shadow-sm overflow-hidden p-8 sticky top-32">
                <div className="space-y-10">
                  <p className="text-[10px] font-black text-foreground uppercase tracking-[0.3em]">
                    Final Summary
                  </p>
                  <h3 className="text-xl font-black text-foreground tracking-tight leading-tight">
                    {summary?.type === 'hotel' ? summary?.hotel?.name : 'Elite Business Class'}
                  </h3>

                  <div className="bg-muted rounded-[2rem] p-6 space-y-6">
                    <div className="flex justify-between items-center text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2 gap-4">
                      <span>{summary?.type === 'hotel' ? 'Accommodation' : 'Fare & Taxes'}</span>
                      <span className="text-foreground">
                        {formatCurrency(
                          summary?.type === 'hotel'
                            ? summary?.hotel?.price || 0
                            : flightPrice + taxes
                        )}
                      </span>
                    </div>
                    {selectedAddOns.length > 0 && (
                      <div className="space-y-3">
                        <div className="h-px bg-border/50" />
                        <p className="text-[9px] font-black text-foreground uppercase tracking-widest">
                          Specialized Services
                        </p>
                        {selectedAddOns.map(item => (
                          <div
                            key={item.id}
                            className="flex justify-between text-[10px] font-bold text-muted-foreground gap-4"
                          >
                            <span>{item.label}</span>
                            <span>{formatCurrency(item.price)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {pricingBreakdown.markupAmount > 0 && (
                      <div className="flex justify-between text-[10px] font-bold text-muted-foreground gap-4">
                        <span>Markup</span>
                        <span>{formatCurrency(pricingBreakdown.markupAmount)}</span>
                      </div>
                    )}
                    {pricingBreakdown.commissionAmount > 0 && (
                      <div className="flex justify-between text-[10px] font-bold text-muted-foreground gap-4">
                        <span>Commission</span>
                        <span>{formatCurrency(pricingBreakdown.commissionAmount)}</span>
                      </div>
                    )}
                    <div className="h-px bg-foreground/10" />
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-sm font-black text-foreground uppercase tracking-widest">
                        Total Due
                      </span>
                      <span className="text-3xl font-black text-foreground tracking-tighter">
                        {formatCurrency(totalPayable)}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 bg-purple-50 rounded-2xl flex gap-3 border border-purple-100/50">
                    <Sparkles size={16} className="text-foreground shrink-0" />
                    <p className="text-[10px] font-bold text-purple-700 leading-relaxed uppercase tracking-wider">
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
