import React, { useState } from 'react';
import { X } from 'lucide-react';

interface FareRulesPopupProps {
    isOpen: boolean;
    onClose: () => void;
    flight?: any;
}

export const FareRulesPopup = ({ isOpen, onClose, flight }: FareRulesPopupProps) => {
    const [activeTab, setActiveTab] = useState(0);

    if (!isOpen) return null;

    const segments = flight?.segments || [];
    const tabs = segments.map((s: any, i: number) => ({
        label: `${s.origin} ${s.destination}`,
        id: i
    }));

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />

            <div className="relative bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 flex flex-col max-h-[85vh]">

                {/* Tabs / Header */}
                <div className="px-6 pt-6 pb-0 flex items-center justify-between border-b border-gray-50">
                    <div className="flex gap-2">
                        {tabs.map((tab: any, index: number) => (
                            <button
                                key={index}
                                onClick={() => setActiveTab(index)}
                                className={`px-5 py-2.5 rounded-t-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === index
                                    ? 'bg-white border-x border-t border-purple-500/20 text-[#8B5CF6] shadow-[0_-4px_20px_-10px_rgba(139,92,246,0.3)]'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="text-center space-y-1">
                        <h2 className="text-lg font-black text-gray-900">Fare rules for <span className="text-[#8B5CF6]">{segments[activeTab]?.originCity || segments[activeTab]?.origin}</span> to <span className="text-[#8B5CF6]">{segments[activeTab]?.destinationCity || segments[activeTab]?.destination}</span></h2>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{flight?.airline} Leg {activeTab + 1}</p>
                    </div>

                    <div className="space-y-6">
                        <section className="space-y-3">
                            <h3 className="text-[10px] font-black text-gray-900 text-center uppercase tracking-[2px]">Standard Conditions</h3>
                            <p className="text-[11px] font-medium text-gray-500 leading-relaxed text-center">
                                {flight?.refundable
                                    ? "APPLICATION AND OTHER CONDITIONS RULE - 008/VN01 UNLESS OTHERWISE SPECIFIED VN CARRIER FARES APPLICATION AREA THESE FARES APPLY FROM VIET NAM TO AREA 3. CLASS OF SERVICE THESE FARES APPLY FOR BUSINESS/PREMIUM ECONOMY/ECONOMY CLASS SERVICE."
                                    : "THIS FARE IS NON-REFUNDABLE AND NON-TRANSFERABLE. ANY CHANGES MAY INCUR ADDITIONAL FEES AND FARE DIFFERENCES. FLIGHT SEGS MUST BE USED IN SEQUENCE."}
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h3 className="text-[10px] font-black text-gray-900 text-center uppercase tracking-[2px]">Baggage & Services</h3>
                            <p className="text-[11px] font-medium text-gray-500 leading-relaxed text-center">
                                {flight?.isLCC
                                    ? "LCC CARRIER RULES APPLY. BAGGAGE MAY NOT BE INCLUDED. PLEASE CHECK YOUR INCLUDED ALLOWANCE BEFORE PROCEEDING."
                                    : "STANDARD CARRIER BAGGAGE POLICY APPLIES. CARRY-ON AND CHECKED BAGGAGE ARE SUBJECT TO AIRLINE SPECIFIC WEIGHT LIMITS."}
                            </p>
                        </section>
                    </div>
                </div>

            </div>
        </div>
    );
};
