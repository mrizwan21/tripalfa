import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import {
    Plus,
    Search,
    Filter,
    Building,
    MapPin,
    Phone,
    Mail,
    User,
    MoreHorizontal,
    Globe,
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

import { Branch } from './types';
import { BranchDialog } from './dialogs/BranchDialog';
import { companyService } from './MockCompanyService';

interface BranchManagementProps {
    companyId?: string;
}

export const BranchManagement = ({ companyId: propCompanyId }: BranchManagementProps = {}) => {
    const { companyId: paramCompanyId } = useParams();
    const companyId = propCompanyId || paramCompanyId;
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [editingBranch, setEditingBranch] = React.useState<Branch | null>(null);

    // Queries
    const { data: branches = [], isLoading } = useQuery({
        queryKey: ['branches', companyId],
        queryFn: () => companyService.getBranches(companyId),
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (newBranch: any) => companyService.createBranch({ ...newBranch, companyId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['branches'] });
            toast.success('Branch created successfully');
            setIsDialogOpen(false);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: any }) => companyService.updateBranch(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['branches'] });
            toast.success('Branch updated successfully');
            setIsDialogOpen(false);
            setEditingBranch(null);
        },
    });

    // Columns
    const columns: ColumnDef<Branch>[] = [
        {
            accessorKey: 'name',
            header: 'Branch Name',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Building className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">{row.original.name}</div>
                        <div className="text-sm text-gray-500">{row.original.code}</div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'location',
            header: 'Location',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-sm text-gray-600 max-w-[200px]" title={row.original.address?.formattedAddress}>
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{row.original.address?.formattedAddress || 'No address'}</span>
                </div>
            ),
        },
        {
            accessorKey: 'contact',
            header: 'Contact',
            cell: ({ row }) => (
                <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-3.5 w-3.5" />
                        {row.original.email}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-3.5 w-3.5" />
                        {row.original.phone}
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'identifiers',
            header: 'Identifiers',
            cell: ({ row }) => (
                <div className="space-y-1 text-sm">
                    {row.original.iataCode && (
                        <Badge variant="outline" className="mr-1">
                            IATA: {row.original.iataCode}
                        </Badge>
                    )}
                    {row.original.officeId && (
                        <Badge variant="outline">
                            OID: {row.original.officeId}
                        </Badge>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant={row.original.status === 'active' ? 'secondary' : 'secondary'} className={row.original.status === 'active' ? "bg-green-100 text-green-800 hover:bg-green-100" : "capitalize"}>
                    {row.original.status}
                </Badge>
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
                        <DropdownMenuItem onClick={() => { setEditingBranch(row.original); setIsDialogOpen(true); }}>
                            Edit Branch
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

    const filteredBranches = branches.filter((branch) =>
        branch.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Branch Management</h2>
                    <p className="text-sm text-gray-500">Manage company branches and office locations</p>
                </div>
                <Button onClick={() => { setEditingBranch(null); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Branch
                </Button>
            </div>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search branches..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <DataTable
                        columns={columns}
                        data={filteredBranches}
                        isLoading={isLoading}
                    />
                </CardContent>
            </Card>

            <BranchDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSubmit={(values) => {
                    if (editingBranch) {
                        updateMutation.mutate({ id: editingBranch.id, updates: values });
                    } else {
                        createMutation.mutate(values);
                    }
                }}
                initialData={editingBranch}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
};
