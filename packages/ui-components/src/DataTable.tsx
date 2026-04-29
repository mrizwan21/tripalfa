import React from 'react';

type DataTableProps = {
  data: any[];
  columns: {
    header: string;
    accessor: string;
    render?: (value: any, row: any) => React.ReactNode;
  }[];
  context: 'admin' | 'b2b' | 'b2c';
};

export const DataTable = ({ data, columns, context }: DataTableProps) => {
  // Context-specific rendering logic
  const showActions = context === 'admin' || context === 'b2b';
  
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-near-black">
          {columns.map(col => (
            <th key={col.accessor} className="p-3 text-left">{col.header}</th>
          ))}
          {showActions && <th className="p-3 text-left">Actions</th>}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-near-black'}>
            {columns.map(col => (
              <td key={col.accessor} className="p-3 border-t">
                {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
              </td>
            ))}
            {showActions && (
              <td className="p-3 border-t">
                <div className="flex space-x-2">
                  {context === 'admin' && (
                    <button className="px-2 py-1 bg-apple-blue text-white rounded">
                      Global Edit
                    </button>
                  )}
                  <button className="px-2 py-1 bg-apple-blue text-white rounded">
                    View
                  </button>
                </div>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};