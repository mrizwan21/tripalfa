import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  Plane, ArrowLeft, Clock, Luggage, ShieldCheck,
  Info, ChevronRight, Check, AlertCircle, Share2,
  Heart, MapPin, Calendar, Users, Loader2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { fetchFlightById } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { FareCard } from '../components/flight/FareCard';

export default function FlightDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

  const [flight, setFlight] = useState<any>(location.state?.flight || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('segments');

  useEffect(() => {
    // If flight data passed via state, usage that. Otherwise fetch by ID.
    if (!flight && id) {
      setLoading(true);
      fetchFlightById(id)
        .then(res => {
          setFlight(res);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setError('Failed to load flight details');
          setLoading(false);
        });
    }
  }, [id, flight]);

  if (loading) {
    return (
      <TripLogerLayout>
        <div className="flex flex-col items-center justify-center min-h-screen pb-32">
          <Loader2 size={48} className="text-[#8B5CF6] animate-spin mb-4" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Flight Details...</p>
        </div>
      </TripLogerLayout>
    );
  }

  if (error || (!flight && !loading)) {
    return (
      <TripLogerLayout>
        <div className="flex flex-col items-center justify-center min-h-screen pb-32">
          <h2 className="text-2xl font-black text-gray-900 mb-2">Flight Not Found</h2>
          <p className="text-gray-500 mb-6">We couldn't find the flight details you requested.</p>
          <Button onClick={() => navigate('/flights')} className="bg-[#8B5CF6] text-white rounded-xl px-6 py-3 font-bold uppercase tracking-widest text-xs shadow-lg shadow-purple-100 hover:bg-[#7C3AED]">
            Back to Search
          </Button>
        </div>
      </TripLogerLayout>
    );
  }

  return (
    <TripLogerLayout>
      <div className="bg-[#F8F9FA] min-h-screen pb-32 font-sans">
        {/* Elite Header */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
          <div className="container mx-auto px-4 max-w-7xl h-20 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate(-1)}
                className="w-12 h-12 rounded-2xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#8B5CF6] hover:border-[#8B5CF6] transition-all"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-sm font-black text-gray-900 uppercase tracking-widest">{flight.origin} to {flight.destination}</h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                  {flight.airline} • {flight.flightNumber} • {flight.cabin}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="w-12 h-12 rounded-2xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#8B5CF6] transition-all">
                <Share2 size={18} />
              </button>
              <button className="w-12 h-12 rounded-2xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                <Heart size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-7xl mt-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Main Content */}
            <div className="lg:col-span-8 space-y-8">
              {/* Tabs */}
              <div className="flex items-center gap-8 border-b border-gray-100">
                {['segments', 'baggage', 'rules', 'policies'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === tab ? 'text-[#8B5CF6]' : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#8B5CF6]" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 p-10">
                {activeTab === 'segments' && (
                  <div className="space-y-12">
                    {flight.segments?.map((segment: any, idx: number) => (
                      <div key={idx} className="relative">
                        {idx > 0 && (
                          <div className="absolute -top-10 left-6 h-8 border-l-2 border-dashed border-gray-200" />
                        )}
                        <div className="flex gap-10">
                          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
                            <Plane className={idx % 2 === 0 ? '-rotate-45' : 'rotate-45'} size={20} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-6">
                              <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">{segment.from} → {segment.to}</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Flight Leg {idx + 1}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-black text-[#8B5CF6] uppercase tracking-widest px-3 py-1 bg-purple-50 rounded-full">Confirmed</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-10">
                              <div className="space-y-4">
                                <div className="flex gap-4">
                                  <Clock className="text-gray-300" size={16} />
                                  <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Departure</p>
                                    <p className="text-sm font-bold text-gray-900">{new Date(segment.depart).toLocaleString()}</p>
                                  </div>
                                </div>
                                <div className="flex gap-4">
                                  <MapPin className="text-gray-300" size={16} />
                                  <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Arrival</p>
                                    <p className="text-sm font-bold text-gray-900">{new Date(segment.arrive).toLocaleString()}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div className="flex gap-4">
                                  <Users className="text-gray-300" size={16} />
                                  <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aircraft</p>
                                    <p className="text-sm font-bold text-gray-900">Boeing 787 Dreamliner</p>
                                  </div>
                                </div>
                                <div className="flex gap-4">
                                  <ShieldCheck className="text-gray-300" size={16} />
                                  <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Operator</p>
                                    <p className="text-sm font-bold text-gray-900">{flight.airline}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'baggage' && (
                  <div className="space-y-8">
                    <div className="flex items-start gap-6 p-8 bg-gray-50 rounded-3xl border border-gray-100">
                      <div className="p-4 bg-white rounded-2xl shadow-sm">
                        <Luggage className="text-[#8B5CF6]" size={32} />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-gray-900 mb-2">Check-in Baggage</h4>
                        <p className="text-sm font-bold text-gray-500 leading-relaxed">
                          Your fare include {flight.includedBags?.[0]?.quantity} bags ({flight.includedBags?.[0]?.weight}{flight.includedBags?.[0]?.unit} each).
                          Maximum dimensions: 158cm (length + width + height).
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-6 p-8 border border-gray-100 rounded-3xl">
                      <div className="p-4 bg-gray-50 rounded-2xl">
                        <ShieldCheck className="text-gray-400" size={32} />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-gray-900 mb-2">Cabin Baggage</h4>
                        <p className="text-sm font-bold text-gray-500 leading-relaxed">
                          1 piece of 7kg (55 x 35 x 25 cm) plus one small personal item (laptop bag or handbag).
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'rules' && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-black text-gray-900">Fare Rules & Conditions</h4>
                    <div className="space-y-4">
                      {[
                        'Cancellations are subject to a fee of $150 per passenger.',
                        'Changes allowed up to 24 hours before departure for a $100 fee.',
                        'Name changes are not permitted after ticket issuance.',
                        'No-show fee: $250 plus fare difference.',
                        'Partially used tickets are non-refundable.'
                      ].map((rule, i) => (
                        <div key={i} className="flex gap-4 items-start">
                          <AlertCircle size={16} className="text-[#8B5CF6] mt-1 shrink-0" />
                          <p className="text-sm font-bold text-gray-500">{rule}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Summary */}
            <div className="lg:col-span-4">
              <FareCard
                amount={flight.amount}
                currency="SAR"
                onSelect={() => navigate(`/flights/addons?id=${flight.id}`)}
              />
            </div>
          </div>
        </div>
      </div>
    </TripLogerLayout>
  );
}
