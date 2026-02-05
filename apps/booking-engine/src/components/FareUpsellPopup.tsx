import React from 'react';
import { X, Check, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';
import { Flight } from '../lib/srs-types';

// Types definition
export interface FareBenefit {
    label: string;
    included: boolean;
    price?: string;
}

export interface FareFlexibility {
    label: string;
    included: boolean;
    type?: 'cancel' | 'change';
    price?: string;
}

export interface FareOption {
    id: string;
    name: string;
    price: number;
    originalPrice: number;
    cabin: string;
    benefits: FareBenefit[];
    flexibility: FareFlexibility[];
    keywords?: string[];
    notes?: string[];
    selected?: boolean;
}

export interface FareUpsellPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (fare: FareOption) => void;
    flight: Flight;
    // Dynamic props
    fares?: FareOption[];
    selectedFareId?: string;
}

export const FareUpsellPopup = ({
    isOpen,
    onClose,
    onSelect,
    flight,
    // Provide defaults if not passed
    fares = [
        {
            id: 'basic',
            name: 'Basic',
            price: 217,
            originalPrice: 216.70,
            cabin: 'Economy - (L)',
            benefits: [
                { label: 'Personal item included', included: true },
                { label: 'Carry-on bags included*', included: true },
                { label: '1st checked bag:** $115', included: false, price: '$115' },
                { label: 'Seat choice for a fee', included: false },
            ],
            flexibility: [
                { label: 'Non-refundable', included: false, type: 'cancel' },
                { label: 'Change fee: $65', included: false, price: '$65' },
            ],
            selected: false
        },
        {
            id: 'plus',
            name: 'Plus',
            price: 243,
            originalPrice: 242.70,
            cabin: 'Economy - (M)',
            keywords: ['Best Value'],
            benefits: [
                { label: 'Personal item included', included: true },
                { label: 'Carry-on bags included*', included: true },
                { label: '1st checked bag included**', included: true },
                { label: 'Seat choice for a fee', included: false },
            ],
            flexibility: [
                { label: 'Non-refundable', included: false, type: 'cancel' },
                { label: 'Change fee: $65', included: false, price: '$65' },
            ],
            notes: [
                '*Carry-on bag included up to 50 lbs',
                '**Checked bag included up to 50 lbs'
            ],
            selected: true
        },
        {
            id: 'premium',
            name: 'Flex', // Changed name slightly for variety
            price: 380,
            originalPrice: 380.00,
            cabin: 'Economy - (Q)',
            benefits: [
                { label: 'Personal item included', included: true },
                { label: 'Carry-on bags included*', included: true },
                { label: '2 checked bags included**', included: true },
                { label: 'Seat choice included', included: true },
            ],
            flexibility: [
                { label: 'Refundable', included: true, type: 'cancel' },
                { label: 'No Change fee', included: true, price: 'Free' },
            ],
            notes: [
                '*Carry-on bag included up to 50 lbs',
                '**Checked bag included up to 50 lbs'
            ],
            selected: false
        }
    ],
    selectedFareId
}: FareUpsellPopupProps) => {

    if (!isOpen) return null;

    // Use passed 'selectedFareId' to derive selection state if available
    const displayFares = fares.map(f => ({
        ...f,
        selected: selectedFareId ? f.id === selectedFareId : f.selected
    }));

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-xl animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative bg-white w-full max-w-6xl rounded-[3rem] shadow-[0_48px_150px_-20px_rgba(0,0,0,0.4)] overflow-hidden animate-in zoom-in-95 fade-in duration-500 border border-white/40 max-h-[90vh] flex flex-col">

                {/* Header Section */}
                <div className="px-12 py-10 flex items-center justify-between border-b border-gray-50 shrink-0">
                    <div className="flex items-center gap-6">
                        <button onClick={onClose} className="p-3 rounded-full hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
                            <X size={20} className="text-gray-900" />
                        </button>
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-[0.2em]">Select Fare for <span className="text-[#8B5CF6]">{flight.origin} - {flight.destination}</span></h2>
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div className="overflow-y-auto flex-1 custom-scrollbar">

                    {/* Flight Summary Bar */}
                    <div className="mx-12 mt-8 mb-8 px-10 py-8 bg-[#F8F9FA] rounded-[2.5rem] border border-gray-100 flex items-center justify-between shadow-inner">
                        <div className="flex items-center gap-12">
                            <div className="space-y-2">
                                <p className="text-xl font-black text-gray-900 tracking-tight">
                                    {new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(flight.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-white rounded-full text-[10px] font-bold text-gray-500 border border-gray-100 uppercase tracking-wider">{flight.stops === 0 ? 'Nonstop' : `${flight.stops} Stop${flight.stops > 1 ? 's' : ''}`}</span>
                                    <span className="text-[11px] font-bold text-gray-400 font-sans">{flight.duration}</span>
                                </div>
                            </div>
                            <div className="h-10 w-px bg-gray-200" />
                            <div className="flex items-center gap-3">
                                <img src={flight.airlineLogo} className="h-8 w-8 object-contain rounded-full bg-white p-1 shadow-sm" alt={flight.airline} />
                                <span className="text-sm font-black text-gray-900">{flight.airline}</span>
                            </div>
                        </div>
                        <Button
                            onClick={onClose}
                            className="bg-[#FFD700] hover:bg-[#FACC15] text-[#1E1B4B] font-black text-xs px-10 py-4 rounded-2xl shadow-xl shadow-yellow-100 transition-all uppercase tracking-[0.2em] hover:-translate-y-0.5 active:scale-95"
                        >
                            Keep Selected
                        </Button>
                    </div>

                    {/* Fares Grid */}
                    <div className="px-12 pb-12 relative min-h-[600px]">

                        {/* Navigation Arrows (Visual only for now) */}
                        <button className="absolute -left-6 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white border border-gray-100 text-[#8B5CF6] flex items-center justify-center shadow-2xl z-20 hover:scale-110 hover:border-[#8B5CF6] transition-all">
                            <ChevronLeft size={28} />
                        </button>
                        <button className="absolute -right-6 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white border border-gray-100 text-[#8B5CF6] flex items-center justify-center shadow-2xl z-20 hover:scale-110 hover:border-[#8B5CF6] transition-all">
                            <ChevronRight size={28} />
                        </button>

                        <div className="grid grid-cols-3 gap-8 h-full">
                            {displayFares.map((fare, idx) => (
                                <div
                                    key={idx}
                                    className={`p-10 rounded-[3rem] border transition-all duration-500 flex flex-col relative overflow-hidden group hover:shadow-2xl hover:shadow-gray-200/50 ${fare.selected
                                        ? 'border-[#8B5CF6] bg-white ring-4 ring-[#8B5CF6]/10 shadow-2xl shadow-purple-100/50 scale-105 z-10'
                                        : 'border-gray-100 hover:border-[#8B5CF6]/30 bg-white hover:-translate-y-2'
                                        }`}
                                >
                                    {fare.selected && (
                                        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#8B5CF6] to-purple-400" />
                                    )}

                                    {/* Price & Description */}
                                    <div className="mb-10 text-center">
                                        <h3 className="text-3xl font-black text-gray-900 tracking-tighter">SAR {fare.price}</h3>
                                        <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-wide">Per Person</p>
                                    </div>

                                    {/* Cabin */}
                                    <div className="mb-10 text-center bg-gray-50/50 py-4 rounded-2xl border border-gray-50">
                                        <p className="text-sm font-black text-[#8B5CF6] uppercase tracking-[0.2em] mb-1">{fare.name}</p>
                                        <p className="text-[10px] font-bold text-gray-400 font-sans uppercase tracking-widest">{fare.cabin}</p>
                                    </div>

                                    {/* Section: Benefits */}
                                    <div className="mb-8 flex-1 space-y-8">
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-center mb-6">Included Benefits</p>
                                            {fare.benefits.map((benefit, i) => (
                                                <div key={i} className="flex items-start gap-4">
                                                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${benefit.included ? 'bg-[#8B5CF6]/10' : 'bg-gray-50'}`}>
                                                        {benefit.included ? <Check size={10} className="text-[#8B5CF6] stroke-[3px]" /> : <DollarSign size={10} className="text-gray-300" />}
                                                    </div>
                                                    <div className="flex-1 flex justify-between items-start">
                                                        <span className={`text-[11px] font-bold leading-relaxed ${benefit.included ? 'text-gray-900' : 'text-gray-400'}`}>{benefit.label}</span>
                                                        {(benefit as any).price && <span className="text-[10px] font-black text-[#8B5CF6]">{(benefit as any).price}</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-8 border-t border-dashed border-gray-100">
                                            <div className="space-y-4">
                                                {fare.flexibility.map((item, i) => (
                                                    <div key={i} className="flex items-center gap-4">
                                                        {item.type === 'cancel' ? <X size={14} className="text-red-400 ml-1" /> : <div className="w-5 h-5 rounded-full bg-gray-50 flex items-center justify-center"><DollarSign size={10} className="text-gray-400" /></div>}
                                                        <span className="text-[11px] font-bold text-gray-500">{item.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <Button
                                        onClick={() => onSelect(fare)}
                                        className={`w-full py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl transition-all active:scale-95 hover:-translate-y-1 ${fare.selected
                                            ? 'bg-[#111827] text-white shadow-gray-200 hover:bg-black'
                                            : 'bg-white border text-[#111827] hover:bg-gray-50 border-gray-200'
                                            }`}
                                    >
                                        {fare.selected ? 'Selected' : 'Select Fare'}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
