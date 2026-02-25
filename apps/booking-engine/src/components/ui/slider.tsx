/**
 * Slider Component
 * Range slider for price and distance filters
 */

import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SliderProps {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ className, value = [0], onValueChange, min = 0, max = 100, step = 1, disabled }, ref) => {
    const sliderRef = React.useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = React.useState<number | null>(null);

    const percentage = React.useMemo(() => {
      return value.map(v => ((v - min) / (max - min)) * 100);
    }, [value, min, max]);

    const handleMouseDown = (index: number) => (e: React.MouseEvent) => {
      if (disabled) return;
      e.preventDefault();
      setIsDragging(index);
    };

    const handleMouseMove = React.useCallback(
      (e: MouseEvent) => {
        if (isDragging === null || !sliderRef.current || disabled) return;

        const rect = sliderRef.current.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const newValue = Math.round((min + percent * (max - min)) / step) * step;

        const updatedValue = [...value];
        updatedValue[isDragging] = Math.max(min, Math.min(max, newValue));

        // Ensure min <= max for range slider
        if (value.length > 1) {
          if (isDragging === 0 && updatedValue[0] > updatedValue[1]) {
            updatedValue[0] = updatedValue[1];
          } else if (isDragging === 1 && updatedValue[1] < updatedValue[0]) {
            updatedValue[1] = updatedValue[0];
          }
        }

        onValueChange?.(updatedValue);
      },
      [isDragging, value, min, max, step, onValueChange, disabled]
    );

    const handleMouseUp = React.useCallback(() => {
      setIsDragging(null);
    }, []);

    React.useEffect(() => {
      if (isDragging !== null) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };
      }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return (
      <div
        ref={sliderRef}
        className={cn(
          'relative w-full h-2 touch-none select-none',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        {/* Track */}
        <div className="absolute w-full h-2 bg-gray-200 rounded-full" />

        {/* Range */}
        {value.length > 1 ? (
          <div
            className="absolute h-2 bg-[#152467] rounded-full"
            style={{
              left: `${Math.min(percentage[0], percentage[1])}%`,
              width: `${Math.abs(percentage[1] - percentage[0])}%`,
            }}
          />
        ) : (
          <div
            className="absolute h-2 bg-[#152467] rounded-full"
            style={{
              width: `${percentage[0]}%`,
            }}
          />
        )}

        {/* Thumbs */}
        {value.map((_, index) => (
          <div
            key={index}
            onMouseDown={handleMouseDown(index)}
            className={cn(
              'absolute w-5 h-5 bg-white border-2 border-[#152467] rounded-full shadow-md',
              'transition-transform duration-100',
              'focus:outline-none focus:ring-2 focus:ring-[#152467] focus:ring-offset-2',
              isDragging === index ? 'scale-110' : 'hover:scale-105',
              disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
            )}
            style={{
              left: `calc(${percentage[index]}% - 10px)`,
              top: '-6px',
            }}
          />
        ))}
      </div>
    );
  }
);

Slider.displayName = 'Slider';

export { Slider };