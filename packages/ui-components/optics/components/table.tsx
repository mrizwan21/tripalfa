import * as React from 'react';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  compact?: boolean;
  striped?: boolean;
  hoverable?: boolean;
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  (
    { compact = false, striped = false, hoverable = true, className = '', children, ...props },
    ref
  ) => {
    const classes = ['table'];
    if (compact) classes.push('table--compact');
    if (striped) classes.push('table--striped');
    if (hoverable) classes.push('table--hoverable');
    if (className) classes.push(className);

    return (
      <table ref={ref} className={classes.join(' ')} {...props}>
        {children}
      </table>
    );
  }
);
Table.displayName = 'Table';
