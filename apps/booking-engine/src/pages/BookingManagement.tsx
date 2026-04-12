import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookingFilters } from '../components/booking/BookingFilters';
import { BookingTable } from '../components/booking/BookingTable';
import { listBookings } from '../lib/api';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { useUserProfile } from '../lib/hooks';
import { ListFilter, Search, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import type { Booking } from '../lib/srs-types';

function BookingManagement() {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const { data: user } = useUserProfile();

  async function load() {
    setLoading(true);
    try {
      const res = await listBookings('all');
      setItems(Array.isArray(res) ? (res as Booking[]) : []);
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
      <div
        className="bg-[hsl(var(--background))] min-h-screen pb-20 font-sans"
        data-testid="booking-management-page"
      >
        {/* Elite Header */}
        <div className="bg-card border-b border-border shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[40%] h-full bg-purple-50/50 pointer-events-none" />
          <div className="container mx-auto px-4 max-w-7xl pt-12 pb-10 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[hsl(var(--primary))] flex items-center justify-center text-[hsl(var(--primary-foreground))] shadow-lg shadow-purple-100 gap-2">
                    <ListFilter size={16} />
                  </div>
                  <h1 className="text-[10px] font-black text-[hsl(var(--primary))] uppercase tracking-[0.3em] text-3xl font-bold tracking-tight">
                    Reservations Portfolio
                  </h1>
                </div>
                <h2 className="text-3xl font-black text-foreground tracking-tighter">
                  My Bookings
                </h2>
                <p className="text-[11px] font-bold text-muted-foreground max-w-md">
                  Manage your luxury travel itinerary, track status updates, and execute
                  post-booking operations.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => load()}
                  className="h-11 px-8 rounded-xl bg-card border border-border text-[10px] font-black uppercase tracking-widest text-foreground shadow-sm hover:border-[hsl(var(--primary))] transition-all flex items-center gap-2 active:scale-95"
                >
                  Refresh Data
                </Button>
                <Link
                  to="/hotels"
                  className="h-11 px-8 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-purple-100 flex items-center gap-2 hover:bg-[hsl(var(--primary)/0.9)] transition-all hover:-translate-y-0.5"
                >
                  <Plus size={14} strokeWidth={3} /> New Booking
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-7xl mt-12 space-y-6">
          {/* Filters Section */}
          <section className="bg-card rounded-xl p-5 shadow-sm border border-border relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 opacity-20 group-hover:opacity-100 transition-opacity" />
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground gap-2">
                  <Search size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-foreground uppercase tracking-widest leading-none text-xl font-semibold tracking-tight">
                    Smart Filters
                  </h3>
                  <p className="text-[10px] font-bold text-muted-foreground mt-1">
                    Refine your portfolio view by status, product, or reference.
                  </p>
                </div>
              </div>
              <BookingFilters onFilter={() => load()} />
            </div>
          </section>

          {/* Results Section */}
          <section>
            {loading ? (
              <div className="py-32 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin shadow-lg" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] animate-pulse">
                  Syncing Portfolio...
                </p>
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

export default BookingManagement;
