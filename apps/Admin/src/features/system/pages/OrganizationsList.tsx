import { useState, useCallback } from 'react';
import { Button } from '@tripalfa/ui-components/ui/button';
import { Label } from '@tripalfa/ui-components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@tripalfa/ui-components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@tripalfa/ui-components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@tripalfa/ui-components/ui/alert-dialog';
import { toast } from 'sonner';
import api from '@/shared/lib/api';
import { EntityListPage } from '@/features/shared/components';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { DateCell } from '@/shared/components/DateCell';
import OrganizationOnboarding from './OrganizationOnboarding';

interface Organization {
  id: string;
  name: string;
  email: string;
  phone: string;
  website?: string;
  industry?: string;
  status: 'active' | 'inactive' | 'pending';
  branchesCount: number;
  usersCount: number;
  createdAt: string;
  updatedAt?: string;
}

export function OrganizationsList() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const transformData = (data: any[]): Organization[] => {
    return data.map(item => ({
      id: item.id,
      name: item.name || '',
      email: item.email || '',
      phone: item.phone || '',
      website: item.website,
      industry: item.industry,
      status: item.status || 'pending',
      branchesCount: item.branchesCount || 0,
      usersCount: item.usersCount || 0,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt,
    }));
  };

  const columns = [
    { key: 'name', header: 'Name', className: 'w-[180px] font-medium' },
    { key: 'email', header: 'Email', className: 'w-[160px]' },
    { key: 'phone', header: 'Phone', className: 'w-[140px]' },
    {
      key: 'industry',
      header: 'Industry',
      className: 'w-[140px]',
      render: (org: Organization) =>
        org.industry ? (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold border bg-secondary text-secondary-foreground">
            {org.industry}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: 'branchesCount',
      header: 'Branches',
      className: 'w-[100px] text-center',
      render: (org: Organization) => (
        <span className="inline-flex items-center justify-center px-2 py-1 rounded text-xs font-semibold bg-secondary text-secondary-foreground">
          {org.branchesCount}
        </span>
      ),
    },
    {
      key: 'usersCount',
      header: 'Users',
      className: 'w-[80px] text-center',
      render: (org: Organization) => (
        <span className="inline-flex items-center justify-center px-2 py-1 rounded text-xs font-semibold bg-secondary text-secondary-foreground">
          {org.usersCount}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      className: 'w-[110px]',
      render: (org: Organization) => <StatusBadge status={org.status} />,
    },
    {
      key: 'createdAt',
      header: 'Created On',
      className: 'w-[140px]',
      render: (org: Organization) => <DateCell date={org.createdAt} />,
    },
  ];

  return (
    <EntityListPage<Organization>
      title="Organizations Management"
      description="Manage organization profiles, branches, and branding"
      entityName="Organization"
      entityNamePlural="Organizations"
      endpoint="/organization"
      columns={columns}
      transformData={transformData}
      onAdd={async () => {}}
      onEdit={async org => {}}
      onDelete={id => setDeleteId(id)}
      FormDialog={OrganizationOnboarding}
      isFormDialogOpen={false}
      setIsFormDialogOpen={() => {}}
      selectedEntity={null}
      setSelectedEntity={() => {}}
      isSubmitting={isSubmitting}
      deleteId={deleteId}
      setDeleteId={setDeleteId}
      searchPlaceholder="Search by name, email, or website..."
    />
  );
}
