/**
 * SeatSelection Component - Dynamic Aircraft Seating
 *
 * ARCHITECTURAL FEATURES:
 * 1. Dual-mode operation: Booking Flow + Post-Booking Management
 * 2. Dynamic rendering based on aircraft type (wide-body vs narrow-body)
 * 3. All API calls routed through centralized API Manager
 * 4. Aircraft-specific seat layouts (3-3, 3-4-3, etc.)
 * 5. Real-time cost tracking and validation
 *
 * @route /seat-selection (Booking flow)
 * @route /seat-selection?mode=post-booking (Post-booking management)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ChevronLeft, AlertCircle, Check, Luggage, Plane } from 'lucide-react';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { formatCurrency } from '@tripalfa/ui-components';
import { Button } from '../components/ui/button';
import {
  getSeatMaps,
  getSeatMapsForBooking,
  parseSeatPattern,
  getAircraftLayout,
} from '../lib/api';
import type { AircraftConfig, SeatMapWithAircraft } from '../services/seatMapsApi';
import { useTenantRuntime } from '@/components/providers/TenantRuntimeProvider';

type SelectedSeat = Record<string, any>;

type SeatSelectionMode = 'booking' | 'post-booking';

interface SeatElement {
  designator: string;
  type: 'seat' | 'empty' | 'lavatory' | 'galley' | 'bassinet' | 'closet';
  available_services?: Array<{
    id: string;
    total_amount: string;
    total_currency: string;
  }>;
}

function SeatSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { config: runtimeConfig } = useTenantRuntime();

  // State
  const [seatMaps, setSeatMaps] = useState<SeatMapWithAircraft[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState(0);
  const [totalSeatCost, setTotalSeatCost] = useState(0);
  const [mode, setMode] = useState<SeatSelectionMode>('booking');
  const [activePassengerIndex, setActivePassengerIndex] = useState(0);

  // Navigation state
  const state = location.state || {};
  const offer = state.offer;
  const orderId = state.orderId;
  const booking = state.booking;

  // Get passenger count from various sources
  const statePassengers = state.passengers || [];
  const urlAdults = parseInt(searchParams.get('adults') || '1', 10);
  const urlChildren = parseInt(searchParams.get('children') || '0', 10);

  // Generate passengers list - use state passengers if available, otherwise generate from URL params
  const passengers =
    statePassengers.length > 0
      ? statePassengers
      : Array.from({ length: urlAdults + urlChildren }, (_, i) => ({
          id: `passenger_${i + 1}`,
          label: `Passenger ${i + 1}`,
          type: i < urlAdults ? 'adult' : 'child',
        }));

  // Get currently active passenger
  const activePassenger = passengers[activePassengerIndex] ||
    passengers[0] || { id: 'passenger_1', label: 'Passenger 1' };

  // Determine mode based on URL params and state
  useEffect(() => {
    const urlMode = searchParams.get('mode') as SeatSelectionMode;
    if (urlMode === 'post-booking' || (orderId && booking)) {
      setMode('post-booking');
    } else {
      setMode('booking');
    }
  }, [searchParams, orderId, booking]);

  if (!runtimeConfig.features.seatSelectionEnabled) {
    return (
      <TripLogerLayout>
        <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] px-4 gap-2">
          <div className="bg-card rounded-[2rem] border border-border shadow-sm p-8 text-center max-w-xl w-full">
            <h1 className="text-2xl font-black text-foreground mb-2">Seat Selection Disabled</h1>
            <p className="text-sm font-bold text-muted-foreground mb-6">
              Seat selection is currently disabled by your admin settings.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate(-1)}
              className="h-11 px-6 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)] text-[hsl(var(--primary-foreground))] rounded-xl text-sm font-bold"
            >
              Go Back
            </Button>
          </div>
        </div>
      </TripLogerLayout>
    );
  }

  // Fetch seat maps based on mode
  useEffect(() => {
    const fetchSeatMaps = async () => {
      try {
        let maps: SeatMapWithAircraft[] = [];

        if (mode === 'post-booking' && orderId) {
          console.log('[SeatSelection] POST-BOOKING MODE: Fetching maps for order:', orderId);
          maps = await getSeatMapsForBooking(orderId, 'duffel', 'test');
        } else if (mode === 'booking' && offer?.id) {
          console.log('[SeatSelection] BOOKING MODE: Fetching maps for offer:', offer.id);
          maps = await getSeatMaps(offer.id, 'duffel', 'test');
        } else {
          setError(mode === 'post-booking' ? 'No booking ID provided' : 'No offer selected');
          setLoading(false);
          return;
        }

        if (!maps || maps.length === 0) {
          setError('Seat selection is not available for this flight');
          setSeatMaps([]);
        } else {
          setSeatMaps(maps);
          setActiveSegment(0);
        }
        setLoading(false);
      } catch (err) {
        console.error('[SeatSelection] Error fetching seat maps:', err);
        setError('Failed to load seat maps. Please try again.');
        setLoading(false);
      }
    };

    fetchSeatMaps();
  }, [mode, offer?.id, orderId]);

  // Handle seat selection with cost tracking
  // Render seat button with dynamic styling
  // DISPLAY RECOMMENDATIONS FROM DUFFEL:
  // - Static width (w-10 h-10) for seats, empty, and bassinets
  // - Flexible width for other facilities (they fill/shrink)
  // - Full designator shown on each seat (e.g., "1A", "2B")
  // - Middle-aligned if elements don't fill section
  const renderSeatButton = (element: SeatElement, segmentId: string, passengerId: string) => {
    const isSelected = selectedSeats.some(
      s => s.designator === element.designator && s.segmentId === segmentId
    );
    const isAvailable =
      element.type === 'seat' &&
      element.available_services &&
      element.available_services.length > 0;

    if (element.type === 'seat') {
      return (
        <Button
          variant="ghost"
          size="sm"
          key={`seat-${element.designator}`}
          onClick={() =>
            isAvailable &&
            handleSeatClick(
              element.designator,
              String(passengerId || 'passenger_1'),
              String(segmentId || ''),
              element.available_services?.[0]?.id,
              parseFloat(element.available_services?.[0]?.total_amount || '0')
            )
          }
          disabled={!isAvailable}
          className={`w-10 h-10 flex items-center justify-center rounded font-bold text-xs transition-all duration-200 shrink-0 ${
            isSelected
              ? 'bg-blue-600 text-background border-2 border-blue-700 shadow-md'
              : isAvailable
                ? 'bg-card border-2 border-border text-foreground hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
          title={`Seat ${element.designator} - ${isAvailable ? 'Available' : 'Unavailable'}`}
        >
          {element.designator}
        </Button>
      );
    } else if (element.type === 'empty') {
      // Static width empty space
      return <div key={`empty-${element.designator}`} className="w-10 h-10 shrink-0" />;
    } else if (element.type === 'bassinet') {
      // Bassinet with static width (same as seats)
      return (
        <div
          key={`bassinet-${element.designator}`}
          className="w-10 h-10 flex items-center justify-center text-xs bg-muted border border-dashed border-border rounded shrink-0 gap-2"
          title="Bassinet"
        >
          👶
        </div>
      );
    } else {
      // Facilities (lavatory, galley, closet) - flexible width, fill available space
      const facilityEmoji: Record<string, string> = {
        lavatory: '🚽',
        galley: '🍽️',
        closet: '🚪',
      };
      return (
        <div
          key={`facility-${element.designator}`}
          className="px-2 h-10 flex items-center justify-center text-sm opacity-60 bg-muted border border-border rounded flex-1 min-w-0 gap-2"
          title={element.type.charAt(0).toUpperCase() + element.type.slice(1)}
        >
          {facilityEmoji[element.type] || '?'}
        </div>
      );
    }
  };

  // Render cabin with dynamic layout based on aircraft
  const renderCabin = (cabin: any, segmentId: string, aircraft?: AircraftConfig) => {
    const layout = aircraft ? getAircraftLayout(aircraft) : null;
    const pattern = layout ? parseSeatPattern(layout.rowPattern) : null;
    const passengerId = activePassenger?.id || 'passenger_1';

    return (
      <div key={`cabin-${cabin.cabin_class}`} className="mb-12">
        {/* Cabin Header with Aircraft Info */}
        <div className="flex justify-between items-start mb-6 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground capitalize">
              {cabin.cabin_class} Class
            </h3>
            {aircraft && (
              <p className="text-sm text-muted-foreground mt-2">
                <Plane className="w-4 h-4 inline mr-1" />
                {aircraft.aircraftType} • {aircraft.bodyType}-body • Pattern: {layout?.rowPattern}
              </p>
            )}
          </div>
          {layout && (
            <div className="text-right text-xs text-muted-foreground">
              <p>Pitch: {layout.seatPitch}"</p>
              <p>Width: {layout.seatWidth}"</p>
            </div>
          )}
        </div>

        {/* Seat Grid Container - Dynamic Layout based on Aircraft Configuration */}
        <div className="inline-block border border-border rounded-lg p-4 bg-muted overflow-x-auto">
          {cabin.rows.map((row: any, rowIndex: number) => (
            <div key={`row-${rowIndex}`} className="flex gap-3 mb-3 items-stretch">
              {/* Row Number Label - Left aligned */}
              <span className="w-8 text-center text-xs font-bold text-muted-foreground shrink-0 flex items-center justify-center bg-muted rounded h-10 gap-2">
                {layout?.firstRow ? rowIndex + layout.firstRow : rowIndex + 1}
              </span>

              {/* Seat Rows with Sections - Center aligned, proper spacing between sections */}
              <div className="flex gap-4 items-center justify-center">
                {row.sections.map((section: any, sectionIdx: number) => (
                  <div
                    key={`section-${sectionIdx}`}
                    className="flex gap-1 items-center justify-center"
                  >
                    {section.elements.map((element: SeatElement) =>
                      renderSeatButton(element, segmentId, passengerId)
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legend - Updated to match new display system */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4 pt-6 border-t">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-card border-2 border-border rounded flex items-center justify-center text-xs font-bold gap-2">
              1A
            </div>
            <span className="text-xs text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 border-2 border-blue-700 rounded flex items-center justify-center text-xs font-bold text-background gap-2">
              1B
            </div>
            <span className="text-xs text-muted-foreground">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-muted rounded flex items-center justify-center text-xs gap-2" />
            <span className="text-xs text-muted-foreground">Unavailable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-muted border border-dashed border-border rounded flex items-center justify-center text-xs gap-2">
              👶
            </div>
            <span className="text-xs text-muted-foreground">Bassinet</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2 h-8 bg-muted border border-border rounded flex items-center justify-center text-xs gap-2">
              🚽
            </div>
            <span className="text-xs text-muted-foreground">Facilities</span>
          </div>
        </div>
      </div>
    );
  };

  const currentSeatMap = seatMaps[activeSegment];

  // Navigate to next step
  const handleContinue = () => {
    if (mode === 'post-booking') {
      // Post-booking: Update seats and return to booking
      navigate(`/bookings/${orderId}`, {
        state: {
          orderId,
          booking,
          selectedSeats,
          totalSeatCost,
          seatUpdateComplete: true,
        },
      });
    } else {
      // Booking flow: Continue to passenger details
      navigate('/passenger-details', {
        state: {
          offer,
          flight: state.flight,
          selectedSeats,
          totalSeatCost,
        },
      });
    }
  };

  // Navigate back
  const handleBack = () => {
    if (mode === 'post-booking') {
      navigate(`/bookings/${orderId}`);
    } else {
      navigate(-1);
    }
  };

  // Handle seat click
  const handleSeatClick = (
    seatDesignator: string,
    passengerId: string,
    segmentId: string,
    serviceId?: string,
    seatPrice?: number
  ) => {
    // Prevent double-booking
    const existingBooking = selectedSeats.find(
      s => s.designator === seatDesignator && s.passengerId !== passengerId
    );
    if (existingBooking) {
      setError('This seat is already selected by another passenger');
      return;
    }

    // Toggle seat selection
    const newSelectedSeats = [...selectedSeats];
    const index = newSelectedSeats.findIndex(
      s => s.passengerId === passengerId && s.segmentId === segmentId
    );

    if (index >= 0) {
      const existingSeat = newSelectedSeats[index];
      if (existingSeat.designator === seatDesignator) {
        // Deselect
        const price = (existingSeat as any).seatPrice || 0;
        newSelectedSeats.splice(index, 1);
        setTotalSeatCost(prev => prev - price);
      } else {
        // Replace with new seat
        const oldPrice = (existingSeat as any).seatPrice || 0;
        newSelectedSeats[index] = {
          designator: seatDesignator,
          passengerId,
          segmentId,
          serviceId,
          seatPrice,
        } as any;
        setTotalSeatCost(prev => prev - oldPrice + (seatPrice || 0));
      }
    } else {
      // New selection
      newSelectedSeats.push({
        designator: seatDesignator,
        passengerId,
        segmentId,
        serviceId,
        seatPrice,
      } as any);
      setTotalSeatCost(prev => prev + (seatPrice || 0));
    }

    setSelectedSeats(newSelectedSeats);
    setError(null);
  };

  /**
   * Render seat grid dynamically based on aircraft configuration
   * Handles different layouts: narrow-body (3-3), wide-body (3-4-3), etc.
   */
  const renderDynamicSeatGrid = (cabinElement: any, aircraft?: AircraftConfig): React.ReactNode => {
    if (!aircraft) {
      // Fallback to static rendering if no aircraft config
      return renderStaticSeatGrid(cabinElement);
    }

    const layout = getAircraftLayout(aircraft);
    if (!layout) {
      return renderStaticSeatGrid(cabinElement);
    }

    const seatPattern = parseSeatPattern(layout.rowPattern);
    const aisleIndices = calculateAislePositions(seatPattern);

    return (
      <div className="inline-block border border-border rounded-lg p-4 bg-muted">
        {cabinElement.rows.map((row: any, rowIndex: number) => (
          <div key={`row-${rowIndex}`} className="flex gap-2 mb-2 items-center">
            {/* Row number */}
            <span className="w-6 text-center text-xs font-bold text-muted-foreground">
              {rowIndex + layout.firstRow}
            </span>

            {/* Seats with aisles */}
            <div className="flex gap-2">
              {seatPattern.map((seatsInSection: number, sectionIdx: number) => (
                <div key={`section-${sectionIdx}`} className="flex gap-1">
                  {row.sections[sectionIdx]?.elements.map((element: any, elementIndex: number) => {
                    const isSelected = selectedSeats.some(
                      s =>
                        s.designator === element.designator &&
                        s.segmentId === currentSeatMap.segment_id
                    );
                    const isAvailable =
                      element.type === 'seat' &&
                      element.available_services &&
                      element.available_services.length > 0;

                    return element.type === 'seat' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        key={`seat-${elementIndex}`}
                        onClick={() =>
                          isAvailable &&
                          handleSeatClick(
                            element.designator,
                            activePassenger?.id || 'passenger_1',
                            currentSeatMap.segment_id,
                            element.available_services?.[0]?.id,
                            parseFloat(element.available_services?.[0]?.total_amount || 0)
                          )
                        }
                        disabled={!isAvailable}
                        className={`w-10 h-10 flex items-center justify-center rounded font-semibold text-xs transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-background border-2 border-blue-700'
                            : isAvailable
                              ? 'bg-card border-2 border-border text-foreground hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                              : 'bg-muted text-muted-foreground cursor-not-allowed'
                        }`}
                        title={`Seat ${element.designator}`}
                      >
                        {element.designator.slice(-1)}
                      </Button>
                    ) : element.type === 'empty' ? (
                      <div key={`empty-${elementIndex}`} className="w-10 h-10" />
                    ) : (
                      <div
                        key={`special-${elementIndex}`}
                        className="w-10 h-10 flex items-center justify-center text-xs text-muted-foreground opacity-50 gap-2"
                        title={element.type}
                      >
                        {element.type === 'lavatory' && '🚽'}
                        {element.type === 'galley' && '🍽️'}
                        {element.type === 'bassinet' && '👶'}
                        {element.type === 'closet' && '🚪'}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  /**
   * Fallback static rendering (for seats without aircraft config)
   */
  const renderStaticSeatGrid = (cabinElement: any): React.ReactNode => {
    return (
      <div className="inline-block border border-border rounded-lg p-4 bg-muted">
        {cabinElement.rows.map((row: any, rowIndex: number) => (
          <div key={`row-${rowIndex}`} className="flex gap-1 mb-2">
            {row.sections.map((section: any, sectionIndex: number) => (
              <div key={`section-${sectionIndex}`} className="flex gap-2">
                {section.elements.map((element: any, elementIndex: number) => {
                  const isSelected = selectedSeats.some(
                    s =>
                      s.designator === element.designator &&
                      s.segmentId === currentSeatMap.segment_id
                  );
                  const isAvailable =
                    element.type === 'seat' &&
                    element.available_services &&
                    element.available_services.length > 0;

                  return element.type === 'seat' ? (
                    <button
                      key={`seat-${elementIndex}`}
                      onClick={() =>
                        isAvailable &&
                        handleSeatClick(
                          element.designator,
                          activePassenger?.id || 'passenger_1',
                          currentSeatMap.segment_id,
                          element.available_services?.[0]?.id,
                          parseFloat(element.available_services?.[0]?.total_amount || 0)
                        )
                      }
                      disabled={!isAvailable}
                      className={`w-10 h-10 flex items-center justify-center rounded font-semibold text-xs transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-background border-2 border-blue-700'
                          : isAvailable
                            ? 'bg-card border-2 border-border text-foreground hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                      }`}
                      title={`Seat ${element.designator}`}
                    >
                      {element.designator}
                    </button>
                  ) : element.type === 'empty' ? (
                    <div key={`empty-${elementIndex}`} className="w-10 h-10" />
                  ) : (
                    <div
                      key={`special-${elementIndex}`}
                      className="w-10 h-10 flex items-center justify-center text-xs text-muted-foreground opacity-50 gap-2"
                      title={element.type}
                    >
                      {element.type === 'lavatory' && '🚽'}
                      {element.type === 'galley' && '🍽️'}
                      {element.type === 'bassinet' && '👶'}
                      {element.type === 'closet' && '🚪'}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  /**
   * Calculate aisle positions for dynamic layout
   * e.g., [3, 4, 3] -> aisles at position 3 and 7
   */
  const calculateAislePositions = (pattern: number[]): number[] => {
    const positions: number[] = [];
    let currentPos = 0;
    for (let i = 0; i < pattern.length - 1; i++) {
      currentPos += pattern[i];
      positions.push(currentPos);
    }
    return positions;
  };

  if (loading) {
    return (
      <TripLogerLayout>
        <div className="flex items-center justify-center min-h-screen gap-2">
          <div className="text-center">
            <Luggage className="w-12 h-12 mx-auto mb-4 animate-bounce text-blue-600" />
            <p className="text-lg text-muted-foreground">Loading seat maps...</p>
          </div>
        </div>
      </TripLogerLayout>
    );
  }

  if (!offer) {
    return (
      <TripLogerLayout>
        <div className="max-w-4xl mx-auto p-6 mt-8">
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
            <AlertCircle className="w-6 h-6 text-neutral-500 inline mr-2" />
            <span className="text-neutral-800">
              No flight offer found. Please select a flight first.
            </span>
          </div>
        </div>
      </TripLogerLayout>
    );
  }

  if (error === 'Seat selection is not available for this flight') {
    return (
      <TripLogerLayout>
        <div className="max-w-4xl mx-auto p-6 mt-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center text-blue-600 mb-6 hover:text-blue-700 gap-2 px-4 py-2 rounded-md"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </Button>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <AlertCircle className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Seat Selection Not Available
            </h3>
            <p className="text-blue-700 mb-4">
              This flight doesn't support seat selection. You can proceed with your booking without
              selecting specific seats.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={handleContinue}
              className="bg-blue-600 text-background px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Continue to Passengers
            </Button>
          </div>
        </div>
      </TripLogerLayout>
    );
  }

  return (
    <TripLogerLayout>
      <div className="max-w-6xl mx-auto p-6 mt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-2">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="flex items-center text-blue-600 mb-4 hover:text-blue-700 gap-2 px-4 py-2 rounded-md"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Select Your Seats</h1>
            <p className="text-muted-foreground mt-2">Choose preferred seats for each segment</p>
          </div>
          {totalSeatCost > 0 && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Seat charges</p>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(totalSeatCost, 'USD')}
              </p>
            </div>
          )}
        </div>

        {/* Passenger Selector */}
        {passengers.length > 0 && (
          <div className="bg-card rounded-lg border p-6 mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Select Passenger</h3>
            <div className="flex flex-wrap gap-3">
              {passengers.map((passenger: any, index: number) => {
                const passengerSeat = selectedSeats.find(
                  s => s.passengerId === passenger.id && s.segmentId === currentSeatMap?.segment_id
                );
                return (
                  <Button
                    variant="ghost"
                    size="sm"
                    key={passenger.id}
                    onClick={() => setActivePassengerIndex(index)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                      activePassengerIndex === index
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-border hover:border-border text-foreground'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        activePassengerIndex === index
                          ? 'bg-blue-500 text-background'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="text-left">
                      <p className="font-medium">
                        {passenger.label || passenger.name || `Passenger ${index + 1}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {passengerSeat ? `Seat ${passengerSeat.designator}` : 'No seat selected'}
                      </p>
                    </div>
                    {passengerSeat && <Check className="w-5 h-5 text-blue-500 ml-2" />}
                  </Button>
                );
              })}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Selecting seats for:{' '}
              <span className="font-semibold text-foreground">
                {activePassenger?.label || `Passenger ${activePassengerIndex + 1}`}
              </span>
            </p>
          </div>
        )}

        {error && (
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-6 flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-neutral-500 mr-3 mt-0.5 flex-shrink-0 gap-4" />
            <p className="text-neutral-800">{error}</p>
          </div>
        )}

        {/* Segment Tabs */}
        {seatMaps.length > 1 && (
          <div className="flex gap-2 mb-8 border-b">
            {seatMaps.map((map, index) => (
              <Button
                variant="ghost"
                size="sm"
                key={map.segment_id}
                onClick={() => setActiveSegment(index)}
                className={`px-4 py-3 font-medium transition-colors ${
                  activeSegment === index
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Segment {index + 1}
              </Button>
            ))}
          </div>
        )}

        {/* Seat Map Display */}
        {currentSeatMap ? (
          <div className="bg-card rounded-lg border p-8">
            {/* Cabin Display */}
            {currentSeatMap.cabins.map((cabin, cabinIndex) => (
              <div key={`cabin-${cabinIndex}`} className="mb-12">
                <h3 className="text-lg font-semibold text-foreground mb-6 capitalize">
                  {cabin.cabin_class} Class
                </h3>

                {/* Seat Grid */}
                <div className="inline-block border border-border rounded-lg p-4 bg-muted">
                  {cabin.rows.map((row, rowIndex) => (
                    <div key={`row-${rowIndex}`} className="flex gap-1 mb-2">
                      {row.sections.map((section, sectionIndex) => (
                        <div key={`section-${sectionIndex}`} className="flex gap-2">
                          {section.elements.map((element, elementIndex) => {
                            const isSelected = selectedSeats.some(
                              s =>
                                s.designator === element.designator &&
                                s.segmentId === currentSeatMap.segment_id
                            );
                            const isAvailable =
                              element.type === 'seat' &&
                              element.available_services &&
                              element.available_services.length > 0;

                            return element.type === 'seat' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                key={`seat-${elementIndex}`}
                                onClick={() =>
                                  isAvailable &&
                                  handleSeatClick(
                                    element.designator,
                                    String(activePassenger?.id || 'passenger_1'),
                                    String(currentSeatMap.segment_id || ''),
                                    element.available_services?.[0]?.id,
                                    parseFloat(element.available_services?.[0]?.total_amount || '0')
                                  )
                                }
                                disabled={!isAvailable}
                                className={`w-10 h-10 flex items-center justify-center rounded font-semibold text-sm transition-all ${
                                  isSelected
                                    ? 'bg-blue-600 text-background border-2 border-blue-700'
                                    : isAvailable
                                      ? 'bg-card border-2 border-border text-foreground hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                                }`}
                                title={`Seat ${element.designator}`}
                              >
                                {element.designator}
                              </Button>
                            ) : element.type === 'empty' ? (
                              <div key={`empty-${elementIndex}`} className="w-10 h-10" />
                            ) : (
                              <div
                                key={`special-${elementIndex}`}
                                className="w-10 h-10 flex items-center justify-center text-xs text-muted-foreground opacity-50 gap-2"
                              >
                                {element.type === 'lavatory' && '🚽'}
                                {element.type === 'galley' && '🍽️'}
                                {element.type === 'bassinet' && '👶'}
                                {element.type === 'closet' && '🚪'}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-card border-2 border-border rounded" />
                    <span className="text-sm text-muted-foreground">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-600 border-2 border-blue-700 rounded" />
                    <span className="text-sm text-muted-foreground">Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-muted rounded" />
                    <span className="text-sm text-muted-foreground">Unavailable</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🚽</span>
                    <span className="text-sm text-muted-foreground">Facilities</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Action Buttons */}
            <div className="mt-8 flex gap-4 justify-end">
              <Button
                variant="outline"
                size="md"
                onClick={handleBack}
                className="px-6 py-3 border-2 border-border text-foreground rounded-lg font-semibold hover:bg-muted"
              >
                Back
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleContinue}
                className="px-6 py-3 bg-blue-600 text-background rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
              >
                Continue to Passengers
                <Check className="w-5 h-5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-muted rounded-lg p-8 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No seat maps available for this segment</p>
          </div>
        )}
      </div>
    </TripLogerLayout>
  );
}

export default SeatSelection;
