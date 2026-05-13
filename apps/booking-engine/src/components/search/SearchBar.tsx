import React from 'react';
import { cn } from '@tripalfa/shared-utils/utils';
import { SearchTabs, SearchTab } from './SearchTabs';
import { TripTypeSelector, TripType } from './TripTypeSelector';
import { TravelerSelector, TravelerConfig } from './TravelerSelector';
import { FlightSearchForm } from './FlightSearchForm';
import { HotelSearchForm } from './HotelSearchForm';
import { PackagesSearchForm } from './PackagesSearchForm';
import { CarsSearchForm } from './CarsSearchForm';
import { FlightSearchData } from './FlightSearchForm';
import { HotelSearchData } from './HotelSearchForm';

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
  onFlightSearch?: (data: FlightSearchData) => void;
  onHotelSearch?: (data: HotelSearchData) => void;
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
  onFlightSearch,
  onHotelSearch,
}: SearchBarProps) {
  return (
    <div className="w-full">
      {/* Main Search Card - Kayak-style clean design */}
      <div className="bg-white rounded-lg shadow-lg shadow-black/10 overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-gray-100">
          <SearchTabs activeTab={activeTab} onTabChange={onTabChange} />
        </div>

        {/* Form Area */}
        <div className="bg-white p-3">
          {activeTab === 'flights' && (
            <FlightSearchForm
              searchLabels={flightSearchLabels}
              isSearchEnabled={isFlightBookingEnabled}
              tripType={tripType}
              onTripTypeChange={onTripTypeChange}
              travelers={travelers}
              onTravelersChange={onTravelersChange}
              cabinClass={cabinClass}
              onCabinChange={onCabinChange}
              directFlightsOnly={directFlightsOnly}
              onDirectFlightsChange={onDirectFlightsChange}
              onSearch={onFlightSearch}
            />
          )}

          {activeTab === 'hotels' && (
            <HotelSearchForm
              searchLabels={hotelSearchLabels}
              isSearchEnabled={isHotelBookingEnabled}
              onSearch={onHotelSearch}
            />
          )}

          {activeTab === 'packages' && (
            <PackagesSearchForm isSearchEnabled={false} />
          )}

          {activeTab === 'cars' && (
            <CarsSearchForm isSearchEnabled={false} />
          )}
        </div>
      </div>
    </div>
  );
}