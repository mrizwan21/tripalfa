import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { X, Plane, Clock, Shield, Briefcase, Info, ChevronRight, Check, Luggage } from 'lucide-react';
import { Button } from './ui/button';
import { Flight } from '../lib/srs-types';
import { fetchAircrafts } from '../lib/api';

interface FlightDetailPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: () => void;
    flight: Flight;
}

export const FlightDetailPopup = ({ isOpen, onClose, onSelect, flight }: FlightDetailPopupProps): React.JSX.Element | null => {
    const [activeTab, setActiveTab] = useState('itinerary');
    const [aircraftNames, setAircraftNames] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            fetchAircrafts().then(data => {
                if (Array.isArray(data)) {
                    const nameMap: Record<string, string> = {};
                    data.forEach((a: any) => {
                        if (a.code) nameMap[a.code] = a.name;
                    });
                    setAircraftNames(nameMap);
                }
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Determine tabs based on available data
    const tabs = [
        { id: 'itinerary', label: 'Itinerary' },
        { id: 'fare', label: 'Fare Details' },
        { id: 'rules', label: 'Fare Rules' },
        { id: 'baggage', label: 'Baggage' },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" data-testid="flight-detail-modal">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white w-full max-w-3xl max-h-[90vh] rounded-[2rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-300 border border-white/20">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-all z-20"
                >
                    <X size={16} />
                </button>

                {/* Header Tabs */}
                <div className="px-8 pt-8 pb-4 border-b border-gray-100 flex-shrink-0">
                    <div className="flex gap-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                    ? 'bg-[#152467] text-white shadow-lg shadow-purple-200 translate-y-[-2px]'
                                    : 'bg-white border border-gray-100 text-gray-400 hover:border-[#152467] hover:text-[#152467]'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="px-10 py-8 overflow-y-auto flex-1 custom-scrollbar">

                    {/* Tab: Itinerary */}
                    {activeTab === 'itinerary' && (
                        <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Segments Loop */}
                            {flight.segments?.map((segment, index) => {
                                const depDate = segment.departureTime ? parseISO(segment.departureTime) : null;
                                const arrDate = segment.arrivalTime ? parseISO(segment.arrivalTime) : null;
                                const isLayover = index < (flight.segments?.length || 0) - 1;

                                // Lookup aircraft name from code or static DB
                                const aircraftName = aircraftNames[segment.aircraft || ''] || segment.aircraft || '--';

                                return (
                                    <div key={index} className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-black text-gray-900">
                                                {depDate ? format(depDate, 'EEE, d MMM') : '--'}
                                            </h3>
                                        </div>

                                        <div className="bg-gray-50/50 rounded-[2rem] p-8 border border-gray-100 relative">
                                            <div className="grid grid-cols-[1.5fr_1fr_1.5fr] gap-8">

                                                {/* Departure Side */}
                                                <div className="space-y-8">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={flight.airlineLogo || `https://logo.clearbit.com/${flight.airline.toLowerCase().replace(/\s/g, '')}.com`}
                                                            className="h-10 w-10 object-contain rounded-lg bg-white p-1 shadow-sm"
                                                            alt="airline"
                                                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/723/723955.png'; }}
                                                        />
                                                        <div>
                                                            <p className="text-[11px] font-black text-gray-900">{flight.airline}</p>
                                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{segment.carrierCode}{flight.flightNumber}</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <p className="text-2xl font-black text-gray-900 tracking-tighter">
                                                            {depDate ? format(depDate, 'HH:mm') : '--:--'}
                                                        </p>
                                                        <div>
                                                            <p className="text-[10px] font-black text-gray-900 uppercase">{segment.origin}</p>
                                                            <p className="text-[9px] font-bold text-gray-400">{segment.originCity || ''}</p>
                                                            {segment.departureTerminal && <p className="text-[8px] font-black text-[#152467] mt-1">TERMINAL {segment.departureTerminal}</p>}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Visual Timeline Centered */}
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="w-full relative h-[140px] flex items-center">
                                                        <div className="absolute left-1/2 -translate-x-1/2 w-[1.5px] h-full bg-gradient-to-b from-[#152467] via-[#EF4444] to-[#152467] rounded-full opacity-20"></div>
                                                        <div className="flex flex-col justify-between h-full w-full items-center relative py-2">
                                                            <div className="w-3 h-3 rounded-full bg-white border-[3px] border-[#152467] shadow-sm"></div>
                                                            <div className="bg-white px-4 py-1.5 rounded-full border border-indigo-100 shadow-lg text-[10px] font-black text-[#152467] whitespace-nowrap">
                                                                {segment.duration || '--'}
                                                            </div>
                                                            <div className="w-3 h-3 rounded-full bg-white border-[3px] border-[#152467] shadow-sm"></div>
                                                        </div>
                                                    </div>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase mt-4 tracking-[1.5px]">{flight.cabin || "Economy"} Class</p>
                                                </div>

                                                {/* Arrival Side */}
                                                <div className="flex flex-col justify-between text-right">
                                                    <div>
                                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Aircraft</p>
                                                        <p className="text-[10px] font-black text-gray-900 uppercase truncate">{aircraftName}</p>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <p className="text-2xl font-black text-gray-900 tracking-tighter">
                                                            {arrDate ? format(arrDate, 'HH:mm') : '--:--'}
                                                        </p>
                                                        <div>
                                                            <p className="text-[10px] font-black text-gray-900 uppercase">{segment.destination}</p>
                                                            <p className="text-[9px] font-bold text-gray-400">{segment.destinationCity || ''}</p>
                                                            {segment.arrivalTerminal && <p className="text-[8px] font-black text-[#152467] mt-1">TERMINAL {segment.arrivalTerminal}</p>}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className={`text-[9px] font-black uppercase tracking-widest ${flight.refundable ? 'text-green-500' : 'text-[#EF4444]'}`}>
                                                            {flight.refundable ? "Refundable" : "Non-Refundable"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {isLayover && (
                                            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                                <div className="flex items-center gap-3">
                                                    <Clock size={12} className="text-gray-400" />
                                                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-[1.5px]">Stopover in {segment.destinationCity || segment.destination}</span>
                                                </div>
                                                {segment.layoverDuration && (
                                                    <p className="text-[11px] font-black text-[#152467] mt-1 uppercase">
                                                        ({segment.layoverDuration})
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Tab: Fare Details */}
                    {activeTab === 'fare' && (
                        <div className="animate-in slide-in-from-bottom-4 duration-500 flex flex-col items-center py-6">
                            <div className="w-full max-w-md bg-gray-50 rounded-[2rem] border border-gray-100 p-8 shadow-sm">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-8 text-center">Fare Breakdown</h4>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Base Fare</span>
                                        <span className="text-md font-black text-gray-900">{(flight.amount * 0.85).toFixed(2)} {flight.currency}</span>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-dashed border-gray-200">
                                        <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-[2px]">Taxes & Fees Breakup</h5>
                                        {[
                                            { label: 'Fuel Surcharge', factor: 0.08 },
                                            { label: 'Passenger Service Fee', factor: 0.04 },
                                            { label: 'Airport Tax', factor: 0.03 }
                                        ].map((tax, i) => (
                                            <div key={i} className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-gray-500">{tax.label}</span>
                                                <span className="text-[10px] font-black text-gray-900">{(flight.amount * tax.factor).toFixed(2)} {flight.currency}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-6 mt-6 border-t-[2px] border-dashed border-gray-200 flex justify-between items-center">
                                        <span className="text-md font-black text-gray-900 uppercase tracking-[1px]">Total Amount</span>
                                        <span className="text-2xl font-black text-[#152467]">{flight.amount} {flight.currency}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Fare Rules */}
                    {activeTab === 'rules' && (
                        <div className="animate-in slide-in-from-bottom-4 duration-500">
                            <div className="p-10 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#152467] shadow-sm"><Shield size={24} /></div>
                                    <h4 className="text-xl font-black text-gray-900">Fare Policy</h4>
                                </div>
                                <div className="space-y-6">
                                    <div className="p-6 bg-white rounded-2xl border border-gray-100">
                                        <p className="text-sm font-black text-gray-900 uppercase tracking-widest mb-2">Refund Policy</p>
                                        <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                            {flight.refundable
                                                ? "This fare is fully refundable before departure. Cancellation fees may apply depending on the time of request."
                                                : "This is a non-refundable fare. Changes and cancellations will not be eligible for a refund."}
                                        </p>
                                    </div>
                                    <div className="p-6 bg-white rounded-2xl border border-gray-100">
                                        <p className="text-sm font-black text-gray-900 uppercase tracking-widest mb-2">Change Policy</p>
                                        <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                            Date changes are permitted with a fee plus any fare difference. Contact our support team at least 24 hours before departure.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Baggage */}
                    {activeTab === 'baggage' && (
                        <div className="animate-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 gap-8">
                                <div className="p-12 rounded-[2.5rem] border border-gray-100 bg-gray-50 shadow-sm">
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#152467] shadow-sm"><Luggage size={24} /></div>
                                        <h5 className="text-xl font-black text-gray-900">Baggage Allowance</h5>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {flight.includedBags && flight.includedBags.map((bag, i) => (
                                            <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 flex items-center gap-6 shadow-sm hover:shadow-md transition-all">
                                                <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center text-[#152467] flex-shrink-0 animate-pulse"><Luggage size={32} /></div>
                                                <div>
                                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-[2px]">{bag.type === 'checked' ? 'Checked' : 'Hand'} Baggage</p>
                                                    <p className="text-2xl font-black text-gray-900 mt-1">{bag.quantity} x {bag.weight || (bag.type === 'checked' ? 23 : 7)} {bag.unit || 'kg'}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Per Passenger</p>
                                                </div>
                                            </div>
                                        ))}
                                        {!flight.includedBags?.length && (
                                            <div className="col-span-2 text-center py-10 bg-white rounded-3xl border border-dashed border-gray-300">
                                                <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No baggage information available.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer Bar */}
                <div className="px-8 py-6 bg-white border-t border-gray-100 flex items-center justify-between flex-shrink-0">
                    <div data-testid="flight-price">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] mb-1">Total Payable</p>
                        <p className="text-2xl font-black text-gray-900 font-sans tracking-tighter">{flight.currency} {flight.amount.toLocaleString()}</p>
                    </div>
                    <Button
                        data-testid="book-now-button"
                        onClick={onSelect}
                        className="px-12 py-5 rounded-2xl bg-[#152467] hover:bg-[#0A1C50] text-white font-black text-sm uppercase tracking-[3px] shadow-2xl shadow-purple-200 transition-all hover:translate-y-[-4px] active:scale-95"
                    >
                        Confirm Booking
                    </Button>
                </div>

            </div>
        </div>
    );
};
