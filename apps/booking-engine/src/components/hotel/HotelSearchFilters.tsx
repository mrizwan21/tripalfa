/**
 * Hotel Search Filters Component
 * ===============================
 * Comprehensive filter UI for hotel search with LiteAPI integration.
 * Implements primary and secondary filters with progressive disclosure.
 * 
 * LiteAPI Endpoints used:
 * - GET /data/facilities - Amenity filter options
 * - POST /hotels/rates - Filter params in request body
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Star, SlidersHorizontal, X, Check, ChevronDown, ChevronUp,
  Wifi, Car, Waves, Dumbbell, Utensils, Clock, Accessibility,
  Building2, RefreshCw, MapPin, DollarSign, Ban, Filter, RotateCcw,
  Plane, Baby, Users, Briefcase, Heart, Shield, Snowflake, Coffee,
  Sparkles, Globe, CreditCard, Wind, Tv, Dog, Bed, Smile
} from 'lucide-react';
import { HotelFacility } from '../../api/hotelApi';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Separator } from '../ui/separator';
import { Card } from '../ui/card';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HotelFilters {
  // Primary filters
  priceMin?: number;
  priceMax?: number;
  refundableOnly: boolean;
  sortBy: 'top_picks' | 'price_asc' | 'price_desc' | 'rating';
  
  // Secondary filters
  starRating: number[];
  facilityIds: number[];
  strictFacilitiesFiltering: boolean;
  hotelTypeIds: number[];
  chainIds: number[];
  minRating: number;
  minReviewsCount: number;
  advancedAccessibilityOnly: boolean;
  boardType?: string;
  
  // Additional filters
  distanceFromCenter?: number;
  guestRatingMin?: number;
  paymentOptions?: string[];
  roomTypes?: string[];
}

interface HotelSearchFiltersProps {
  facilities: HotelFacility[];
  facilitiesLoading: boolean;
  filters: HotelFilters;
  onFiltersChange: (filters: HotelFilters) => void;
  onApply: () => void;
  onReset: () => void;
  resultCounts?: {
    total: number;
    byStar?: Record<number, number>;
    byFacility?: Record<number, number>;
  };
  isMobile?: boolean;
  className?: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const STAR_RATINGS = [5, 4, 3, 2, 1];

const BOARD_TYPES = [
  { value: 'RO', label: 'Room Only', icon: Bed },
  { value: 'BB', label: 'Breakfast Included', icon: Coffee },
  { value: 'HB', label: 'Half Board', icon: Utensils },
  { value: 'FB', label: 'Full Board', icon: Utensils },
  { value: 'AI', label: 'All Inclusive', icon: Sparkles },
];

const PROPERTY_TYPES = [
  { id: 1, name: 'Hotel', icon: Building2, code: 'HOTEL' },
  { id: 2, name: 'Resort', icon: Waves, code: 'RESORT' },
  { id: 3, name: 'Apartment', icon: Building2, code: 'APARTMENT' },
  { id: 4, name: 'Villa', icon: Heart, code: 'VILLA' },
  { id: 5, name: 'Boutique', icon: Sparkles, code: 'BOUTIQUE' },
];

const ROOM_TYPES = [
  { id: 'single', label: 'Single Room' },
  { id: 'double', label: 'Double Room' },
  { id: 'twin', label: 'Twin Room' },
  { id: 'suite', label: 'Suite' },
  { id: 'deluxe', label: 'Deluxe Room' },
  { id: 'family', label: 'Family Room' },
];

const CANCELLATION_POLICIES = [
  { id: 'free', label: 'Free Cancellation' },
  { id: 'partial', label: 'Partial Refund' },
  { id: 'nonRefundable', label: 'Non-refundable' },
];

const PAYMENT_OPTIONS = [
  { id: 'payNow', label: 'Pay Now' },
  { id: 'payLater', label: 'Pay at Property' },
  { id: 'noCard', label: 'No Credit Card Required' },
];

const SORT_OPTIONS = [
  { value: 'top_picks', label: 'Recommended' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Guest Rating' },
];

const GUEST_POLICIES = [
  { id: 'petFriendly', label: 'Pet Friendly', icon: Dog },
  { id: 'familyFriendly', label: 'Family Friendly', icon: Baby },
  { id: 'accessible', label: 'Wheelchair Accessible', icon: Accessibility },
];

// ── Icon Mapping for Facilities ──────────────────────────────────────────────

const FACILITY_ICONS: Record<string, React.ElementType> = {
  'WIFI': Wifi,
  'PARKING': Car,
  'POOL': Waves,
  'GYM': Dumbbell,
  'SPA': Heart,
  'RESTAURANT': Utensils,
  'BAR': Coffee,
  'ROOM_SERVICE': Utensils,
  'AC': Wind,
  'BEACH': Waves,
  'KIDS_CLUB': Baby,
  'BUSINESS_CENTER': Briefcase,
  'ACCESSIBLE': Accessibility,
  'FRONT_DESK_24H': Clock,
  'CONCIERGE': Users,
  'SAFE': Shield,
  'ELEVATOR': Building2,
  'LAUNDRY': RefreshCw,
  'TV': Tv,
};

// ── Sub-Components ───────────────────────────────────────────────────────────

interface FilterSectionProps {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
  className?: string;
}

function FilterSection({ title, icon: Icon, children, defaultOpen = true, count, className = '' }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className={`border-b border-gray-100 last:border-0 ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg px-2 -mx-2"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-gray-400" />}
          <span className="text-sm font-bold text-gray-700">{title}</span>
          {count !== undefined && count > 0 && (
            <span className="bg-[#A855F7] text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center">
              {count}
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {isOpen && <div className="pb-4">{children}</div>}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function HotelSearchFilters({
  facilities,
  facilitiesLoading,
  filters,
  onFiltersChange,
  onApply,
  onReset,
  resultCounts,
  isMobile = false,
  className = '',
}: HotelSearchFiltersProps): React.JSX.Element {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([filters.priceMin || 0, filters.priceMax || 1000]);
  const [distanceRange, setDistanceRange] = useState([0, filters.distanceFromCenter || 10]);
  const [guestRatingMin, setGuestRatingMin] = useState([filters.guestRatingMin || 6]);
  
  // Local state for checkboxes
  const [selectedStars, setSelectedStars] = useState<number[]>(filters.starRating);
  const [selectedFacilities, setSelectedFacilities] = useState<number[]>(filters.facilityIds);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<number[]>(filters.hotelTypeIds);
  const [selectedBoardTypes, setSelectedBoardTypes] = useState<string[]>(filters.boardType ? [filters.boardType] : []);
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>(filters.roomTypes || []);
  const [selectedCancellation, setSelectedCancellation] = useState<string[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<string[]>(filters.paymentOptions || []);
  const [selectedGuestPolicies, setSelectedGuestPolicies] = useState<string[]>(
    filters.advancedAccessibilityOnly ? ['accessible'] : []
  );
  const [strictMode, setStrictMode] = useState(filters.strictFacilitiesFiltering);
  
  // Calculate total active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedStars.length > 0) count++;
    if (selectedFacilities.length > 0) count++;
    if (filters.priceMin || filters.priceMax) count++;
    if (filters.refundableOnly) count++;
    if (selectedBoardTypes.length > 0) count++;
    if (selectedPropertyTypes.length > 0) count++;
    if (filters.advancedAccessibilityOnly) count++;
    return count;
  }, [filters, selectedStars, selectedFacilities, selectedBoardTypes, selectedPropertyTypes]);
  
  // Sync local state with props
  useEffect(() => {
    setSelectedStars(filters.starRating);
    setSelectedFacilities(filters.facilityIds);
    setSelectedPropertyTypes(filters.hotelTypeIds);
    setSelectedBoardTypes(filters.boardType ? [filters.boardType] : []);
    setStrictMode(filters.strictFacilitiesFiltering);
    setPriceRange([filters.priceMin || 0, filters.priceMax || 1000]);
  }, [filters]);
  
  // Toggle handlers
  const toggleStar = (star: number) => {
    const newStars = selectedStars.includes(star)
      ? selectedStars.filter(s => s !== star)
      : [...selectedStars, star].sort((a, b) => b - a);
    setSelectedStars(newStars);
  };
  
  const toggleFacility = (id: number) => {
    const newFacilities = selectedFacilities.includes(id)
      ? selectedFacilities.filter(f => f !== id)
      : [...selectedFacilities, id];
    setSelectedFacilities(newFacilities);
  };
  
  const togglePropertyType = (id: number) => {
    const newTypes = selectedPropertyTypes.includes(id)
      ? selectedPropertyTypes.filter(t => t !== id)
      : [...selectedPropertyTypes, id];
    setSelectedPropertyTypes(newTypes);
  };
  
  const toggleBoardType = (value: string) => {
    const newTypes = selectedBoardTypes.includes(value)
      ? selectedBoardTypes.filter(t => t !== value)
      : [...selectedBoardTypes, value];
    setSelectedBoardTypes(newTypes);
  };
  
  const toggleRoomType = (id: string) => {
    const newTypes = selectedRoomTypes.includes(id)
      ? selectedRoomTypes.filter(t => t !== id)
      : [...selectedRoomTypes, id];
    setSelectedRoomTypes(newTypes);
  };
  
  const toggleCancellation = (id: string) => {
    const newPolicies = selectedCancellation.includes(id)
      ? selectedCancellation.filter(p => p !== id)
      : [...selectedCancellation, id];
    setSelectedCancellation(newPolicies);
  };
  
  const togglePayment = (id: string) => {
    const newOptions = selectedPayment.includes(id)
      ? selectedPayment.filter(o => o !== id)
      : [...selectedPayment, id];
    setSelectedPayment(newOptions);
  };
  
  const toggleGuestPolicy = (id: string) => {
    const newPolicies = selectedGuestPolicies.includes(id)
      ? selectedGuestPolicies.filter(p => p !== id)
      : [...selectedGuestPolicies, id];
    setSelectedGuestPolicies(newPolicies);
  };
  
  // Apply all filters
  const handleApplyFilters = () => {
    const newFilters: HotelFilters = {
      ...filters,
      starRating: selectedStars,
      facilityIds: selectedFacilities,
      strictFacilitiesFiltering: strictMode,
      hotelTypeIds: selectedPropertyTypes,
      boardType: selectedBoardTypes[0],
      roomTypes: selectedRoomTypes,
      paymentOptions: selectedPayment,
      priceMin: priceRange[0] || undefined,
      priceMax: priceRange[1] || undefined,
      distanceFromCenter: distanceRange[1],
      guestRatingMin: guestRatingMin[0],
      advancedAccessibilityOnly: selectedGuestPolicies.includes('accessible'),
    };
    onFiltersChange(newFilters);
    onApply();
    if (isMobile) setShowMobileFilters(false);
  };
  
  // Clear all filters
  const handleClearAll = () => {
    setSelectedStars([]);
    setSelectedFacilities([]);
    setSelectedPropertyTypes([]);
    setSelectedBoardTypes([]);
    setSelectedRoomTypes([]);
    setSelectedCancellation([]);
    setSelectedPayment([]);
    setSelectedGuestPolicies([]);
    setStrictMode(false);
    setPriceRange([0, 1000]);
    setDistanceRange([0, 10]);
    setGuestRatingMin([6]);
    onReset();
  };
  
  // Render stars
  const renderStars = (count: number) => (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      ))}
    </div>
  );
  
  // Get facility icon
  const getFacilityIcon = (code: string) => {
    return FACILITY_ICONS[code.toUpperCase()] || Building2;
  };
  
  // Filter content
  const FilterContent = () => (
    <div className="space-y-1">
      {/* Sort By */}
      <FilterSection title="Sort By" icon={Sparkles} defaultOpen={true}>
        <RadioGroup
          value={filters.sortBy}
          onValueChange={(value) => onFiltersChange({ ...filters, sortBy: value as HotelFilters['sortBy'] })}
          className="space-y-3"
        >
          {SORT_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={`sort-${option.value}`} />
              <Label htmlFor={`sort-${option.value}`} className="cursor-pointer font-normal text-sm">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </FilterSection>
      
      {/* Price Range */}
      <FilterSection title="Price Range" icon={DollarSign} count={priceRange[0] > 0 || priceRange[1] < 1000 ? 1 : 0}>
        <div className="space-y-4 pt-2">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            min={0}
            max={1000}
            step={10}
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 font-medium">${priceRange[0]}</span>
            <span className="text-gray-500 font-medium">${priceRange[1]}+</span>
          </div>
        </div>
      </FilterSection>
      
      {/* Star Rating */}
      <FilterSection title="Star Rating" icon={Star} count={selectedStars.length}>
        <div className="space-y-3">
          {STAR_RATINGS.map((star) => (
            <div key={star} className="flex items-center space-x-3">
              <Checkbox
                id={`star-${star}`}
                checked={selectedStars.includes(star)}
                onCheckedChange={() => toggleStar(star)}
              />
              <Label htmlFor={`star-${star}`} className="cursor-pointer font-normal flex items-center gap-2">
                {renderStars(star)}
                <span className="text-gray-500 text-sm">& up</span>
              </Label>
            </div>
          ))}
        </div>
      </FilterSection>
      
      {/* Property Type */}
      <FilterSection title="Property Type" icon={Building2} count={selectedPropertyTypes.length} defaultOpen={false}>
        <div className="space-y-3">
          {PROPERTY_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <div key={type.id} className="flex items-center space-x-3">
                <Checkbox
                  id={`property-${type.id}`}
                  checked={selectedPropertyTypes.includes(type.id)}
                  onCheckedChange={() => togglePropertyType(type.id)}
                />
                <Label htmlFor={`property-${type.id}`} className="cursor-pointer font-normal flex items-center gap-2">
                  <Icon className="h-4 w-4 text-gray-500" />
                  {type.name}
                </Label>
              </div>
            );
          })}
        </div>
      </FilterSection>
      
      {/* Room Type */}
      <FilterSection title="Room Type" icon={Bed} count={selectedRoomTypes.length} defaultOpen={false}>
        <div className="space-y-3">
          {ROOM_TYPES.map((type) => (
            <div key={type.id} className="flex items-center space-x-3">
              <Checkbox
                id={`room-${type.id}`}
                checked={selectedRoomTypes.includes(type.id)}
                onCheckedChange={() => toggleRoomType(type.id)}
              />
              <Label htmlFor={`room-${type.id}`} className="cursor-pointer font-normal text-sm">
                {type.label}
              </Label>
            </div>
          ))}
        </div>
      </FilterSection>
      
      {/* Amenities */}
      <FilterSection title="Amenities" icon={Wifi} count={selectedFacilities.length} defaultOpen={false}>
        <div className="space-y-4">
          {/* Strict Mode Toggle */}
          <div className="p-3 bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl border border-gray-100">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                  strictMode ? 'bg-[#A855F7] text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {strictMode ? 'ALL' : 'ANY'}
                </div>
                <span className="text-xs font-bold text-gray-700">
                  {strictMode ? 'Must have all' : 'Match any'}
                </span>
              </div>
              <button
                onClick={() => setStrictMode(!strictMode)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  strictMode ? 'bg-[#A855F7]' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                  strictMode ? 'left-5' : 'left-0.5'
                }`} />
              </button>
            </label>
          </div>
          
          {/* Facilities Grid */}
          {facilitiesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#152467] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {facilities.slice(0, 20).map((facility) => {
                const Icon = getFacilityIcon(facility.code);
                const isSelected = selectedFacilities.includes(facility.id);
                
                return (
                  <button
                    key={facility.id}
                    onClick={() => toggleFacility(facility.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-[#A855F7] text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={14} className={isSelected ? 'text-white' : 'text-gray-400'} />
                    <span className="truncate">{facility.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </FilterSection>
      
      {/* Guest Policies */}
      <FilterSection title="Guest Policies" icon={Users} count={selectedGuestPolicies.length} defaultOpen={false}>
        <div className="space-y-3">
          {GUEST_POLICIES.map((policy) => {
            const Icon = policy.icon;
            return (
              <div key={policy.id} className="flex items-center space-x-3">
                <Checkbox
                  id={`policy-${policy.id}`}
                  checked={selectedGuestPolicies.includes(policy.id)}
                  onCheckedChange={() => toggleGuestPolicy(policy.id)}
                />
                <Label htmlFor={`policy-${policy.id}`} className="cursor-pointer font-normal flex items-center gap-2">
                  <Icon className="h-4 w-4 text-gray-500" />
                  {policy.label}
                </Label>
              </div>
            );
          })}
        </div>
      </FilterSection>
      
      {/* Distance from Center */}
      <FilterSection title="Distance from Center" icon={MapPin} defaultOpen={false}>
        <div className="space-y-4 pt-2">
          <Slider
            value={distanceRange}
            onValueChange={setDistanceRange}
            min={0}
            max={20}
            step={0.5}
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {distanceRange[0]} km
            </span>
            <span className="text-gray-500">{distanceRange[1]} km</span>
          </div>
        </div>
      </FilterSection>
      
      {/* Guest Rating */}
      <FilterSection title="Guest Rating" icon={Smile} defaultOpen={false}>
        <div className="space-y-4 pt-2">
          <Slider
            value={guestRatingMin}
            onValueChange={setGuestRatingMin}
            min={0}
            max={10}
            step={0.5}
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 flex items-center gap-1">
              <Smile className="h-3 w-3" />
              {guestRatingMin[0]}/10 & up
            </span>
          </div>
        </div>
      </FilterSection>
      
      {/* Meal Plans */}
      <FilterSection title="Meal Plans" icon={Utensils} count={selectedBoardTypes.length} defaultOpen={false}>
        <div className="space-y-3">
          {BOARD_TYPES.map((plan) => {
            const Icon = plan.icon;
            return (
              <div key={plan.value} className="flex items-center space-x-3">
                <Checkbox
                  id={`meal-${plan.value}`}
                  checked={selectedBoardTypes.includes(plan.value)}
                  onCheckedChange={() => toggleBoardType(plan.value)}
                />
                <Label htmlFor={`meal-${plan.value}`} className="cursor-pointer font-normal flex items-center gap-2">
                  <Icon className="h-4 w-4 text-gray-500" />
                  {plan.label}
                </Label>
              </div>
            );
          })}
        </div>
      </FilterSection>
      
      {/* Cancellation Policy */}
      <FilterSection title="Cancellation Policy" icon={Shield} count={selectedCancellation.length} defaultOpen={false}>
        <div className="space-y-3">
          {CANCELLATION_POLICIES.map((policy) => (
            <div key={policy.id} className="flex items-center space-x-3">
              <Checkbox
                id={`cancel-${policy.id}`}
                checked={selectedCancellation.includes(policy.id)}
                onCheckedChange={() => toggleCancellation(policy.id)}
              />
              <Label htmlFor={`cancel-${policy.id}`} className="cursor-pointer font-normal text-sm">
                {policy.label}
              </Label>
            </div>
          ))}
        </div>
      </FilterSection>
      
      {/* Payment Options */}
      <FilterSection title="Payment Options" icon={CreditCard} count={selectedPayment.length} defaultOpen={false}>
        <div className="space-y-3">
          {PAYMENT_OPTIONS.map((option) => (
            <div key={option.id} className="flex items-center space-x-3">
              <Checkbox
                id={`payment-${option.id}`}
                checked={selectedPayment.includes(option.id)}
                onCheckedChange={() => togglePayment(option.id)}
              />
              <Label htmlFor={`payment-${option.id}`} className="cursor-pointer font-normal text-sm">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </FilterSection>
    </div>
  );
  
  // Mobile Filter Button
  if (isMobile) {
    return (
      <>
        {/* Mobile Filter Button */}
        <button
          onClick={() => setShowMobileFilters(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-6 py-3 bg-[#152467] text-white rounded-full shadow-2xl text-xs font-bold uppercase tracking-wider"
        >
          <SlidersHorizontal size={16} />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-[#A855F7] w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black">
              {activeFilterCount}
            </span>
          )}
        </button>
        
        {/* Mobile Bottom Sheet */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
              onClick={() => setShowMobileFilters(false)}
            />
            
            {/* Sheet */}
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-hidden animate-slide-up">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>
              
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-black text-gray-900">Filters</h3>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
              
              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(85vh-140px)] px-6 py-4">
                <FilterContent />
              </div>
              
              {/* Footer */}
              <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-white">
                <button
                  onClick={handleClearAll}
                  className="flex-1 h-12 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Clear All
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="flex-1 h-12 bg-[#152467] text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
  
  // Desktop Sidebar
  return (
    <Card className={`bg-white rounded-2xl shadow-lg border border-gray-100 ${className}`}>
      <div className="p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-white z-10 pb-4">
          <h2 className="text-xl font-black text-gray-900">Filters</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearAll}
            className="text-xs text-gray-500 hover:text-[#152467]"
          >
            Clear All
          </Button>
        </div>
        
        <FilterContent />
        
        {/* Apply Button */}
        <div className="sticky bottom-0 bg-white pt-6 mt-6 border-t border-gray-100">
          <Button
            onClick={handleApplyFilters}
            className="w-full h-12 bg-[#152467] hover:bg-[#0A1C50] text-white rounded-xl text-xs font-black uppercase tracking-wider"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default HotelSearchFilters;