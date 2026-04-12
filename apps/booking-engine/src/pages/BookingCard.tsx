import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBookingById } from '../lib/api';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { AccordionBookingCard } from '../components/booking/AccordionBookingCard';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import type { Booking } from '../lib/srs-types';

function BookingCard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const b = await getBookingById(id || '');
        setBooking(b as Booking);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading)
    return (
      <TripLogerLayout>
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-secondary)] gap-2">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest animate-pulse">
              Loading Booking...
            </p>
          </div>
        </div>
      </TripLogerLayout>
    );

  if (!booking)
    return (
      <TripLogerLayout>
        <div className="min-h-screen flex items-center justify-center gap-2">
          <div className="text-center">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] text-2xl font-semibold tracking-tight">
              Booking not found
            </h2>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/')}
              className="mt-4 px-4 py-2 bg-[var(--color-primary)] text-background rounded-md text-sm font-medium"
            >
              Go Home
            </Button>
          </div>
        </div>
      </TripLogerLayout>
    );

  return (
    <TripLogerLayout>
      <div className="bg-[var(--color-bg-secondary)] min-h-screen pb-20">
        {/* Header Actions */}
        <div className="bg-[var(--color-bg-primary)] px-4 py-3 border-b border-[var(--color-border-light)] sticky top-0 z-10 flex items-center justify-between shadow-sm gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wide text-3xl font-bold tracking-tight">
            Booking Details
          </h1>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 -mr-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] rounded-full transition-colors"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={18} />
          </Button>
        </div>

        <div className="max-w-3xl mx-auto pt-4 md:pt-8 px-0 md:px-4">
          <AccordionBookingCard booking={booking} />
        </div>

        {/* Note: Popups/Modals will be re-integrated in Phase 4 when actions are connected */}
      </div>
    </TripLogerLayout>
  );
}

export default BookingCard;
