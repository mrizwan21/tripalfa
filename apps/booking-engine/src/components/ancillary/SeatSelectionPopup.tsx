import React, { useState, useMemo, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Info, Loader2, Plane } from 'lucide-react';
import { Button } from '../ui/button';
import { useQuery } from '@tanstack/react-query';
import { fetchSeatMaps } from '../../lib/api';
import { formatCurrency } from '@tripalfa/ui-components';
import { 
    Passenger, 
    FlightSegmentInfo, 
    SelectedSeat, 
    getPassengerAvatar 
} from '../../lib/ancillary-types';

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

export const SeatSelectionPopup = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    isLCC = false, 
    offerId,
    passengers,
    segments,
    existingSelections = []
}: SeatSelectionPopupProps): React.JSX.Element | null => {
    const [selectedPassengerIdx, setSelectedPassengerIdx] = useState(0);
    const [selectedSegmentIdx, setSelectedSegmentIdx] = useState(0);
    const [isConfirming, setIsConfirming] = useState(false);
    const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>(existingSelections);

    const { data: seatMaps, isLoading } = useQuery({
        queryKey: ['seat-maps', offerId],
        queryFn: () => fetchSeatMaps(offerId!),
        enabled: !!offerId && isOpen
    });

    const [seatMap, setSeatMap] = useState<any[]>([]);

    // Reset selections when segment changes
    useEffect(() => {
        setSelectedPassengerIdx(0);
    }, [selectedSegmentIdx]);

    // Generate mock seat map if no real data
    useEffect(() => {
        if (seatMaps && seatMaps.length > 0) {
            const firstMap = seatMaps[selectedSegmentIdx] || seatMaps[0];
            const flatMap: any[] = [];
            firstMap.cabins?.forEach((cabin: any) => {
                cabin.rows?.forEach((row: any) => {
                    row.sections?.forEach((section: any) => {
                        section.elements?.forEach((element: any) => {
                            if (element.type === 'seat') {
                                flatMap.push({
                                    id: element.designator,
                                    designator: element.designator,
                                    status: element.available_services?.length > 0 ? 'available' : 'unavailable',
                                    price: parseFloat(element.available_services?.[0]?.total_amount || '0'),
                                    isExitRow: row.is_exit_row === true
                                });
                            }
                        });
                    });
                });
            });
            setSeatMap(flatMap);
        } else if (!isLoading && !seatMaps && isOpen) {
            // Generate mock seats (15 rows x 6 seats)
            const mockSeats = Array.from({ length: 90 }, (_, i) => {
                const row = Math.floor(i / 6) + 1;
                const col = 'ABCDEF'[i % 6];
                const isExitRow = row >= 10 && row <= 11;
                return {
                    id: `${row}${col}`,
                    designator: `${row}${col}`,
                    status: Math.random() > 0.25 ? 'available' : 'unavailable',
                    price: isLCC ? (row < 4 ? 25 : (isExitRow ? 35 : 15)) : (row < 4 ? 50 : (isExitRow ? 45 : 0)),
                    isExitRow
                };
            });
            setSeatMap(mockSeats);
        }
    }, [seatMaps, isLoading, isOpen, selectedSegmentIdx, isLCC]);

    const currentPassenger = passengers[selectedPassengerIdx];
    const currentSegment = segments[selectedSegmentIdx];

    // Get seat selection for current passenger/segment combo
    const getCurrentSelectionKey = () => `${currentPassenger?.id}-${currentSegment?.id}`;
    
    const currentSeatSelection = useMemo(() => {
        return selectedSeats.find(
            s => s.passengerId === currentPassenger?.id && s.segmentId === currentSegment?.id
        );
    }, [selectedSeats, currentPassenger, currentSegment]);

    const handleSeatClick = (seat: any) => {
        if (seat.status === 'unavailable') return;

        const newSeat: SelectedSeat = {
            passengerId: currentPassenger.id,
            passengerName: `${currentPassenger.firstName} ${currentPassenger.lastName}`.trim(),
            segmentId: currentSegment.id,
            flightNumber: currentSegment.flightNumber,
            seatDesignator: seat.designator,
            seatType: seat.isExitRow ? 'Exit Row' : (seat.price > 20 ? 'Extra Legroom' : 'Standard'),
            price: seat.price,
            currency: 'USD'
        };

        setSelectedSeats(prev => {
            // Remove existing selection for this passenger-segment combo
            const filtered = prev.filter(
                s => !(s.passengerId === currentPassenger.id && s.segmentId === currentSegment.id)
            );
            // Add new selection
            return [...filtered, newSeat];
        });
    };

    const totalAmount = selectedSeats.reduce((sum, s) => sum + s.price, 0);

    if (!isOpen) return null;

    if (isConfirming) {
        return (
            <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsConfirming(false)} />
                <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-12 flex flex-col items-center gap-8 animate-in zoom-in-95 duration-300">
                    <div className="w-16 h-16 rounded-full bg-[#10B981] flex items-center justify-center shadow-xl shadow-green-100 relative">
                        <div className="absolute inset-0 bg-[#10B981] blur-xl opacity-20 scale-150 animate-pulse" />
                    </div>
                    <h2 className="text-xl font-black text-gray-900 text-center">Confirm Seat Selection</h2>

                    <div className="w-full space-y-4">
                        <p className="text-[10px] font-black text-center text-[#8B5CF6] uppercase tracking-widest">Seat Selection Summary</p>
                        <div className="max-h-64 overflow-y-auto">
                            <table className="w-full border-collapse">
                                <thead className="sticky top-0 bg-white">
                                    <tr className="border-b border-gray-50">
                                        <th className="px-4 py-2 text-left text-[8px] font-black text-gray-400 uppercase tracking-widest">Passenger</th>
                                        <th className="px-4 py-2 text-left text-[8px] font-black text-gray-400 uppercase tracking-widest">Flight</th>
                                        <th className="px-4 py-2 text-left text-[8px] font-black text-gray-400 uppercase tracking-widest">Seat</th>
                                        <th className="px-4 py-2 text-left text-[8px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                                        <th className="px-4 py-2 text-left text-[8px] font-black text-gray-400 uppercase tracking-widest">Price</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {selectedSeats.map((seat, i) => (
                                        <tr key={i} className="text-[9px] font-bold text-gray-600">
                                            <td className="px-4 py-3">{seat.passengerName}</td>
                                            <td className="px-4 py-3">{seat.flightNumber}</td>
                                            <td className="px-4 py-3">{seat.seatDesignator}</td>
                                            <td className="px-4 py-3">{seat.seatType}</td>
                                            <td className="px-4 py-3">{formatCurrency(seat.price)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                            <span className="text-sm font-black text-gray-900">Total</span>
                            <span className="text-lg font-black text-[#8B5CF6]">{formatCurrency(totalAmount)}</span>
                        </div>
                    </div>

                    <div className="flex gap-4 w-full">
                        <button onClick={() => setIsConfirming(false)} className="flex-1 h-12 rounded-xl border border-[#8B5CF6] text-[#8B5CF6] font-black text-xs uppercase tracking-widest">Go Back</button>
                        <button onClick={() => onConfirm(selectedSeats)} className="flex-1 h-12 rounded-xl bg-[#8B5CF6] text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-100 transition-all active:scale-95">Confirm</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />

            <div className="relative bg-white w-full max-w-5xl rounded-[3rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-500 border border-gray-100 flex flex-col max-h-[95vh]" data-testid="seat-selection-modal">

                <div className="p-8 text-center relative border-b border-gray-50">
                    <h2 className="text-2xl font-black text-gray-900">Seat Selection</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                        {isLCC ? 'Pre-select your preferred seat' : 'Choose your seat at no extra cost'}
                    </p>
                    <button onClick={onClose} className="absolute top-8 right-8 p-2 text-gray-400 hover:text-gray-900 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-12 space-y-12">
                    {/* Passenger Selection */}
                    <div className="flex items-center justify-center gap-6">
                        <button 
                            onClick={() => setSelectedPassengerIdx(prev => Math.max(0, prev - 1))}
                            disabled={selectedPassengerIdx === 0}
                            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-all disabled:opacity-30"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex gap-4 flex-wrap justify-center">
                            {passengers.filter(p => p.type !== 'Infant').map((p, idx) => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedPassengerIdx(idx)}
                                    className={`px-6 h-14 rounded-[2rem] flex items-center gap-4 border transition-all ${selectedPassengerIdx === idx
                                        ? 'bg-[#FFD700] border-[#FFD700] shadow-xl shadow-yellow-100 scale-105'
                                        : 'border-gray-100 text-gray-400'
                                        }`}
                                >
                                    <img src={p.avatar || getPassengerAvatar(p.firstName)} className="w-8 h-8 rounded-full bg-blue-100 border border-white" alt="" />
                                    <div className="text-left">
                                        <span className="text-[11px] font-black uppercase tracking-widest block">{`${p.firstName} ${p.lastName}`.trim()}</span>
                                        <span className="text-[8px] font-bold text-gray-400 uppercase">{p.type}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={() => setSelectedPassengerIdx(prev => Math.min(passengers.filter(p => p.type !== 'Infant').length - 1, prev + 1))}
                            disabled={selectedPassengerIdx === passengers.filter(p => p.type !== 'Infant').length - 1}
                            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-all disabled:opacity-30"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div className="flex flex-col items-center gap-8 bg-gray-50/50 p-12 rounded-[3.5rem] border border-gray-100">
                        {/* Flight Segment Tabs */}
                        <div className="flex gap-4 flex-wrap justify-center">
                            {segments.map((seg, idx) => (
                                <button
                                    key={seg.id}
                                    onClick={() => setSelectedSegmentIdx(idx)}
                                    className={`px-6 py-3 rounded-xl text-xs font-black flex items-center gap-3 transition-all ${
                                        selectedSegmentIdx === idx 
                                            ? 'bg-[#8B5CF6] text-white shadow-lg' 
                                            : 'border border-[#8B5CF6] text-[#8B5CF6] hover:bg-purple-50'
                                    }`}
                                >
                                    <span>{seg.origin}</span>
                                    <Plane size={14} className={selectedSegmentIdx === idx ? 'text-white' : 'text-[#8B5CF6]'} />
                                    <span>{seg.destination}</span>
                                </button>
                            ))}
                        </div>

                        {/* Seat Legend */}
                        <div className="flex gap-8 flex-wrap justify-center">
                            {[
                                { label: 'Unavailable', color: 'bg-gray-200' },
                                { label: isLCC ? 'Standard ($15+)' : 'Free Seat', color: 'bg-[#8B5CF6]' },
                                { label: 'Exit Row', color: 'bg-purple-300' },
                                { label: 'Selected', color: 'bg-[#FFD700]' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                                    <span className="text-[10px] font-bold text-gray-400">{item.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Seat Map */}
                        <div className="relative w-full max-w-2xl bg-white border border-gray-100 rounded-2xl p-8 overflow-hidden">
                            {/* Exit Row Indicators */}
                            <div className="absolute left-0 top-[60%] w-6 bg-orange-100 text-orange-600 text-[6px] font-black py-1 text-center -rotate-90 origin-center">EXIT</div>
                            <div className="absolute right-0 top-[60%] w-6 bg-orange-100 text-orange-600 text-[6px] font-black py-1 text-center rotate-90 origin-center">EXIT</div>
                            
                            {/* Cockpit */}
                            <div className="w-full flex justify-center mb-6">
                                <div className="w-24 h-4 bg-gray-100 rounded-t-full text-[6px] font-black text-gray-300 flex items-center justify-center uppercase">Front</div>
                            </div>

                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center p-20 gap-4">
                                    <Loader2 className="w-8 h-8 text-[#8B5CF6] animate-spin" />
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Seat Map...</p>
                                </div>
                            ) : (
                                <div className="max-w-sm mx-auto">
                                    {/* Column Headers */}
                                    <div className="flex justify-between mb-2 px-8">
                                        <div className="flex gap-1">
                                            {['A', 'B', 'C'].map(col => (
                                                <div key={col} className="w-8 text-center text-[8px] font-black text-gray-300">{col}</div>
                                            ))}
                                        </div>
                                        <div className="w-6" /> {/* Aisle */}
                                        <div className="flex gap-1">
                                            {['D', 'E', 'F'].map(col => (
                                                <div key={col} className="w-8 text-center text-[8px] font-black text-gray-300">{col}</div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Seat Rows */}
                                    <div className="space-y-1">
                                        {Array.from({ length: Math.ceil(seatMap.length / 6) }, (_, rowIdx) => {
                                            const rowSeats = seatMap.slice(rowIdx * 6, rowIdx * 6 + 6);
                                            const rowNum = rowIdx + 1;
                                            return (
                                                <div key={rowIdx} className="flex items-center justify-between">
                                                    <div className="w-6 text-[8px] font-black text-gray-300 text-right pr-2">{rowNum}</div>
                                                    <div className="flex gap-1">
                                                        {rowSeats.slice(0, 3).map((seat) => (
                                                            <button
                                                                key={seat.designator}
                                                                disabled={seat.status === 'unavailable'}
                                                                onClick={() => handleSeatClick(seat)}
                                                                className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 active:scale-95 flex flex-col items-center justify-center text-[6px] font-black ${
                                                                    seat.status === 'unavailable' 
                                                                        ? 'bg-gray-200 border-gray-200 text-gray-400 cursor-not-allowed' 
                                                                        : currentSeatSelection?.seatDesignator === seat.designator
                                                                            ? 'bg-[#FFD700] border-[#FFD700] text-black shadow-lg' 
                                                                            : selectedSeats.some(s => s.seatDesignator === seat.designator && s.segmentId === currentSegment.id)
                                                                                ? 'bg-green-400 border-green-400 text-white'
                                                                                : seat.isExitRow 
                                                                                    ? 'bg-purple-200 border-purple-200 text-purple-700 hover:bg-purple-300' 
                                                                                    : 'bg-white border-gray-100 text-[#8B5CF6] hover:border-[#8B5CF6]'
                                                                }`}
                                                            >
                                                                <span>{seat.designator}</span>
                                                                {seat.price > 0 && <span className="text-[4px]">${seat.price}</span>}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="w-6" /> {/* Aisle */}
                                                    <div className="flex gap-1">
                                                        {rowSeats.slice(3, 6).map((seat) => (
                                                            <button
                                                                key={seat.designator}
                                                                disabled={seat.status === 'unavailable'}
                                                                onClick={() => handleSeatClick(seat)}
                                                                className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 active:scale-95 flex flex-col items-center justify-center text-[6px] font-black ${
                                                                    seat.status === 'unavailable' 
                                                                        ? 'bg-gray-200 border-gray-200 text-gray-400 cursor-not-allowed' 
                                                                        : currentSeatSelection?.seatDesignator === seat.designator
                                                                            ? 'bg-[#FFD700] border-[#FFD700] text-black shadow-lg' 
                                                                            : selectedSeats.some(s => s.seatDesignator === seat.designator && s.segmentId === currentSegment.id)
                                                                                ? 'bg-green-400 border-green-400 text-white'
                                                                                : seat.isExitRow 
                                                                                    ? 'bg-purple-200 border-purple-200 text-purple-700 hover:bg-purple-300' 
                                                                                    : 'bg-white border-gray-100 text-[#8B5CF6] hover:border-[#8B5CF6]'
                                                                }`}
                                                            >
                                                                <span>{seat.designator}</span>
                                                                {seat.price > 0 && <span className="text-[4px]">${seat.price}</span>}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="w-6 text-[8px] font-black text-gray-300 text-left pl-2">{rowNum}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Selection Summary */}
                        {selectedSeats.length > 0 && (
                            <div className="bg-white/80 p-6 rounded-[2rem] border border-gray-100 space-y-4 w-full max-w-2xl">
                                <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Your Selections</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {selectedSeats.map((seat, i) => (
                                        <div key={i} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                                            <div>
                                                <p className="text-[9px] font-black text-gray-600">{seat.passengerName}</p>
                                                <p className="text-[8px] font-bold text-gray-400">{seat.flightNumber} - Seat {seat.seatDesignator}</p>
                                            </div>
                                            <span className="text-[10px] font-black text-[#8B5CF6]">{formatCurrency(seat.price)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* CTA */}
                        <div className="flex flex-col items-center gap-6 w-full">
                            <Button
                                onClick={() => selectedSeats.length > 0 && setIsConfirming(true)}
                                disabled={selectedSeats.length === 0}
                                data-testid="confirm-seat-selection"
                                className="w-full max-w-xl h-14 rounded-2xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-black text-sm uppercase tracking-[4px] shadow-2xl shadow-purple-100 transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add Seats {totalAmount > 0 && ` - ${formatCurrency(totalAmount)}`}
                            </Button>
                            <div className="flex items-start gap-3 max-w-lg">
                                <Info size={16} className="text-[#FFD700] shrink-0 mt-0.5" />
                                <p className="text-[9px] font-bold text-gray-500 leading-relaxed uppercase tracking-wide italic">
                                    Infants do not require a separate seat. If you need a bassinet, please use the Special Services section.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
