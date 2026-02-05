import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import {
    Plus,
    Search,
    Filter,
    Users,
    Medal,
    MoreHorizontal,
    Briefcase,
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

import { Designation } from './types';
import { DesignationDialog } from './dialogs/DesignationDialog';
import { companyService } from './MockCompanyService';

interface DesignationManagementProps {
    companyId?: string;
}

export const DesignationManagement = ({ companyId: propCompanyId }: DesignationManagementProps = {}) => {
    const { companyId: paramCompanyId } = useParams();
    const companyId = propCompanyId || paramCompanyId;
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [editingDesignation, setEditingDesignation] = React.useState<Designation | null>(null);

    // Queries
    const { data: designations = [], isLoading } = useQuery({
        queryKey: ['designations', companyId],
        queryFn: () => companyService.getDesignations(companyId),
    });

    const { data: departments = [] } = useQuery({
        queryKey: ['departments', companyId],
        queryFn: () => companyService.getDepartments(companyId),
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (newDesig: any) => companyService.createDesignation({ ...newDesig, companyId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['designations'] });
            toast.success('Designation created successfully');
            setIsDialogOpen(false);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: any }) => companyService.updateDesignation(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['designations'] });
            toast.success('Designation updated successfully');
            setIsDialogOpen(false);
            setEditingDesignation(null);
        },
    });

    const handleEdit = (designation: Designation) => {
        setEditingDesignation(designation);
        setIsDialogOpen(true);
    };

    const handleSave = (values: any) => {
        if (editingDesignation) {
            updateMutation.mutate({ id: editingDesignation.id, updates: values });
        } else {
            createMutation.mutate(values);
        }
    };

    // Columns
    const columns: ColumnDef<Designation>[] = [
        {
            accessorKey: 'name',
            header: 'Designation Name',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                        <Medal className="h-5 w-5" />
                    </div>
                    <div className="font-medium text-gray-900">{row.original.name}</div>
                </div>
            ),
        },
        {
            accessorKey: 'level',
            header: 'Level',
            cell: ({ row }) => (
                <Badge variant="outline">
                    Level {row.original.level}
                </Badge>
            ),
        },
        {
            accessorKey: 'department',
            header: 'Department',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-gray-600">
                    <Briefcase className="h-4 w-4" />
                    <span>{row.original.departmentName}</span>
                </div>
            ),
        },
        {
            accessorKey: 'count',
            header: 'Employees',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{row.original.employeeCount}</span>
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
                        <DropdownMenuItem onClick={() => handleEdit(row.original)}>
                            Edit Designation
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                            Remove
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    const filteredDesignations = designations.filter((desig) =>
        desig.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Designations</h2>
                    <p className="text-sm text-gray-500">Manage employee roles and hierarchy levels</p>
                </div>
                <Button onClick={() => { setEditingDesignation(null); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Designation
                </Button>
            </div>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search designations..."
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
                        data={filteredDesignations}
                        isLoading={isLoading}
                    />
                </CardContent>
            </Card>

            <DesignationDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSubmit={handleSave}
                initialData={editingDesignation}
                departments={departments}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
};
