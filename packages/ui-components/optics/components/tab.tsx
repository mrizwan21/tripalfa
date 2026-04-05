import * as React from 'react';

export interface TabProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  disabled?: boolean;
}

export const Tab = React.forwardRef<HTMLDivElement, TabProps>(
  ({ active = false, disabled = false, className = '', children, ...props }, ref) => {
    const classes = ['tab'];
    if (active) classes.push('tab--active');
    if (disabled) classes.push('tab--disabled');
    if (className) classes.push(className);

    return (
      <div ref={ref} className={classes.join(' ')} role="tab" aria-selected={active} {...props}>
        {children}
      </div>
    );
  }
);
Tab.displayName = 'Tab';

export interface TabGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TabGroup = React.forwardRef<HTMLDivElement, TabGroupProps>(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`tab-group${className ? ` ${className}` : ''}`}
      role="tablist"
      {...props}
    >
      {children}
    </div>
  )
);
TabGroup.displayName = 'TabGroup';

export interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
}

export const TabPanel = React.forwardRef<HTMLDivElement, TabPanelProps>(
  ({ active = false, className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`tab-panel${active ? ' tab-panel--active' : ''}${className ? ` ${className}` : ''}`}
      role="tabpanel"
      hidden={!active}
      {...props}
    >
      {children}
    </div>
  )
);
TabPanel.displayName = 'TabPanel';
