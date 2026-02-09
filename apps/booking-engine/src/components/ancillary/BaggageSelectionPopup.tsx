import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Luggage, Briefcase, Plane, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../lib/utils';
import { 
    Passenger, 
    FlightSegmentInfo, 
    SelectedBaggage, 
    BaggageOption,
    DEFAULT_BAGGAGE_OPTIONS,
    getPassengerAvatar 
} from '../../lib/ancillary-types';

interface BaggageSelectionPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (baggage: SelectedBaggage[]) => void;
    isLCC?: boolean;
    passengers: Passenger[];
    segments: FlightSegmentInfo[];
    includedBaggage?: { quantity: number; weight?: number; unit?: string }[];
    availableOptions?: BaggageOption[];
    existingSelections?: SelectedBaggage[];
}

export const BaggageSelectionPopup = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    isLCC = false,
    passengers,
    segments,
    includedBaggage,
    availableOptions,
    existingSelections = []
}: BaggageSelectionPopupProps) => {
    const [selectedPassengerIdx, setSelectedPassengerIdx] = useState(0);
    const [selectedSegmentIdx, setSelectedSegmentIdx] = useState(0);
    const [isConfirming, setIsConfirming] = useState(false);
    const [selectedBaggage, setSelectedBaggage] = useState<SelectedBaggage[]>(existingSelections);
    const [selectedOptionId, setSelectedOptionId] = useState('');

    // Use provided options or defaults
    const baggageOptions: BaggageOption[] = availableOptions && availableOptions.length > 0 
        ? availableOptions 
        : DEFAULT_BAGGAGE_OPTIONS.map(opt => ({
            ...opt,
            price: isLCC ? opt.price : Math.round(opt.price * 1.3) // FSC typically more expensive
        }));

    const currentPassenger = passengers[selectedPassengerIdx];
    const currentSegment = segments[selectedSegmentIdx];

    // Get baggage for current passenger/segment
    const currentSelections = selectedBaggage.filter(
        b => b.passengerId === currentPassenger?.id && b.segmentId === currentSegment?.id
    );

    const handleAddBaggage = () => {
        if (!selectedOptionId || !currentPassenger || !currentSegment) return;

        const option = baggageOptions.find(o => o.id === selectedOptionId);
        if (!option) return;

        const newBaggage: SelectedBaggage = {
            passengerId: currentPassenger.id,
            passengerName: `${currentPassenger.firstName} ${currentPassenger.lastName}`.trim(),
            segmentId: currentSegment.id,
            flightNumber: currentSegment.flightNumber,
            baggageId: option.id,
            weight: option.weight,
            weightUnit: option.weightUnit,
            price: option.price,
            currency: option.currency
        };

        setSelectedBaggage(prev => [...prev, newBaggage]);
        setSelectedOptionId('');
    };

    const handleRemoveBaggage = (index: number) => {
        // Find the actual index in the full array
        let count = 0;
        let actualIdx = -1;
        for (let i = 0; i < selectedBaggage.length; i++) {
            if (selectedBaggage[i].passengerId === currentPassenger?.id && 
                selectedBaggage[i].segmentId === currentSegment?.id) {
                if (count === index) {
                    actualIdx = i;
                    break;
                }
                count++;
            }
        }
        if (actualIdx >= 0) {
            setSelectedBaggage(prev => prev.filter((_, i) => i !== actualIdx));
        }
    };

    const totalAmount = selectedBaggage.reduce((sum, b) => sum + b.price, 0);

    // Calculate included baggage display
    const includedDisplay = includedBaggage && includedBaggage.length > 0
        ? `${includedBaggage[0].quantity} x ${includedBaggage[0].weight || 23}${includedBaggage[0].unit || 'kg'}`
        : isLCC ? 'No checked baggage included' : '2 x 23kg checked bags included';

    if (!isOpen) return null;

    if (isConfirming) {
        return (
            <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsConfirming(false)} />
                <div className="relative bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-12 flex flex-col items-center gap-8 animate-in zoom-in-95 duration-300">
                    <div className="w-16 h-16 rounded-full bg-[#10B981] flex items-center justify-center shadow-xl shadow-green-100 relative">
                        <Luggage className="w-8 h-8 text-white" />
                        <div className="absolute inset-0 bg-[#10B981] blur-2xl opacity-40 scale-150 animate-pulse" />
                    </div>
                    <h2 className="text-xl font-black text-gray-900 text-center leading-relaxed">Confirm Extra Baggage</h2>
                    
                    <div className="w-full space-y-3 max-h-48 overflow-y-auto">
                        {selectedBaggage.map((bag, i) => (
                            <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                                <div>
                                    <p className="text-[10px] font-black text-gray-900">{bag.passengerName}</p>
                                    <p className="text-[8px] font-bold text-gray-400">{bag.flightNumber} - {bag.weight}{bag.weightUnit}</p>
                                </div>
                                <span className="text-sm font-black text-[#8B5CF6]">{formatCurrency(bag.price)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center w-full pt-4 border-t border-gray-100">
                        <span className="text-sm font-black text-gray-900">Total</span>
                        <span className="text-xl font-black text-[#8B5CF6]">{formatCurrency(totalAmount)}</span>
                    </div>

                    <div className="flex gap-4 w-full">
                        <button onClick={() => setIsConfirming(false)} className="flex-1 h-12 rounded-xl border border-[#8B5CF6] text-[#8B5CF6] font-black text-xs uppercase tracking-widest transition-colors hover:bg-purple-50">Go Back</button>
                        <button onClick={() => onConfirm(selectedBaggage)} className="flex-1 h-12 rounded-xl bg-[#8B5CF6] text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-100 transition-all hover:-translate-y-0.5 active:scale-95">Confirm</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />

            <div className="relative bg-white w-full max-w-5xl rounded-[3rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-500 border border-gray-100 flex flex-col max-h-[95vh]" data-testid="baggage-selection-modal">

                {/* Header */}
                <div className="p-8 text-center relative border-b border-gray-50">
                    <h2 className="text-2xl font-black text-gray-900">Extra Baggage</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Add additional checked baggage to your booking</p>
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
                            className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[#8B5CF6] hover:bg-purple-50 transition-all disabled:opacity-30"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex gap-4 flex-wrap justify-center">
                            {passengers.map((p, idx) => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedPassengerIdx(idx)}
                                    className={`px-6 h-14 rounded-[2rem] flex items-center gap-4 border transition-all ${selectedPassengerIdx === idx
                                        ? 'bg-[#FFD700] border-[#FFD700] shadow-xl shadow-yellow-100'
                                        : 'border-yellow-200 text-gray-400 bg-white'
                                        }`}
                                >
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 border-2 border-white">
                                        <img src={p.avatar || getPassengerAvatar(p.firstName)} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="text-left">
                                        <span className="text-[11px] font-black uppercase tracking-widest block">{`${p.firstName} ${p.lastName}`.trim()}</span>
                                        <span className="text-[8px] font-bold text-gray-400 uppercase">{p.type}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={() => setSelectedPassengerIdx(prev => Math.min(passengers.length - 1, prev + 1))}
                            disabled={selectedPassengerIdx === passengers.length - 1}
                            className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[#8B5CF6] hover:bg-purple-50 transition-all disabled:opacity-30"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Main Selection Area */}
                    <div className="bg-gray-100/50 p-10 rounded-[3rem] space-y-8">
                        {/* Flight Tabs */}
                        <div className="flex justify-center">
                            <div className="bg-white p-2 rounded-2xl flex gap-4 flex-wrap justify-center">
                                {segments.map((seg, idx) => (
                                    <button
                                        key={seg.id}
                                        onClick={() => setSelectedSegmentIdx(idx)}
                                        className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all ${
                                            selectedSegmentIdx === idx 
                                                ? 'bg-[#8B5CF6] text-white shadow-lg' 
                                                : 'border border-[#8B5CF6] text-[#8B5CF6]'
                                        }`}
                                    >
                                        {seg.origin}
                                        <Plane size={14} className={`transform rotate-90 ${selectedSegmentIdx === idx ? 'text-white/70' : ''}`} />
                                        {seg.destination}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Current Allowance Info */}
                        <div className="flex justify-center gap-4 flex-wrap">
                            <div className="bg-white px-6 py-3 rounded-full flex items-center gap-3 border border-gray-50">
                                <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center text-[#8B5CF6]">
                                    <Luggage className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-bold text-gray-500">{includedDisplay}</span>
                            </div>
                            <div className="bg-white px-6 py-3 rounded-full flex items-center gap-3 border border-gray-100">
                                <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center text-[#8B5CF6]">
                                    <Briefcase className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-bold text-gray-500">
                                    {isLCC ? '1x7kg cabin bag' : '1x10kg cabin bag included'}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white p-10 rounded-[2.5rem] border border-gray-50 shadow-sm space-y-8">
                            {/* Add Baggage Form */}
                            <div className="flex gap-4 flex-wrap">
                                <div className="flex-1 min-w-[200px] relative">
                                    <select
                                        value={selectedOptionId}
                                        onChange={(e) => setSelectedOptionId(e.target.value)}
                                        className="w-full h-12 px-6 bg-gray-50 border border-transparent rounded-xl text-[11px] font-bold text-gray-600 appearance-none outline-none focus:border-[#8B5CF6]/20 transition-all"
                                    >
                                        <option value="">Select Baggage Option</option>
                                        {baggageOptions.map(opt => (
                                            <option key={opt.id} value={opt.id}>
                                                {opt.weight}{opt.weightUnit} Extra - {formatCurrency(opt.price)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={handleAddBaggage}
                                    disabled={!selectedOptionId}
                                    className="h-12 px-10 bg-[#FFD700] hover:bg-[#F4CE14] disabled:bg-gray-200 disabled:text-gray-400 text-black rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-yellow-50 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <Plus size={16} /> Add
                                </button>
                            </div>

                            {/* Current Selections for this Passenger/Segment */}
                            {currentSelections.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        Selected for {currentPassenger?.firstName} on {currentSegment?.origin}-{currentSegment?.destination}
                                    </p>
                                    {currentSelections.map((bag, i) => (
                                        <div key={i} className="flex items-center justify-between pb-4 border-b border-gray-50 last:border-0">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#8B5CF6]">
                                                    <Luggage size={20} />
                                                </div>
                                                <div>
                                                    <span className="text-sm font-black text-gray-900">{bag.weight}{bag.weightUnit} Extra Baggage</span>
                                                    <p className="text-[9px] font-bold text-gray-400">{bag.flightNumber}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm font-black text-gray-900">{formatCurrency(bag.price)}</span>
                                                <button
                                                    onClick={() => handleRemoveBaggage(i)}
                                                    className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Total Bar */}
                            <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                                <span className="text-sm font-black text-gray-900 uppercase tracking-[2px]">Total Baggage Cost</span>
                                <span className="text-xl font-black text-[#8B5CF6]">{formatCurrency(totalAmount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* All Selections Summary */}
                    {selectedBaggage.length > 0 && (
                        <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
                            <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest mb-4">All Baggage Selections</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {selectedBaggage.map((bag, i) => (
                                    <div key={i} className="bg-white rounded-xl p-3 flex items-center justify-between border border-gray-100">
                                        <div>
                                            <p className="text-[9px] font-black text-gray-700">{bag.passengerName}</p>
                                            <p className="text-[8px] font-bold text-gray-400">{bag.flightNumber} - {bag.weight}{bag.weightUnit}</p>
                                        </div>
                                        <span className="text-[10px] font-black text-[#8B5CF6]">{formatCurrency(bag.price)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer CTA */}
                    <div className="flex justify-center pt-4">
                        <Button
                            onClick={() => selectedBaggage.length > 0 && setIsConfirming(true)}
                            disabled={selectedBaggage.length === 0}
                            className="w-full max-w-xl h-14 rounded-2xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-black text-sm uppercase tracking-[4px] shadow-2xl shadow-purple-100 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                        >
                            Add Baggage {totalAmount > 0 && ` - ${formatCurrency(totalAmount)}`}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
