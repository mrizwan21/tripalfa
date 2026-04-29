import * as React from "react";
import { DataTableProps } from './types/DataTableTypes';
import { b2bDenseVariant } from './variants';
import { adminComplexVariant } from './variants';
import { DataTable } from '../DataTable';

// Example usage of DataTable component
const Example = () => {
  const data = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ];

  const columns: DataTableProps<any>['columns'] = [
    { key: 'name', header: 'Name', cell: (item: any) => item.name },
    { key: 'email', header: 'Email', cell: (item: any) => item.email }
  ];

  return (
    <div>
      <h2>B2B Dense Variant</h2>
      <DataTable
        data={data}
        columns={columns}
        variant="b2b-dense"
      />

      <h2>Admin Complex Variant</h2>
      <DataTable
        data={data}
        columns={columns}
        variant="admin-complex"
      />
    </div>
  );
};

export default Example;