import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  Car,
  Utensils,
  Star,
  Info,
  ArrowRight,
  ArrowLeft,
  Clock,
  PartyPopper,
  ShieldCheck,
  Heart,
  User,
  Calendar,
  CreditCard,
  Check,
  ChevronRight,
  Calculator,
  Diamond,
  Tag,
  Sparkles,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { api, fetchAddonPrices } from "../lib/api";
import { formatCurrency } from "@tripalfa/ui-components";
import { BookingStepper } from "../components/ui/BookingStepper";
import { TripLogerLayout } from "../components/layout/TripLogerLayout";
import { useTenantRuntime } from "@/components/providers/TenantRuntimeProvider";

export default function HotelAddons() {
  const navigate = useNavigate();
  const { config: runtimeConfig } = useTenantRuntime();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const checkin = searchParams.get("checkin") || "";
  const checkout = searchParams.get("checkout") || "";
  const adults = searchParams.get("adults") || "2";
  const children = searchParams.get("children") || "0";
  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addonPrices, setAddonPrices] = useState<Record<string, number>>({});

  const [addons, setAddons] = useState({
    refundProtect: false,
    travelInsurance: false,
  });

  const location = useLocation();
  const stateHotel = location.state?.hotel;
  const selectedUnits = location.state?.selectedUnits || {};

  React.useEffect(() => {
    if (stateHotel) {
      setHotel(stateHotel);
      setLoading(false);
      return;
    }
    if (!id) return;
    api
      .get(`/hotels/${id}`)
      .then((res) => {
        setHotel(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, stateHotel]);

  // Fetch addon prices from backend
  useEffect(() => {
    const loadAddonPrices = async () => {
      try {
        const prices = await fetchAddonPrices();
        setAddonPrices(prices);
      } catch (error) {
        console.warn("Failed to load addon prices:", error);
        setAddonPrices({});
      }
    };
    loadAddonPrices();
  }, []);

  if (loading)
    return (
      <TripLogerLayout>
        <div className="container mx-auto px-4 py-40 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </TripLogerLayout>
    );

  if (!runtimeConfig.features.hotelBookingEnabled) {
    return (
      <TripLogerLayout>
        <div className="container mx-auto px-4 py-40 flex flex-col items-center text-center gap-4">
          <h1 className="text-3xl font-black text-foreground mb-3">
            Hotel Booking Disabled
          </h1>
          <p className="text-sm font-bold text-muted-foreground mb-6">
            Hotel booking is currently disabled by your admin settings.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate("/")}
            className="h-11 px-6"
          >
            Back to Home
          </Button>
        </div>
      </TripLogerLayout>
    );
  }

  const hasAllRoomPrices = () => {
    if (!hotel || !hotel.rooms) return true;

    for (const [key, quantity] of Object.entries(selectedUnits)) {
      if (Number(quantity) <= 0) continue;
      const [roomId] = key.split("_");
      const room = hotel.rooms.find((r: any) => r.id === roomId);
      if (!room?.originalPrice?.amount) {
        return false;
      }
    }
    return true;
  };

  const calculateTotal = () => {
    if (!hotel || !hotel.rooms) return 0;
    let baseTotal = 0;

    // Calculate room totals from selectedUnits
    Object.entries(selectedUnits).forEach(([key, quantity]) => {
      if (Number(quantity) <= 0) return;
      // key is format room.id_rate
      const [roomId] = key.split("_");
      const room = hotel.rooms.find((r: any) => r.id === roomId);
      if (room && room.originalPrice?.amount) {
        const price = room.originalPrice.amount;
        baseTotal += price * Number(quantity);
      }
    });

    if (addons.refundProtect) baseTotal += addonPrices["refundProtect"] ?? 0;
    if (addons.travelInsurance)
      baseTotal += addonPrices["travelInsurance"] ?? 0;
    return baseTotal;
  };

  return (
    <TripLogerLayout>
      <div className="bg-[hsl(var(--background))] min-h-screen pb-20 pt-32">
        {/* Stepper Restored at Top */}
        <BookingStepper currentStep={3} />

        <div className="container mx-auto px-4 max-w-6xl mt-10">
          {/* Top Info Bar */}
          <div className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] p-6 rounded-[2rem] flex flex-wrap items-center gap-8 mb-10 shadow-2xl relative overflow-hidden ring-1 ring-border/10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-background/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="w-24 h-16 rounded-2xl overflow-hidden shadow-xl border-2 border-border/10 shrink-0">
              <img
                src={
                  hotel?.image ||
                  "https://images.unsplash.com/photo-1566073771259-6a8506099945"
                }
                className="w-full h-full object-cover"
                alt="Hotel"
              />
            </div>
            <div className="flex-1 min-w-[200px] gap-4">
              <h3 className="text-xl font-black tracking-tight">
                {hotel?.name || "Loading Hotel..."}
              </h3>
              <p className="text-[10px] text-primary-foreground/60 font-bold uppercase tracking-[0.2em] mt-1">
                {adults} Adult{Number(adults) > 1 ? "s" : ""} | {children} Child
                {Number(children) !== 1 ? "ren" : ""}
              </p>
            </div>
            <div className="flex gap-10 text-[10px] font-black uppercase tracking-widest border-l border-border/10 pl-10">
              <div>
                <p className="text-primary-foreground/60 mb-1">Check-in</p>
                <p className="text-lg tracking-tight text-primary-foreground">
                  {checkin
                    ? new Date(checkin).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })
                    : "TBD"}
                </p>
              </div>
              <div>
                <p className="text-primary-foreground/60 mb-1">Check-out</p>
                <p className="text-lg tracking-tight text-primary-foreground">
                  {checkout
                    ? new Date(checkout).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })
                    : "TBD"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-8 space-y-10">
              {/* Refund Protect Card - Only render if price is available */}
              {addonPrices["refundProtect"] !== undefined && (
                <Card className="overflow-hidden border-none shadow-xl rounded-[2.5rem] bg-card group hover:shadow-2xl transition-all duration-500">
                  <div className="relative h-56">
                    <img
                      src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80"
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      alt="Refund Protect"
                    />
                    <div className="absolute inset-0 bg-blue-900/50 backdrop-blur-md flex items-center p-10 gap-2">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-[hsl(var(--primary))] rounded-2xl flex items-center justify-center text-[hsl(var(--primary-foreground))] shadow-2xl border-4 border-border/20 gap-2">
                          <ShieldCheck size={32} />
                        </div>
                        <div>
                          <h2 className="text-3xl font-black text-primary-foreground drop-shadow-2xl tracking-tighter">
                            Refund Protect
                          </h2>
                          <p className="text-blue-100 font-bold text-xs mt-1 uppercase tracking-widest">
                            Worry-free booking experience
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-10">
                    <div className="flex justify-between items-start mb-8 gap-4">
                      <div className="flex-1 pr-10 gap-4">
                        <p className="text-muted-foreground font-medium text-sm leading-relaxed mb-6">
                          Receive a{" "}
                          <span className="text-[hsl(var(--primary))] font-black">
                            FULL refund
                          </span>{" "}
                          if you cannot travel due to a reason listed in the
                          T&C, including 100% refundable booking security.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                          {[
                            "Sickness, accident or Injury",
                            "Unexpected Travel Disruption",
                            "Pre-existing medical conditions",
                            "Adverse weather conditions",
                          ].map((text, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 text-xs font-bold text-foreground"
                            >
                              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 shadow-sm shrink-0 gap-2">
                                <Check size={12} strokeWidth={4} />
                              </div>
                              {text}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-[hsl(var(--secondary))] px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-yellow-200/50 text-[hsl(var(--secondary-foreground))]">
                        Recommended
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-8 pt-6 border-t border-dashed border-border">
                      <div className="flex gap-4">
                        <Button
                          variant="outline"
                          size="md"
                          onClick={() =>
                            setAddons((p) => ({ ...p, refundProtect: true }))
                          }
                          disabled={!runtimeConfig.features.ancillariesEnabled}
                          className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 font-black text-[9px] uppercase tracking-widest transition-all focus:scale-95 ${addons.refundProtect ? "bg-[hsl(var(--primary))] border-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-xl shadow-indigo-200" : "bg-background border-border text-muted-foreground hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]"}`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${addons.refundProtect ? "border-background" : "border-border"}`}
                          >
                            {addons.refundProtect && (
                              <div className="w-2 h-2 rounded-full bg-background" />
                            )}
                          </div>
                          Add to Cart
                        </Button>
                        <Button
                          variant="outline"
                          size="md"
                          onClick={() =>
                            setAddons((p) => ({ ...p, refundProtect: false }))
                          }
                          disabled={!runtimeConfig.features.ancillariesEnabled}
                          className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 font-black text-[9px] uppercase tracking-widest transition-all focus:scale-95 ${!addons.refundProtect ? "bg-muted border-muted text-foreground" : "bg-background border-border text-muted-foreground hover:border-border"}`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${!addons.refundProtect ? "border-foreground" : "border-border"}`}
                          >
                            {!addons.refundProtect && (
                              <div className="w-2 h-2 rounded-full bg-foreground" />
                            )}
                          </div>
                          No thanks
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-0.5">
                          Additional Cost
                        </p>
                        {addonPrices["refundProtect"] !== undefined ? (
                          <p className="text-xl font-black text-[hsl(var(--primary))] tracking-tighter">
                            {formatCurrency(
                              addonPrices["refundProtect"],
                              "SAR",
                            )}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Price unavailable
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Travel Insurance Card - Only render if price is available */}
              {addonPrices["travelInsurance"] !== undefined && (
                <Card className="overflow-hidden border-none shadow-xl rounded-[2.5rem] bg-card group hover:shadow-2xl transition-all duration-500">
                  <div className="relative h-56">
                    <img
                      src="https://images.unsplash.com/photo-1544006659-f0b21f04cb1d?auto=format&fit=crop&q=80"
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      alt="Travel Insurance"
                    />
                    <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-md flex items-center p-10 gap-2">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-background/20 backdrop-blur-xl rounded-2xl flex items-center justify-center text-primary-foreground shadow-2xl border-4 border-border/30 gap-2">
                          <Heart size={32} className="fill-current" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-black text-primary-foreground drop-shadow-2xl tracking-tighter">
                            Travel Insurance
                          </h2>
                          <p className="text-indigo-100 font-bold text-xs mt-1 uppercase tracking-widest">
                            Global coverage & medical support
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-10">
                    <p className="text-muted-foreground font-medium text-sm mb-8 leading-relaxed">
                      Travel Insurance will provide you with the peace of mind
                      in case of any unexpected eventualities, including{" "}
                      <span className="text-indigo-600 font-black">
                        24/7 global medical assistance
                      </span>
                      .
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-8 pt-6 border-t border-dashed border-border">
                      <div className="flex gap-4">
                        <Button
                          variant="outline"
                          size="md"
                          onClick={() =>
                            setAddons((p) => ({ ...p, travelInsurance: true }))
                          }
                          disabled={!runtimeConfig.features.ancillariesEnabled}
                          className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 font-black text-[9px] uppercase tracking-widest transition-all focus:scale-95 ${addons.travelInsurance ? "bg-[hsl(var(--primary))] border-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-xl shadow-indigo-200" : "bg-background border-border text-muted-foreground hover:border-[hsl(var(--primary))]"}`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${addons.travelInsurance ? "border-background" : "border-border"}`}
                          >
                            {addons.travelInsurance && (
                              <div className="w-2 h-2 rounded-full bg-background" />
                            )}
                          </div>
                          Add to Cart
                        </Button>
                        <Button
                          variant="outline"
                          size="md"
                          onClick={() =>
                            setAddons((p) => ({ ...p, travelInsurance: false }))
                          }
                          disabled={!runtimeConfig.features.ancillariesEnabled}
                          className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 font-black text-[9px] uppercase tracking-widest transition-all focus:scale-95 ${!addons.travelInsurance ? "bg-muted border-muted text-foreground" : "bg-background border-border text-muted-foreground hover:border-border"}`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${!addons.travelInsurance ? "border-foreground" : "border-border"}`}
                          >
                            {!addons.travelInsurance && (
                              <div className="w-2 h-2 rounded-full bg-foreground" />
                            )}
                          </div>
                          No thanks
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-0.5">
                          Additional Cost
                        </p>
                        {addonPrices["travelInsurance"] !== undefined ? (
                          <p className="text-xl font-black text-[hsl(var(--primary))] tracking-tighter">
                            {formatCurrency(
                              addonPrices["travelInsurance"],
                              "SAR",
                            )}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Price unavailable
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            <div className="lg:col-span-4 space-y-8 sticky top-32">
              {/* Premium Fare Summary */}
              <div className="bg-background/70 backdrop-blur-2xl border border-border/50 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-8 relative overflow-hidden ring-1 ring-border">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[hsl(var(--primary))] via-purple-500 to-pink-500"></div>
                <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-foreground">
                  <Sparkles className="text-[hsl(var(--primary))]" size={20} />
                  Booking Summary
                </h3>

                <div className="space-y-6">
                  {/* Room Selection */}
                  <div className="group p-4 rounded-2xl bg-background border border-border shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[hsl(var(--primary))] shrink-0 gap-2">
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                          Accommodation
                        </p>
                        <div className="flex justify-between items-baseline gap-4 w-full">
                          <div>
                            {Object.entries(selectedUnits).map(([key, qty]) => {
                              if (Number(qty) <= 0) return null;
                              const [roomId] = key.split("_");
                              const room = hotel?.rooms?.find(
                                (r: any) => r.id === roomId,
                              );
                              const hasPrice = room?.originalPrice?.amount;
                              return (
                                <p
                                  key={key}
                                  className="text-sm font-bold text-foreground leading-tight mb-1 last:mb-0 flex items-center justify-between gap-2"
                                >
                                  <span>
                                    {qty} × {room?.name || "Room"}
                                  </span>
                                  {!hasPrice && (
                                    <span className="text-[10px] font-medium text-orange-600 ml-2">
                                      Price on request
                                    </span>
                                  )}
                                </p>
                              );
                            })}
                          </div>
                          {!hasAllRoomPrices() ? (
                            <p className="text-sm font-black text-orange-600">
                              Price on Request
                            </p>
                          ) : (
                            <p className="text-sm font-black text-foreground">
                              {formatCurrency(
                                calculateTotal() -
                                  (addons.refundProtect
                                    ? (addonPrices["refundProtect"] ?? 0)
                                    : 0) -
                                  (addons.travelInsurance
                                    ? (addonPrices["travelInsurance"] ?? 0)
                                    : 0),
                              )}
                            </p>
                          )}
                        </div>
                        <span className="inline-block mt-2 px-2 py-0.5 bg-green-50 text-green-600 text-[9px] font-black rounded uppercase tracking-wider">
                          Taxes Included
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Add-ons */}
                  <div className="group p-4 rounded-2xl bg-background border border-border shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0 gap-2">
                        <ShieldCheck size={18} />
                      </div>
                      <div className="w-full">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                          Extras
                        </p>
                        {addons.travelInsurance || addons.refundProtect ? (
                          <div className="space-y-1.5">
                            {addons.refundProtect && (
                              <div className="flex justify-between text-xs font-bold text-foreground gap-4">
                                <span>Refund Protect</span>
                                <span>
                                  {addonPrices["refundProtect"] !== undefined
                                    ? formatCurrency(
                                        addonPrices["refundProtect"],
                                        "SAR",
                                      )
                                    : "Price pending"}
                                </span>
                              </div>
                            )}
                            {addons.travelInsurance && (
                              <div className="flex justify-between text-xs font-bold text-foreground gap-4">
                                <span>Travel Insurance</span>
                                <span>
                                  {addonPrices["travelInsurance"] !== undefined
                                    ? formatCurrency(
                                        addonPrices["travelInsurance"],
                                        "SAR",
                                      )
                                    : "Price pending"}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs font-medium text-muted-foreground italic">
                            No add-ons selected
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="my-6 border-t border-dashed border-border"></div>

                  {/* Total */}
                  <div className="flex justify-between items-end gap-4">
                    <span className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">
                      Total Payable
                    </span>
                    {!hasAllRoomPrices() ? (
                      <span className="text-lg font-black text-orange-600 tracking-tighter">
                        Price on Request
                      </span>
                    ) : (
                      <span className="text-3xl font-black text-[hsl(var(--primary))] tracking-tighter">
                        {formatCurrency(calculateTotal())}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Loyalty Program Input (New Request) */}
              <div className="bg-background rounded-[2.5rem] p-8 shadow-xl border border-border relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-20 h-20 bg-[hsl(var(--secondary)/0.1)] rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
                <h4 className="text-xs font-black text-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Diamond
                    size={14}
                    className="text-[hsl(var(--secondary))] fill-current"
                  />
                  Loyalty Program
                </h4>
                <div className="space-y-4">
                  <p className="text-[10px] text-muted-foreground font-medium leading-tight">
                    Enter your membership number to earn points and unlock
                    exclusive perks.
                  </p>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Membership Number"
                      className="w-full h-12 bg-muted border border-border px-4 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:bg-background transition-all placeholder:text-muted-foreground"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-background rounded-full flex items-center justify-center shadow-sm text-muted-foreground gap-2">
                      <User size={12} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Promotional Code */}
              <div className="bg-background rounded-[2.5rem] p-8 shadow-xl border border-border group">
                <h4 className="text-xs font-black text-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Tag size={14} className="text-[hsl(var(--primary))]" />
                  Promo Code
                </h4>
                <div className="flex gap-2">
                  <input
                    id="hotel-voucher-code"
                    name="hotel-voucher-code"
                    type="text"
                    placeholder="Voucher Code"
                    className="flex-1 h-12 bg-muted border border-border px-4 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all uppercase placeholder:normal-case gap-4"
                  />
                  <Button
                    variant="outline"
                    size="md"
                    className="h-12 px-5 bg-foreground text-background rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-foreground/90 transition-colors"
                  >
                    Apply
                  </Button>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={!hasAllRoomPrices()}
                className="w-full h-16 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)] disabled:bg-muted disabled:cursor-not-allowed font-black text-xs text-[hsl(var(--primary-foreground))] shadow-[0_20px_40px_-10px_rgba(99,102,241,0.5)] rounded-[2rem] uppercase tracking-widest flex items-center justify-center gap-3 transition-all scale-95 hover:scale-100 active:scale-90"
                onClick={() => {
                  const total = calculateTotal();
                  const accommodationPrice =
                    total -
                    (addons.refundProtect
                      ? (addonPrices["refundProtect"] ?? 0)
                      : 0) -
                    (addons.travelInsurance
                      ? (addonPrices["travelInsurance"] ?? 0)
                      : 0);
                  const bookingState = {
                    type: "hotel",
                    summary: {
                      hotel: hotel,
                      accommodation: {
                        selectedUnits,
                        price: accommodationPrice,
                      },
                      totals: {
                        final: total,
                      },
                    },
                    addOns: addons,
                    addonPrices: addonPrices,
                  };
                  navigate(`/passenger-details?type=hotel&id=${id}`, {
                    state: bookingState,
                  });
                }}
              >
                {!hasAllRoomPrices() ? "Request Pricing" : "Continue to Guests"}{" "}
                <ArrowRight size={20} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </TripLogerLayout>
  );
}
