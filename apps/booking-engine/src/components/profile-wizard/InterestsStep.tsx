import React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@tripalfa/ui-components";
import { Label } from "../ui/label";

interface InterestChip {
  id: string;
  label: string;
  icon: string;
  description: string;
}

const INTEREST_OPTIONS: InterestChip[] = [
  {
    id: "adventure",
    label: "Adventure",
    icon: "🧗",
    description: "Hiking, climbing, extreme sports",
  },
  {
    id: "beach",
    label: "Beach & Islands",
    icon: "🏖️",
    description: "Tropical getaways and coastal retreats",
  },
  {
    id: "culture",
    label: "Culture & History",
    icon: "🏛️",
    description: "Museums, heritage sites, local traditions",
  },
  {
    id: "food",
    label: "Food & Dining",
    icon: "🍽️",
    description: "Culinary experiences and gastronomy tours",
  },
  {
    id: "luxury",
    label: "Luxury Travel",
    icon: "💎",
    description: "Premium stays, first-class experiences",
  },
  {
    id: "nature",
    label: "Nature & Wildlife",
    icon: "🌿",
    description: "Safaris, national parks, eco-tourism",
  },
  {
    id: "nightlife",
    label: "Nightlife & Entertainment",
    icon: "🎶",
    description: "Clubs, bars, live performances",
  },
  {
    id: "photography",
    label: "Photography",
    icon: "📸",
    description: "Scenic spots and photo opportunities",
  },
  {
    id: "road-trip",
    label: "Road Trips",
    icon: "🚗",
    description: "Scenic drives and self-guided tours",
  },
  {
    id: "shopping",
    label: "Shopping & Markets",
    icon: "🛍️",
    description: "Local bazaars, designer outlets, souvenirs",
  },
  {
    id: "wellness",
    label: "Wellness & Spa",
    icon: "🧘",
    description: "Spas, yoga retreats, wellness resorts",
  },
  {
    id: "family",
    label: "Family Travel",
    icon: "👨‍👩‍👧‍👦",
    description: "Kid-friendly activities and family resorts",
  },
  {
    id: "solo",
    label: "Solo Travel",
    icon: "🎒",
    description: "Independent travel and social hostels",
  },
  {
    id: "business",
    label: "Business Travel",
    icon: "💼",
    description: "Work trips, conferences, corporate stays",
  },
  {
    id: "cruise",
    label: "Cruises & Sailing",
    icon: "🚢",
    description: "Ocean cruises, river boats, yachting",
  },
];

interface InterestsStepProps {
  selectedInterests: string[];
  onToggleInterest: (id: string) => void;
  maxSelections?: number;
  minSelections?: number;
  errors: Record<string, string>;
}

export function InterestsStep({
  selectedInterests,
  onToggleInterest,
  maxSelections = 8,
  minSelections = 1,
  errors,
}: InterestsStepProps) {
  const remaining = maxSelections - selectedInterests.length;

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
          What interests you?
        </Label>
        <p className="text-xs text-gray-400 mb-4">
          Select up to {maxSelections} interests to personalize your experience.
          At least {minSelections} required.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {INTEREST_OPTIONS.map((interest) => {
            const isSelected = selectedInterests.includes(interest.id);
            const isDisabled =
              !isSelected && remaining <= 0;

            return (
              <button
                key={interest.id}
                type="button"
                disabled={isDisabled}
                onClick={() => onToggleInterest(interest.id)}
                className={cn(
                  "group relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all duration-200",
                  isSelected
                    ? "bg-[#0071e3]/5 border-[#0071e3] text-[#0071e3]"
                    : isDisabled
                      ? "bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed"
                      : "bg-white border-gray-200 text-gray-700 hover:border-[#0071e3]/30 hover:bg-[#0071e3]/5 active:scale-[0.97]"
                )}
                aria-pressed={isSelected}
                aria-label={`${interest.label}${isSelected ? " selected" : ""}`}
              >
                {/* Check badge */}
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#0071e3] flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </div>
                )}

                <span className="text-xl">{interest.icon}</span>
                <span className="text-[11px] font-semibold leading-tight truncate w-full">
                  {interest.label}
                </span>
                <span className="text-[10px] text-gray-400 leading-tight hidden sm:block">
                  {interest.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selection count */}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-2">
        <span>
          {selectedInterests.length} of {maxSelections} selected
        </span>
        {selectedInterests.length < minSelections && (
          <span className="text-amber-500">
            Select at least {minSelections - selectedInterests.length} more
          </span>
        )}
      </div>

      {errors.interests && (
        <p className="text-sm text-red-500">{errors.interests}</p>
      )}
    </div>
  );
}