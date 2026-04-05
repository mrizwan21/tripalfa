import * as React from 'react';
export interface SliderProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange'
> {
  value?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}
export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ value = 0, onValueChange, min = 0, max = 100, step = 1, className = '', ...props }, ref) => (
    <input
      ref={ref}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onValueChange?.(Number(e.target.value))}
      className={`w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer ${className}`}
      {...props}
    />
  )
);
Slider.displayName = 'Slider';
