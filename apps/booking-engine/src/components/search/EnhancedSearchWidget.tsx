'use client';

/**
 * Enhanced Search Widget - Kayak.com Style
 * 
 * Main container that holds the flight search form.
 * Provides the service tabs (Flights, Stays, Car Rental) above the search form.
 * 
 * From screenshot (ST Flight Search Widget.png):
 * - Service tabs with icons on light background
 * - "Compare flight deals from 100s of sites." heading
 * - Flights (airplane), Stays (bed), Car Rental (car) tabs
 * - Flights tab is active with orange/red color
 */

import React, { useState } from 'react';
import { cn } from '@tripalfa/shared-utils/utils';
import { FlightSearchForm } from './FlightSearchForm';

type ServiceTab = 'flights' | 'stays' | 'car';

interface EnhancedSearchWidgetProps {
  isSearchEnabled?: boolean;
  onSearch?: (data: any) => void;
  activeService?: ServiceTab;
  onServiceChange?: (service: ServiceTab) => void;
}

export function EnhancedSearchWidget({
  isSearchEnabled = true,
  onSearch,
  activeService: externalActiveService,
  onServiceChange,
}: EnhancedSearchWidgetProps) {
  const [activeService, setActiveService] = useState<ServiceTab>(externalActiveService || 'flights');

  const handleServiceChange = (service: ServiceTab) => {
    setActiveService(service);
    onServiceChange?.(service);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Service Tabs */}
      <div className="flex items-center gap-4 mb-6">
        {[
          { id: 'flights' as ServiceTab, label: 'Flights', icon: 'plane' },
          { id: 'stays' as ServiceTab, label: 'Stays', icon: 'bed' },
          { id: 'car' as ServiceTab, label: 'Car Rental', icon: 'car' },
        ].map((service) => (
          <button
            key={service.id}
            onClick={() => handleServiceChange(service.id)}
            className={cn(
              'flex flex-col items-center gap-2 transition-all duration-200',
              activeService === service.id ? 'opacity-100' : 'opacity-60 hover:opacity-80'
            )}
          >
            <div
              className={cn(
                'w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200',
                activeService === service.id
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white text-gray-600 shadow-sm border border-gray-200'
              )}
            >
              {service.icon === 'plane' && (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.769 59.769 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              )}
              {service.icon === 'bed' && (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m18-18v18m0-18c0 2.485-2.239 4.5-5 4.5-2.761 0-5-2.015-5-4.5m0 4.5c0-2.485-2.239-4.5-5-4.5-2.761 0-5 2.015-5 4.5" />
                </svg>
              )}
              {service.icon === 'car' && (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0V13.5m9 0v4.664c0 .621-.504 1.125-1.125 1.125h-9c-.621 0-1.125-.504-1.125-1.125m18.75-4.664v-7.019c0-1.5-1.164-2.719-2.625-2.719h-13.25c-1.461 0-2.625 1.219-2.625 2.719v7.019m18.75 0h-18.75" />
                </svg>
              )}
            </div>
            <span
              className={cn(
                'text-xs font-medium transition-colors',
                activeService === service.id ? 'text-gray-900' : 'text-gray-500'
              )}
            >
              {service.label}
            </span>
          </button>
        ))}
      </div>

      {/* Flight Search Form */}
      {activeService === 'flights' && (
        <FlightSearchForm
          isSearchEnabled={isSearchEnabled}
          onSearch={onSearch}
        />
      )}

      {/* Placeholder for other services */}
      {activeService === 'stays' && (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <p className="text-gray-500">Hotel search coming soon</p>
        </div>
      )}
      {activeService === 'car' && (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <p className="text-gray-500">Car rental search coming soon</p>
        </div>
      )}
    </div>
  );
}

export default EnhancedSearchWidget;
