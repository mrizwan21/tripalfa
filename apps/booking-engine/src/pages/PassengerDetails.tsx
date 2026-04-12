import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Globe,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Edit3,
  ShieldCheck,
  Heart,
  ChevronRight,
  CreditCard,
  Sparkles,
  LogIn,
  Lock,
  Info,
  CheckCircle2,
  Luggage,
  Briefcase,
  Plus,
  Plane,
  ChevronDown,
  UserCheck,
  AlertCircle,
  Gift,
  Utensils,
  Clock,
  Map,
  Star,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { formatCurrency } from '@tripalfa/ui-components';
import { api } from '../lib/api';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { FareRulesPopup } from '../components/FareRulesPopup';
import {
  SeatSelectionPopup,
  BaggageSelectionPopup,
  MealSelectionPopup,
  SpecialServicesPopup,
} from '../components/ancillary';
import {
  type SelectedSeat,
  type SelectedBaggage,
  type SelectedMeal,
  type SelectedSpecialService,
  calculateAncillarySummary,
  formatFlightSegments,
  formatPassengersFromBooking,
} from '../lib/ancillary-types';
import { PassengerForm, activePassengerSchema } from '../components/booking/PassengerForm';
import { useCouponValidation } from '../hooks/useCouponValidation';
import { useLoyaltyBalance } from '../hooks/useLoyaltyBalance';
import { useBundledStaticData } from '../hooks/useBundledStaticData';
import { useTenantRuntime } from '@/components/providers/TenantRuntimeProvider';

type FlightSummary = Record<string, any>;
type HotelSummary = Record<string, any>;
type Ancillaries = Record<string, any>;
type PaymentMode = 'wallet' | 'hold' | 'card' | string;
type FormValues = Record<string, any>;

const ANCILLARY_CARD_CLASS =
  'p-6 bg-card border-2 border-border hover:border-foreground/30 rounded-[2rem] transition-all group flex flex-col items-center gap-3 text-center';
const ANCILLARY_ICON_CLASS =
  'w-10 h-10 rounded-xl bg-muted text-foreground/70 flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-all';
const BILLING_LABEL_CLASS =
  'text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1';

// Determine parent schema
const formSchema = z.object({
  passengers: z.array(activePassengerSchema).min(1, 'At least one passenger required'),
  billingAddress: z.object({
    street: z.string().min(5, 'Street address is required'),
    city: z.string().min(2, 'City is required'),
    zipCode: z.string().min(4, 'Zip code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  discountCoupon: z.string().optional(),
});

// Redefining FormValues locally if needed or using imported one
// type FormValues = z.infer<typeof formSchema>;

function PassengerDetails() {
  const navigate = useNavigate();
  const { config: runtimeConfig } = useTenantRuntime();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [isFareRulesOpen, setIsFareRulesOpen] = useState(false);
  const [isSeatSelectionOpen, setIsSeatSelectionOpen] = useState(false);
  const [isBaggageOpen, setIsBaggageOpen] = useState(false);
  const [isMealSelectionOpen, setIsMealSelectionOpen] = useState(false);
  const [isSpecialRequestOpen, setIsSpecialRequestOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const urlAdults = parseInt(searchParams.get('adults') || '1', 10);
  const urlChildren = parseInt(searchParams.get('children') || '0', 10);

  // Loyalty hook for tier discount calculations
  const { balance } = useLoyaltyBalance();

  // Coupon validation hook with debounce and cache
  const { validateCoupon, isValidating, validationResult } = useCouponValidation();
  const couponData = validationResult;

  // ── Ancillary state – initialised from FlightAddons navigation state ──────
  const passedAncillarySelections = location.state?.ancillarySelections || {
    seats: [],
    baggage: [],
    meals: [],
    specialServices: [],
  };

  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>(
    passedAncillarySelections.seats
  );
  const [selectedBaggage, setSelectedBaggage] = useState<SelectedBaggage[]>(
    passedAncillarySelections.baggage
  );
  const [selectedMeals, setSelectedMeals] = useState<SelectedMeal[]>(
    passedAncillarySelections.meals
  );
  const [selectedSpecialServices, setSelectedSpecialServices] = useState<SelectedSpecialService[]>(
    passedAncillarySelections.specialServices
  );

  const ancillarySummary = useMemo(
    () =>
      calculateAncillarySummary({
        seats: selectedSeats,
        baggage: selectedBaggage,
        meals: selectedMeals,
        specialServices: selectedSpecialServices,
      }),
    [selectedSeats, selectedBaggage, selectedMeals, selectedSpecialServices]
  );

  const seatsTotal = ancillarySummary.seats;
  const baggageTotal = ancillarySummary.baggage;
  const mealsTotal = ancillarySummary.meals;
  const ssrTotal = ancillarySummary.specialServices;
  const ancillaryTotal = ancillarySummary.total;

  const passengersCount: {
    adults: number;
    children: number;
    infants: number;
  } | null = location.state?.passengersCount ?? null;

  const passedFlight = location.state?.flight;
  const [paymentModeState, setPaymentModeState] = useState<PaymentMode>('wallet');

  // Initialize Form
  const methods = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      passengers: [
        {
          firstName: '',
          lastName: '',
          nationality: '',
          dob: '',
          gender: 'Male',
          passportNumber: '',
          passportExpiry: '',
          residencyCountry: '',
          phoneCountryCode: '',
          phone: '',
          email: '',
        },
      ],
      billingAddress: {
        street: '',
        city: '',
        zipCode: '',
        country: '',
      },
      discountCoupon: '',
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = methods;
  const { fields } = useFieldArray({
    control,
    name: 'passengers',
  });

  // Get countries for billing address dropdown from bundled static data
  const staticData = useBundledStaticData();
  const countries = useMemo(() => {
    return staticData.countries.data || [];
  }, [staticData.countries.data]);

  const onSubmit = async (data: FormValues) => {
    // Handle valid submission
    console.log('Form Submitted:', data);

    try {
      let bookingId = '';

      // Initialize booking state object (will be updated with response data)
      const bookingState = {
        bookingData: data,
        bookingId: '',
        workflowId: null as string | null,
        documents: null as any,
        summary: {
          type: isHotel ? 'hotel' : 'flight',
          hotel: hotelSummary,
          flight: isHotel ? null : flightSummary,
          ancillaries: {
            seats: selectedSeats,
            baggage: selectedBaggage,
            meals: selectedMeals,
            specialServices: selectedSpecialServices,
            total: ancillaryTotal,
          },
          totals: {
            subtotal,
            discount: totalDiscounts,
            final: finalTotal,
          },
        },
      };

      // For real integration, we MUST hold the booking first to get a reference
      if (paymentModeState === 'wallet' || paymentModeState === 'hold') {
        // Get refundable status from flight/hotel data
        const isFlightRefundable = passedFlight?.refundable === true;
        const isHotelRefundable = summary?.hotel?.refundable === true;
        const isRefundable = isHotel ? isHotelRefundable : isFlightRefundable;

        const holdPayload = {
          ...data,
          flight: passedFlight,
          hotel: hotelSummary,
          ancillaries: {
            seats: selectedSeats,
            baggage: selectedBaggage,
            meals: selectedMeals,
            specialServices: selectedSpecialServices,
            total: ancillaryTotal,
          },
          isRefundable: isRefundable,
        };

        if (isHotel) {
          const res = await api.post('/bookings/hotel/hold', holdPayload);
          if (res) {
            bookingId = res.bookingReference || res.bookingId || res.id;
            bookingState.bookingId = bookingId;
            // Store workflowId and documents for confirmation page
            if (res.workflowId) {
              bookingState.workflowId = res.workflowId;
            }
            if (res.documents) {
              bookingState.documents = res.documents;
            }
          }
        } else {
          const res = await api.post('/bookings/flight/hold', holdPayload);
          if (res) {
            bookingId = res.bookingReference || res.orderId || res.bookingId || res.id;
            bookingState.bookingId = bookingId;
            // Store workflowId and documents for confirmation page
            if (res.workflowId) {
              bookingState.workflowId = res.workflowId;
            }
            if (res.documents) {
              bookingState.documents = res.documents;
            }
          }
        }

        if (!bookingId) {
          throw new Error('Unable to create booking reference. Please try again.');
        }
      }

      if (paymentModeState === 'wallet') {
        navigate('/checkout', { state: bookingState });
      } else {
        navigate('/confirmation', {
          state: {
            paymentMode: 'hold',
            bookingId,
            passengerName: data.passengers[0].firstName,
            totalPaid: finalTotal,
            bookingState,
          },
        });
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Booking failed:', error);
      alert(error.message || 'Failed to process booking. Please try again.');
    }
  };

  const handleFormSubmit = (mode: 'wallet' | 'hold') => {
    if (mode === 'wallet' && !walletPaymentEnabled) {
      return;
    }
    if (mode === 'hold' && !holdPaymentEnabled) {
      return;
    }
    setPaymentModeState(mode);
    handleSubmit(onSubmit)();
  };

  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [tierDiscount, setTierDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');

  // Calculate tier-based discount (5% per tier)
  const getTierDiscount = (tierName: string | undefined) => {
    const tierMultipliers: Record<string, number> = {
      Bronze: 0.02,
      Silver: 0.05,
      Gold: 0.08,
      Platinum: 0.1,
      Diamond: 0.15,
    };
    return tierMultipliers[tierName || 'Bronze'] || 0;
  };

  const handleApplyCoupon = async () => {
    const input = methods.getValues('discountCoupon');
    if (!input?.trim()) {
      setCouponError('Enter a coupon code');
      return;
    }

    try {
      const result = await validateCoupon(input, subtotal, isHotel ? 'hotel' : 'flight');
      if (result?.valid) {
        setCouponDiscount(result.discountPercentage || 0);
        setCouponError('');
      } else {
        setCouponDiscount(0);
        setCouponError(result?.error || 'Invalid coupon code');
      }
    } catch (err) {
      setCouponDiscount(0);
      setCouponError('Failed to validate coupon');
    }
  };

  const summary = location.state?.summary || location.state;
  const isHotel = summary?.type === 'hotel' || !!summary?.hotel;
  const bookingEnabled = isHotel
    ? runtimeConfig.features.hotelBookingEnabled
    : runtimeConfig.features.flightBookingEnabled;
  const allowedPaymentMethods = runtimeConfig.checkout.enforceSupplierWallet
    ? ['wallet']
    : runtimeConfig.checkout.allowedPaymentMethods;
  const walletPaymentEnabled =
    runtimeConfig.features.walletEnabled && allowedPaymentMethods.includes('wallet');
  const holdPaymentEnabled = allowedPaymentMethods.length > 0;

  // const passedFlight = location.state?.flight; // Duplicate removed

  // ── Map Duffel segment fields to the display format used by the sidebar ──
  // Duffel segment keys: origin, destination, departureTime, arrivalTime, airline, flightNumber
  // Previous code incorrectly used s.from / s.to / s.depart / s.arrive
  const mapSegment = (s: any) => ({
    from: s.origin || s.from || '',
    to: s.destination || s.to || '',
    carrier: s.airline || s.carrier || passedFlight?.airline || '',
    code:
      s.flightNumber ||
      s.code ||
      `${passedFlight?.carrierCode || ''}${passedFlight?.flightNumber || ''}`,
    date:
      s.departureTime || s.depart ? format(new Date(s.departureTime || s.depart), 'dd MMM') : 'N/A',
    time:
      (s.departureTime || s.depart) && (s.arrivalTime || s.arrive)
        ? `${format(new Date(s.departureTime || s.depart), 'hh:mm a')} - ${format(new Date(s.arrivalTime || s.arrive), 'hh:mm a')}`
        : 'N/A',
    duration: s.duration || passedFlight?.duration || 'N/A',
  });

  const flightSummary = passedFlight
    ? {
        cabin: passedFlight.cabin || 'Economy',
        route: `${passedFlight.origin || ''} — ${passedFlight.destination || ''}`,
        price: passedFlight.amount || 0,
        taxes: passedFlight.taxes || 0,
        isLCC: passedFlight.isLCC || false,
        airlineLogo: passedFlight.airlineLogo,
        airlineName: passedFlight.airline || '',
        segments: (passedFlight.segments || []).map(mapSegment),
      }
    : summary?.flight || {
        // No flight in state → empty / null summary (no hardcoded data)
        cabin: '',
        route: '',
        price: 0,
        taxes: 0,
        isLCC: false,
        airlineName: '',
        segments: [],
      };

  const hotelSummary = summary?.hotel
    ? {
        name: summary.hotel.name,
        location: summary.hotel.location,
        price: summary.accommodation?.price || 5500,
        taxes: 0,
        image: summary.hotel.image,
      }
    : null;

  // Dynamic Calculations with tier discount
  const subtotal = isHotel
    ? hotelSummary?.price || 0
    : (flightSummary.price || 0) + (flightSummary.taxes || 0) + ancillaryTotal;
  const tierDiscountPercent = balance?.tier.discountPercentage || 0;
  const tierDiscountAmount = (subtotal * tierDiscountPercent) / 100;
  const couponDiscountAmount = (subtotal * couponDiscount) / 100;
  const totalDiscounts = tierDiscountAmount + couponDiscountAmount;
  const finalTotal = subtotal - totalDiscounts;

  if (!bookingEnabled) {
    return (
      <TripLogerLayout>
        <div className="bg-[hsl(var(--background))] min-h-screen flex items-center justify-center px-4 gap-2">
          <div className="bg-card rounded-[2rem] border border-border shadow-sm p-8 text-center max-w-xl w-full">
            <h1 className="text-2xl font-black text-foreground mb-2">Booking Disabled</h1>
            <p className="text-sm font-bold text-muted-foreground mb-6">
              {isHotel ? 'Hotel booking' : 'Flight booking'} is currently disabled by your admin
              settings.
            </p>
            <Button
              onClick={() => navigate('/')}
              className="h-11 px-6 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-xl"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </TripLogerLayout>
    );
  }

  return (
    <TripLogerLayout>
      <div data-testid="passenger-form" className="bg-[hsl(var(--background))] min-h-screen pb-24">
        <div className="container mx-auto px-4 max-w-7xl pt-12">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-black text-[10px] uppercase tracking-[0.2em] mb-10 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />{' '}
            {summary?.type === 'hotel' ? 'Back to Add-ons' : 'Back to Itinerary'}
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left: Detailed Forms */}
            <div className="lg:col-span-8 space-y-10">
              {/* Membership Banner */}
              {!isLoggedIn && (
                <div className="bg-[hsl(var(--primary))] rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-[hsl(var(--primary-foreground))/0.05] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000" />
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="space-y-4 text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-[hsl(var(--secondary-foreground))] shadow-xl gap-2">
                          <UserCheck size={24} />
                        </div>
                        <h3 className="text-xl font-black text-[hsl(var(--primary-foreground))] tracking-tight">
                          Elite Member Rewards
                        </h3>
                      </div>
                      <p className="text-[11px] font-bold text-[hsl(var(--primary-foreground))/0.7] uppercase tracking-widest leading-relaxed max-w-md">
                        Sign in now to sync your personal details, earn reward points, and access
                        member-only flight deals.
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <Button
                        variant="secondary"
                        className="px-10 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:-translate-y-1"
                      >
                        Log In
                      </Button>
                      <Button
                        variant="outline"
                        className="px-10 h-12 rounded-xl border border-[hsl(var(--primary-foreground))/0.2] text-[hsl(var(--primary-foreground))] font-black text-[10px] uppercase tracking-widest transition-all hover:bg-[hsl(var(--primary-foreground))/0.05]"
                      >
                        Register
                      </Button>
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-6 right-6 text-neutral-500 hover: text-xs font-bold h-auto p-0"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </form>
              </FormProvider>

              {/* Tactical Ancillary Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  onClick={() =>
                    runtimeConfig.features.seatSelectionEnabled && setIsSeatSelectionOpen(true)
                  }
                  disabled={!runtimeConfig.features.seatSelectionEnabled}
                  className={ANCILLARY_CARD_CLASS}
                >
                  <div className={ANCILLARY_ICON_CLASS}>
                    <Map size={20} />
                  </div>
                  <span className="text-[10px] font-black text-foreground uppercase tracking-widest">
                    Select Seats
                  </span>
                  {seatsTotal > 0 && (
                    <span className="text-[9px] font-bold text-blue-600">
                      +{formatCurrency(seatsTotal)}
                    </span>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() =>
                    runtimeConfig.features.ancillariesEnabled && setIsBaggageOpen(true)
                  }
                  disabled={!runtimeConfig.features.ancillariesEnabled}
                  className={ANCILLARY_CARD_CLASS}
                >
                  <div className={ANCILLARY_ICON_CLASS}>
                    <Luggage size={20} />
                  </div>
                  <span className="text-[10px] font-black text-foreground uppercase tracking-widest">
                    Add Baggage
                  </span>
                  {baggageTotal > 0 && (
                    <span className="text-[9px] font-bold text-blue-600">
                      +{formatCurrency(baggageTotal)}
                    </span>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() =>
                    runtimeConfig.features.ancillariesEnabled && setIsMealSelectionOpen(true)
                  }
                  disabled={!runtimeConfig.features.ancillariesEnabled}
                  className={ANCILLARY_CARD_CLASS}
                >
                  <div className={ANCILLARY_ICON_CLASS}>
                    <Utensils size={20} />
                  </div>
                  <span className="text-[10px] font-black text-foreground uppercase tracking-widest">
                    Meals
                  </span>
                  {mealsTotal > 0 && (
                    <span className="text-[9px] font-bold text-blue-600">
                      +{formatCurrency(mealsTotal)}
                    </span>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() =>
                    runtimeConfig.features.ancillariesEnabled && setIsSpecialRequestOpen(true)
                  }
                  disabled={!runtimeConfig.features.ancillariesEnabled}
                  className={ANCILLARY_CARD_CLASS}
                >
                  <div className={ANCILLARY_ICON_CLASS}>
                    <Heart size={20} />
                  </div>
                  <span className="text-[10px] font-black text-foreground uppercase tracking-widest">
                    Special RR
                  </span>
                  {selectedSpecialServices.length > 0 && (
                    <span className="text-[9px] font-bold text-orange-500 uppercase tracking-widest italic flex items-center gap-1">
                      <Clock size={8} /> Pending
                    </span>
                  )}
                </Button>
              </div>

              {/* Billing Address Section */}
              <div className="bg-card rounded-[2.5rem] border border-border shadow-sm p-10 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-foreground gap-2">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-foreground tracking-tight uppercase text-xl font-semibold tracking-tight">
                      Billing Information
                    </h3>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                      Invoice details for your transaction
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2 group/field">
                    <Label required className={BILLING_LABEL_CLASS}>
                      Street Address
                    </Label>
                    <Input
                      {...methods.register('billingAddress.street')}
                      placeholder="Building, Street Name, District"
                      className={`w-full h-14 px-6 bg-muted/50 border-2 hover:bg-muted focus:bg-background focus:border-foreground/30 rounded-xl text-[11px] font-bold outline-none transition-all placeholder:text-muted-foreground/70 ${methods.formState.errors.billingAddress?.street ? 'border-blue-500/50' : 'border-transparent'}`}
                    />
                    {methods.formState.errors.billingAddress?.street && (
                      <div className="flex items-center gap-1 text-blue-500 pl-1">
                        <AlertCircle size={10} />
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          {methods.formState.errors.billingAddress.street.message}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 group/field">
                    <Label required className={BILLING_LABEL_CLASS}>
                      City
                    </Label>
                    <Input
                      {...methods.register('billingAddress.city')}
                      placeholder="City"
                      className={`w-full h-14 px-6 bg-muted/50 border-2 hover:bg-muted focus:bg-background focus:border-foreground/30 rounded-xl text-[11px] font-bold outline-none transition-all placeholder:text-muted-foreground/70 ${methods.formState.errors.billingAddress?.city ? 'border-blue-500/50' : 'border-transparent'}`}
                    />
                    {methods.formState.errors.billingAddress?.city && (
                      <div className="flex items-center gap-1 text-blue-500 pl-1">
                        <AlertCircle size={10} />
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          {methods.formState.errors.billingAddress.city.message}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2 group/field">
                      <Label required className={BILLING_LABEL_CLASS}>
                        Zip Code
                      </Label>
                      <Input
                        {...methods.register('billingAddress.zipCode')}
                        placeholder="Zip"
                        className={`w-full h-14 px-6 bg-muted/50 border-2 hover:bg-muted focus:bg-background focus:border-foreground/30 rounded-xl text-[11px] font-bold outline-none transition-all placeholder:text-muted-foreground/70 ${methods.formState.errors.billingAddress?.zipCode ? 'border-blue-500/50' : 'border-transparent'}`}
                      />
                      {methods.formState.errors.billingAddress?.zipCode && (
                        <div className="flex items-center gap-1 text-blue-500 pl-1">
                          <AlertCircle size={10} />
                          <span className="text-[9px] font-black uppercase tracking-widest">
                            {methods.formState.errors.billingAddress.zipCode.message}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 group/field">
                      <Label required className={BILLING_LABEL_CLASS}>
                        Country
                      </Label>
                      <div className="relative">
                        <select
                          {...methods.register('billingAddress.country')}
                          className={`w-full h-14 px-6 bg-muted/50 border-2 hover:bg-muted focus:bg-background focus:border-foreground/30 rounded-xl text-[11px] font-bold appearance-none outline-none cursor-pointer ${methods.formState.errors.billingAddress?.country ? 'border-blue-500/50' : 'border-transparent'}`}
                        >
                          <option value="">Select</option>
                          {((countries as any[]) || []).map((c: any) => (
                            <option key={c.code} value={c.code}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <ChevronDown size={14} className="text-muted-foreground" />
                        </div>
                      </div>
                      {methods.formState.errors.billingAddress?.country && (
                        <div className="flex items-center gap-1 text-blue-500 pl-1">
                          <AlertCircle size={10} />
                          <span className="text-[9px] font-black uppercase tracking-widest">
                            {methods.formState.errors.billingAddress.country.message}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-[2.5rem] border border-border shadow-sm p-10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 gap-2">
                    <CheckCircle2 size={20} />
                  </div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                    Secure Booking with 256-bit SSL Encryption
                  </p>
                </div>
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-10 h-6 bg-muted border border-border rounded-md" />
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Summary Sidebar */}
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-card rounded-[3rem] border border-border shadow-sm overflow-hidden p-8 sticky top-32">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
                      {isHotel ? 'Hotel Summary' : 'Trip Summary'}
                    </p>
                    <h3 className="text-xl font-black text-foreground tracking-tight leading-tight">
                      {isHotel ? hotelSummary?.name : flightSummary.route}
                    </h3>
                  </div>

                  {isHotel ? (
                    <div className="bg-muted rounded-[2rem] p-4 overflow-hidden shadow-inner group">
                      <img
                        src={hotelSummary?.image}
                        alt="Hotel"
                        className="w-full h-32 object-cover rounded-xl mb-4 group-hover:scale-105 transition-transform"
                      />
                      <div className="flex items-center gap-2">
                        <MapPin size={12} className="text-muted-foreground" />
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          {hotelSummary?.location}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted rounded-[2rem] p-6 space-y-6">
                      {flightSummary.segments.map((seg: any, i: number) => (
                        <div key={i} className="space-y-4">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center p-2 shadow-sm gap-2">
                                <Plane size={16} className="text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-[11px] font-black text-foreground">
                                  {seg.carrier}
                                </p>
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                                  {seg.code}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[11px] font-black text-foreground leading-none mb-1">
                                {seg.time}
                              </p>
                              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                                {seg.date}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2 gap-4">
                      <span>{isHotel ? 'Accommodation' : 'Base Fare'}</span>
                      <span className="text-foreground">
                        {formatCurrency(isHotel ? hotelSummary?.price || 0 : flightSummary.price)}
                      </span>
                    </div>
                    {!isHotel && (
                      <div className="flex justify-between items-center text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2 gap-4">
                        <span>Fees & Taxes</span>
                        <span className="text-foreground">
                          {formatCurrency(flightSummary.taxes)}
                        </span>
                      </div>
                    )}
                    {(seatsTotal > 0 || baggageTotal > 0 || mealsTotal > 0) && (
                      <div className="flex justify-between items-center text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2 group gap-4">
                        <div className="flex items-center gap-1">
                          <span>Ancillary Fees</span>
                          <Info
                            size={10}
                            className="text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                        <span className="">
                          +{formatCurrency(seatsTotal + baggageTotal + mealsTotal)}
                        </span>
                      </div>
                    )}
                    {tierDiscountAmount > 0 && (
                      <div className="flex justify-between items-center text-[10px] font-black text-blue-600 uppercase tracking-widest px-2 group gap-4">
                        <div className="flex items-center gap-1">
                          <Star size={10} className="text-blue-500" />
                          <span>Tier Discount ({(tierDiscountPercent * 100).toFixed(0)}%)</span>
                        </div>
                        <span className="">-{formatCurrency(tierDiscountAmount)}</span>
                      </div>
                    )}
                    {couponDiscount > 0 && (
                      <div className="flex justify-between items-center text-[10px] font-black text-blue-600 uppercase tracking-widest px-2 gap-4">
                        <span>Coupon Discount ({couponDiscount}%)</span>
                        <span className="">-{formatCurrency(couponDiscountAmount)}</span>
                      </div>
                    )}
                    {totalDiscounts > 0 && (
                      <div className="flex justify-between items-center text-[10px] font-black text-purple-600 uppercase tracking-widest px-2 border-t pt-2 gap-4">
                        <span>Total Savings</span>
                        <span className="">-{formatCurrency(totalDiscounts)}</span>
                      </div>
                    )}
                    <div className="h-px bg-border" />
                    <div className="flex justify-between items-center px-2 gap-4">
                      <span className="text-sm font-black text-foreground uppercase tracking-widest">
                        Total
                      </span>
                      <span className="text-2xl font-black text-foreground tracking-tighter">
                        {formatCurrency(finalTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Discount Coupon */}
                  <div className="pt-2">
                    <div className="relative group/coupon">
                      <Input
                        {...methods.register('discountCoupon')}
                        placeholder="ENTER COUPON CODE"
                        className={`w-full h-14 px-6 pr-16 bg-muted border-2 focus:border-foreground/30 focus:bg-background rounded-xl text-[10px] font-black uppercase tracking-[0.2em] outline-none transition-all placeholder:text-muted-foreground/70 ${couponError ? 'border-blue-500/50' : couponDiscount > 0 ? 'border-blue-500/50' : 'border-transparent'}`}
                      />
                      <Button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={isValidating}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 h-8 px-4 text-[hsl(var(--primary-foreground))] text-[9px] font-black uppercase tracking-widest rounded-lg transition-colors ${isValidating ? 'bg-muted-foreground cursor-wait' : 'bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)]'}`}
                      >
                        {isValidating ? 'Checking...' : 'Apply'}
                      </Button>
                    </div>
                    {couponError && (
                      <p className="text-[9px] font-bold text-blue-500 mt-2 ml-2 uppercase tracking-widest animate-pulse flex items-center gap-1">
                        <AlertCircle size={10} /> {couponError}
                      </p>
                    )}
                    {couponDiscount > 0 && (
                      <p className="text-[9px] font-bold text-blue-600 mt-2 ml-2 uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle2 size={10} /> Coupon Applied: {couponDiscount}% Off
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-4 pt-4">
                    <Button
                      variant="primary"
                      onClick={() => handleFormSubmit('wallet')}
                      disabled={!walletPaymentEnabled}
                      className="h-14 text-background rounded-xl text-[11px] font-black uppercase tracking-widest transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Pay with Wallet{' '}
                      <ArrowRight
                        size={16}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </Button>

                    {(isHotel ? summary?.hotel?.refundable : passedFlight?.refundable) ? (
                      <Button
                        variant="outline"
                        onClick={() => handleFormSubmit('hold')}
                        disabled={!holdPaymentEnabled}
                        className="h-14 bg-card border-2 border-border hover:border-foreground/30 hover:text-foreground text-muted-foreground rounded-xl text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Hold Booking
                      </Button>
                    ) : (
                      <div className="p-4 bg-muted rounded-xl border border-border">
                        <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest text-center">
                          Hold option unavailable for non-refundable {isHotel ? 'rates' : 'fares'}
                        </p>
                      </div>
                    )}
                    {Object.keys(errors).length > 0 && (
                      <p className="text-center text-blue-500 text-[10px] font-bold uppercase tracking-widest animate-pulse">
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
        isLCC={passedFlight?.isLCC}
        offerId={passedFlight?.id}
        passengers={formatPassengersFromBooking(
          passengersCount || { adults: urlAdults, children: urlChildren, infants: 0 },
          fields
        )}
        segments={formatFlightSegments(passedFlight?.segments || [])}
        onConfirm={seats => {
          setSelectedSeats(seats);
          setIsSeatSelectionOpen(false);
        }}
        existingSelections={selectedSeats}
      />
      <BaggageSelectionPopup
        isOpen={isBaggageOpen}
        onClose={() => setIsBaggageOpen(false)}
        isLCC={passedFlight?.isLCC}
        passengers={formatPassengersFromBooking(
          passengersCount || { adults: urlAdults, children: urlChildren, infants: 0 },
          fields
        ).filter(p => p.type !== 'Infant')}
        segments={formatFlightSegments(passedFlight?.segments || [])}
        availableOptions={passedFlight?.ancillaries
          ?.filter((a: any) => a.type === 'baggage')
          .map((a: any) => ({
            id: a.id,
            type: 'checked',
            weight: a.raw?.metadata?.weight || 23,
            weightUnit: a.raw?.metadata?.weight_unit || 'kg',
            price: a.price,
            currency: a.currency,
            description: a.name,
          }))}
        onConfirm={bags => {
          setSelectedBaggage(bags);
          setIsBaggageOpen(false);
        }}
        existingSelections={selectedBaggage}
      />
      <MealSelectionPopup
        isOpen={isMealSelectionOpen}
        onClose={() => setIsMealSelectionOpen(false)}
        isLCC={passedFlight?.isLCC}
        passengers={formatPassengersFromBooking(
          passengersCount || { adults: urlAdults, children: urlChildren, infants: 0 },
          fields
        )}
        segments={formatFlightSegments(passedFlight?.segments || [])}
        availableMeals={passedFlight?.ancillaries
          ?.filter((a: any) => a.type === 'meal')
          .map((a: any) => ({
            id: a.id,
            code: a.raw?.metadata?.type || 'MEAL',
            name: a.name,
            description: a.raw?.metadata?.description,
            type: 'special',
            price: a.price,
            currency: a.currency,
          }))}
        onConfirm={meals => {
          setSelectedMeals(meals);
          setIsMealSelectionOpen(false);
        }}
        existingSelections={selectedMeals}
      />
      <SpecialServicesPopup
        isOpen={isSpecialRequestOpen}
        onClose={() => setIsSpecialRequestOpen(false)}
        passengers={formatPassengersFromBooking(
          passengersCount || { adults: urlAdults, children: urlChildren, infants: 0 },
          fields
        )}
        segments={formatFlightSegments(passedFlight?.segments || [])}
        availableServices={passedFlight?.ancillaries
          ?.filter((a: any) => a.type === 'other')
          .map((a: any) => ({
            id: a.id,
            code: a.raw?.metadata?.type || 'SSR',
            name: a.name,
            description: a.raw?.metadata?.description,
            price: a.price,
            currency: a.currency,
          }))}
        onConfirm={reqs => {
          setSelectedSpecialServices(reqs);
          setIsSpecialRequestOpen(false);
        }}
        existingSelections={selectedSpecialServices}
      />
    </TripLogerLayout>
  );
}

export default PassengerDetails;
