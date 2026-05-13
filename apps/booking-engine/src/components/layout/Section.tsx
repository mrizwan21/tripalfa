import React from 'react';
import { cn } from '@tripalfa/ui-components';

export interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'black' | 'light-gray' | 'white';
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

/**
 * Apple-style Section component
 * Implements cinematic section rhythm with alternating backgrounds
 * - 'black': Pure black (#000000) for immersive moments
 * - 'light-gray': Light gray (#f5f5f7) for informational moments
 * - 'white': White background
 */
export const Section = React.forwardRef<HTMLDivElement, SectionProps>(
  ({ variant = 'white', children, className, containerClassName, ...props }, ref) => {
    const variantClasses = {
      black: 'section-black', // #000000 - Pure black
      'light-gray': 'section-light-gray', // #f5f5f7 - Light gray
      white: 'bg-white', // White
    };

    return (
      <section
        ref={ref}
        className={cn(
          'py-20',
          variantClasses[variant],
          className
        )}
        {...props}
      >
        <div className={cn('container-apple', containerClassName)}>
          {children}
        </div>
      </section>
    );
  }
);

Section.displayName = 'Section';

export default Section;
