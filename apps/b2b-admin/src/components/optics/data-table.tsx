import * as React from 'react';
export interface DataTableProps extends React.HTMLAttributes<HTMLTableElement> {
  columns?: any[];
  data?: any[];
  searchKey?: string;
}
export const DataTable = React.forwardRef<HTMLTableElement, DataTableProps>(
  ({ columns, data, searchKey, className = '', children, ...props }, ref) => (
    <div className="rounded-md border overflow-auto">
      <table ref={ref} className={`w-full caption-bottom text-sm ${className}`} {...props}>
        {children}
      </table>
    </div>
  )
);
DataTable.displayName = 'DataTable';
