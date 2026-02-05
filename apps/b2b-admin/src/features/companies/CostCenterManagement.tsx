import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import {
    Plus,
    Search,
    Filter,
    PieChart,
    DollarSign,
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
import { Progress } from '@/components/ui/progress';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

import { CostCenter } from './types';
import { CostCenterDialog } from './dialogs/CostCenterDialog';
import { companyService } from './MockCompanyService';

interface CostCenterManagementProps {
    companyId?: string;
}

export const CostCenterManagement = ({ companyId: propCompanyId }: CostCenterManagementProps = {}) => {
    const { companyId: paramCompanyId } = useParams();
    const companyId = propCompanyId || paramCompanyId;
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [editingCostCenter, setEditingCostCenter] = React.useState<CostCenter | null>(null);

    // Queries
    const { data: costCenters = [], isLoading } = useQuery({
        queryKey: ['costCenters', companyId],
        queryFn: () => companyService.getCostCenters(companyId),
    });

    const { data: departments = [] } = useQuery({
        queryKey: ['departments', companyId],
        queryFn: () => companyService.getDepartments(companyId),
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (newCC: any) => companyService.createCostCenter({ ...newCC, companyId, spent: 0 }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['costCenters'] });
            toast.success('Cost Center created successfully');
            setIsDialogOpen(false);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: any }) => companyService.updateCostCenter(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['costCenters'] });
            toast.success('Cost Center updated successfully');
            setIsDialogOpen(false);
            setEditingCostCenter(null);
        },
    });

    const handleEdit = (costCenter: CostCenter) => {
        setEditingCostCenter(costCenter);
        setIsDialogOpen(true);
    };

    const handleSave = (values: any) => {
        if (editingCostCenter) {
            updateMutation.mutate({ id: editingCostCenter.id, updates: values });
        } else {
            createMutation.mutate(values);
        }
    };

    const getUtilizationColor = (percentage: number) => {
        if (percentage >= 90) return 'bg-destructive/80';
        if (percentage >= 75) return 'bg-yellow-500';
        return 'bg-primary';
    };

    // Columns
    const columns: ColumnDef<CostCenter>[] = [
        {
            accessorKey: 'name',
            header: 'Cost Center Name',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                        <PieChart className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">{row.original.name}</div>
                        <div className="text-sm text-gray-500">{row.original.code}</div>
                    </div>
                </div>
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
            accessorKey: 'budget',
            header: 'Budget Utilization',
            cell: ({ row }) => {
                const utilization = (row.original.spent / row.original.budget) * 100;
                return (
                    <div className="w-[180px] space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="font-medium">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: row.original.currency }).format(row.original.spent)}
                            </span>
                            <span className="text-gray-500">
                                of {new Intl.NumberFormat('en-US', { style: 'currency', currency: row.original.currency }).format(row.original.budget)}
                            </span>
                        </div>
                        <Progress value={utilization} className="h-2" indicatorClassName={getUtilizationColor(utilization)} />
                    </div>
                );
            },
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant="secondary" className={row.original.status === 'active' ? "bg-green-100 text-green-800 hover:bg-green-100 capitalize" : "capitalize"}>
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
                        <DropdownMenuItem onClick={() => handleEdit(row.original)}>
                            Edit Cost Center
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

    const filteredCostCenters = costCenters.filter((cc) =>
        cc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cc.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Cost Centers</h2>
                    <p className="text-sm text-gray-500">Track and manage departmental budgets</p>
                </div>
                <Button onClick={() => { setEditingCostCenter(null); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Cost Center
                </Button>
            </div>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search cost centers..."
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
                        data={filteredCostCenters}
                        isLoading={isLoading}
                    />
                </CardContent>
            </Card>

            <CostCenterDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSubmit={handleSave}
                initialData={editingCostCenter}
                departments={departments}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
};
