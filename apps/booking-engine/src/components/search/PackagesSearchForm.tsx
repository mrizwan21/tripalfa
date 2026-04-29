import React, { type ChangeEvent } from 'react';
import { MapPin, CalendarDays, Users, X, Search, Plane, Hotel } from 'lucide-react';
import { cn } from '@tripalfa/shared-utils/utils';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface PackagesSearchFormProps {
  searchLabels?: {
    destination: string;
    checkIn: string;
    checkOut: string;
    destinationPlaceholder: string;
    searchCtaLabel: string;
    disabledLabel?: string;
  };
  isSearchEnabled?: boolean;
  onSearch?: (data: PackagesSearchData) => void;
}

export interface PackagesSearchData {
  origin: string;
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
}

export function PackagesSearchForm({
  searchLabels,
  isSearchEnabled = true,
  onSearch,
}: PackagesSearchFormProps) {
  const [origin, setOrigin] = React.useState('');
  const [destination, setDestination] = React.useState('');
  const [checkIn, setCheckIn] = React.useState('');
  const [checkOut, setCheckOut] = React.useState('');
  const [guests, setGuests] = React.useState(2);
  const [rooms, setRooms] = React.useState(1);

  const defaultLabels = {
    destination: 'Destination',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    destinationPlaceholder: 'Where are you going?',
    searchCtaLabel: 'Search',
    disabledLabel: 'Package search coming soon',
  };

  const labels = { ...defaultLabels, ...searchLabels };

  const handleSearch = () => {
    if (onSearch) {
      onSearch({ origin, destination, checkIn, checkOut, guests, rooms });
    }
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
        {/* Origin Input */}
        <div className="lg:col-span-2 relative group">
          <Label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2 block">
            From
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 w-11 flex items-center justify-center pointer-events-none">
              <Plane
                className="h-4.5 w-4.5 text-[hsl(var(--muted-foreground))] group-focus-within:text-[#F45D48] transition-colors"
                strokeWidth={1.75}
              />
            </div>
            <Input
              type="text"
              placeholder="Departure city"
              className="pl-11 h-14 rounded-xl border border-[hsl(var(--border))]/60 bg-white/80 backdrop-blur-sm text-sm font-medium transition-all duration-200 focus:border-[#F45D48] focus:ring-4 focus:ring-[#F45D48]/10 focus:bg-white"
              value={origin}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setOrigin(e.target.value)}
            />
            {origin && (
              <button
                type="button"
                onClick={() => setOrigin('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[hsl(var(--muted))] transition-colors"
              >
                <X className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
              </button>
            )}
          </div>
        </div>

        {/* Destination Input */}
        <div className="lg:col-span-3 relative group">
          <Label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2 block">
            {labels.destination}
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
              placeholder={labels.destinationPlaceholder}
              className="pl-11 h-14 rounded-xl border border-[hsl(var(--border))]/60 bg-white/80 backdrop-blur-sm text-sm font-medium transition-all duration-200 focus:border-[#F45D48] focus:ring-4 focus:ring-[#F45D48]/10 focus:bg-white"
              value={destination}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDestination(e.target.value)}
            />
            {destination && (
              <button
                type="button"
                onClick={() => setDestination('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[hsl(var(--muted))] transition-colors"
              >
                <X className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
              </button>
            )}
          </div>
        </div>

        {/* Check-in Date */}
        <div className="lg:col-span-2 group">
          <Label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2 block">
            {labels.checkIn}
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
              value={checkIn}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCheckIn(e.target.value)}
            />
          </div>
        </div>

        {/* Check-out Date */}
        <div className="lg:col-span-2 group">
          <Label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2 block">
            {labels.checkOut}
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
              value={checkOut}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCheckOut(e.target.value)}
            />
          </div>
        </div>

        {/* Guests & Rooms */}
        <div className="lg:col-span-1 group">
          <Label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2 block">
            Guests
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 w-11 flex items-center justify-center pointer-events-none">
              <Users
                className="h-4.5 w-4.5 text-[hsl(var(--muted-foreground))] group-focus-within:text-[#F45D48] transition-colors"
                strokeWidth={1.75}
              />
            </div>
            <Input
              type="text"
              value={`${guests}`}
              className="pl-11 h-14 rounded-xl border border-[hsl(var(--border))]/60 bg-white/80 backdrop-blur-sm text-sm font-medium transition-all duration-200 cursor-pointer hover:bg-white"
              readOnly
            />
          </div>
        </div>

        {/* Search Button */}
        <div className="lg:col-span-2">
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
