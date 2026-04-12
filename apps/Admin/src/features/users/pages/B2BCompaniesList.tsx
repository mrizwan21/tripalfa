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
import OrganizationOnboarding from '@/features/system/pages/OrganizationOnboarding';

interface B2BCompany {
  id: string;
  name: string;
  email: string;
  phone: string;
  website?: string;
  creditLimit: number;
  status: 'active' | 'inactive' | 'suspended';
  branchesCount: number;
  usersCount: number;
  createdAt: string;
  updatedAt?: string;
}

export function B2BCompaniesList() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const transformData = (data: any[]): B2BCompany[] => {
    return data.map(item => ({
      id: item.id,
      name: item.name || '',
      email: item.email || '',
      phone: item.phone || '',
      website: item.website,
      creditLimit: item.creditLimit || 0,
      status: item.status || 'active',
      branchesCount: item.branchesCount || 0,
      usersCount: item.usersCount || 0,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt,
    }));
  };

  const columns = [
    { key: 'name', header: 'Company Name', className: 'w-[160px] font-medium' },
    { key: 'email', header: 'Email', className: 'w-[160px]' },
    { key: 'phone', header: 'Phone', className: 'w-[140px]' },
    {
      key: 'creditLimit',
      header: 'Credit Limit',
      className: 'w-[130px]',
      render: (company: B2BCompany) => (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-secondary text-secondary-foreground">
          ${company.creditLimit.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'branchesCount',
      header: 'Branches',
      className: 'w-[100px] text-center',
      render: (company: B2BCompany) => (
        <span className="inline-flex items-center justify-center px-2 py-1 rounded text-xs font-semibold bg-secondary text-secondary-foreground">
          {company.branchesCount}
        </span>
      ),
    },
    {
      key: 'usersCount',
      header: 'Users',
      className: 'w-[80px] text-center',
      render: (company: B2BCompany) => (
        <span className="inline-flex items-center justify-center px-2 py-1 rounded text-xs font-semibold bg-secondary text-secondary-foreground">
          {company.usersCount}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      className: 'w-[110px]',
      render: (company: B2BCompany) => {
        const colors: Record<string, string> = {
          active: 'bg-emerald-500/10 text-emerald-400 border-emerald-200',
          suspended: 'bg-destructive/10 text-destructive border-destructive-200',
          inactive: 'bg-muted text-muted-foreground border-border',
        };
        const color = colors[company.status] || 'bg-muted text-muted-foreground';
        return (
          <span
            className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold border ${color}`}
          >
            {company.status}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Created On',
      className: 'w-[140px]',
      render: (company: B2BCompany) => {
        try {
          return new Date(company.createdAt).toLocaleDateString();
        } catch {
          return company.createdAt;
        }
      },
    },
  ];

  return (
    <EntityListPage<B2BCompany>
      title="B2B Companies Management"
      description="Manage B2B partner companies, users, and credit limits"
      entityName="B2B Company"
      entityNamePlural="B2B Companies"
      endpoint="/companies"
      columns={columns}
      transformData={transformData}
      onAdd={async () => {}}
      onEdit={async company => {}}
      onDelete={id => setDeleteId(id)}
      FormDialog={OrganizationOnboarding}
      isFormDialogOpen={false}
      setIsFormDialogOpen={() => {}}
      selectedEntity={null}
      setSelectedEntity={() => {}}
      isSubmitting={isSubmitting}
      deleteId={deleteId}
      setDeleteId={setDeleteId}
      searchPlaceholder="Search by company name, email, or website..."
    />
  );
}
