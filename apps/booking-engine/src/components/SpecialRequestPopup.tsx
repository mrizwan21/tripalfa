import React, { useState } from 'react';
import { X, Heart, Info, Check, Clock, Plus } from 'lucide-react';
import { Button } from './ui/button';

interface SpecialRequestPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (requests: any[]) => void;
}

export const SpecialRequestPopup = ({ isOpen, onClose, onConfirm }: SpecialRequestPopupProps) => {
    const [selectedPassenger, setSelectedPassenger] = useState(1);

    const ssrOptions = [
        { id: 'WCHR', name: 'Wheelchair (WCHR)', description: 'For passengers who can climb stairs but need assistance for long distances', icon: <Heart size={20} /> },
        { id: 'BSCT', name: 'Bascinet (BSCT)', description: 'Infant cot request (subject to availability for infants < 2 years)', icon: <Info size={20} /> },
        { id: 'EXST', name: 'Extra Legroom (RQ)', description: 'Request for preferred seating (Pending Airline Approval)', icon: <Plus size={20} /> },
        { id: 'BLND', name: 'Blind Passenger (BLND)', description: 'Assistance for visually impaired passengers', icon: <Info size={20} /> }
    ];

    const [requests, setRequests] = useState<{ [key: number]: string[] }>({});

    if (!isOpen) return null;

    const passengers = [
        { id: 1, name: 'Arun Kumar', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arun' },
        { id: 2, name: 'Enbeae Mohamed', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Enbeae' }
    ];

    const toggleRequest = (ssrId: string) => {
        setRequests(prev => {
            const current = prev[selectedPassenger] || [];
            const updated = current.includes(ssrId)
                ? current.filter(id => id !== ssrId)
                : [...current, ssrId];
            return { ...prev, [selectedPassenger]: updated };
        });
    };

    const currentRequests = requests[selectedPassenger] || [];

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />

            <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-gray-100 flex flex-col max-h-[90vh]">

                <div className="p-8 text-center relative border-b border-gray-50">
                    <h2 className="text-2xl font-black text-gray-900">Special Service Requests</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                        Send requests directly to the Airline for approval
                    </p>
                    <button onClick={onClose} className="absolute top-8 right-8 p-2 text-gray-400 hover:text-gray-900">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-10">
                    {/* Passenger Selection */}
                    <div className="flex justify-center gap-4">
                        {passengers.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setSelectedPassenger(p.id)}
                                className={`px-6 h-12 rounded-[2rem] flex items-center gap-3 border transition-all ${selectedPassenger === p.id
                                    ? 'bg-[#FFD700] border-[#FFD700] shadow-lg'
                                    : 'bg-white border-gray-100 text-gray-400'
                                    }`}
                            >
                                <img src={p.avatar} className="w-6 h-6 rounded-full" alt="" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{p.name}</span>
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {ssrOptions.map((opt) => {
                            const isSelected = currentRequests.includes(opt.id);
                            return (
                                <div
                                    key={opt.id}
                                    onClick={() => toggleRequest(opt.id)}
                                    className={`p-6 rounded-[2.5rem] border-2 cursor-pointer transition-all flex items-center gap-6 group ${isSelected
                                        ? 'border-[#8B5CF6] bg-purple-50/50'
                                        : 'border-gray-50 hover:border-gray-200 bg-white'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isSelected ? 'bg-[#8B5CF6] text-white shadow-lg' : 'bg-gray-50 text-gray-300'}`}>
                                        {opt.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">{opt.name}</h4>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase leading-tight mt-1">{opt.description}</p>
                                    </div>
                                    <div className="text-right">
                                        {isSelected && (
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center">
                                                    <Check size={14} />
                                                </div>
                                                <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-1">
                                                    <Clock size={8} /> RQ
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50 flex items-start gap-4">
                        <Info size={18} className="text-blue-500 mt-0.5" />
                        <p className="text-[10px] font-bold text-blue-600/80 uppercase tracking-wide leading-relaxed">
                            Note: Most special requests are marked as **RQ (On Request)**. Our travel experts will coordinate with the airline and update the status in your booking notification queue once confirmed.
                        </p>
                    </div>
                </div>

                <div className="p-8 bg-[#111827] flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Selected Requests</p>
                        <p className="text-xl font-black text-white">{Object.values(requests).flat().length} Services</p>
                    </div>
                    <Button
                        onClick={() => onConfirm(requests as any)}
                        className="bg-[#FFD700] hover:bg-[#F4CE14] text-black px-12 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:-translate-y-1"
                    >
                        Send Requests
                    </Button>
                </div>
            </div>
        </div>
    );
};
