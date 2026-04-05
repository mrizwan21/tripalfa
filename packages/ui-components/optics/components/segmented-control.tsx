import * as React from 'react';

export interface SegmentedControlProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange'
> {
  options: Array<{ value: string; label: string }>;
  value?: string;
  onChange?: (value: string) => void;
}

export const SegmentedControl = React.forwardRef<HTMLDivElement, SegmentedControlProps>(
  ({ options, value, onChange, className = '', ...props }, ref) => {
    const classes = ['segmented-control'];
    if (className) classes.push(className);

    return (
      <div ref={ref} className={classes.join(' ')} role="radiogroup" {...props}>
        {options.map(option => (
          <button
            key={option.value}
            className={`segmented-control__item${value === option.value ? ' segmented-control__item--active' : ''}`}
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange?.(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }
);
SegmentedControl.displayName = 'SegmentedControl';
