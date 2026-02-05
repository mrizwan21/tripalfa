import React from 'react';
import { useQuery } from 'react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Building2, GitBranch, Users, Award, Calendar, User } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';

export interface StaffProfile {
    companyId: string;
    branchId?: string;
    departmentId?: string;
    designationId?: string;
    employeeId: string;
    joiningDate: string;
    reportingToId?: string;
    permissions: string[];
}

const staffProfileSchema = z.object({
    companyId: z.string().min(1, "Company is required"),
    branchId: z.string().optional(),
    departmentId: z.string().optional(),
    designationId: z.string().optional(),
    employeeId: z.string().min(1, "Employee ID is required"),
    joiningDate: z.string().min(1, "Joining date is required"),
    reportingToId: z.string().optional(),
});

interface StaffProfileFormProps {
    defaultValues?: Partial<StaffProfile>;
    onChange: (values: StaffProfile) => void;
}

export function StaffProfileForm({ defaultValues, onChange }: StaffProfileFormProps) {
    const form = useForm({
        resolver: zodResolver(staffProfileSchema),
        defaultValues: {
            companyId: defaultValues?.companyId || '',
            branchId: defaultValues?.branchId || '',
            departmentId: defaultValues?.departmentId || '',
            designationId: defaultValues?.designationId || '',
            employeeId: defaultValues?.employeeId || '',
            joiningDate: defaultValues?.joiningDate || '',
            reportingToId: defaultValues?.reportingToId || '',
        },
    });

    const selectedCompanyId = form.watch('companyId');

    // Mock data - in real app, these would be API calls filtered by company/branch
    const { data: companies } = useQuery('companies', async () => [
        { id: '1', name: 'TravelPro International' },
        { id: '2', name: 'Global Travel Solutions' },
        { id: '3', name: 'Skyline Travels' },
    ]);

    const { data: branches } = useQuery(['branches', selectedCompanyId], async () => [
        { id: '1', name: 'Dubai Main Office', companyId: '1' },
        { id: '2', name: 'Abu Dhabi Branch', companyId: '1' },
        { id: '3', name: 'London Office', companyId: '1' },
    ], { enabled: !!selectedCompanyId });

    const { data: departments } = useQuery(['departments', selectedCompanyId], async () => [
        { id: '1', name: 'Operations' },
        { id: '2', name: 'Sales' },
        { id: '3', name: 'Marketing' },
        { id: '4', name: 'Finance' },
        { id: '5', name: 'IT' },
    ], { enabled: !!selectedCompanyId });

    const { data: designations } = useQuery(['designations', selectedCompanyId], async () => [
        { id: '1', name: 'CEO', level: 1 },
        { id: '2', name: 'Director', level: 3 },
        { id: '3', name: 'Senior Manager', level: 4 },
        { id: '4', name: 'Manager', level: 5 },
        { id: '5', name: 'Senior Consultant', level: 6 },
        { id: '6', name: 'Travel Consultant', level: 7 },
    ], { enabled: !!selectedCompanyId });

    const { data: users } = useQuery(['users', selectedCompanyId], async () => [
        { id: '1', name: 'John Smith' },
        { id: '2', name: 'Sarah Johnson' },
        { id: '3', name: 'Mike Brown' },
    ], { enabled: !!selectedCompanyId });

    // Watch form changes and call onChange
    React.useEffect(() => {
        const subscription = form.watch((values) => {
            if (values.companyId && values.employeeId && values.joiningDate) {
                onChange(values as StaffProfile);
            }
        });
        return () => subscription.unsubscribe();
    }, [form, onChange]);

    return (
        <Card className="border-none shadow-lg rounded-2xl">
            <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Staff Profile
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <Form {...form}>
                    <div className="space-y-6">
                        {/* Company Selection */}
                        <FormField control={form.control} name="companyId" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-gray-700 flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-gray-400" />
                                    Company *
                                </FormLabel>
                                <FormControl>
                                    <select {...field} className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:ring-2 focus:ring-primary">
                                        <option value="">Select company</option>
                                        {companies?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {selectedCompanyId && (
                            <>
                                {/* Branch Selection */}
                                <FormField control={form.control} name="branchId" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700 flex items-center gap-2">
                                            <GitBranch className="h-4 w-4 text-gray-400" />
                                            Branch
                                        </FormLabel>
                                        <FormControl>
                                            <select {...field} className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm">
                                                <option value="">Main Company (No Branch)</option>
                                                {branches?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                            </select>
                                        </FormControl>
                                        <FormDescription className="text-xs text-gray-500">Leave empty if user works at headquarters</FormDescription>
                                    </FormItem>
                                )} />

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Department Selection */}
                                    <FormField control={form.control} name="departmentId" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-gray-700 flex items-center gap-2">
                                                <Users className="h-4 w-4 text-gray-400" />
                                                Department
                                            </FormLabel>
                                            <FormControl>
                                                <select {...field} className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm">
                                                    <option value="">Select department</option>
                                                    {departments?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                                </select>
                                            </FormControl>
                                        </FormItem>
                                    )} />

                                    {/* Designation Selection */}
                                    <FormField control={form.control} name="designationId" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-gray-700 flex items-center gap-2">
                                                <Award className="h-4 w-4 text-gray-400" />
                                                Designation
                                            </FormLabel>
                                            <FormControl>
                                                <select {...field} className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm">
                                                    <option value="">Select designation</option>
                                                    {designations?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                                </select>
                                            </FormControl>
                                        </FormItem>
                                    )} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Employee ID */}
                                    <FormField control={form.control} name="employeeId" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-gray-700">Employee ID *</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="EMP-001" className="h-11 rounded-xl" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    {/* Joining Date */}
                                    <FormField control={form.control} name="joiningDate" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-gray-700 flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                Joining Date *
                                            </FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} className="h-11 rounded-xl" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>

                                {/* Reporting To */}
                                <FormField control={form.control} name="reportingToId" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700 flex items-center gap-2">
                                            <User className="h-4 w-4 text-gray-400" />
                                            Reports To
                                        </FormLabel>
                                        <FormControl>
                                            <select {...field} className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm">
                                                <option value="">No reporting manager</option>
                                                {users?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                            </select>
                                        </FormControl>
                                        <FormDescription className="text-xs text-gray-500">Select direct supervisor for this employee</FormDescription>
                                    </FormItem>
                                )} />
                            </>
                        )}
                    </div>
                </Form>
            </CardContent>
        </Card>
    );
}

export default StaffProfileForm;
