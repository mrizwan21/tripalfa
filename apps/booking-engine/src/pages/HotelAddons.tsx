import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { api, fetchAddonPrices } from '../lib/api';
import { formatCurrency } from '@tripalfa/ui-components';
import { BookingStepper } from '../components/ui/BookingStepper';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { useTenantRuntime } from '@/components/providers/TenantRuntimeProvider';

function HotelAddons() {
  const navigate = useNavigate();
  const { config: runtimeConfig } = useTenantRuntime();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const checkin = searchParams.get('checkin') || '';
  const checkout = searchParams.get('checkout') || '';
  const adults = searchParams.get('adults') || '2';
  const children = searchParams.get('children') || '0';
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
      .then(res => {
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
        console.warn('Failed to load addon prices:', error);
        setAddonPrices({});
      }
    };
    loadAddonPrices();
  }, []);

  if (loading)
    return (
      <TripLogerLayout>
        <div className="container mx-auto px-4 py-40 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#003b95] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </TripLogerLayout>
    );

  if (!runtimeConfig.features.hotelBookingEnabled) {
    return (
      <TripLogerLayout>
        <div className="container mx-auto px-4 py-40 flex flex-col items-center text-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Hotel Booking Disabled</h1>
          <p className="text-sm font-semibold text-gray-500 mb-6">
            Hotel booking is currently disabled by your admin settings.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-[#003b95] text-white rounded-lg px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-[#002a6e] transition-all duration-200"
          >
            Back to Home
          </button>
        </div>
      </TripLogerLayout>
    );
  }

  const hasAllRoomPrices = () => {
    if (!hotel || !hotel.rooms) return true;

    for (const [key, quantity] of Object.entries(selectedUnits)) {
      if (Number(quantity) <= 0) continue;
      const [roomId] = key.split('_');
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
      const [roomId] = key.split('_');
      const room = hotel.rooms.find((r: any) => r.id === roomId);
      if (room && room.originalPrice?.amount) {
        const price = room.originalPrice.amount;
        baseTotal += price * Number(quantity);
      }
    });

    if (addons.refundProtect) baseTotal += addonPrices['refundProtect'] ?? 0;
    if (addons.travelInsurance) baseTotal += addonPrices['travelInsurance'] ?? 0;
    return baseTotal;
  };

  return (
    <TripLogerLayout>
      <div className="bg-gray-50/50 min-h-screen pb-20 pt-32">
        {/* Stepper Restored at Top */}
        <BookingStepper currentStep={3} />

        <div className="container mx-auto px-4 max-w-6xl mt-10">
          {/* Top Info Bar */}
          <div className="bg-white text-gray-900 p-6 rounded-xl flex flex-wrap items-center gap-8 mb-10 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="w-24 h-16 rounded-xl overflow-hidden shadow-sm border border-gray-100 shrink-0">
              <img
                src={hotel?.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945'}
                className="w-full h-full object-cover"
                alt="Hotel"
              />
            </div>
            <div className="flex-1 min-w-[200px] gap-4">
              <h3 className="text-xl font-bold tracking-tight text-gray-900">
                {hotel?.name || 'Loading Hotel...'}
              </h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">
                {adults} Adult{Number(adults) > 1 ? 's' : ''} | {children} Child
                {Number(children) !== 1 ? 'ren' : ''}
              </p>
            </div>
            <div className="flex gap-10 text-xs font-bold uppercase tracking-wider border-l border-gray-100 pl-10">
              <div>
                <p className="text-gray-400 mb-1">Check-in</p>
                <p className="text-lg tracking-tight text-gray-900">
                  {checkin
                    ? new Date(checkin).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                      })
                    : 'TBD'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Check-out</p>
                <p className="text-lg tracking-tight text-gray-900">
                  {checkout
                    ? new Date(checkout).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                      })
                    : 'TBD'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-8 space-y-10">
              {/* Refund Protect Card - Only render if price is available */}
              {addonPrices['refundProtect'] !== undefined && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                  <div className="relative h-56">
                    <img
                      src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80"
                      className="w-full h-full object-cover"
                      alt="Refund Protect"
                    />
                    <div className="absolute inset-0 bg-blue-900/50 backdrop-blur-md flex items-center p-10">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center text-[#003b95] shadow-lg gap-2">
                          <ShieldCheck size={32} />
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold text-white tracking-tight">
                            Refund Protect
                          </h2>
                          <p className="text-blue-100 font-semibold text-xs mt-1 uppercase tracking-wider">
                            Worry-free booking experience
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-8 gap-4">
                      <div className="flex-1 pr-10 gap-4">
                        <p className="text-sm text-gray-600 leading-relaxed mb-6">
                          Receive a{' '}
                          <span className="text-[#003b95] font-bold">FULL refund</span>{' '}
                          if you cannot travel due to a reason listed in the T&C, including 100%
                          refundable booking security.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                          {[
                            'Sickness, accident or Injury',
                            'Unexpected Travel Disruption',
                            'Pre-existing medical conditions',
                            'Adverse weather conditions',
                          ].map((text, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 text-xs font-semibold text-gray-900"
                            >
                              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-700 shadow-sm shrink-0">
                                <Check size={12} strokeWidth={3} />
                              </div>
                              {text}
                            </div>
                          ))}
                        </div>
                      </div>
                      <span className="bg-[#003b95] text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm whitespace-nowrap">
                        Recommended
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-8 pt-6 border-t border-gray-100">
                      <div className="flex gap-4">
                        <button
                          onClick={() => setAddons(p => ({ ...p, refundProtect: true }))}
                          disabled={!runtimeConfig.features.ancillariesEnabled}
                          className={`flex items-center gap-3 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${addons.refundProtect ? 'bg-[#003b95] text-white shadow-md' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${addons.refundProtect ? 'border-white' : 'border-gray-300'}`}
                          >
                            {addons.refundProtect && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          Add to Cart
                        </button>
                        <button
                          onClick={() => setAddons(p => ({ ...p, refundProtect: false }))}
                          disabled={!runtimeConfig.features.ancillariesEnabled}
                          className={`flex items-center gap-3 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${!addons.refundProtect ? 'bg-gray-900 text-white' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${!addons.refundProtect ? 'border-white' : 'border-gray-300'}`}
                          >
                            {!addons.refundProtect && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          No thanks
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                          Additional Cost
                        </p>
                        {addonPrices['refundProtect'] !== undefined ? (
                          <p className="text-2xl font-bold text-[#1d1d1f] tracking-tight">
                            {formatCurrency(addonPrices['refundProtect'], 'SAR')}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">Price unavailable</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Travel Insurance Card - Only render if price is available */}
              {addonPrices['travelInsurance'] !== undefined && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                  <div className="relative h-56">
                    <img
                      src="https://images.unsplash.com/photo-1544006659-f0b21f04cb1d?auto=format&fit=crop&q=80"
                      className="w-full h-full object-cover"
                      alt="Travel Insurance"
                    />
                    <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-md flex items-center p-10">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center text-white shadow-lg gap-2">
                          <Heart size={32} className="fill-current" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold text-white tracking-tight">
                            Travel Insurance
                          </h2>
                          <p className="text-indigo-100 font-semibold text-xs mt-1 uppercase tracking-wider">
                            Global coverage & medical support
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-8">
                    <p className="text-sm text-gray-600 mb-8 leading-relaxed">
                      Travel Insurance will provide you with the peace of mind in case of any
                      unexpected eventualities, including{' '}
                      <span className="text-[#003b95] font-bold">
                        24/7 global medical assistance
                      </span>
                      .
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-8 pt-6 border-t border-gray-100">
                      <div className="flex gap-4">
                        <button
                          onClick={() => setAddons(p => ({ ...p, travelInsurance: true }))}
                          disabled={!runtimeConfig.features.ancillariesEnabled}
                          className={`flex items-center gap-3 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${addons.travelInsurance ? 'bg-[#003b95] text-white shadow-md' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${addons.travelInsurance ? 'border-white' : 'border-gray-300'}`}
                          >
                            {addons.travelInsurance && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          Add to Cart
                        </button>
                        <button
                          onClick={() => setAddons(p => ({ ...p, travelInsurance: false }))}
                          disabled={!runtimeConfig.features.ancillariesEnabled}
                          className={`flex items-center gap-3 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${!addons.travelInsurance ? 'bg-gray-900 text-white' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${!addons.travelInsurance ? 'border-white' : 'border-gray-300'}`}
                          >
                            {!addons.travelInsurance && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          No thanks
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                          Additional Cost
                        </p>
                        {addonPrices['travelInsurance'] !== undefined ? (
                          <p className="text-2xl font-bold text-[#1d1d1f] tracking-tight">
                            {formatCurrency(addonPrices['travelInsurance'], 'SAR')}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">Price unavailable</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-4 space-y-8 sticky top-32">
              {/* Premium Fare Summary */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#003b95]"></div>
                <h3 className="text-sm font-bold text-[#003b95] uppercase tracking-wider mb-6 flex items-center gap-3">
                  <Sparkles className="text-[#003b95]" size={20} />
                  Booking Summary
                </h3>

                <div className="space-y-4">
                  {/* Room Selection */}
                  <div className="group p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#003b95] shrink-0">
                        <CreditCard size={18} />
                      </div>
                      <div className="w-full">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                          Accommodation
                        </p>
                        <div className="flex justify-between items-baseline gap-4 w-full">
                          <div>
                            {Object.entries(selectedUnits).map(([key, qty]) => {
                              if (Number(qty) <= 0) return null;
                              const [roomId] = key.split('_');
                              const room = hotel?.rooms?.find((r: any) => r.id === roomId);
                              const hasPrice = room?.originalPrice?.amount;
                              return (
                                <p
                                  key={key}
                                  className="text-sm font-bold text-gray-900 leading-tight mb-1 last:mb-0 flex items-center justify-between gap-2"
                                >
                                  <span>
                                    {qty} × {room?.name || 'Room'}
                                  </span>
                                  {!hasPrice && (
                                    <span className="text-xs font-medium text-orange-600 ml-2">
                                      Price on request
                                    </span>
                                  )}
                                </p>
                              );
                            })}
                          </div>
                          {!hasAllRoomPrices() ? (
                            <p className="text-sm font-bold text-orange-600">Price on Request</p>
                          ) : (
                            <p className="text-sm font-bold text-gray-900">
                              {formatCurrency(
                                calculateTotal() -
                                  (addons.refundProtect ? (addonPrices['refundProtect'] ?? 0) : 0) -
                                  (addons.travelInsurance
                                    ? (addonPrices['travelInsurance'] ?? 0)
                                    : 0)
                              )}
                            </p>
                          )}
                        </div>
                        <span className="inline-block mt-2 px-2.5 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                          Taxes Included
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Add-ons */}
                  <div className="group p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#003b95] shrink-0">
                        <ShieldCheck size={18} />
                      </div>
                      <div className="w-full">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                          Extras
                        </p>
                        {addons.travelInsurance || addons.refundProtect ? (
                          <div className="space-y-1.5">
                            {addons.refundProtect && (
                              <div className="flex justify-between text-xs font-bold text-gray-900 gap-4">
                                <span>Refund Protect</span>
                                <span>
                                  {addonPrices['refundProtect'] !== undefined
                                    ? formatCurrency(addonPrices['refundProtect'], 'SAR')
                                    : 'Price pending'}
                                </span>
                              </div>
                            )}
                            {addons.travelInsurance && (
                              <div className="flex justify-between text-xs font-bold text-gray-900 gap-4">
                                <span>Travel Insurance</span>
                                <span>
                                  {addonPrices['travelInsurance'] !== undefined
                                    ? formatCurrency(addonPrices['travelInsurance'], 'SAR')
                                    : 'Price pending'}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs font-medium text-gray-500 italic">
                            No add-ons selected
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="my-6 border-t border-dashed border-gray-200"></div>

                  {/* Total */}
                  <div className="flex justify-between items-end gap-4">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Total Payable
                    </span>
                    {!hasAllRoomPrices() ? (
                      <span className="text-lg font-bold text-orange-600 tracking-tight">
                        Price on Request
                      </span>
                    ) : (
                      <span className="text-2xl font-bold text-[#1d1d1f] tracking-tight">
                        {formatCurrency(calculateTotal())}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Loyalty Program Input (New Request) */}
              <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-full -mr-10 -mt-10"></div>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Diamond size={14} className="text-[#003b95]" />
                  Loyalty Program
                </h4>
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 font-medium leading-tight">
                    Enter your membership number to earn points and unlock exclusive perks.
                  </p>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Membership Number"
                      className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 hover:border-gray-300 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/10"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center shadow-sm text-gray-400">
                      <User size={12} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Promotional Code */}
              <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Tag size={14} className="text-[#003b95]" />
                  Promo Code
                </h4>
                <div className="flex gap-2">
                  <input
                    id="hotel-voucher-code"
                    name="hotel-voucher-code"
                    type="text"
                    placeholder="Voucher Code"
                    className="flex-1 h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 hover:border-gray-300 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/10 uppercase placeholder:normal-case"
                  />
                  <button className="h-12 px-5 bg-gray-900 text-white rounded-lg font-semibold text-sm hover:bg-gray-700 transition-colors">
                    Apply
                  </button>
                </div>
              </div>

              <button
                disabled={!hasAllRoomPrices()}
                className="w-full h-16 bg-[#003b95] hover:bg-[#002a6e] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed font-semibold text-sm text-white shadow-md rounded-lg flex items-center justify-center gap-3 transition-all duration-200"
                onClick={() => {
                  const total = calculateTotal();
                  const accommodationPrice =
                    total -
                    (addons.refundProtect ? (addonPrices['refundProtect'] ?? 0) : 0) -
                    (addons.travelInsurance ? (addonPrices['travelInsurance'] ?? 0) : 0);
                  const bookingState = {
                    type: 'hotel',
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
                {!hasAllRoomPrices() ? 'Request Pricing' : 'Continue to Guests'}{' '}
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </TripLogerLayout>
  );
}

export default HotelAddons;
