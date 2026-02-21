import React from 'react';
import { Search, Filter, Calendar, ChevronDown, Package, ArrowRightLeft } from 'lucide-react';

export function BookingFilters({ onFilter }: { onFilter: (f: any) => void }) {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 p-2">
      {/* Expanded Search Bar */}
      <div className="flex-1 relative group/search">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400 group-focus-within/search:text-[#8B5CF6] transition-colors duration-300" />
        </div>
        <input
          type="text"
          placeholder="Search by airline, airport, or flight #..."
          className="block w-full h-14 pl-12 pr-4 bg-white/60 border-2 border-transparent hover:bg-white focus:bg-white focus:border-[#8B5CF6]/50 rounded-[2rem] text-[13px] font-bold text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-300 shadow-sm focus:shadow-xl focus:shadow-purple-100/50"
          onChange={(e) => onFilter({ search: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-4 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 no-scrollbar">
        {/* Product Type Semantic Select */}
        <div className="relative group/select min-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Package className="h-4 w-4 text-gray-400 group-hover/select:text-[#8B5CF6] transition-colors" />
          </div>
          <select
            className="block w-full h-14 pl-12 pr-10 bg-white/60 border-2 border-transparent hover:bg-white focus:bg-white focus:border-[#8B5CF6]/50 rounded-[2rem] text-[11px] font-bold text-gray-700 uppercase tracking-widest outline-none appearance-none cursor-pointer transition-all shadow-sm"
            onChange={(e) => onFilter({ product: e.target.value })}
          >
            <option value="">All Products</option>
            <option value="hotel">Luxury Hotels</option>
            <option value="flight">Premium Flights</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none">
            <ChevronDown className="h-3 w-3 text-gray-400" />
          </div>
        </div>

        {/* Date Range Picker Styling */}
        <div className="flex items-center gap-3 h-14 px-6 bg-white/60 hover:bg-white border-2 border-transparent hover:border-[#8B5CF6]/20 rounded-[2rem] shadow-sm transition-all cursor-pointer group/date min-w-[280px]">
          <Calendar className="h-4 w-4 text-gray-400 group-hover/date:text-[#8B5CF6] transition-colors" />
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1">
              <input
                type="date"
                className="w-full bg-transparent text-[11px] font-bold text-gray-600 uppercase tracking-widest outline-none appearance-none [&::-webkit-calendar-picker-indicator]:hidden cursor-pointer"
              />
            </div>
            <ArrowRightLeft className="w-3 h-3 text-gray-300" />
            <div className="relative flex-1">
              <input
                type="date"
                className="w-full bg-transparent text-[11px] font-bold text-gray-600 uppercase tracking-widest outline-none appearance-none [&::-webkit-calendar-picker-indicator]:hidden cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Action Button - Standard Size */}
        <button className="h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2 whitespace-nowrap">
          <Filter className="w-4 h-4" />
          <span>Apply</span>
        </button>
      </div>
    </div>
  );
}

