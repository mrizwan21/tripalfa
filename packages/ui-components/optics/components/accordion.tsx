import * as React from 'react';

export interface AccordionProps extends React.DetailsHTMLAttributes<HTMLDetailsElement> {}

export const Accordion = React.forwardRef<HTMLDetailsElement, AccordionProps>(
  ({ className = '', children, ...props }, ref) => {
    const classes = ['accordion'];
    if (className) classes.push(className);

    return (
      <details ref={ref} className={classes.join(' ')} {...props}>
        {children}
      </details>
    );
  }
);
Accordion.displayName = 'Accordion';

export interface AccordionSummaryProps extends React.HTMLAttributes<HTMLElement> {}

export const AccordionSummary = React.forwardRef<HTMLElement, AccordionSummaryProps>(
  ({ className = '', children, ...props }, ref) => (
    <summary
      ref={ref}
      className={`accordion__marker${className ? ` ${className}` : ''}`}
      {...props}
    >
      {children}
    </summary>
  )
);
AccordionSummary.displayName = 'AccordionSummary';

export interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`accordion__content${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </div>
  )
);
AccordionContent.displayName = 'AccordionContent';
