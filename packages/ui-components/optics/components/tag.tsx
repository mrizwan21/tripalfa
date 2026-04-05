import * as React from 'react';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'danger' | 'warning' | 'info' | 'notice';
  removable?: boolean;
  onRemove?: () => void;
}

export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ variant, removable, onRemove, className = '', children, ...props }, ref) => {
    const classes = ['tag'];
    if (variant) classes.push(`tag--${variant}`);
    if (className) classes.push(className);

    return (
      <span ref={ref} className={classes.join(' ')} {...props}>
        {children}
        {removable && (
          <button className="tag__remove" onClick={onRemove} aria-label="Remove tag">
            &times;
          </button>
        )}
      </span>
    );
  }
);
Tag.displayName = 'Tag';
