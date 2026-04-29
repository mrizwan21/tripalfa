import React from 'react';
import { Search, MapPin, Calendar, Users, ArrowRight } from 'lucide-react';
import { cn } from '../../index';

interface FlightSearchStepProps {
  tenant: any;
  onSearch: (data: any) => void;
  bookingContext?: string;
}

export default function FlightSearchStep({ tenant, onSearch, bookingContext = 'direct' }: FlightSearchStepProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
      <div className="p-8 lg:p-10 space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-apple-blue/10 text-apple-blue rounded-xl flex items-center justify-center">
            <Search size={20} />
          </div>
          <div>
            <h2 className="text-[18px] font-display font-bold text-pure-black">Search Flights</h2>
            <p className="text-[13px] font-text text-black/50">Book flights for {bookingContext} context</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-[12px] font-text font-semibold text-black/40 ml-1">From</label>
            <div className="relative">
              <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" />
              <input type="text" className="w-full pl-12 pr-4 py-4 bg-light-gray rounded-xl text-[14px] font-text outline-none focus:ring-2 focus:ring-apple-blue/10 border border-transparent focus:border-apple-blue/20" placeholder="Origin" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[12px] font-text font-semibold text-black/40 ml-1">To</label>
            <div className="relative">
              <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" />
              <input type="text" className="w-full pl-12 pr-4 py-4 bg-light-gray rounded-xl text-[14px] font-text outline-none focus:ring-2 focus:ring-apple-blue/10 border border-transparent focus:border-apple-blue/20" placeholder="Destination" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[12px] font-text font-semibold text-black/40 ml-1">Departure</label>
            <div className="relative">
              <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" />
              <input type="date" className="w-full pl-12 pr-4 py-4 bg-light-gray rounded-xl text-[14px] font-text outline-none focus:ring-2 focus:ring-apple-blue/10 border border-transparent focus:border-apple-blue/20" />
            </div>
          </div>
          <div className="space-y-2 flex flex-col justify-end">
            <button 
              onClick={() => onSearch({})}
              className="w-full py-4 bg-pure-black text-white rounded-xl text-[14px] font-text font-bold hover:bg-black/80 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              Search Flights <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
