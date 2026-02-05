import React, { useState } from 'react';
import { X, Search, ChevronDown, Smile, Frown, MessageSquare, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '../ui/Button';

interface GuestReviewsModalProps {
    isOpen: boolean;
    onClose: () => void;
    hotelName: string;
    rating: number;
    reviewCount: number;
}

export function GuestReviewsModal({ isOpen, onClose, hotelName, rating, reviewCount }: GuestReviewsModalProps): React.JSX.Element | null {
    if (!isOpen) return null;

    const categories = [
        { name: 'Staff', score: 9.1, color: 'bg-[#6366F1]' },
        { name: 'Facilities', score: 9.3, color: 'bg-[#FFD700]' },
        { name: 'Cleanliness', score: 9.5, color: 'bg-[#FFD700]' },
        { name: 'Free WiFi', score: 9.0, color: 'bg-[#6366F1]' },
        { name: 'Value for money', score: 8.6, color: 'bg-[#6366F1]' },
        { name: 'Location', score: 9.2, color: 'bg-[#6366F1]' },
        { name: 'Comfort', score: 9.5, color: 'bg-[#FFD700]' },
    ];

    const reviews = [
        {
            id: 1,
            user: { name: 'Grisha', country: 'Armenia', avatar: 'G', color: 'bg-yellow-500' },
            room: 'Deluxe Twin Room',
            stay: '2 nights · December 2023',
            group: 'Couple',
            date: 'Reviewed: January 17, 2024',
            score: 10,
            badge: 'Reviewer\'s choice',
            title: 'The most beautiful hotel with classic elegant atmosphere. Only high level guests can value this.',
            pros: [
                'Klassicheskaya, korolevskaya atmosfera.',
                'Tea ceremony at the lounge, remind us UK.',
                'Club floor 👍',
                'Asian restaurant 👍',
                'Spa the best.'
            ],
            cons: [
                'The bath robes at the room can be the same as in the spa.',
                'Before the complimentary cosmetics in the room was Bulgary, was more luxury I think.',
                'Next new Year to change the Christmas tree design pls'
            ],
            response: 'Dear Grisha,\nThank you for sharing your feedback with us...\nContinue reading'
        },
        {
            id: 2,
            user: { name: 'Marta', country: 'Portugal', avatar: 'M', color: 'bg-cyan-500' },
            room: 'Premier Ocean View Room With Balcony',
            stay: '3 nights · October 2024',
            group: 'Couple',
            date: 'Reviewed: October 5, 2024',
            score: 10,
            title: 'Exceptional',
            pros: [
                'The luxury in every detail is outstanding, it\'s so comfortable and beautiful that is a must do once in Dubai. We loved every moment. Also very client service oriented which allows the guest to really relax and enjoy.'
            ]
        },
        {
            id: 3,
            user: { name: 'Pamparau', country: 'United Kingdom', avatar: 'P', color: 'bg-green-500' },
            room: 'Deluxe Twin Room',
            stay: '2 nights · September 2024',
            group: 'Couple',
            date: 'Reviewed: September 30, 2024',
            score: 10,
            title: 'Exceptional',
            pros: [
                'I like everything, I can say that everything is perfect.'
            ],
            response: 'Dear Pamparau, Thank you for your fantastic review! We...\nContinue reading'
        }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white z-10">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Guest reviews for {hotelName}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} className="text-gray-500" /></button>
                </div>

                <div className="overflow-y-auto p-8 custom-scrollbar">
                    {/* Overall Rating & Categories */}
                    <div className="mb-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-[#6366F1] rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-200">{rating}</div>
                            <div>
                                <p className="font-black text-lg text-gray-900 leading-none">Wonderful</p>
                                <p className="text-sm text-gray-500 font-medium mt-1">{reviewCount.toLocaleString()} reviews</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-6">
                            {categories.map((cat) => (
                                <div key={cat.name}>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm font-bold text-gray-700">{cat.name}</span>
                                        <span className="text-sm font-black text-gray-900">{cat.score}</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${(cat.score / 10) * 100}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="space-y-4 mb-10">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Filters</h3>
                        <div className="flex flex-wrap gap-4">
                            {['Reviewers', 'Review scores', 'Languages', 'Time of year'].map((label) => (
                                <div key={label} className="relative group">
                                    <button className="flex items-center justify-between w-64 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:border-[#6366F1] transition-colors">
                                        <span>All ({reviewCount})</span>
                                        <ChevronDown size={16} />
                                    </button>
                                    <label className="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Reviews List */}
                    <div className="space-y-12">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-gray-900 tracking-tight">Guest reviews</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sort reviews by:</span>
                                <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-50">
                                    Most relevant <ChevronDown size={14} />
                                </button>
                            </div>
                        </div>

                        {reviews.map((review) => (
                            <div key={review.id} className="grid grid-cols-12 gap-8 border-b border-gray-100 pb-12 last:border-0">
                                {/* User Info */}
                                <div className="col-span-12 md:col-span-3 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 ${review.user.color} rounded-full flex items-center justify-center text-white font-black`}>{review.user.avatar}</div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{review.user.name}</p>
                                            <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                                <span className="text-xs">🏳️</span> {review.user.country}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                            <span className="text-gray-400">🛏️</span> {review.room}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                            <span className="text-gray-400">📅</span> {review.stay}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                            <span className="text-gray-400">👥</span> {review.group}
                                        </div>
                                    </div>
                                </div>

                                {/* Review Content */}
                                <div className="col-span-12 md:col-span-9 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            {review.badge && (
                                                <span className="text-[10px] font-black text-[#FFD700] uppercase tracking-widest mb-1 block">👑 {review.badge}</span>
                                            )}
                                            <p className="text-xs text-gray-400 font-bold mb-2">{review.date}</p>
                                            <h4 className="text-lg font-black text-gray-900">{review.title}</h4>
                                        </div>
                                        <div className="w-8 h-8 bg-[#6366F1] rounded-lg flex items-center justify-center text-white font-black text-sm">{review.score}</div>
                                    </div>

                                    {review.pros && (
                                        <div className="space-y-2">
                                            {review.pros.map((pro, i) => (
                                                <div key={i} className="flex gap-3">
                                                    <Smile size={18} className="text-green-500 shrink-0 mt-0.5" />
                                                    <p className="text-sm font-medium text-gray-700 leading-relaxed">{pro}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {review.cons && (
                                        <div className="space-y-2 mt-4">
                                            {review.cons.map((con, i) => (
                                                <div key={i} className="flex gap-3">
                                                    <Frown size={18} className="text-red-500 shrink-0 mt-0.5" />
                                                    <p className="text-sm font-medium text-gray-700 leading-relaxed">{con}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {review.response && (
                                        <div className="bg-gray-100 rounded-xl p-6 mt-6 border border-gray-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <MessageSquare size={14} className="text-gray-900" />
                                                <span className="text-xs font-black text-gray-900 uppercase tracking-widest">Property response:</span>
                                            </div>
                                            <p className="text-sm font-medium text-gray-600 whitespace-pre-line leading-relaxed">{review.response}</p>
                                            <button className="text-[#6366F1] text-xs font-bold mt-2 hover:underline">Continue reading</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Pagination */}
                        <div className="flex items-center justify-center gap-2 pt-8 border-t border-gray-100">
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50"><ChevronLeft size={14} /></button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-900 text-gray-900 font-black text-sm">1</button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent text-[#6366F1] font-bold text-sm hover:bg-gray-50">2</button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent text-[#6366F1] font-bold text-sm hover:bg-gray-50">3</button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent text-[#6366F1] font-bold text-sm hover:bg-gray-50">4</button>
                            <span className="text-gray-400 px-2">...</span>
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent text-[#6366F1] font-bold text-sm hover:bg-gray-50">204</button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent text-[#6366F1] font-bold text-sm hover:bg-gray-50">205</button>
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent text-[#6366F1] font-bold text-sm hover:bg-gray-50"><ChevronRight size={14} /></button>
                            <span className="text-xs font-bold text-gray-500 ml-4">Showing 1 - 10</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
