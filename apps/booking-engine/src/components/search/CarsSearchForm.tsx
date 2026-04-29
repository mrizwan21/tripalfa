import React, { type ChangeEvent } from 'react';
import { MapPin, CalendarDays, Clock, X, Search, Car } from 'lucide-react';
import { cn } from '@tripalfa/shared-utils/utils';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface CarsSearchFormProps {
  searchLabels?: {
    pickupLocation: string;
    pickupDate: string;
    pickupTime: string;
    returnDate: string;
    returnTime: string;
    locationPlaceholder: string;
    searchCtaLabel: string;
    disabledLabel?: string;
  };
  isSearchEnabled?: boolean;
  onSearch?: (data: CarsSearchData) => void;
}

export interface CarsSearchData {
  pickupLocation: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
}

export function CarsSearchForm({
  searchLabels,
  isSearchEnabled = true,
  onSearch,
}: CarsSearchFormProps) {
  const [pickupLocation, setPickupLocation] = React.useState('');
  const [pickupDate, setPickupDate] = React.useState('');
  const [pickupTime, setPickupTime] = React.useState('10:00');
  const [returnDate, setReturnDate] = React.useState('');
  const [returnTime, setReturnTime] = React.useState('10:00');

  const defaultLabels = {
    pickupLocation: 'Pick-up Location',
    pickupDate: 'Pick-up Date',
    pickupTime: 'Pick-up Time',
    returnDate: 'Return Date',
    returnTime: 'Return Time',
    locationPlaceholder: 'Airport, city, or hotel',
    searchCtaLabel: 'Search',
    disabledLabel: 'Car rental search coming soon',
  };

  const labels = { ...defaultLabels, ...searchLabels };

  const handleSearch = () => {
    if (onSearch) {
      onSearch({ pickupLocation, pickupDate, pickupTime, returnDate, returnTime });
    }
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
        {/* Pickup Location */}
        <div className="lg:col-span-3 relative group">
          <Label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2 block">
            {labels.pickupLocation}
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 w-11 flex items-center justify-center pointer-events-none">
              <MapPin
                className="h-4.5 w-4.5 text-[hsl(var(--muted-foreground))] group-focus-within:text-[#F45D48] transition-colors"
                strokeWidth={1.75}
              />
            </div>
            <Input
              type="text"
              placeholder={labels.locationPlaceholder}
              className="pl-11 h-14 rounded-xl border border-[hsl(var(--border))]/60 bg-white/80 backdrop-blur-sm text-sm font-medium transition-all duration-200 focus:border-[#F45D48] focus:ring-4 focus:ring-[#F45D48]/10 focus:bg-white"
              value={pickupLocation}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPickupLocation(e.target.value)}
            />
            {pickupLocation && (
              <button
                type="button"
                onClick={() => setPickupLocation('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[hsl(var(--muted))] transition-colors"
              >
                <X className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
              </button>
            )}
          </div>
        </div>

        {/* Pickup Date */}
        <div className="lg:col-span-2 group">
          <Label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2 block">
            {labels.pickupDate}
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 w-11 flex items-center justify-center pointer-events-none">
              <CalendarDays
                className="h-4.5 w-4.5 text-[hsl(var(--muted-foreground))] group-focus-within:text-[#F45D48] transition-colors"
                strokeWidth={1.75}
              />
            </div>
            <Input
              type="date"
              className="pl-11 h-14 rounded-xl border border-[hsl(var(--border))]/60 bg-white/80 backdrop-blur-sm text-sm font-medium transition-all duration-200 focus:border-[#F45D48] focus:ring-4 focus:ring-[#F45D48]/10 focus:bg-white"
              value={pickupDate}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPickupDate(e.target.value)}
            />
          </div>
        </div>

        {/* Pickup Time */}
        <div className="lg:col-span-1 group">
          <Label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2 block">
            Time
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 w-11 flex items-center justify-center pointer-events-none">
              <Clock
                className="h-4.5 w-4.5 text-[hsl(var(--muted-foreground))] group-focus-within:text-[#F45D48] transition-colors"
                strokeWidth={1.75}
              />
            </div>
            <Input
              type="time"
              className="pl-11 h-14 rounded-xl border border-[hsl(var(--border))]/60 bg-white/80 backdrop-blur-sm text-sm font-medium transition-all duration-200 focus:border-[#F45D48] focus:ring-4 focus:ring-[#F45D48]/10 focus:bg-white"
              value={pickupTime}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPickupTime(e.target.value)}
            />
          </div>
        </div>

        {/* Return Date */}
        <div className="lg:col-span-2 group">
          <Label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2 block">
            {labels.returnDate}
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 w-11 flex items-center justify-center pointer-events-none">
              <CalendarDays
                className="h-4.5 w-4.5 text-[hsl(var(--muted-foreground))] group-focus-within:text-[#F45D48] transition-colors"
                strokeWidth={1.75}
              />
            </div>
            <Input
              type="date"
              className="pl-11 h-14 rounded-xl border border-[hsl(var(--border))]/60 bg-white/80 backdrop-blur-sm text-sm font-medium transition-all duration-200 focus:border-[#F45D48] focus:ring-4 focus:ring-[#F45D48]/10 focus:bg-white"
              value={returnDate}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setReturnDate(e.target.value)}
            />
          </div>
        </div>

        {/* Return Time */}
        <div className="lg:col-span-1 group">
          <Label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2 block">
            Time
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 w-11 flex items-center justify-center pointer-events-none">
              <Clock
                className="h-4.5 w-4.5 text-[hsl(var(--muted-foreground))] group-focus-within:text-[#F45D48] transition-colors"
                strokeWidth={1.75}
              />
            </div>
            <Input
              type="time"
              className="pl-11 h-14 rounded-xl border border-[hsl(var(--border))]/60 bg-white/80 backdrop-blur-sm text-sm font-medium transition-all duration-200 focus:border-[#F45D48] focus:ring-4 focus:ring-[#F45D48]/10 focus:bg-white"
              value={returnTime}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setReturnTime(e.target.value)}
            />
          </div>
        </div>

        {/* Search Button */}
        <div className="lg:col-span-3">
          <button
            type="button"
            disabled={!isSearchEnabled}
            onClick={handleSearch}
            className={cn(
              'w-full h-14 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 outline-none',
              'bg-[hsl(var(--primary))] text-white',
              'hover:bg-[hsl(var(--primary))]/90 shadow-lg hover:shadow-xl hover:-translate-y-0.5',
              'active:translate-y-0 active:shadow-md',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:translate-y-0'
            )}
          >
            <Search className="h-4.5 w-4.5" strokeWidth={2.5} />
            {labels.searchCtaLabel}
          </button>
        </div>
      </div>

      {/* Disabled Message */}
      {!isSearchEnabled && (
        <div className="mt-4 text-center py-3">
          <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))]/40 inline-flex items-center gap-2 px-4 py-2 rounded-full">
            {labels.disabledLabel}
          </p>
        </div>
      )}
    </div>
  );
}
