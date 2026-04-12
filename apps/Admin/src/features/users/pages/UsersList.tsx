import { useState } from 'react';
import { toast } from 'sonner';
import api from '@/shared/lib/api';
import { EntityListPage } from '@/features/shared/components';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { DateCell } from '@/shared/components/DateCell';
import { UserForm } from './UserForm';

interface User {
  id: string;
  name: string;
  email: string;
  mobileNumber: string;
  nationality?: string;
  dateOfBirth?: string;
  role?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export function UsersList() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const transformData = (data: any[]): User[] => {
    return data.map(item => ({
      id: item.id,
      name: item.name || '',
      email: item.email || '',
      mobileNumber: item.mobileNumber || '',
      nationality: item.nationality,
      dateOfBirth: item.dateOfBirth,
      role: item.role,
      status: item.status || 'active',
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt,
    }));
  };

  const handleAddUser = async (values?: any) => {
    if (!values) return;
    try {
      setIsSubmitting(true);
      await api.post('/users', values);
      toast.success('User created successfully');
      // Reload will happen via EntityListPage
    } catch (error) {
      console.error('Failed to create user', error);
      toast.error('Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (user: User, values?: any) => {
    if (!values) return;
    try {
      setIsSubmitting(true);
      await api.put(`/users/${user.id}/details`, values);
      toast.success('User updated successfully');
    } catch (error) {
      console.error('Failed to update user', error);
      toast.error('Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { key: 'name', header: 'Name', className: 'w-[180px] font-medium' },
    { key: 'email', header: 'Email', className: 'w-[180px]' },
    { key: 'mobileNumber', header: 'Mobile', className: 'w-[140px]' },
    {
      key: 'status',
      header: 'Status',
      className: 'w-[110px]',
      render: (user: User) => <StatusBadge status={user.status} />,
    },
    {
      key: 'createdAt',
      header: 'Created On',
      className: 'w-[140px]',
      render: (user: User) => <DateCell date={user.createdAt} />,
    },
  ];

  return (
    <EntityListPage<User>
      title="Users Management"
      description="Manage system users and permissions"
      entityName="User"
      entityNamePlural="Users"
      endpoint="/users"
      columns={columns}
      transformData={transformData}
      onAdd={handleAddUser}
      onEdit={handleEditUser}
      onDelete={id => setDeleteId(id)}
      FormDialog={UserForm}
      isFormDialogOpen={false}
      setIsFormDialogOpen={() => {}}
      selectedEntity={null}
      setSelectedEntity={() => {}}
      isSubmitting={isSubmitting}
      deleteId={deleteId}
      setDeleteId={setDeleteId}
      searchPlaceholder="Search by name, email, or mobile..."
    />
  );
}
