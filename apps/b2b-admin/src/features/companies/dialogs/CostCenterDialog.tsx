import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CostCenter } from '../types';

const costCenterSchema = z.object({
    name: z.string().min(2, "Cost center name required"),
    code: z.string().min(2, "Cost center code required"),
    departmentId: z.string().optional(),
    branchId: z.string().optional(),
    budget: z.number().min(0, "Budget must be positive"),
    currency: z.string().min(3, "Currency required"),
});

type CostCenterFormValues = z.infer<typeof costCenterSchema>;

interface CostCenterDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: CostCenterFormValues) => void;
    initialData?: CostCenter | null;
    departments?: Array<{ id: string; name: string }>;
    branches?: Array<{ id: string; name: string }>;
    isLoading?: boolean;
}

export function CostCenterDialog({ open, onOpenChange, onSubmit, initialData, departments = [], branches = [], isLoading }: CostCenterDialogProps) {
    const form = useForm<CostCenterFormValues>({
        resolver: zodResolver(costCenterSchema),
        defaultValues: { name: '', code: '', departmentId: '', branchId: '', budget: 0, currency: 'USD' },
    });

    React.useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    name: initialData.name,
                    code: initialData.code,
                    departmentId: initialData.departmentId || '',
                    branchId: initialData.branchId || '',
                    budget: initialData.budget,
                    currency: initialData.currency,
                });
            } else {
                form.reset({ name: '', code: '', departmentId: '', branchId: '', budget: 0, currency: 'USD' });
            }
        }
    }, [open, initialData, form]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">{initialData ? 'Edit Cost Center' : 'Add Cost Center'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-gray-700">Cost Center Name</FormLabel>
                                <FormControl><Input {...field} className="h-10" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="code" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-gray-700">Cost Center Code</FormLabel>
                                <FormControl><Input {...field} className="h-10" placeholder="CC-XXX-XXX" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="budget" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Budget</FormLabel>
                                    <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} className="h-10" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="currency" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Currency</FormLabel>
                                    <FormControl>
                                        <select {...field} className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm">
                                            <option value="USD">USD</option>
                                            <option value="EUR">EUR</option>
                                            <option value="GBP">GBP</option>
                                            <option value="AED">AED</option>
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="departmentId" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-gray-700">Department (Optional)</FormLabel>
                                <FormControl>
                                    <select {...field} className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm">
                                        <option value="">None</option>
                                        {departments?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="branchId" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-gray-700">Branch (Optional)</FormLabel>
                                <FormControl>
                                    <select {...field} className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm">
                                        <option value="">None</option>
                                        {branches?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={isLoading} className="bg-gray-900 hover:bg-primary">
                                {isLoading ? 'Saving...' : 'Save'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
