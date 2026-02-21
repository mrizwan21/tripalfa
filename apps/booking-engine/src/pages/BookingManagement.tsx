import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookingFilters } from '../components/booking/BookingFilters';
import { BookingTable } from '../components/booking/BookingTable';
import { listBookings } from '../lib/api';
import type { Booking } from '../lib/srs-types';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { useUserProfile } from '../lib/hooks';
import { ListFilter, Search, Plus } from 'lucide-react';

export default function BookingManagement() {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const { data: user } = useUserProfile();

  async function load() {
    setLoading(true);
    try {
      const res = await listBookings('all');
      setItems(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <TripLogerLayout>
      <div className="bg-[#F8F9FA] min-h-screen pb-20 font-sans" data-testid="booking-management-page">
        {/* Elite Header */}
        <div className="bg-white border-b border-gray-100 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-purple-50/50 to-transparent pointer-events-none" />
          <div className="container mx-auto px-4 max-w-7xl pt-12 pb-10 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#8B5CF6] flex items-center justify-center text-white shadow-lg shadow-purple-100">
                    <ListFilter size={16} />
                  </div>
                  <h1 className="text-[10px] font-black text-[#8B5CF6] uppercase tracking-[0.3em]">Reservations Portfolio</h1>
                </div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">My Bookings</h2>
                <p className="text-[11px] font-bold text-gray-400 max-w-md">Manage your luxury travel itinerary, track status updates, and execute post-booking operations.</p>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => load()}
                  className="h-11 px-8 rounded-xl bg-white border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-sm hover:border-[#8B5CF6] transition-all flex items-center gap-2 active:scale-95"
                >
                  Refresh Data
                </button>
                <Link
                  to="/hotels"
                  className="h-11 px-8 rounded-xl bg-[#8B5CF6] text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-purple-100 flex items-center gap-2 hover:bg-[#7C3AED] transition-all hover:-translate-y-0.5"
                >
                  <Plus size={14} strokeWidth={3} /> New Booking
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-7xl mt-6 space-y-6">
          {/* Filters Section */}
          <section className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 opacity-20 group-hover:opacity-100 transition-opacity" />
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
                  <Search size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest leading-none">Smart Filters</h3>
                  <p className="text-[10px] font-bold text-gray-400 mt-1">Refine your portfolio view by status, product, or reference.</p>
                </div>
              </div>
              <BookingFilters onFilter={() => load()} />
            </div>
          </section>

          {/* Results Section */}
          <section>
            {loading ? (
              <div className="py-32 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin shadow-lg" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Syncing Portfolio...</p>
              </div>
            ) : (
              <BookingTable items={items} />
            )}
          </section>
        </div>
      </div>
    </TripLogerLayout>
  );
}

