import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import {
    Plus,
    Search,
    MoreHorizontal,
    Users,
    Network,
    ChevronRight,
    GitCommit,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/Badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table';
import { toast } from 'sonner';

import { Department } from './types';
import { DepartmentDialog } from './dialogs/DepartmentDialog';
import { companyService } from './MockCompanyService';

interface DepartmentManagementProps {
    companyId?: string;
}

export const DepartmentManagement = ({ companyId: propCompanyId }: DepartmentManagementProps = {}) => {
    const { companyId: paramCompanyId } = useParams();
    const companyId = propCompanyId || paramCompanyId;
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [editingDepartment, setEditingDepartment] = React.useState<Department | null>(null);

    // Queries
    const { data: departments = [], isLoading } = useQuery({
        queryKey: ['departments', companyId],
        queryFn: () => companyService.getDepartments(companyId),
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (newDept: any) => companyService.createDepartment({ ...newDept, companyId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            toast.success('Department created successfully');
            setIsDialogOpen(false);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: any }) => companyService.updateDepartment(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            toast.success('Department updated successfully');
            setIsDialogOpen(false);
            setEditingDepartment(null);
        },
    });

    const handleEdit = (department: Department) => {
        setEditingDepartment(department);
        setIsDialogOpen(true);
    };

    const handleSave = (values: any) => {
        if (editingDepartment) {
            updateMutation.mutate({ id: editingDepartment.id, updates: values });
        } else {
            createMutation.mutate(values);
        }
    };

    const filteredDepartments = React.useMemo(() => {
        if (!Array.isArray(departments)) return [];
        return departments.filter((dept) => {
            if (!dept) return false;
            const nameMatch = dept.name?.toLowerCase().includes(searchTerm.toLowerCase());
            const codeMatch = dept.code?.toLowerCase().includes(searchTerm.toLowerCase());
            return nameMatch || codeMatch;
        });
    }, [departments, searchTerm]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Departments</h2>
                    <p className="text-sm text-gray-500">Manage organizational structure and teams</p>
                </div>
                <Button onClick={() => { setEditingDepartment(null); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Department
                </Button>
            </div>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search departments..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Department Name</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Parent Department</TableHead>
                            <TableHead>Employees</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    Loading departments...
                                </TableCell>
                            </TableRow>
                        ) : filteredDepartments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    No departments found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredDepartments.map((dept) => (
                                <TableRow key={dept.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                                                <Network className="h-4 w-4" />
                                            </div>
                                            <span className="font-medium text-gray-900">{dept?.name || 'Unknown'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{dept?.code || '-'}</TableCell>
                                    <TableCell>
                                        {dept?.parentDepartmentName ? (
                                            <div className="flex items-center gap-1 text-gray-600">
                                                <GitCommit className="h-4 w-4 rotate-90" />
                                                <span>{dept.parentDepartmentName}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic">Root</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-gray-600">
                                            <Users className="h-4 w-4" />
                                            {dept.employeeCount}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={dept.status === 'active' ? "bg-green-100 text-green-800 hover:bg-green-100 capitalize" : "capitalize"}>
                                            {dept.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => dept && handleEdit(dept)}>
                                                    Edit Department
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive">
                                                    Archive
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            <DepartmentDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSubmit={handleSave}
                initialData={editingDepartment}
                departments={departments}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />
        </div>
    );
};
