import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBookingById } from "../lib/api";
import { TripLogerLayout } from "../components/layout/TripLogerLayout";
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
  Map,
  Luggage,
  Utensils,
  Heart,
  Shield,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Info,
} from "lucide-react";
import { formatCurrency } from "@tripalfa/ui-components";
import { SeatSelectionPopup } from "../components/SeatSelectionPopup";
import { AdditionalBaggagePopup } from "../components/AdditionalBaggagePopup";
import { MealSelectionPopup } from "../components/MealSelectionPopup";
import { SpecialRequestPopup } from "../components/SpecialRequestPopup";
import { useTenantRuntime } from "@/components/providers/TenantRuntimeProvider";
import { Button } from "@/components/ui/button";

type Booking = Record<string, any>;

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { config: runtimeConfig } = useTenantRuntime();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);

  // Ancillary Popups
  const [isSeatSelectionOpen, setIsSeatSelectionOpen] = useState(false);
  const [isBaggageOpen, setIsBaggageOpen] = useState(false);
  const [isMealSelectionOpen, setIsMealSelectionOpen] = useState(false);
  const [isSpecialRequestOpen, setIsSpecialRequestOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const b = await getBookingById(id || "");
        setBooking(b as any);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading)
    return (
      <TripLogerLayout>
        <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] gap-2">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest animate-pulse">
              Retrieving Booking Details...
            </p>
          </div>
        </div>
      </TripLogerLayout>
    );

  if (!booking) return <div>No booking found</div>;

  // Tactical Status Logic
  const isTicketed =
    booking.status === "Ticketed" || booking.status === "Issued";
  const isLCC = booking.details?.isLCC || false; // Mock LCC logic persistence
  const allowedPaymentMethods = runtimeConfig.checkout.enforceSupplierWallet
    ? ["wallet"]
    : runtimeConfig.checkout.allowedPaymentMethods;
  const holdPaymentEnabled = allowedPaymentMethods.length > 0;
  const flight = booking.details?.flight || {
    route: "San Francisco (SFO) — Dubai (DXB)",
    segments: [
      {
        from: "SFO",
        to: "DXB",
        carrier: "Emirates",
        code: "EK226",
        date: "15 Feb",
        time: "11:30 AM - 7:00 PM",
        duration: "15h 30m",
        terminal: "4",
      },
    ],
  };

  return (
    <TripLogerLayout>
      <div
        className="bg-[hsl(var(--background))] min-h-screen pb-32 font-sans"
        data-testid="booking-detail-page"
      >
        {/* Header Banner */}
        <div className="bg-[hsl(var(--primary))] pt-32 pb-48 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--primary)/0.1)] to-transparent" />
          <div className="container mx-auto px-4 max-w-7xl relative z-10">
            <Button
              variant="outline"
              size="default"
              onClick={() => navigate("/bookings")}
              className="flex items-center gap-2 text-primary-foreground/50 hover:text-primary-foreground font-black text-[10px] uppercase tracking-[0.2em] mb-10 transition-colors group"
            >
              <ArrowLeft
                size={16}
                className="group-hover:-translate-x-1 transition-transform"
              />{" "}
              Back to Dashboard
            </Button>

            <div className="flex flex-col md:flex-row items-end justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`px-4 py-1.5 rounded-full border ${isTicketed ? "bg-green-500/10 border-green-500 text-green-400" : "bg-orange-500/10 border-orange-500 text-orange-400"} text-[10px] font-black uppercase tracking-widest`}
                  >
                    {booking.status}
                  </div>
                  <span className="text-[10px] font-black text-primary-foreground/40 uppercase tracking-widest">
                    Reference: {booking.reference || booking.bookingId}
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-primary-foreground tracking-tight leading-none">
                  {flight.route || "Flight Booking"}
                </h1>
                <div className="flex items-center gap-6 text-primary-foreground/60">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span className="text-xs font-bold">15 Feb 2026</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={14} />
                    <span className="text-xs font-bold">2 Passengers</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {isTicketed && (
                  <>
                    <Button
                      variant="default"
                      size="default"
                      className="h-12 px-6 rounded-xl bg-background/5 border border-border/10 text-primary-foreground font-black text-[10px] uppercase tracking-widest hover:bg-background/10 transition-all flex items-center gap-2"
                    >
                      <Download size={16} /> E-Ticket
                    </Button>
                    <Button
                      variant="default"
                      size="default"
                      className="h-12 px-6 rounded-xl bg-background/5 border border-border/10 text-primary-foreground font-black text-[10px] uppercase tracking-widest hover:bg-background/10 transition-all flex items-center gap-2"
                    >
                      <Printer size={16} /> Receipt
                    </Button>
                  </>
                )}
                {!isTicketed && (
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => {
                      if (!holdPaymentEnabled) {
                        return;
                      }
                      navigate("/booking-checkout", {
                        state: {
                          bookingId: booking.bookingId || booking.id || id,
                          isHoldPayment: true,
                        },
                      });
                    }}
                    disabled={!holdPaymentEnabled}
                    className="h-12 px-8 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-black text-[10px] uppercase tracking-widest hover:bg-[hsl(var(--primary)/0.9)] shadow-xl shadow-purple-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {holdPaymentEnabled
                      ? "Complete Payment"
                      : "Payment Disabled"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-7xl -mt-24 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-8 space-y-10">
              {/* Manage Services Card */}
              <div className="bg-card rounded-[2.5rem] p-10 shadow-sm border border-border relative overflow-hidden">
                <div className="flex items-center justify-between mb-8 gap-2">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-[hsl(var(--primary))] gap-2">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-foreground tracking-tight text-2xl font-semibold tracking-tight">
                        Manage Services
                      </h2>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Customize your journey
                      </p>
                    </div>
                  </div>
                  {isTicketed && (
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest bg-muted px-3 py-1 rounded-full">
                      modifications allowed
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() =>
                      runtimeConfig.features.seatSelectionEnabled &&
                      setIsSeatSelectionOpen(true)
                    }
                    data-testid="seat-selection-button"
                    disabled={!runtimeConfig.features.seatSelectionEnabled}
                    className="group p-6 rounded-[2rem] border-2 border-border hover:border-[hsl(var(--primary))] transition-all bg-card hover:shadow-xl flex flex-col items-center gap-4 text-center relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-[hsl(var(--primary))] group-hover:text-[hsl(var(--primary-foreground))] transition-all gap-2">
                      <Map size={24} />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest text-xl font-semibold tracking-tight">
                        Seats
                      </h3>
                      <p className="text-[9px] font-bold text-muted-foreground mt-1">
                        Select / Change
                      </p>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() =>
                      runtimeConfig.features.ancillariesEnabled &&
                      setIsBaggageOpen(true)
                    }
                    data-testid="baggage-modification-button"
                    disabled={!runtimeConfig.features.ancillariesEnabled}
                    className="group p-6 rounded-[2rem] border-2 border-border hover:border-[hsl(var(--primary))] transition-all bg-card hover:shadow-xl flex flex-col items-center gap-4 text-center relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-[hsl(var(--primary))] group-hover:text-[hsl(var(--primary-foreground))] transition-all gap-2">
                      <Luggage size={24} />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest text-xl font-semibold tracking-tight">
                        Baggage
                      </h3>
                      <p className="text-[9px] font-bold text-muted-foreground mt-1">
                        Add Extra Weight
                      </p>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() =>
                      runtimeConfig.features.ancillariesEnabled &&
                      setIsMealSelectionOpen(true)
                    }
                    disabled={!runtimeConfig.features.ancillariesEnabled}
                    className="group p-6 rounded-[2rem] border-2 border-border hover:border-[hsl(var(--primary))] transition-all bg-card hover:shadow-xl flex flex-col items-center gap-4 text-center relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-[hsl(var(--primary))] group-hover:text-[hsl(var(--primary-foreground))] transition-all gap-2">
                      <Utensils size={24} />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest text-xl font-semibold tracking-tight">
                        Meals
                      </h3>
                      <p className="text-[9px] font-bold text-muted-foreground mt-1">
                        Dietary Prefs
                      </p>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() =>
                      runtimeConfig.features.ancillariesEnabled &&
                      setIsSpecialRequestOpen(true)
                    }
                    disabled={!runtimeConfig.features.ancillariesEnabled}
                    className="group p-6 rounded-[2rem] border-2 border-border hover:border-[hsl(var(--primary))] transition-all bg-card hover:shadow-xl flex flex-col items-center gap-4 text-center relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-[hsl(var(--primary))] group-hover:text-[hsl(var(--primary-foreground))] transition-all gap-2">
                      <Heart size={24} />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest text-xl font-semibold tracking-tight">
                        Special RR
                      </h3>
                      <p className="text-[9px] font-bold text-muted-foreground mt-1">
                        Assistance
                      </p>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Flight Summary */}
              <div className="bg-card rounded-[2.5rem] p-10 shadow-sm border border-border">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 gap-2">
                    <Plane size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-foreground tracking-tight text-2xl font-semibold tracking-tight">
                      Flight Segments
                    </h2>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Journey Details
                    </p>
                  </div>
                </div>
                <div className="space-y-6">
                  {flight.segments?.map((seg: any, i: number) => (
                    <div
                      key={i}
                      className="bg-muted rounded-[2rem] p-8 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-background/50 to-transparent" />
                      <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-background rounded-xl shadow-sm flex items-center justify-center text-2xl font-black text-foreground gap-2">
                            {seg.carrier.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-foreground">
                              {seg.carrier}
                            </h3>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                              {seg.code} • Business Class
                            </p>
                          </div>
                        </div>
                        <div className="flex-1 flex items-center justify-center gap-8">
                          <div className="text-center">
                            <p className="text-2xl font-black text-foreground">
                              {seg.time.split(" - ")[0]}
                            </p>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                              {seg.from} T{seg.terminal || "1"}
                            </p>
                          </div>
                          <div className="flex flex-col items-center gap-2">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                              {seg.duration}
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-border" />
                              <div className="w-16 h-0.5 bg-border" />
                              <div className="w-2 h-2 rounded-full bg-border" />
                            </div>
                            <p className="text-[9px] font-black text-green-500 uppercase tracking-widest">
                              Confimed
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-black text-foreground">
                              {seg.time.split(" - ")[1]}
                            </p>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                              {seg.to}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar: Payment Summary */}
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-card rounded-[2.5rem] border border-border shadow-sm p-8 sticky top-32">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 gap-2">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-foreground tracking-tight uppercase text-xl font-semibold tracking-tight">
                        Payment Summary
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="flex justify-between items-center text-[10px] font-black text-muted-foreground uppercase tracking-widest gap-4">
                      <span>Base Fare</span>
                      <span className="text-foreground">
                        {formatCurrency(3220)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black text-muted-foreground uppercase tracking-widest gap-4">
                      <span>Taxes & Fees</span>
                      <span className="text-foreground">
                        {formatCurrency(240)}
                      </span>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-sm font-black text-foreground uppercase tracking-widest">
                        Total Paid
                      </span>
                      <span className="text-2xl font-black text-[hsl(var(--primary))] tracking-tighter">
                        {formatCurrency(booking.total?.amount || 0)}
                      </span>
                    </div>
                  </div>

                  {!isTicketed && (
                    <div className="bg-orange-50 rounded-2xl p-4 flex items-start gap-3">
                      <AlertCircle
                        size={16}
                        className="text-orange-500 mt-0.5 shrink-0"
                      />
                      <div>
                        <p className="text-[10px] font-black text-orange-700 uppercase tracking-widest mb-1">
                          Payment Required
                        </p>
                        <p className="text-[11px] font-bold text-orange-600/80 leading-relaxed">
                          This booking is currently on hold. Confirm your
                          payment to issue e-tickets.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
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
        onConfirm={() => setIsSeatSelectionOpen(false)}
      />
      <AdditionalBaggagePopup
        isOpen={isBaggageOpen}
        onClose={() => setIsBaggageOpen(false)}
        isLCC={isLCC}
        onConfirm={() => setIsBaggageOpen(false)}
      />
      <MealSelectionPopup
        isOpen={isMealSelectionOpen}
        onClose={() => setIsMealSelectionOpen(false)}
        isLCC={isLCC}
        onConfirm={() => setIsMealSelectionOpen(false)}
      />
      <SpecialRequestPopup
        isOpen={isSpecialRequestOpen}
        onClose={() => setIsSpecialRequestOpen(false)}
        onConfirm={() => setIsSpecialRequestOpen(false)}
      />
    </TripLogerLayout>
  );
}
