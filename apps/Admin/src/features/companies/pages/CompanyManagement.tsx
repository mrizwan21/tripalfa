import { useEffect, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@tripalfa/ui-components/ui/data-table';
import { Badge } from '@tripalfa/ui-components/ui/badge';
import { Button } from '@tripalfa/ui-components/ui/button';
import { Input } from '@tripalfa/ui-components/ui/input';
import { Label } from '@tripalfa/ui-components/ui/label';
import { Checkbox } from '@tripalfa/ui-components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tripalfa/ui-components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@tripalfa/ui-components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@tripalfa/ui-components/ui/tabs';
import { ArrowUpDown, Plus } from 'lucide-react';
import api from '@/shared/lib/api';
import { CorporateLoyaltyAccounts } from '../components/CorporateLoyaltyAccounts';

export type Company = {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'suspended';
  creditLimit: number;
  balance: number;
};

type BranchRow = { id: string; name: string; city?: string; status?: string };
type DepartmentRow = { id: string; name: string; code?: string };
type DesignationRow = { id: string; name: string; code?: string };
type BankAccountRow = {
  bank: string;
  account: string;
  currency: string;
  branch?: string;
};

function ListItem({ name, code }: { name: string; code?: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2 gap-2">
      <div className="text-sm font-medium text-foreground">{name}</div>
      <span className="text-xs text-muted-foreground">{code}</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
      {message}
    </div>
  );
}
type DocumentRow = { name: string; status: string };
type PermissionRow = { id: string; label: string };

const columns: ColumnDef<Company>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Organization
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: 'domain',
    header: 'Domain',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.status === 'active' ? 'default' : 'destructive'}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: 'creditLimit',
    header: () => <div className="text-right">Credit Limit</div>,
    cell: ({ row }) => {
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(row.original.creditLimit);
      return <div className="text-right">{formatted}</div>;
    },
  },
  {
    accessorKey: 'balance',
    header: () => <div className="text-right">Balance Used</div>,
    cell: ({ row }) => {
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(row.original.balance);
      return <div className="text-right">{formatted}</div>;
    },
  },
];

export default function CompanyManagementPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [designations, setDesignations] = useState<DesignationRow[]>([]);
  const [bankAccounts] = useState<BankAccountRow[]>([]);
  const [documents] = useState<DocumentRow[]>([]);
  const permissions: PermissionRow[] = [];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedCompany = useMemo(
    () => companies.find(c => c.id === selectedCompanyId),
    [companies, selectedCompanyId]
  );

  useEffect(() => {
    let cancelled = false;
    async function loadCompanies() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/organization', { params: { limit: 50 } });
        const rows: Company[] = (res.data?.data as Company[]) || res.data || [];
        if (cancelled) return;
        if (rows.length) {
          setCompanies(rows);
          setSelectedCompanyId(rows[0].id);
        }
      } catch (err) {
        console.error('Failed to load organizations', err);
        if (!cancelled) setError('Unable to load organizations; showing fallback data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadCompanies();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedCompanyId) return;
    let cancelled = false;
    async function loadBranches() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/organization/${selectedCompanyId}/branches`);
        const rows: any[] = res.data || [];
        if (cancelled) return;
        setBranches(
          rows.map(b => ({
            id: String(b.id),
            name: b.name || b.code || 'Branch',
            city: b.address?.city,
            status: b.status?.toString().toLowerCase() ?? 'active',
          }))
        );
      } catch (err) {
        console.error('Failed to load branches', err);
        if (!cancelled) {
          setError(prev => prev || 'Unable to load branches.');
          setBranches([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadBranches();
    return () => {
      cancelled = true;
    };
  }, [selectedCompanyId]);

  useEffect(() => {
    let cancelled = false;
    async function loadOrg() {
      try {
        setError(null);
        const [depRes, desRes] = await Promise.all([
          api.get('/organization/departments', { params: { limit: 50 } }),
          api.get('/organization/designations', { params: { limit: 50 } }),
        ]);
        if (cancelled) return;
        const depRows: any[] = depRes.data?.data || depRes.data || [];
        const desRows: any[] = desRes.data?.data || desRes.data || [];
        setDepartments(
          depRows.map(d => ({
            id: String(d.id),
            name: d.name,
            code: d.code,
          }))
        );
        setDesignations(
          desRows.map(d => ({
            id: String(d.id),
            name: d.name,
            code: d.code,
          }))
        );
      } catch (err) {
        console.error('Failed to load departments/designations', err);
        if (!cancelled) {
          setError(prev => prev || 'Unable to load org data.');
          setDepartments([]);
          setDesignations([]);
        }
      }
    }
    loadOrg();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Organization Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage B2B agencies, credit limits, and statuses.
          </p>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> Add organization
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex flex-wrap gap-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="org">Designation & Departments</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="loyalty">Corporate Loyalty</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="access">Access & Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader className="space-y-0 gap-2">
              <CardTitle>Organizations</CardTitle>
              <CardDescription>Roster of B2B agencies with credit posture.</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {error}
                </div>
              )}
              {companies.length > 0 && (
                <div className="mb-4 max-w-sm">
                  <Label className="mb-1 block text-sm font-medium text-foreground">
                    Select organization
                  </Label>
                  <Select
                    value={selectedCompanyId ?? undefined}
                    onValueChange={val => setSelectedCompanyId(val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading organizations...</div>
              ) : (
                <>
                  {companies.length === 0 ? (
                    <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
                      No organizations available.
                    </div>
                  ) : (
                    <DataTable columns={columns} data={companies} searchKey="name" />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <div>
                <CardTitle>Branch Management</CardTitle>
                <CardDescription>Regional branches with status and city.</CardDescription>
              </div>
              <Button size="sm" variant="outline">
                Add branch
              </Button>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 p-6">
              {branches.length === 0 ? (
                <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
                  No branches available.
                </div>
              ) : (
                branches.map(b => (
                  <div key={b.id} className="rounded-md border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-foreground">{b.name}</div>
                      <Badge variant={b.status === 'active' ? 'default' : 'secondary'}>
                        {b.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{b.city}</div>
                    <div className="text-xs text-muted-foreground mt-1">ID: {b.id}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="org">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <div>
                  <CardTitle>Departments</CardTitle>
                  <CardDescription>Organizational units for access scoping.</CardDescription>
                </div>
                <Button size="sm" variant="outline">
                  Add department
                </Button>
              </CardHeader>
              <CardContent className="space-y-2 p-6">
                {departments.length === 0 ? (
                  <EmptyState message="No departments available." />
                ) : (
                  departments.map(d => <ListItem key={d.id} name={d.name} code={d.code || d.id} />)
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                <div>
                  <CardTitle>Designations</CardTitle>
                  <CardDescription>Role labels used for HR and permissions.</CardDescription>
                </div>
                <Button size="sm" variant="outline">
                  Add designation
                </Button>
              </CardHeader>
              <CardContent className="space-y-2 p-6">
                {designations.length === 0 ? (
                  <EmptyState message="No designations available." />
                ) : (
                  designations.map(d => <ListItem key={d.id} name={d.name} code={d.code || d.id} />)
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financials">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <div>
                <CardTitle>Financials</CardTitle>
                <CardDescription>
                  Bank accounts and finance contacts per organization/branch.
                </CardDescription>
              </div>
              <Button size="sm" variant="outline">
                Add bank
              </Button>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 p-6">
              {bankAccounts.length === 0 ? (
                <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
                  No bank accounts available.
                </div>
              ) : (
                bankAccounts.map(acct => (
                  <div key={acct.account} className="rounded-md border p-3">
                    <div className="font-medium text-foreground">{acct.bank}</div>
                    <div className="text-sm text-muted-foreground">
                      {acct.account} · {acct.currency}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Branch: {acct.branch}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loyalty">
          <Card>
            <CardHeader className="space-y-0 gap-2">
              <CardTitle>Corporate Loyalty Accounts</CardTitle>
              <CardDescription>
                Manage frequent flyer accounts for corporate bookings. These accounts are used to
                access corporate benefits, earn miles, and receive priority services on eligible
                flights.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CorporateLoyaltyAccounts companyId={selectedCompanyId ?? undefined} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader className="space-y-0 gap-2">
              <CardTitle>Profile & Branding</CardTitle>
              <CardDescription>Upload logos used on invoices and documents.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 p-6">
              <div className="space-y-2">
                <Label>Organization Name</Label>
                <Input
                  placeholder="Organization legal name"
                  defaultValue={selectedCompany?.name || ''}
                />
              </div>
              <div className="space-y-2">
                <Label>Primary Domain</Label>
                <Input placeholder="example.com" defaultValue={selectedCompany?.domain || ''} />
              </div>
              <div className="space-y-2">
                <Label>Logo</Label>
                <Input type="file" accept="image/*" />
                <p className="text-xs text-muted-foreground">
                  Used on vouchers, invoices, and emails.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <div>
                <CardTitle>Document Management</CardTitle>
                <CardDescription>Compliance docs per organization and branch.</CardDescription>
              </div>
              <Button size="sm" variant="outline">
                Upload document
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 p-6">
              {documents.length === 0 ? (
                <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
                  No documents available.
                </div>
              ) : (
                documents.map(doc => (
                  <div
                    key={doc.name}
                    className="flex items-center justify-between rounded-md border px-3 py-2 gap-2"
                  >
                    <div className="text-sm font-medium text-foreground">{doc.name}</div>
                    <Badge
                      variant={
                        doc.status === 'verified'
                          ? 'default'
                          : doc.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {doc.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <Card>
            <CardHeader className="space-y-0 gap-2">
              <CardTitle>Access, Permissions & Sessions</CardTitle>
              <CardDescription>Control roles, permissions, and session policies.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Permissions</Label>
                {permissions.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
                    Permissions are not available yet.
                  </div>
                ) : (
                  <div className="grid gap-2 md:grid-cols-2">
                    {permissions.map(perm => (
                      <label
                        key={perm.id}
                        className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-foreground font-medium"
                      >
                        <Checkbox id={perm.id} />
                        <span>{perm.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Session timeout (minutes)</Label>
                  <Input type="number" min={5} defaultValue={30} />
                </div>
                <div className="space-y-2">
                  <Label>MFA required</Label>
                  <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-foreground">
                    <Checkbox id="mfa-required" />
                    <span>Enforce MFA for admins</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
