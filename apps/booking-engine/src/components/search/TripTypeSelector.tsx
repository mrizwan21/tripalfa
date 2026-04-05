import React from 'react';
import { cn } from '@tripalfa/shared-utils/utils';
import { Repeat, ArrowRight, ArrowLeftRight } from 'lucide-react';

export type TripType = 'roundtrip' | 'oneway' | 'multicity';

interface TripTypeOption {
  id: TripType;
  label: string;
  icon: React.ElementType;
}

interface TripTypeSelectorProps {
  value: TripType;
  onChange: (type: TripType) => void;
  className?: string;
}

const tripTypes: TripTypeOption[] = [
  { id: 'roundtrip', label: 'Round Trip', icon: Repeat },
  { id: 'oneway', label: 'One Way', icon: ArrowRight },
  { id: 'multicity', label: 'Multi-city', icon: ArrowLeftRight },
];

export function TripTypeSelector({ value, onChange, className }: TripTypeSelectorProps) {
  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      {tripTypes.map(({ id, label, icon: Icon }) => {
        const isActive = id === value;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              'relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 outline-none',
              isActive
                ? 'bg-[#F45D48] text-white shadow-sm'
                : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={isActive ? 2.5 : 2} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}