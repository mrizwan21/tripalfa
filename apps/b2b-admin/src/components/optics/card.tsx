import * as React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  decorations?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ decorations = false, className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={[
        'rounded-lg border border-border bg-background shadow-xs',
        decorations ? 'ring-1 ring-border' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  )
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className = '', ...props }, ref) => (
  <h3
    ref={ref}
    className={`text-2xl font-bold leading-tight tracking-[-0.02em] ${className}`}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className = '', ...props }, ref) => (
  <p ref={ref} className={`text-base text-muted-foreground ${className}`} {...props} />
));
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`p-6 pt-0 ${className}`} {...props} />
  )
);
CardContent.displayName = 'CardContent';

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  background?: boolean;
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ background = false, className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={[
        'flex items-center p-6 pt-0',
        background ? 'rounded-b-lg bg-muted -mx-6 -mb-6 px-6 pb-6 pt-4' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

const CardAction = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`flex items-center ${className}`} {...props} />
  )
);
CardAction.displayName = 'CardAction';
