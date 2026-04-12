'use client';

/**
 * Search Tabs - Premium International OTA Design
 *
 * Upgraded with:
 * - Phosphor animated icons (duotone with active state)
 * - Smooth sliding indicator animation
 * - Premium hover effects and transitions
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
  const activeIndex = tabItems.findIndex(t => t.id === activeTab);

  return (
    <div className={cn('relative', className)}>
      <div
        className="relative inline-flex items-center bg-gray-100/60 backdrop-blur-md rounded-xl p-1.5 shadow-inner shadow-gray-200/50"
        role="tablist"
        aria-orientation="horizontal"
      >
        {/* Sliding indicator */}
        <div
          className="absolute inset-y-1.5 rounded-xl bg-white shadow-lg shadow-black/5 ring-1 ring-gray-200/50 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{
            left: `calc(${activeIndex * 25}% + 6px)`,
            width: `calc(25% - 12px)`,
          }}
          aria-hidden="true"
        />

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
                'relative z-10 flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 outline-none group/tab',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 transition-all duration-300',
                  isActive
                    ? 'text-[hsl(var(--primary))] scale-110'
                    : 'group-hover/tab:scale-110 group-hover/tab:text-gray-700'
                )}
                size={20}
                weight={isActive ? 'duotone' : 'regular'}
              />
              <span className="tracking-wide">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
