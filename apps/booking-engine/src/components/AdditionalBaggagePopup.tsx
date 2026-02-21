import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Info, Plus, Luggage, Briefcase } from 'lucide-react';
import { Button } from './ui/button';

interface AdditionalBaggagePopupProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (baggage: any[]) => void;
    isLCC?: boolean;
    availableServices?: any[];
    /** Number of passengers – drives the passenger selector. Defaults to 1. */
    passengerCount?: number;
}

export const AdditionalBaggagePopup = ({ isOpen, onClose, onConfirm, isLCC = false, availableServices, passengerCount = 1 }: AdditionalBaggagePopupProps) => {
    const [selectedPassenger, setSelectedPassenger] = useState(1);
    const [isConfirming, setIsConfirming] = useState(false);

    // Real Baggage Options from availableServices
    const baggageOptions = (availableServices || [])
        .filter((s: any) => s.type === 'baggage')
        .map((s: any) => ({
            id: s.id,
            label: `${s.metadata?.maximum_weight_kg}${s.metadata?.weight_unit || 'kg'} ${s.metadata?.type || 'Extra'}`,
            price: parseFloat(s.total_amount),
            currency: s.total_currency
        }));

    // Fallback if no dynamic baggage
    const [bags, setBags] = useState<any[]>([]);
    const [selectedBagId, setSelectedBagId] = useState('');

    if (!isOpen) return null;

    // Generate passenger list from count – no hardcoded names
    const passengers = Array.from({ length: Math.max(1, passengerCount) }, (_, i) => ({
        id: i + 1,
        label: `Passenger ${i + 1}`,
    }));

    if (isConfirming) {
        return (
            <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsConfirming(false)} />
                <div className="relative bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-12 flex flex-col items-center gap-8 animate-in zoom-in-95 duration-300">
                    <div className="w-16 h-16 rounded-full bg-[#10B981] flex items-center justify-center shadow-xl shadow-green-100 relative">
                        <div className="absolute inset-0 bg-[#10B981] blur-2xl opacity-40 scale-150 animate-pulse" />
                    </div>
                    <h2 className="text-xl font-black text-gray-900 text-center leading-relaxed">Are you sure you want to add extra baggage to the booking</h2>
                    <div className="flex gap-4 w-full">
                        <button onClick={() => setIsConfirming(false)} className="flex-1 h-12 rounded-xl border border-[#8B5CF6] text-[#8B5CF6] font-black text-xs uppercase tracking-widest transition-colors hover:bg-purple-50">No Need</button>
                        <button onClick={() => onConfirm(bags)} className="flex-1 h-12 rounded-xl bg-[#8B5CF6] text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-100 transition-all hover:-translate-y-0.5 active:scale-95">Yes, Sure</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />

            <div className="relative bg-white w-full max-w-5xl rounded-[3rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-500 border border-gray-100 flex flex-col max-h-[95vh]" data-testid="ancillary-modification-modal">

                {/* Header */}
                <div className="p-8 text-center relative">
                    <h2 className="text-2xl font-black text-gray-900">Additional Baggage Request</h2>
                    <button onClick={onClose} className="absolute top-8 right-8 p-2 text-gray-400 hover:text-gray-900 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-12 space-y-12">
                    {/* Passenger Selection */}
                    <div className="flex items-center justify-center gap-6 border-b border-gray-100 pb-10">
                        <button className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[#8B5CF6] hover:bg-purple-50 transition-all">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex gap-4 flex-wrap justify-center">
                            {passengers.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedPassenger(p.id)}
                                    className={`px-8 h-14 rounded-[2rem] flex items-center gap-3 border transition-all ${selectedPassenger === p.id
                                        ? 'bg-[#FFD700] border-[#FFD700] shadow-xl shadow-yellow-100 text-gray-900'
                                        : 'border-yellow-200 text-gray-400 bg-white hover:border-yellow-300'
                                        }`}
                                >
                                    {/* Generic avatar circle with passenger number */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black border-2 border-white ${selectedPassenger === p.id ? 'bg-gray-900 text-white' : 'bg-purple-100 text-purple-600'}`}>
                                        {p.id}
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-widest">{p.label}</span>
                                </button>
                            ))}
                        </div>
                        <button className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-[#8B5CF6] hover:bg-purple-50 transition-all">
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Main Selection Area */}
                    <div className="bg-gray-100/50 p-10 rounded-[3rem] space-y-8">
                        {/* Flight Tabs */}
                        <div className="flex justify-center">
                            <div className="bg-white p-2 rounded-2xl flex gap-4">
                                <button className="px-10 py-3 bg-[#8B5CF6] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-3">FIG4312 <img src="/airplane-white.svg" className="w-4 h-4 opacity-50 rotate-90" /></button>
                                <button className="px-10 py-3 border border-[#8B5CF6] text-[#8B5CF6] rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-3">FIG4312 <img src="/airplane-purple.svg" className="w-4 h-4 opacity-50 rotate-90" /></button>
                            </div>
                        </div>

                        {/* Current Allowance Info */}
                        <div className="flex justify-center gap-4">
                            <div className="bg-white px-6 py-3 rounded-full flex items-center gap-3 border border-gray-50">
                                <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center text-[#8B5CF6]"><Luggage className="w-4 h-4" /></div>
                                <span className="text-[10px] font-bold text-gray-500">
                                    {isLCC ? "0 x 15 Kgs Included (Buy Below)" : "2 x 23 Kgs Checked-in Bags Included"}
                                </span>
                            </div>
                            <div className="bg-white px-6 py-3 rounded-full flex items-center gap-3 border border-gray-100">
                                <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center text-[#8B5CF6]"><Briefcase className="w-4 h-4" /></div>
                                <span className="text-[10px] font-bold text-gray-500">
                                    {isLCC ? "1x7 kg cabin bag only" : "1x10 kg cabin bag included"}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white p-10 rounded-[2.5rem] border border-gray-50 shadow-sm space-y-10">
                            <div className="flex gap-4">
                                <div className="flex-1 relative">
                                    <select
                                        value={selectedBagId}
                                        onChange={(e) => setSelectedBagId(e.target.value)}
                                        className="w-full h-12 px-6 bg-gray-50 border border-transparent rounded-xl text-[11px] font-bold text-gray-500 appearance-none outline-none focus:border-[#8B5CF6]/20 transition-all font-sans"
                                    >
                                        <option value="">Select Extra Weight</option>
                                        {baggageOptions.length > 0 ? (
                                            baggageOptions.map(opt => (
                                                <option key={opt.id} value={opt.id}>{opt.label} - ${opt.price}</option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="m1">15Kg Extra - ${isLCC ? 35 : 65}</option>
                                                <option value="m2">20Kg Extra - ${isLCC ? 45 : 85}</option>
                                                <option value="m3">30Kg Extra - ${isLCC ? 65 : 120}</option>
                                            </>
                                        )}
                                    </select>
                                    <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 rotate-90 text-gray-400" size={14} />
                                </div>
                                <input id="baggage-note" name="baggage-note" type="text" placeholder="Add Note" className="flex-1 h-12 px-6 bg-gray-50 border border-transparent rounded-xl text-[11px] font-bold outline-none focus:border-[#8B5CF6]/20 transition-all" />
                                <button
                                    onClick={() => {
                                        if (!selectedBagId) return;
                                        const opt = baggageOptions.find(o => o.id === selectedBagId) || {
                                            id: selectedBagId,
                                            label: selectedBagId === 'm1' ? '15Kg Extra' : selectedBagId === 'm2' ? '20Kg Extra' : '30Kg Extra',
                                            price: selectedBagId === 'm1' ? (isLCC ? 35 : 65) : selectedBagId === 'm2' ? (isLCC ? 45 : 85) : (isLCC ? 65 : 120)
                                        };
                                        setBags(p => [...p, opt]);
                                        setSelectedBagId('');
                                    }}
                                    className="h-12 px-12 bg-[#FFD700] hover:bg-[#F4CE14] text-black rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-yellow-50 transition-all active:scale-95"
                                >
                                    Add
                                </button>
                            </div>

                            {/* Selection Summary Table */}
                            <div className="space-y-4">
                                {bags.map((bag: any, i: number) => (
                                    <div key={`${bag.id}-${i}`} className="flex items-center justify-between pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                                        <div className="flex-1 flex justify-between px-6">
                                            <span className="text-xs font-black text-gray-900 uppercase tracking-widest">{bag.label || bag.weight}</span>
                                            <span className="text-xs font-black text-gray-900">${bag.price}</span>
                                        </div>
                                        <button
                                            onClick={() => setBags((p: any[]) => p.filter((_, idx) => idx !== i))}
                                            className="px-8 py-2.5 bg-red-400/10 text-red-500 hover:bg-red-400 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Total Bar */}
                            <div className="pt-8 border-t border-gray-50 flex items-center justify-between px-6">
                                <span className="text-sm font-black text-gray-900 uppercase tracking-[2px]">Total Payment</span>
                                <span className="text-sm font-black text-gray-900">${bags.reduce((sum: number, b: any) => sum + b.price, 0)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer CTA */}
                    <div className="flex justify-center pt-4">
                        <Button
                            onClick={() => setIsConfirming(true)}
                            className="w-full max-w-xl h-14 rounded-2xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-black text-sm uppercase tracking-[4px] shadow-2xl shadow-purple-100 transition-all hover:-translate-y-1 active:scale-95"
                        >
                            Add Extra Baggage
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
};
