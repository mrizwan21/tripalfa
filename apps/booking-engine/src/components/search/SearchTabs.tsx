'use client';

/**
 * Search Tabs - Modern OTA Design
 *
 * Features:
 * - Clean minimal tab design with subtle active indicator line
 * - Inspired by Booking.com / Kayak / Expedia
 * - Smooth transitions and accessible keyboard navigation
 */

import React from 'react';
import { cn } from '@tripalfa/shared-utils/utils';
import { AirplaneTilt, Bed, Car, SuitcaseSimple } from '@phosphor-icons/react';

export type SearchTab = 'flights' | 'hotels' | 'packages' | 'cars';

interface SearchTabItem {
  id: SearchTab;
  label: string;
  icon: React.ElementType;
  disabled?: boolean;
}

interface SearchTabsProps {
  activeTab: SearchTab;
  onTabChange: (tab: SearchTab) => void;
  tabs?: SearchTabItem[];
  className?: string;
}

export function SearchTabs({ activeTab, onTabChange, tabs, className }: SearchTabsProps) {
  const defaultTabs: SearchTabItem[] = [
    { id: 'flights', label: 'Flights', icon: AirplaneTilt },
    { id: 'hotels', label: 'Hotels', icon: Bed },
    { id: 'packages', label: 'Packages', icon: SuitcaseSimple },
    { id: 'cars', label: 'Car Rental', icon: Car },
  ];

  const tabItems = tabs || defaultTabs;

  return (
    <div className={cn('relative', className)} role="tablist" aria-orientation="horizontal">
      <div className="flex items-center gap-1 px-4 py-2">
        {tabItems.map(({ id, label, icon: Icon, disabled }) => {
          const isActive = id === activeTab;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${id}`}
              disabled={disabled}
              onClick={() => !disabled && onTabChange(id)}
              className={cn(
                'relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 outline-none',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                isActive
                  ? 'text-[#003b95]'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 transition-all duration-200',
                  isActive ? 'text-[#003b95]' : 'text-gray-400'
                )}
                size={20}
                weight={isActive ? 'fill' : 'regular'}
              />
              <span className="hidden sm:inline">{label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#003b95] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
