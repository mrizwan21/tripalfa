import { useState } from 'react';
import { toast } from 'sonner';
import { EntityListPage } from '@/features/shared/components';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { DateCell } from '@/shared/components/DateCell';
import SuppliersList from './SuppliersList';

interface Supplier {
  id: string;
  name: string;
  email: string;
  country: string;
  businessType: string;
  status: 'active' | 'inactive' | 'pending';
  productsCount: number;
  createdAt: string;
  updatedAt?: string;
}

export function SuppliersManagement() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const transformData = (data: any[]): Supplier[] => {
    return data.map(item => ({
      id: item.id,
      name: item.name || '',
      email: item.email || '',
      country: item.country || '',
      businessType: item.businessType || '',
      status: item.status || 'pending',
      productsCount: item.productsCount || 0,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt,
    }));
  };

  const columns = [
    { key: 'name', header: 'Name', className: 'w-[180px] font-medium' },
    { key: 'email', header: 'Email', className: 'w-[180px]' },
    { key: 'country', header: 'Country', className: 'w-[140px]' },
    {
      key: 'businessType',
      header: 'Business Type',
      className: 'w-[140px]',
      render: (supplier: Supplier) => (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold border bg-secondary text-secondary-foreground">
          {supplier.businessType}
        </span>
      ),
    },
    {
      key: 'productsCount',
      header: 'Products',
      className: 'w-[100px] text-center',
      render: (supplier: Supplier) => (
        <span className="inline-flex items-center justify-center px-2 py-1 rounded text-xs font-semibold bg-secondary text-secondary-foreground">
          {supplier.productsCount}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      className: 'w-[110px]',
      render: (supplier: Supplier) => <StatusBadge status={supplier.status} />,
    },
    {
      key: 'createdAt',
      header: 'Created On',
      className: 'w-[140px]',
      render: (supplier: Supplier) => <DateCell date={supplier.createdAt} />,
    },
  ];

  return (
    <EntityListPage<Supplier>
      title="Suppliers Management"
      description="Manage supplier profiles, products, and documentation"
      entityName="Supplier"
      entityNamePlural="Suppliers"
      endpoint="/admin/suppliers"
      columns={columns}
      transformData={transformData}
      onAdd={async () => {}}
      onEdit={async supplier => {}}
      onDelete={id => setDeleteId(id)}
      FormDialog={SuppliersList}
      isFormDialogOpen={false}
      setIsFormDialogOpen={() => {}}
      selectedEntity={null}
      setSelectedEntity={() => {}}
      isSubmitting={isSubmitting}
      deleteId={deleteId}
      setDeleteId={setDeleteId}
      searchPlaceholder="Search by name, email, or country..."
    />
  );
}
