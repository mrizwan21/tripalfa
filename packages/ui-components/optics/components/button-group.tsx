import * as React from 'react';

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className = '', children, ...props }, ref) => {
    const classes = ['btn-group'];
    if (className) classes.push(className);

    return (
      <div ref={ref} className={classes.join(' ')} {...props}>
        {children}
      </div>
    );
  }
);
ButtonGroup.displayName = 'ButtonGroup';
