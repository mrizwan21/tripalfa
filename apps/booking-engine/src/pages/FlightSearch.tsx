import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Plane, ArrowRight, Clock, Calendar, ChevronDown, Luggage, ShieldCheck, Star, ArrowLeft } from 'lucide-react';
import { searchFlights } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';

export default function FlightSearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [flights, setFlights] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Get search params
  const origin = searchParams.get('origin') || 'NYC';
  const destination = searchParams.get('destination') || 'LON';
  const departureDate = searchParams.get('departureDate') || new Date().toISOString().split('T')[0];
  const returnDate = searchParams.get('returnDate');
  const travelers = searchParams.get('travelers') || '1';
  const cabinClass = searchParams.get('cabinClass') || 'Economy';

  useEffect(() => {
    const fetchFlights = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await searchFlights({
          origin,
          destination,
          departureDate,
          returnDate,
          adults: parseInt(travelers),
          cabinClass: cabinClass.toUpperCase()
        });
        setFlights(results);
      } catch (error) {
        console.error('Failed to fetch flights:', error);
        setError('Failed to find flights for this route. Please try another search.');
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [origin, destination, departureDate, returnDate, travelers, cabinClass]);

  return (
    <TripLogerLayout>
      <div className="bg-[#F8F9FA] min-h-screen pb-20 font-sans">
        {/* Elite Search Header */}
        <div className="bg-white border-b border-gray-100 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-purple-50/50 to-transparent pointer-events-none" />
          <div className="container mx-auto px-4 max-w-7xl pt-12 pb-10 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate('/')} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                    <ArrowLeft size={16} className="text-gray-400" />
                  </button>
                  <div className="w-8 h-8 rounded-xl bg-[#8B5CF6] flex items-center justify-center text-white shadow-lg shadow-purple-100">
                    <Plane size={16} />
                  </div>
                  <h1 className="text-[10px] font-black text-[#8B5CF6] uppercase tracking-[0.3em]">Available Itineraries</h1>
                </div>
                <div className="flex items-center gap-6">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter">{origin}</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Origin</p>
                  </div>
                  <ArrowRight className="text-gray-300 mb-4" size={24} strokeWidth={3} />
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter">{destination}</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Destination</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 bg-gray-50/50 p-2 rounded-2xl border border-gray-100">
                <div className="px-4 py-2 border-r border-gray-200">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Departure</p>
                  <p className="text-[11px] font-bold text-gray-900 leading-none">{departureDate}</p>
                </div>
                <div className="px-4 py-2 border-r border-gray-200">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Travelers</p>
                  <p className="text-[11px] font-bold text-gray-900 leading-none">{travelers} Traveler, {cabinClass}</p>
                </div>
                <button
                  onClick={() => navigate('/')}
                  className="h-10 px-6 bg-white border border-gray-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-900 hover:border-[#8B5CF6] transition-all"
                >
                  Modify Search
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-7xl mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Filters Sidebar */}
            <div className="lg:col-span-3 space-y-8">
              <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 space-y-8 sticky top-32">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Global Filters</h3>
                  <button className="text-[10px] font-black text-[#8B5CF6] uppercase underline">Reset All</button>
                </div>

                <div className="space-y-10">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Stops</h4>
                    <div className="space-y-3">
                      {['Non-stop', '1 Stop', '2+ Stops'].map((stop) => (
                        <label key={stop} className="flex items-center justify-between cursor-pointer group">
                          <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors">{stop}</span>
                          <input id={`flight-stop-${stop.toLowerCase().replace(' ', '-')}`} name="flight-stops" type="checkbox" value={stop.toLowerCase().replace(' ', '-')} className="w-4 h-4 rounded border-gray-200 text-[#8B5CF6] focus:ring-[#8B5CF6]" />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Preferred Airlines</h4>
                    <div className="space-y-3">
                      {['Emirates', 'Qatar Airways', 'Etihad', 'Lufthansa'].map((airline) => (
                        <label key={airline} className="flex items-center justify-between cursor-pointer group">
                          <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors">{airline}</span>
                          <input id={`flight-airline-${airline.toLowerCase().replace(' ', '-')}`} name="flight-airlines" type="checkbox" value={airline.toLowerCase().replace(' ', '-')} className="w-4 h-4 rounded border-gray-200 text-[#8B5CF6] focus:ring-[#8B5CF6]" />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div className="lg:col-span-9 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Found {flights.length} results</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sort By:</span>
                  <select id="flight-search-sort" name="flight-search-sort" className="bg-transparent text-[11px] font-black text-[#8B5CF6] uppercase tracking-widest outline-none border-none py-0">
                    <option>Recommended</option>
                    <option>Cheapest</option>
                    <option>Fastest</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
                  <div className="w-12 h-12 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Searching the skies...</p>
                </div>
              ) : flights.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No flights found matching your criteria</p>
                </div>
              ) : flights.map((flight) => (
                <div key={flight.id} className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm hover:shadow-xl hover:border-[#8B5CF6]/20 transition-all duration-500 group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#8B5CF6] scale-y-0 group-hover:scale-y-100 transition-transform duration-500" />

                  <div className="flex flex-col lg:flex-row items-center gap-10">
                    {/* Airline & Number */}
                    <div className="w-full lg:w-48 flex items-center gap-4 border-b lg:border-b-0 lg:border-r border-gray-100 pb-6 lg:pb-0 lg:pr-6">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center p-2">
                        <img src={`https://logo.clearbit.com/${flight.airline.toLowerCase().replace(' ', '')}.com`} className="w-full h-full object-contain" alt={flight.airline} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-gray-900 tracking-tight">{flight.airline}</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{flight.flightNumber}</p>
                      </div>
                    </div>

                    {/* Flight Timeline */}
                    <div className="flex-1 w-full">
                      <div className="flex items-center justify-between gap-10">
                        <div className="space-y-1">
                          <p className="text-2xl font-black text-gray-900 tracking-tighter">{flight.departureTime}</p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{flight.origin}</p>
                        </div>

                        <div className="flex-1 flex flex-col items-center">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">{flight.duration}</span>
                          <div className="w-full h-px bg-gray-100 relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[#8B5CF6] shadow-sm group-hover:rotate-12 transition-transform">
                              <Plane size={14} />
                            </div>
                          </div>
                          <div className="mt-4 flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            <span className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">
                              {flight.stops === 0 ? 'Direct' : `${flight.stops} Stop${flight.stops > 1 ? 's' : ''}`}
                            </span>
                          </div>
                        </div>

                        <div className="text-right space-y-1">
                          <p className="text-2xl font-black text-gray-900 tracking-tighter">{flight.arrivalTime}</p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{flight.destination}</p>
                        </div>
                      </div>
                    </div>

                    {/* Price & Selection */}
                    <div className="w-full lg:w-56 flex lg:flex-col items-center justify-between lg:justify-center gap-6 lg:border-l border-gray-100 lg:pl-10 pt-6 lg:pt-0">
                      <div className="text-right">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Standard Economy</p>
                        <p className="text-2xl font-black text-[#8B5CF6] tracking-tighter">{formatCurrency(flight.amount)}</p>
                        <div className="flex items-center gap-1 justify-end text-[9px] font-bold text-green-600 mt-1 uppercase tracking-widest">
                          <Luggage size={10} /> {flight.includedBags?.[0]?.weight}{flight.includedBags?.[0]?.unit} Included
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/flights/detail?id=${flight.id}`)}
                        className="h-12 px-10 bg-[#111827] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-gray-200 hover:bg-black transition-all hover:-translate-y-0.5 active:scale-95"
                      >
                        Select Deal
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </TripLogerLayout>
  );
}

