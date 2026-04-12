import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@tripalfa/shared-utils/utils';
import { Users, ChevronDown, Minus, Plus } from 'lucide-react';

export interface TravelerConfig {
  adults: number;
  children: number;
  infants: number;
}

interface TravelerOption {
  key: keyof TravelerConfig;
  label: string;
  description: string;
  min: number;
  max: number;
}

interface TravelerSelectorProps {
  value: TravelerConfig;
  onChange: (travelers: TravelerConfig) => void;
  cabinClass?: string;
  onCabinChange?: (cabin: string) => void;
  className?: string;
}

const cabinClasses = [
  { id: 'economy', label: 'Economy' },
  { id: 'premium-economy', label: 'Premium Economy' },
  { id: 'business', label: 'Business' },
  { id: 'first', label: 'First Class' },
];

const travelerOptions: TravelerOption[] = [
  { key: 'adults', label: 'Adults', description: 'Age 12+', min: 1, max: 9 },
  { key: 'children', label: 'Children', description: 'Age 2-11', min: 0, max: 6 },
  { key: 'infants', label: 'Infants', description: 'Under 2', min: 0, max: 4 },
];

export function TravelerSelector({
  value,
  onChange,
  cabinClass = 'economy',
  onCabinChange,
  className,
}: TravelerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCabinOpen, setIsCabinOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCabinOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateTraveler = (key: keyof TravelerConfig, delta: number) => {
    const option = travelerOptions.find(o => o.key === key)!;
    const newValue = Math.max(option.min, Math.min(option.max, value[key] + delta));
    onChange({ ...value, [key]: newValue });
  };

  const totalTravelers = value.adults + value.children + value.infants;
  const currentCabin = cabinClasses.find(c => c.id === cabinClass)?.label || 'Economy';

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="flex items-center gap-2">
        {/* Travelers Button */}
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            setIsCabinOpen(false);
          }}
          className={cn(
            'flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 outline-none min-w-[140px]',
            'border border-[hsl(var(--border))] bg-white hover:border-[hsl(var(--primary))/0.4] hover:shadow-sm',
            isOpen && 'border-[hsl(var(--primary))] ring-2 ring-[hsl(var(--primary))]/15 shadow-sm'
          )}
        >
          <Users className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <div className="flex flex-col items-start">
            <span className="text-xs text-[hsl(var(--muted-foreground))] leading-none">
              Travelers
            </span>
            <span className="font-semibold text-[hsl(var(--foreground))] leading-tight">
              {totalTravelers}
            </span>
          </div>
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 ml-auto text-[hsl(var(--muted-foreground))] transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        {/* Cabin Class Selector */}
        {onCabinChange && (
          <button
            type="button"
            onClick={() => {
              setIsCabinOpen(!isCabinOpen);
              setIsOpen(false);
            }}
            className={cn(
              'flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 outline-none min-w-[140px]',
              'border border-[hsl(var(--border))] bg-white hover:border-[hsl(var(--primary))/0.4] hover:shadow-sm',
              isCabinOpen &&
                'border-[hsl(var(--primary))] ring-2 ring-[hsl(var(--primary))]/15 shadow-sm'
            )}
          >
            <div className="flex flex-col items-start">
              <span className="text-xs text-[hsl(var(--muted-foreground))] leading-none">
                Cabin
              </span>
              <span className="font-semibold text-[hsl(var(--foreground))] leading-tight">
                {currentCabin}
              </span>
            </div>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 ml-auto text-[hsl(var(--muted-foreground))] transition-transform duration-200',
                isCabinOpen && 'rotate-180'
              )}
            />
          </button>
        )}
      </div>

      {/* Travelers Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl shadow-black/[0.08] ring-1 ring-black/[0.05] z-50 overflow-hidden animate-scale-in">
          <div className="p-4 space-y-4">
            {travelerOptions.map(({ key, label, description, min, max }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-[hsl(var(--foreground))]">{label}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateTraveler(key, -1)}
                    disabled={value[key] <= min}
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-150',
                      value[key] <= min
                        ? 'border-[hsl(var(--border))] opacity-40 cursor-not-allowed'
                        : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] hover:border-[hsl(var(--primary))/0.3]'
                    )}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-6 text-center font-semibold text-sm">{value[key]}</span>
                  <button
                    type="button"
                    onClick={() => updateTraveler(key, 1)}
                    disabled={
                      value[key] >= max || (key === 'infants' && value[key] >= value.adults)
                    }
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-150',
                      value[key] >= max || (key === 'infants' && value[key] >= value.adults)
                        ? 'border-[hsl(var(--border))] opacity-40 cursor-not-allowed'
                        : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] hover:border-[hsl(var(--primary))/0.3]'
                    )}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cabin Class Dropdown */}
      {isCabinOpen && onCabinChange && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl shadow-black/[0.08] ring-1 ring-black/[0.05] z-50 overflow-hidden animate-scale-in">
          <div className="p-2">
            {cabinClasses.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onCabinChange(id);
                  setIsCabinOpen(false);
                }}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all duration-150',
                  cabinClass === id
                    ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] font-semibold'
                    : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
                )}
              >
                {label}
                {cabinClass === id && (
                  <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
