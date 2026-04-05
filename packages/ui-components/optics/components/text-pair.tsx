import * as React from 'react';

export interface TextPairProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
}

export const TextPair = React.forwardRef<HTMLDivElement, TextPairProps>(
  ({ label, value, direction = 'vertical', className = '', ...props }, ref) => {
    const classes = ['text-pair'];
    if (direction === 'horizontal') classes.push('text-pair--horizontal');
    if (className) classes.push(className);

    return (
      <div ref={ref} className={classes.join(' ')} {...props}>
        <dt className="text-pair__label">{label}</dt>
        <dd className="text-pair__value">{value}</dd>
      </div>
    );
  }
);
TextPair.displayName = 'TextPair';
