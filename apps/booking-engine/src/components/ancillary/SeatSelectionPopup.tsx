import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
  Plane,
  AlertCircle,
} from "lucide-react";
import { Button } from "../ui/button";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@tripalfa/ui-components";
import {
  Passenger,
  FlightSegmentInfo,
  SelectedSeat,
  getPassengerAvatar,
} from "../../lib/ancillary-types";
import {
  DuffelSeatMap,
  ProcessedSeatMap,
  FlattenedSeat,
  DuffelCabinRowSectionElement,
  DuffelSeatElement,
} from "../../types/duffel-seat-maps";
import {
  duffelSeatMapsService,
  groupSeatsByRow,
  getSeatPattern,
} from "../../services/duffelSeatMapsService";

interface SeatSelectionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedSeats: SelectedSeat[]) => void;
  isLCC?: boolean;
  offerId?: string;
  passengers: Passenger[];
  segments: FlightSegmentInfo[];
  existingSelections?: SelectedSeat[];
}

/**
 * Seat Selection Popup Component
 *
 * Integrates with Duffel Seat Maps API v2 to display available seats
 * and allow passengers to select their preferred seats.
 *
 * @see https://duffel.com/docs/api/v2/seat-maps/get-seat-maps
 */
export const SeatSelectionPopup = ({
  isOpen,
  onClose,
  onConfirm,
  isLCC = false,
  offerId,
  passengers,
  segments,
  existingSelections = [],
}: SeatSelectionPopupProps): React.JSX.Element | null => {
  const [selectedPassengerIdx, setSelectedPassengerIdx] = useState(0);
  const [selectedSegmentIdx, setSelectedSegmentIdx] = useState(0);
  const [isConfirming, setIsConfirming] = useState(false);
  const [selectedSeats, setSelectedSeats] =
    useState<SelectedSeat[]>(existingSelections);
  const [processedSeatMaps, setProcessedSeatMaps] = useState<
    ProcessedSeatMap[]
  >([]);

  // Fetch seat maps from Duffel API
  const {
    data: seatMapsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["seat-maps", offerId],
    queryFn: async () => {
      if (!offerId) return null;
      return duffelSeatMapsService.getSeatMapsForOffer(offerId);
    },
    enabled: !!offerId && isOpen,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Reset selections when segment changes
  useEffect(() => {
    setSelectedPassengerIdx(0);
  }, [selectedSegmentIdx]);

  // Process seat maps when data arrives
  useEffect(() => {
    if (seatMapsResponse?.success && seatMapsResponse.data?.seatMaps) {
      setProcessedSeatMaps(seatMapsResponse.data.seatMaps);
    } else if (!isLoading && !seatMapsResponse?.success) {
      // Generate mock seats if no real data available
      setProcessedSeatMaps([]);
    }
  }, [seatMapsResponse, isLoading]);

  // Get current processed seat map for selected segment
  const currentSeatMap = useMemo(() => {
    if (processedSeatMaps.length === 0) return null;
    // Try to match by segment ID, otherwise use index
    const segment = segments[selectedSegmentIdx];
    const matched = processedSeatMaps.find(
      (sm) => sm.segmentId === segment?.id,
    );
    return (
      matched || processedSeatMaps[selectedSegmentIdx] || processedSeatMaps[0]
    );
  }, [processedSeatMaps, selectedSegmentIdx, segments]);

  // Group seats by row for rendering
  const seatsByRow = useMemo(() => {
    if (!currentSeatMap) return new Map<number, FlattenedSeat[]>();
    return groupSeatsByRow(currentSeatMap);
  }, [currentSeatMap]);

  // Get seat pattern (e.g., "3-3" or "3-4-3")
  const seatPattern = useMemo(() => {
    if (!currentSeatMap) return "3-3";
    return getSeatPattern(currentSeatMap);
  }, [currentSeatMap]);

  // Generate mock seats if no real data
  const mockSeatsByRow = useMemo(() => {
    if (currentSeatMap || !isOpen) return new Map<number, FlattenedSeat[]>();

    const mockMap = new Map<number, FlattenedSeat[]>();
    const numRows = 15;

    for (let row = 1; row <= numRows; row++) {
      const seats: FlattenedSeat[] = [];
      const isExitRow = row >= 10 && row <= 11;

      ["A", "B", "C", "D", "E", "F"].forEach((col, idx) => {
        const isAvailable = Math.random() > 0.25;
        const price = isLCC
          ? row < 4
            ? 25
            : isExitRow
              ? 35
              : 15
          : row < 4
            ? 50
            : isExitRow
              ? 45
              : 0;

        seats.push({
          designator: `${row}${col}`,
          available: isAvailable,
          price: isAvailable ? price : null,
          currency: "USD",
          serviceId: isAvailable ? `mock_${row}${col}` : null,
          passengerId: null,
          name: isExitRow ? "Exit Row" : null,
          disclosures: [],
          isExitRow,
          isOverWing: row >= 8 && row <= 12,
          rowNumber: row,
          columnLetter: col,
          sectionIndex: idx < 3 ? 0 : 1,
          elementIndex: idx < 3 ? idx : idx - 3,
        });
      });

      mockMap.set(row, seats);
    }

    return mockMap;
  }, [currentSeatMap, isOpen, isLCC]);

  // Use either real or mock seats
  const displaySeatsByRow = seatsByRow.size > 0 ? seatsByRow : mockSeatsByRow;

  const currentPassenger = passengers[selectedPassengerIdx];
  const currentSegment = segments[selectedSegmentIdx];

  // Get current seat selection for passenger/segment
  const currentSeatSelection = useMemo(() => {
    return selectedSeats.find(
      (s) =>
        s.passengerId === currentPassenger?.id &&
        s.segmentId === currentSegment?.id,
    );
  }, [selectedSeats, currentPassenger, currentSegment]);

  // Handle seat click
  const handleSeatClick = useCallback(
    (seat: FlattenedSeat) => {
      if (!seat.available || !currentPassenger || !currentSegment) return;

      const newSeat: SelectedSeat = {
        passengerId: currentPassenger.id,
        passengerName:
          `${currentPassenger.firstName} ${currentPassenger.lastName}`.trim(),
        segmentId: currentSegment.id,
        flightNumber: currentSegment.flightNumber,
        seatDesignator: seat.designator,
        seatType: seat.isExitRow
          ? "Exit Row"
          : seat.price && seat.price > 20
            ? "Extra Legroom"
            : "Standard",
        price: seat.price ?? 0,
        currency: seat.currency ?? "USD",
      };

      setSelectedSeats((prev) => {
        // Remove existing selection for this passenger-segment combo
        const filtered = prev.filter(
          (s) =>
            !(
              s.passengerId === currentPassenger.id &&
              s.segmentId === currentSegment.id
            ),
        );
        // Add new selection
        return [...filtered, newSeat];
      });
    },
    [currentPassenger, currentSegment],
  );

  // Check if a seat is selected by another passenger
  const isSeatSelectedByOther = useCallback(
    (designator: string) => {
      return selectedSeats.some(
        (s) =>
          s.seatDesignator === designator &&
          s.segmentId === currentSegment?.id &&
          s.passengerId !== currentPassenger?.id,
      );
    },
    [selectedSeats, currentSegment, currentPassenger],
  );

  const totalAmount = selectedSeats.reduce((sum, s) => sum + s.price, 0);

  if (!isOpen) return null;

  // Confirmation modal
  if (isConfirming) {
    return (
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 gap-2">
        <div
          className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
          onClick={() => setIsConfirming(false)}
        />
        <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-12 flex flex-col items-center gap-8 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/20 relative gap-2">
            <div className="absolute inset-0 bg-primary blur-xl opacity-20 scale-150 animate-pulse" />
          </div>
          <h2 className="text-xl font-black text-gray-900 text-center text-2xl font-semibold tracking-tight">
            Confirm Seat Selection
          </h2>

          <div className="w-full space-y-4">
            <p className="text-[10px] font-black text-center text-primary uppercase tracking-widest">
              Seat Selection Summary
            </p>
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-50">
                    <th className="px-4 py-2 text-left text-[8px] font-black text-gray-400 uppercase tracking-widest">
                      Passenger
                    </th>
                    <th className="px-4 py-2 text-left text-[8px] font-black text-gray-400 uppercase tracking-widest">
                      Flight
                    </th>
                    <th className="px-4 py-2 text-left text-[8px] font-black text-gray-400 uppercase tracking-widest">
                      Seat
                    </th>
                    <th className="px-4 py-2 text-left text-[8px] font-black text-gray-400 uppercase tracking-widest">
                      Type
                    </th>
                    <th className="px-4 py-2 text-left text-[8px] font-black text-gray-400 uppercase tracking-widest">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {selectedSeats.map((seat, i) => (
                    <tr key={i} className="text-[9px] font-bold text-gray-600">
                      <td className="px-4 py-3">{seat.passengerName}</td>
                      <td className="px-4 py-3">{seat.flightNumber}</td>
                      <td className="px-4 py-3">{seat.seatDesignator}</td>
                      <td className="px-4 py-3">{seat.seatType}</td>
                      <td className="px-4 py-3">
                        {formatCurrency(seat.price, seat.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-100 gap-4">
              <span className="text-sm font-black text-gray-900">Total</span>
              <span className="text-lg font-black text-primary">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          <div className="flex gap-4 w-full">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsConfirming(false)}
              className="flex-1 h-12 rounded-xl border border-primary text-primary font-black text-xs uppercase tracking-widest gap-4"
            >
              Go Back
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => onConfirm(selectedSeats)}
              className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95 gap-4"
            >
              Confirm
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 gap-2">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div
        className="relative bg-white w-full max-w-5xl rounded-[3rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-500 border border-gray-100 flex flex-col max-h-[95vh]"
        data-testid="seat-selection-modal"
      >
        <div className="p-8 text-center relative border-b border-gray-50">
          <h2 className="text-2xl font-black text-gray-900">Seat Selection</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
            {isLCC
              ? "Pre-select your preferred seat"
              : "Choose your seat at no extra cost"}
          </p>
          <Button
            variant="ghost"
            size="md"
            onClick={onClose}
            className="absolute top-8 right-8 p-2 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <X size={20} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 space-y-12">
          {/* Passenger Selection */}
          <div className="flex items-center justify-center gap-6">
            <Button
              variant="outline"
              size="md"
              onClick={() =>
                setSelectedPassengerIdx((prev) => Math.max(0, prev - 1))
              }
              disabled={selectedPassengerIdx === 0}
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-all disabled:opacity-30 gap-2"
            >
              <ChevronLeft size={20} />
            </Button>
            <div className="flex gap-4 flex-wrap justify-center">
              {passengers
                .filter((p) => p.type !== "Infant")
                .map((p, idx) => (
                  <Button
                    variant="outline"
                    size="md"
                    key={p.id}
                    onClick={() => setSelectedPassengerIdx(idx)}
                    className={`px-6 h-14 rounded-[2rem] flex items-center gap-4 border transition-all ${
                      selectedPassengerIdx === idx
                        ? "bg-accent border-accent text-accent-foreground shadow-xl shadow-accent/20 scale-105"
                        : "border-gray-100 text-gray-400"
                    }`}
                  >
                    <img
                      src={p.avatar || getPassengerAvatar(p.firstName)}
                      className="w-8 h-8 rounded-full bg-blue-100 border border-white"
                      alt=""
                    />
                    <div className="text-left">
                      <span className="text-[11px] font-black uppercase tracking-widest block">
                        {`${p.firstName} ${p.lastName}`.trim()}
                      </span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase">
                        {p.type}
                      </span>
                    </div>
                  </Button>
                ))}
            </div>
            <Button
              variant="outline"
              size="md"
              onClick={() =>
                setSelectedPassengerIdx((prev) =>
                  Math.min(
                    passengers.filter((p) => p.type !== "Infant").length - 1,
                    prev + 1,
                  ),
                )
              }
              disabled={
                selectedPassengerIdx ===
                passengers.filter((p) => p.type !== "Infant").length - 1
              }
              className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-all disabled:opacity-30 gap-2"
            >
              <ChevronRight size={20} />
            </Button>
          </div>

          <div className="flex flex-col items-center gap-8 bg-gray-50/50 p-12 rounded-[3.5rem] border border-gray-100">
            {/* Flight Segment Tabs */}
            <div className="flex gap-4 flex-wrap justify-center">
              {segments.map((seg, idx) => (
                <Button
                  variant="outline"
                  size="md"
                  key={seg.id}
                  onClick={() => setSelectedSegmentIdx(idx)}
                  className={`px-6 py-3 rounded-xl text-xs font-black flex items-center gap-3 transition-all ${
                    selectedSegmentIdx === idx
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "border border-primary text-primary hover:bg-primary/10"
                  }`}
                >
                  <span>{seg.origin}</span>
                  <Plane
                    size={14}
                    className={
                      selectedSegmentIdx === idx ? "text-white" : "text-primary"
                    }
                  />
                  <span>{seg.destination}</span>
                </Button>
              ))}
            </div>

            {/* Error State */}
            {error && (
              <div className="w-full max-w-md bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle
                  size={20}
                  className="text-red-500 shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-sm font-bold text-red-700">
                    Unable to load seat map
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Using default layout. Some seats may not reflect actual
                    availability.
                  </p>
                </div>
              </div>
            )}

            {/* Seat Legend */}
            <div className="flex gap-8 flex-wrap justify-center">
              {[
                { label: "Unavailable", color: "bg-gray-200" },
                {
                  label: isLCC ? "Standard ($15+)" : "Available",
                  color: "bg-primary",
                },
                { label: "Exit Row", color: "bg-purple-300" },
                { label: "Selected", color: "bg-accent" },
                { label: "Taken", color: "bg-green-400" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-[10px] font-bold text-gray-400">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Seat Map */}
            <div className="relative w-full max-w-2xl bg-white border border-gray-100 rounded-2xl p-8 overflow-hidden">
              {/* Exit Row Indicators */}
              <div className="absolute left-0 top-[60%] w-6 bg-orange-100 text-orange-600 text-[6px] font-black py-1 text-center -rotate-90 origin-center">
                EXIT
              </div>
              <div className="absolute right-0 top-[60%] w-6 bg-orange-100 text-orange-600 text-[6px] font-black py-1 text-center rotate-90 origin-center">
                EXIT
              </div>

              {/* Cockpit */}
              <div className="w-full flex justify-center mb-6 gap-4">
                <div className="w-24 h-4 bg-gray-100 rounded-t-full text-[6px] font-black text-gray-300 flex items-center justify-center uppercase gap-2">
                  Front
                </div>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Loading Seat Map...
                  </p>
                </div>
              ) : (
                <div className="max-w-sm mx-auto">
                  {/* Column Headers - Dynamic based on seat pattern */}
                  <div className="flex justify-between mb-2 px-4 gap-4">
                    <div className="flex gap-1">
                      {["A", "B", "C"].map((col) => (
                        <div
                          key={col}
                          className="w-8 text-center text-[8px] font-black text-gray-300"
                        >
                          {col}
                        </div>
                      ))}
                    </div>
                    <div className="w-6" /> {/* Aisle */}
                    <div className="flex gap-1">
                      {["D", "E", "F"].map((col) => (
                        <div
                          key={col}
                          className="w-8 text-center text-[8px] font-black text-gray-300"
                        >
                          {col}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Seat Rows */}
                  <div className="space-y-2">
                    {Array.from(displaySeatsByRow.entries()).map(
                      ([rowNum, seats]) => (
                        <div
                          key={rowNum}
                          className="flex items-center justify-between gap-2"
                        >
                          <div className="w-6 text-[8px] font-black text-gray-300 text-right pr-2">
                            {rowNum}
                          </div>
                          {/* Left Section (A, B, C) */}
                          <div className="flex gap-1">
                            {seats
                              .filter((s) => s.sectionIndex === 0)
                              .map((seat) => (
                                <Button
                                  variant="outline"
                                  size="md"
                                  key={seat.designator}
                                  disabled={!seat.available}
                                  onClick={() => handleSeatClick(seat)}
                                  title={
                                    seat.disclosures?.join(". ") || undefined
                                  }
                                  className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 active:scale-95 flex flex-col items-center justify-center text-[6px] font-black ${
                                    !seat.available
                                      ? "bg-gray-200 border-gray-200 text-gray-400 cursor-not-allowed"
                                      : currentSeatSelection?.seatDesignator ===
                                          seat.designator
                                        ? "bg-accent border-accent text-accent-foreground shadow-lg"
                                        : isSeatSelectedByOther(seat.designator)
                                          ? "bg-green-400 border-green-400 text-white cursor-not-allowed"
                                          : seat.isExitRow
                                            ? "bg-purple-200 border-purple-200 text-purple-700 hover:bg-purple-300"
                                            : "bg-white border-gray-100 text-primary hover:border-primary"
                                  }`}
                                >
                                  <span>{seat.designator}</span>
                                  {seat.price !== null && seat.price > 0 && (
                                    <span className="text-[4px]">
                                      ${seat.price}
                                    </span>
                                  )}
                                </Button>
                              ))}
                          </div>
                          <div className="w-6" /> {/* Aisle */}
                          {/* Right Section (D, E, F) */}
                          <div className="flex gap-1">
                            {seats
                              .filter((s) => s.sectionIndex === 1)
                              .map((seat) => (
                                <Button
                                  variant="outline"
                                  size="md"
                                  key={seat.designator}
                                  disabled={!seat.available}
                                  onClick={() => handleSeatClick(seat)}
                                  title={
                                    seat.disclosures?.join(". ") || undefined
                                  }
                                  className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 active:scale-95 flex flex-col items-center justify-center text-[6px] font-black ${
                                    !seat.available
                                      ? "bg-gray-200 border-gray-200 text-gray-400 cursor-not-allowed"
                                      : currentSeatSelection?.seatDesignator ===
                                          seat.designator
                                        ? "bg-accent border-accent text-accent-foreground shadow-lg"
                                        : isSeatSelectedByOther(seat.designator)
                                          ? "bg-green-400 border-green-400 text-white cursor-not-allowed"
                                          : seat.isExitRow
                                            ? "bg-purple-200 border-purple-200 text-purple-700 hover:bg-purple-300"
                                            : "bg-white border-gray-100 text-primary hover:border-primary"
                                  }`}
                                >
                                  <span>{seat.designator}</span>
                                  {seat.price !== null && seat.price > 0 && (
                                    <span className="text-[4px]">
                                      ${seat.price}
                                    </span>
                                  )}
                                </Button>
                              ))}
                          </div>
                          <div className="w-6 text-[8px] font-black text-gray-300 text-left pl-2">
                            {rowNum}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Selection Summary */}
            {selectedSeats.length > 0 && (
              <div className="bg-white/80 p-6 rounded-[2rem] border border-gray-100 space-y-4 w-full max-w-2xl">
                <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest text-xl font-semibold tracking-tight">
                  Your Selections
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedSeats.map((seat, i) => (
                    <div
                      key={i}
                      className="bg-gray-50 rounded-xl p-3 flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="text-[9px] font-black text-gray-600">
                          {seat.passengerName}
                        </p>
                        <p className="text-[8px] font-bold text-gray-400">
                          {seat.flightNumber} - Seat {seat.seatDesignator}
                        </p>
                      </div>
                      <span className="text-[10px] font-black text-primary">
                        {formatCurrency(seat.price, seat.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="flex flex-col items-center gap-6 w-full">
              <Button
                onClick={() =>
                  selectedSeats.length > 0 && setIsConfirming(true)
                }
                disabled={selectedSeats.length === 0}
                data-testid="confirm-seat-selection"
                className="w-full max-w-xl h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm uppercase tracking-[4px] shadow-2xl shadow-primary/20 transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Seats{" "}
                {totalAmount > 0 && ` - ${formatCurrency(totalAmount)}`}
              </Button>
              <div className="flex items-start gap-3 max-w-lg">
                <Info
                  size={16}
                  className="text-accent-foreground shrink-0 mt-0.5"
                />
                <p className="text-[9px] font-bold text-gray-500 leading-relaxed uppercase tracking-wide italic">
                  Infants do not require a separate seat. If you need a
                  bassinet, please use the Special Services section.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelectionPopup;
