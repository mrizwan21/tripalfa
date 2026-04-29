import React from "react";
import {
  Search,
  Filter,
  Calendar,
  ChevronDown,
  Package,
  ArrowRightLeft,
} from "lucide-react";
import { Button } from '../ui/button';

export function BookingFilters({ onFilter }: { onFilter: (f: any) => void }) {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 p-2">
      {/* Expanded Search Bar */}
      <div className="flex-1 relative group/search gap-4">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none gap-2">
          <Search className="h-4 w-4 text-muted-foreground group-focus-within/search:text-primary transition-colors duration-300" />
        </div>
        <input
          type="text"
          placeholder="Search by airline, airport, or flight #..."
          className="block w-full h-14 pl-12 pr-4 bg-card/60 border-2 border-transparent hover:bg-card focus:bg-card focus:border-primary/50 rounded-[2rem] text-[13px] font-bold text-foreground placeholder:text-muted-foreground outline-none transition-all duration-300 shadow-sm focus:shadow-xl focus:shadow-purple-100/50"
          onChange={(e) => onFilter({ search: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-4 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 no-scrollbar">
        {/* Product Type Semantic Select */}
        <div className="relative group/select min-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none gap-2">
            <Package className="h-4 w-4 text-muted-foreground group-hover/select:text-primary transition-colors" />
          </div>
          <select
            className="block w-full h-14 pl-12 pr-10 bg-card/60 border-2 border-transparent hover:bg-card focus:bg-card focus:border-primary/50 rounded-[2rem] text-[11px] font-bold text-foreground uppercase tracking-widest outline-none appearance-none cursor-pointer transition-all shadow-sm"
            onChange={(e) => onFilter({ product: e.target.value })}
          >
            <option value="">All Products</option>
            <option value="hotel">Luxury Hotels</option>
            <option value="flight">Premium Flights</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none gap-2">
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>

        {/* Date Range Picker Styling */}
        <div className="flex items-center gap-3 h-14 px-6 bg-card/60 hover:bg-card border-2 border-transparent hover:border-primary/20 rounded-[2rem] shadow-sm transition-all cursor-pointer group/date min-w-[280px]">
          <Calendar className="h-4 w-4 text-muted-foreground group-hover/date:text-primary transition-colors" />
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 gap-4">
              <input
                type="date"
                className="w-full bg-transparent text-[11px] font-bold text-muted-foreground uppercase tracking-widest outline-none appearance-none [&::-webkit-calendar-picker-indicator]:hidden cursor-pointer"
              />
            </div>
            <ArrowRightLeft className="w-3 h-3 text-muted-foreground" />
            <div className="relative flex-1 gap-4">
              <input
                type="date"
                className="w-full bg-transparent text-[11px] font-bold text-muted-foreground uppercase tracking-widest outline-none appearance-none [&::-webkit-calendar-picker-indicator]:hidden cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Action Button - Standard Size */}
        <Button
          variant="default"
          size="sm"
          className="h-10 px-5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <Filter className="w-4 h-4" />
          <span>Apply</span>
        </Button>
      </div>
    </div>
  );
}
