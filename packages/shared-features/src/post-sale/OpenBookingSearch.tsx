import React, { useState } from 'react';
import { Search, Globe, Plane, Hotel } from 'lucide-react';

interface OpenBookingSearchProps {
  onBack?: () => void;
  onSelect?: (booking: any) => void;
}

export default function OpenBookingSearch({ onBack, onSelect }: OpenBookingSearchProps) {
  const [query, setQuery] = useState('');

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <Globe size={18} className="text-slate-600" />
        <h3 className="text-sm font-semibold text-pure-black">Open Booking Search</h3>
      </div>
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by reference, passenger, or route..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-black"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center gap-2 p-4 rounded-lg border border-slate-200 hover:border-black transition-colors text-left">
            <Plane size={16} className="text-slate-500" />
            <div>
              <p className="text-xs font-semibold text-pure-black">Flight</p>
              <p className="text-[10px] text-pure-black/40">Search open flight bookings</p>
            </div>
          </button>
          <button className="flex items-center gap-2 p-4 rounded-lg border border-slate-200 hover:border-black transition-colors text-left">
            <Hotel size={16} className="text-slate-500" />
            <div>
              <p className="text-xs font-semibold text-pure-black">Hotel</p>
              <p className="text-[10px] text-pure-black/40">Search open hotel bookings</p>
            </div>
          </button>
        </div>
        <p className="text-[10px] text-pure-black/30 text-center py-4">
          Enter a reference number or passenger name to search
        </p>
      </div>
    </div>
  );
}
