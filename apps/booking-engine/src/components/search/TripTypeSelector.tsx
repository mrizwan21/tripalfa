import React from 'react';
import { cn } from '@tripalfa/shared-utils/utils';

export type TripType = 'roundtrip' | 'oneway' | 'multicity';

interface TripTypeOption {
  id: TripType;
  label: string;
}

interface TripTypeSelectorProps {
  value: TripType;
  onChange: (type: TripType) => void;
  className?: string;
}

const tripTypes: TripTypeOption[] = [
  { id: 'roundtrip', label: 'Round trip' },
  { id: 'oneway', label: 'One way' },
  { id: 'multicity', label: 'Multi-city' },
];

export function TripTypeSelector({ value, onChange, className }: TripTypeSelectorProps) {
  return (
    <div className={cn('inline-flex items-center bg-gray-100 rounded-lg p-1', className)}>
      {tripTypes.map(({ id, label }) => {
        const isActive = id === value;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              'relative px-4 py-1.5 text-sm font-medium transition-all duration-200 outline-none rounded-md',
              isActive
                ? 'bg-white text-[#003b95] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
