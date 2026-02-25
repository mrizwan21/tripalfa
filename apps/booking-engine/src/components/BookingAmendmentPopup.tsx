import React, { useState } from 'react';
import { X, Upload, Calendar, User, Plane, Check } from 'lucide-react';

import { NotificationItem } from '../lib/notification-types';

interface BookingAmendmentPopupProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId: string;
    passengers?: any[];
    productType?: 'flight' | 'hotel';
    prefillData?: NotificationItem | null;
}

type AmendmentType = 'cancel_refund' | 're_issue' | 'wheel_chair' | 'seat_request' | 'add_baggage' | 'add_meals' | 'special_request';

export function BookingAmendmentPopup({ isOpen, onClose, bookingId, passengers = [], productType = 'flight', prefillData }: BookingAmendmentPopupProps) {
    if (!isOpen) return null;

    const [activeType, setActiveType] = useState<AmendmentType>('cancel_refund');
    const [selectedPassengers, setSelectedPassengers] = useState<string[]>([]);
    const [files, setFiles] = useState<File[]>([]);

    React.useEffect(() => {
        if (isOpen && prefillData) {
            // Map notification type to amendment type
            if (prefillData.title.includes('Date Change') || prefillData.title.includes('Re-Issue')) {
                setActiveType('re_issue');
            } else if (prefillData.title.includes('Meal')) {
                setActiveType('add_meals');
            } else if (prefillData.title.includes('Seat')) {
                setActiveType('seat_request');
            } else if (prefillData.title.includes('Baggage')) {
                setActiveType('add_baggage');
            } else if (prefillData.title.includes('Wheelchair')) {
                setActiveType('wheel_chair');
            } else if (prefillData.title.includes('Refund') || prefillData.title.includes('Cancel')) {
                setActiveType('cancel_refund');
            } else {
                setActiveType('special_request');
            }
        }
    }, [isOpen, prefillData]);

    const togglePassenger = (id: string) => {
        if (selectedPassengers.includes(id)) {
            setSelectedPassengers(selectedPassengers.filter(p => p !== id));
        } else {
            setSelectedPassengers([...selectedPassengers, id]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles([...files, ...newFiles]);
        }
    };

    const menuItems: { id: AmendmentType; label: string }[] = [
        { id: 'cancel_refund', label: 'Cancel & Refund' },
        { id: 're_issue', label: productType === 'hotel' ? 'Change Dates' : 'Re-Issue' },
        { id: 'wheel_chair', label: 'Wheel Chair' },
        { id: 'seat_request', label: 'Seat Request' },
        ...(productType === 'flight' ? [
            { id: 'add_baggage', label: 'Add Baggage' },
            { id: 'add_meals', label: 'Add Meals' },
        ] as const : []), // Baggage/Meals relevant for flights mostly
        { id: 'special_request', label: 'Special Request' },
    ];

    // Mock passenger data if not provided (keeping existing logic)
    const displayPassengers = passengers.length > 0 ? passengers : [
        { id: 'p1', firstName: 'Mohamed', lastName: 'Rizwan', type: 'ADT' },
        { id: 'p2', firstName: 'Samia', lastName: 'Khan', type: 'ADT' },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
            <div className="relative bg-white w-full max-w-6xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex max-h-[90vh]">

                {/* Left Sidebar Menu */}
                <div className="w-64 bg-gray-50 border-r border-gray-100 p-6 flex-shrink-0">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 px-2">Actions</h3>
                    <div className="space-y-2">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveType(item.id)}
                                className={`w-full text-left px-5 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 ${activeType === item.id
                                    ? 'bg-white text-[#152467] shadow-md translate-x-2 border border-gray-100'
                                    : 'text-gray-500 hover:bg-white hover:text-gray-700 hover:shadow-sm'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-white">
                    {/* Header */}
                    <div className="h-20 border-b border-gray-100 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                        <div>
                            <h2 className="text-lg font-black text-[#1E1B4B]">Booking Request Card</h2>
                            <p className="text-[10px] font-bold text-gray-400 mt-1">Ref: {bookingId} <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-gray-500 uppercase">{productType}</span></p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Scrollable Form Content */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="space-y-8 max-w-4xl mx-auto">

                            {/* Passengers Section */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-[#152467] uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#152467]" />
                                    Select {productType === 'hotel' ? 'Guests' : 'Passengers'}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {displayPassengers.map((p) => (
                                        <div
                                            key={p.id}
                                            onClick={() => togglePassenger(p.id)}
                                            className={`relative group cursor-pointer border rounded-2xl p-4 transition-all duration-200 ${selectedPassengers.includes(p.id)
                                                ? 'border-[#152467] bg-purple-50/30'
                                                : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${selectedPassengers.includes(p.id) ? 'bg-[#152467] text-white' : 'bg-gray-100 text-gray-400'
                                                    }`}>
                                                    <User size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-[#1E1B4B]">{p.firstName} {p.lastName}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{p.type === 'ADT' ? 'Adult' : p.type}</p>
                                                </div>
                                                <div className={`ml-auto w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedPassengers.includes(p.id) ? 'border-[#152467] bg-[#152467]' : 'border-gray-200'
                                                    }`}>
                                                    {selectedPassengers.includes(p.id) && <Check size={14} className="text-white" />}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Dynamic Fields Based on Selection */}
                            <div className="space-y-6 pt-4 border-t border-dashed border-gray-100">

                                {activeType === 're_issue' && (
                                    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                        <h3 className="text-xs font-black text-[#152467] uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#152467]" />
                                            {productType === 'hotel' ? 'New Date Details' : 'New Flight Details'}
                                        </h3>
                                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-6">
                                            {productType === 'flight' ? (
                                                /* Flight specific fields */
                                                <>
                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">New Date</label>
                                                            <div className="relative">
                                                                <input id="amendment-departure-date" name="amendment-departure-date" type="date" className="w-full h-12 rounded-xl border border-gray-200 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-[#152467] transition-colors" />
                                                                <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Preferred Class</label>
                                                            <select id="amendment-preferred-class" name="amendment-preferred-class" className="w-full h-12 rounded-xl border border-gray-200 px-4 text-sm font-medium focus:outline-none focus:border-[#152467] bg-white transition-colors">
                                                                <option value="economy">Economy</option>
                                                                <option value="business">Business</option>
                                                                <option value="first-class">First Class</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Route (Optional)</label>
                                                        <div className="relative">
                                                            <input id="amendment-route" name="amendment-route" type="text" placeholder="e.g. DXB - LHR" className="w-full h-12 rounded-xl border border-gray-200 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-[#152467] transition-colors" />
                                                            <Plane size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                /* Hotel specific fields */
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Check-in Date</label>
                                                        <div className="relative">
                                                            <input id="amendment-new-departure" name="amendment-new-departure" type="date" className="w-full h-12 rounded-xl border border-gray-200 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-[#152467] transition-colors" />
                                                            <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Check-out Date</label>
                                                        <div className="relative">
                                                            <input id="amendment-new-return" name="amendment-new-return" type="date" className="w-full h-12 rounded-xl border border-gray-200 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-[#152467] transition-colors" />
                                                            <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                )}

                                {(activeType === 'add_baggage' || activeType === 'add_meals' || activeType === 'seat_request' || activeType === 'special_request') && (
                                    <div className="space-y-2 animate-in slide-in-from-right-4 duration-300">
                                        <h3 className="text-xs font-black text-[#152467] uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#152467]" />
                                            {menuItems.find(i => i.id === activeType)?.label} Details
                                        </h3>
                                        <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-yellow-700 text-xs font-medium">
                                            Please specify your exact requirements below. Our team will verify availability and confirm the additional costs.
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-[#152467] uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#152467]" />
                                        Message / Instructions
                                    </label>
                                        <textarea id="amendment-message" name="amendment-message" className="w-full h-32 rounded-2xl border border-gray-200 p-4 text-sm font-medium focus:outline-none focus:border-[#152467] focus:ring-4 focus:ring-purple-50 transition-all resize-none" placeholder="Please describe your request in detail..."></textarea>
                                </div>

                                {/* File Upload */}
                                <div className="space-y-2">
                                    <h3 className="text-xs font-black text-[#152467] uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#152467]" />
                                        Attachments (Optional)
                                    </h3>
                                    <div className="mt-2 text-xs text-gray-500 mb-2">Upload relevant documents like medical reports or passport copies.</div>

                                    <div className="flex gap-4 items-center">
                                        <label className="flex items-center gap-2 px-6 py-3 bg-[#152467] text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-[#0A1C50] transition-all shadow-lg shadow-purple-100 active:scale-95">
                                            <Upload size={14} />
                                            Choose Files
                                            <input type="file" multiple className="hidden" onChange={handleFileChange} />
                                        </label>
                                        <div className="flex-1 h-12 rounded-xl border border-gray-200 bg-gray-50 flex items-center px-4 text-xs font-medium text-gray-500">
                                            {files.length > 0 ? (
                                                <span className="text-gray-900">{files.length} file(s) selected</span>
                                            ) : (
                                                "No file chosen"
                                            )}
                                        </div>
                                    </div>

                                    {files.length > 0 && (
                                        <div className="flex gap-2 flex-wrap mt-2">
                                            {files.map((f, i) => (
                                                <div key={i} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 flex items-center gap-2">
                                                    {f.name}
                                                    <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="hover:text-red-500"><X size={10} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="h-24 border-t border-gray-100 flex items-center justify-center bg-gray-50/50 backdrop-blur-sm px-8 gap-4">
                        <button
                            onClick={onClose}
                            className="h-12 w-32 border border-gray-200 text-gray-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-white hover:border-gray-300 transition-all"
                        >
                            Cancel
                        </button>
                        <button className="h-12 w-48 bg-[#152467] text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-purple-200 hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95 active:translate-y-0">
                            Submit Request
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
