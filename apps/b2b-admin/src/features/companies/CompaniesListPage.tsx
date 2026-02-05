import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    Filter,
    Building2,
    Briefcase,
    Users,
    MoreHorizontal,
    Phone,
    Mail,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

import { Company } from './types';
import { CompanyDialog } from './dialogs/CompanyDialog';
import { companyService } from './MockCompanyService';

export const CompaniesListPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [editingCompany, setEditingCompany] = React.useState<Company | null>(null);

    // Queries
    const { data: companies = [], isLoading } = useQuery({
        queryKey: ['companies'],
        queryFn: () => companyService.getCompanies(),
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (newCompany: any) => companyService.createCompany(newCompany),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            toast.success('Company created successfully');
            setIsDialogOpen(false);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: any }) => companyService.updateCompany(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            toast.success('Company updated successfully');
            setIsDialogOpen(false);
            setEditingCompany(null);
        },
    });

    const handleEdit = (company: Company) => {
        setEditingCompany(company);
        setIsDialogOpen(true);
    };

    const handleSave = (values: any) => {
        if (editingCompany) {
            updateMutation.mutate({ id: editingCompany.id, updates: values });
        } else {
            createMutation.mutate(values);
        }
    };

    // Removed debug console.log for production

    const filteredCompanies = React.useMemo((): Company[] => {
        if (!Array.isArray(companies)) {
            console.error('Companies is not an array:', companies);
            return [];
        }
        return companies.filter((company): company is Company => {
            if (!company) return false;
            if (!company.name && !company.email) return false;
            
            const nameMatch = company.name?.toLowerCase().includes(searchTerm.toLowerCase());
            const emailMatch = company.email?.toLowerCase().includes(searchTerm.toLowerCase());
            return Boolean(nameMatch || emailMatch);
        });
    }, [companies, searchTerm]);

    // Columns
    const columns: ColumnDef<Company>[] = [
        {
            accessorKey: 'name',
            header: 'Company',
            cell: ({ row }: { row: { original: Company } }) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">{row.original.name}</div>
                        <div className="text-sm text-gray-500">{row.original.legalName}</div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'contact',
            header: 'Contact Info',
            cell: ({ row }) => (
                <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-3.5 w-3.5" />
                        {row.original.email}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-3.5 w-3.5" /> {row.original.phone} </div> </div> ), }, { accessorKey: 'status', header: 'Status', cell: ({ row }) => { const status = row.original.status; const variant = status === 'active' ? 'secondary' : status === 'inactive' ? 'destructive' : 'secondary'; const className = status === 'active' ?"bg-green-100 text-green-800 hover:bg-green-100 capitalize" : 'capitalize';
                return (
                    <Badge variant={variant} className={className}>
                        {status}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'tier',
            header: 'Tier',
            cell: ({ row }) => (
                <Badge variant="outline" className="capitalize">
                    {row.original.tier}
                </Badge>
            ),
        },
        {
            accessorKey: 'metrics',
            header: 'Metrics',
            cell: ({ row }) => (
                <div className="flex gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1" title="Active Users">
                        <Users className="h-4 w-4" />
                        {row.original.usersCount}
                    </div>
                    <div className="flex items-center gap-1" title="Total Bookings">
                        <Briefcase className="h-4 w-4" />
                        {row.original.bookingsCount}
                    </div>
                </div>
            ),
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigate(`/companies/${row.original.id}`)}>
                            View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(row.original)}>
                            Edit Company
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                            Deactivate
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Companies</h1>
                    <p className="text-gray-500">Manage B2B corporate clients and partnerships</p>
                </div>
                <Button onClick={() => { setEditingCompany(null); setIsDialogOpen(true); }} className="bg-primary hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Company
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search companies..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="md:w-auto">
                            <Filter className="mr-2 h-4 w-4" />
                            Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Data Table */}
            <Card>
                <CardContent className="p-0">
                    <DataTable
                        columns={columns}
                        data={filteredCompanies}
                        isLoading={isLoading}
                    />
                </CardContent>
            </Card>

            <CompanyDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSubmit={handleSave}
                initialData={editingCompany}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
};
