import React from 'react';
import { useQuery } from 'react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Building2, GitBranch, Users, Award, Calendar, Plus, Store } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import MapboxAddressPicker, { Address } from '@/components/MapboxAddressPicker';

export interface SubagentProfile {
    subagencyId: string;
    branchId?: string;
    departmentId?: string;
    designationId?: string;
    employeeId: string;
    joiningDate: string;
}

export interface Subagency {
    id: string;
    parentCompanyId: string;
    name: string;
    legalName: string;
    registrationNumber?: string;
    iataCode?: string;
    officeId?: string;
    address?: Address;
    phone: string;
    email: string;
    status: 'active' | 'inactive' | 'pending';
}

const subagentProfileSchema = z.object({
    subagencyId: z.string().min(1, "Subagency is required"),
    branchId: z.string().optional(),
    departmentId: z.string().optional(),
    designationId: z.string().optional(),
    employeeId: z.string().min(1, "Employee ID is required"),
    joiningDate: z.string().min(1, "Joining date is required"),
});

const newSubagencySchema = z.object({
    name: z.string().min(2, "Name required"),
    legalName: z.string().min(2, "Legal name required"),
    registrationNumber: z.string().optional(),
    iataCode: z.string().optional(),
    officeId: z.string().optional(),
    phone: z.string().min(5, "Phone required"),
    email: z.string().email("Valid email required"),
    parentCompanyId: z.string().min(1, "Parent company required"),
});

interface SubagentProfileFormProps {
    defaultValues?: Partial<SubagentProfile>;
    onChange: (values: SubagentProfile) => void;
}

export function SubagentProfileForm({ defaultValues, onChange }: SubagentProfileFormProps) {
    const [showNewSubagencyModal, setShowNewSubagencyModal] = React.useState(false);
    const [newSubagencyAddress, setNewSubagencyAddress] = React.useState<Address | undefined>();

    const form = useForm({
        resolver: zodResolver(subagentProfileSchema),
        defaultValues: {
            subagencyId: defaultValues?.subagencyId || '',
            branchId: defaultValues?.branchId || '',
            departmentId: defaultValues?.departmentId || '',
            designationId: defaultValues?.designationId || '',
            employeeId: defaultValues?.employeeId || '',
            joiningDate: defaultValues?.joiningDate || '',
        },
    });

    const newSubagencyForm = useForm({
        resolver: zodResolver(newSubagencySchema),
        defaultValues: {
            name: '',
            legalName: '',
            registrationNumber: '',
            iataCode: '',
            officeId: '',
            phone: '',
            email: '',
            parentCompanyId: '',
        },
    });

    const selectedSubagencyId = form.watch('subagencyId');

    // Mock data queries
    const { data: companies } = useQuery('parentCompanies', async () => [
        { id: '1', name: 'TravelPro International' },
        { id: '2', name: 'Global Travel Solutions' },
    ]);

    const { data: subagencies, refetch: refetchSubagencies } = useQuery('subagencies', async () => [
        { id: '1', parentCompanyId: '1', name: 'Dubai Holiday Experts', legalName: 'DHE LLC', iataCode: 'DHE01', status: 'active' },
        { id: '2', parentCompanyId: '1', name: 'Abu Dhabi Travel Hub', legalName: 'ADTH Ltd', officeId: 'ADTH-001', status: 'active' },
        { id: '3', parentCompanyId: '2', name: 'London Luxury Travel', legalName: 'LLT Co', iataCode: 'LLT02', status: 'active' },
    ] as Subagency[]);

    const { data: branches } = useQuery(['subagencyBranches', selectedSubagencyId], async () => [
        { id: '1', name: 'Main Office' },
        { id: '2', name: 'Mall Branch' },
    ], { enabled: !!selectedSubagencyId });

    const { data: departments } = useQuery(['subagencyDepartments', selectedSubagencyId], async () => [
        { id: '1', name: 'Sales' },
        { id: '2', name: 'Operations' },
        { id: '3', name: 'Customer Service' },
    ], { enabled: !!selectedSubagencyId });

    const { data: designations } = useQuery(['subagencyDesignations', selectedSubagencyId], async () => [
        { id: '1', name: 'Agency Owner' },
        { id: '2', name: 'Senior Consultant' },
        { id: '3', name: 'Travel Consultant' },
        { id: '4', name: 'Junior Consultant' },
    ], { enabled: !!selectedSubagencyId });

    // Watch form changes
    React.useEffect(() => {
        const subscription = form.watch((values) => {
            if (values.subagencyId && values.employeeId && values.joiningDate) {
                onChange(values as SubagentProfile);
            }
        });
        return () => subscription.unsubscribe();
    }, [form, onChange]);

    const handleCreateSubagency = (values: z.infer<typeof newSubagencySchema>) => {
        // In real app, this would be an API call
        console.log('Creating subagency:', { ...values, address: newSubagencyAddress });
        setShowNewSubagencyModal(false);
        newSubagencyForm.reset();
        refetchSubagencies();
        // Set the new subagency as selected
    };

    return (
        <>
            <Card className="border-none shadow-lg rounded-2xl">
                <CardHeader className="border-b border-gray-100">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Store className="h-5 w-5 text-primary" />
                        Subagent Profile
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <Form {...form}>
                        <div className="space-y-6">
                            {/* Subagency Selection */}
                            <FormField control={form.control} name="subagencyId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700 flex items-center gap-2">
                                        <Store className="h-4 w-4 text-gray-400" />
                                        Subagency *
                                    </FormLabel>
                                    <div className="flex gap-3">
                                        <FormControl>
                                            <select {...field} className="flex h-11 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:ring-2 focus:ring-primary">
                                                <option value="">Select subagency</option>
                                                {subagencies?.map(s => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.name} {s.iataCode && `(${s.iataCode})`}
                                                    </option>
                                                ))}
                                            </select>
                                        </FormControl>
                                        <Button type="button" variant="outline" className="rounded-xl h-11" onClick={() => setShowNewSubagencyModal(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            New
                                        </Button>
                                    </div>
                                    <FormDescription className="text-xs text-gray-500">Select existing subagency or create a new one</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {selectedSubagencyId && (
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
                                                    <option value="">Main Office (No Branch)</option>
                                                    {branches?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                                </select>
                                            </FormControl>
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
                                                <FormLabel className="font-bold text-gray-700">Agent ID *</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="AGT-001" className="h-11 rounded-xl" />
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
                                </>
                            )}
                        </div>
                    </Form>
                </CardContent>
            </Card>

            {/* New Subagency Modal */}
            <Dialog open={showNewSubagencyModal} onOpenChange={setShowNewSubagencyModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Store className="h-5 w-5" />
                            Create New Subagency
                        </DialogTitle>
                    </DialogHeader>

                    <Form {...newSubagencyForm}>
                        <form onSubmit={newSubagencyForm.handleSubmit(handleCreateSubagency)} className="space-y-6 py-4">
                            {/* Parent Company */}
                            <FormField control={newSubagencyForm.control} name="parentCompanyId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Parent Company *</FormLabel>
                                    <FormControl>
                                        <select {...field} className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm">
                                            <option value="">Select parent company</option>
                                            {companies?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={newSubagencyForm.control} name="name" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700">Subagency Name *</FormLabel>
                                        <FormControl><Input {...field} placeholder="Dubai Holiday Experts" className="h-11 rounded-xl" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={newSubagencyForm.control} name="legalName" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700">Legal Name *</FormLabel>
                                        <FormControl><Input {...field} placeholder="DHE LLC" className="h-11 rounded-xl" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <FormField control={newSubagencyForm.control} name="registrationNumber" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700">Registration #</FormLabel>
                                        <FormControl><Input {...field} placeholder="REG-12345" className="h-11 rounded-xl" /></FormControl>
                                    </FormItem>
                                )} />
                                <FormField control={newSubagencyForm.control} name="iataCode" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700">IATA Code</FormLabel>
                                        <FormControl><Input {...field} placeholder="DHE01" maxLength={8} className="h-11 rounded-xl" /></FormControl>
                                    </FormItem>
                                )} />
                                <FormField control={newSubagencyForm.control} name="officeId" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700">Office ID</FormLabel>
                                        <FormControl><Input {...field} placeholder="OFF-DHE-001" className="h-11 rounded-xl" /></FormControl>
                                    </FormItem>
                                )} />
                            </div>

                            {/* Contact */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={newSubagencyForm.control} name="phone" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700">Phone *</FormLabel>
                                        <FormControl><Input {...field} placeholder="+971 4 555 1234" className="h-11 rounded-xl" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={newSubagencyForm.control} name="email" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700">Email *</FormLabel>
                                        <FormControl><Input type="email" {...field} placeholder="info@subagency.com" className="h-11 rounded-xl" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            {/* Address */}
                            <div className="border-t pt-4">
                                <h4 className="font-bold text-gray-900 mb-4">Office Address</h4>
                                <MapboxAddressPicker value={newSubagencyAddress} onChange={setNewSubagencyAddress} placeholder="Search subagency office address..." />
                            </div>

                            <DialogFooter className="pt-4">
                                <Button type="button" variant="ghost" onClick={() => setShowNewSubagencyModal(false)}>Cancel</Button>
                                <Button type="submit" className="bg-gray-900 hover:bg-primary rounded-xl font-bold">
                                    Create Subagency
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default SubagentProfileForm;
