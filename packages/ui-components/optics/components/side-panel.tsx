import * as React from 'react';

export interface SidePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  position?: 'left' | 'right';
  onClose?: () => void;
}

export const SidePanel = React.forwardRef<HTMLDivElement, SidePanelProps>(
  ({ open = false, position = 'right', onClose, className = '', children, ...props }, ref) => {
    const classes = ['side-panel'];
    if (open) classes.push('side-panel--open');
    if (position === 'left') classes.push('side-panel--left');
    if (className) classes.push(className);

    return (
      <div ref={ref} className={classes.join(' ')} {...props}>
        {onClose && (
          <button className="side-panel__close" onClick={onClose} aria-label="Close panel">
            &times;
          </button>
        )}
        {children}
      </div>
    );
  }
);
SidePanel.displayName = 'SidePanel';
