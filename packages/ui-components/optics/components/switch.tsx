import * as React from 'react';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  switchSize?: 'small' | 'medium' | 'large';
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ switchSize, className = '', onCheckedChange, onChange, ...props }, ref) => {
    const classes = ['switch'];
    if (switchSize) classes.push(`switch--${switchSize}`);
    if (className) classes.push(className);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    return (
      <input
        ref={ref}
        type="checkbox"
        className={classes.join(' ')}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
Switch.displayName = 'Switch';
