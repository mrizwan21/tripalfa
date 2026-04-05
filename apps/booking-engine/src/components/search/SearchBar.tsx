import React from 'react';
import { cn } from '@tripalfa/shared-utils/utils';
import { SearchTabs, SearchTab } from './SearchTabs';
import { TripTypeSelector, TripType } from './TripTypeSelector';
import { TravelerSelector, TravelerConfig } from './TravelerSelector';
import { FlightSearchForm } from './FlightSearchForm';
import { HotelSearchForm } from './HotelSearchForm';
import { PackagesSearchForm } from './PackagesSearchForm';
import { CarsSearchForm } from './CarsSearchForm';
import { Sparkles, Car, Plane, Hotel } from 'lucide-react';

interface SearchBarProps {
  activeTab: SearchTab;
  onTabChange: (tab: SearchTab) => void;
  tripType: TripType;
  onTripTypeChange: (type: TripType) => void;
  travelers: TravelerConfig;
  onTravelersChange: (travelers: TravelerConfig) => void;
  cabinClass: string;
  onCabinChange: (cabin: string) => void;
  directFlightsOnly: boolean;
  onDirectFlightsChange: (value: boolean) => void;
  isFlightBookingEnabled: boolean;
  isHotelBookingEnabled: boolean;
  flightSearchLabels: {
    from: string;
    to: string;
    departure: string;
    return: string;
    originPlaceholder: string;
    destinationPlaceholder: string;
    searchCtaLabel: string;
    disabledLabel?: string;
  };
  hotelSearchLabels: {
    destination: string;
    checkIn: string;
    checkOut: string;
    destinationPlaceholder: string;
    searchCtaLabel: string;
    disabledLabel?: string;
  };
}

export function SearchBar({
  activeTab,
  onTabChange,
  tripType,
  onTripTypeChange,
  travelers,
  onTravelersChange,
  cabinClass,
  onCabinChange,
  directFlightsOnly,
  onDirectFlightsChange,
  isFlightBookingEnabled,
  isHotelBookingEnabled,
  flightSearchLabels,
  hotelSearchLabels,
}: SearchBarProps) {
  return (
    <div className="w-full">
      <div className="bg-white/[0.98] backdrop-blur-2xl rounded-3xl shadow-2xl shadow-black/[0.08] ring-1 ring-black/[0.05] overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-[hsl(var(--border))]/40">
          <div className="flex flex-wrap items-center justify-between gap-4 p-5">
            <SearchTabs
              activeTab={activeTab}
              onTabChange={onTabChange}
            />

            {activeTab === 'flights' && isFlightBookingEnabled && (
              <div className="flex items-center gap-3">
                <TripTypeSelector value={tripType} onChange={onTripTypeChange} />
                <TravelerSelector
                  value={travelers}
                  onChange={onTravelersChange}
                  cabinClass={cabinClass}
                  onCabinChange={onCabinChange}
                />
                <label className="flex items-center gap-2 cursor-pointer pl-2">
                  <input
                    type="checkbox"
                    checked={directFlightsOnly}
                    onChange={(e) => onDirectFlightsChange(e.target.checked)}
                    className="w-4 h-4 rounded border-[hsl(var(--border))] text-[#F45D48] focus:ring-[#F45D48]/20 focus:ring-2"
                  />
                  <span className="text-sm text-[hsl(var(--muted-foreground))] font-medium">Direct only</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Search Form Area */}
        <div className="p-5">
          {activeTab === 'flights' && (
            <FlightSearchForm
              searchLabels={flightSearchLabels}
              isSearchEnabled={isFlightBookingEnabled}
            />
          )}

          {activeTab === 'hotels' && (
            <HotelSearchForm
              searchLabels={hotelSearchLabels}
              isSearchEnabled={isHotelBookingEnabled}
            />
          )}

          {activeTab === 'packages' && (
            <PackagesSearchForm
              isSearchEnabled={false}
            />
          )}

          {activeTab === 'cars' && (
            <CarsSearchForm
              isSearchEnabled={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}