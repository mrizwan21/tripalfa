import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Designation, Department } from '../types';

const designationSchema = z.object({
    name: z.string().min(2, "Designation name required"),
    level: z.number().min(1).max(10),
    departmentId: z.string().optional(),
});

type DesignationFormValues = z.infer<typeof designationSchema>;

interface DesignationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: DesignationFormValues) => void;
    initialData?: Designation | null;
    departments?: Department[]; // Use Department type, or simplified version {id, name}
    isLoading?: boolean;
}

export function DesignationDialog({ open, onOpenChange, onSubmit, initialData, departments = [], isLoading }: DesignationDialogProps) {
    const form = useForm<DesignationFormValues>({
        resolver: zodResolver(designationSchema),
        defaultValues: { name: '', level: 5, departmentId: '' },
    });

    React.useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    name: initialData.name,
                    level: initialData.level,
                    departmentId: initialData.departmentId || '',
                });
            } else {
                form.reset({ name: '', level: 5, departmentId: '' });
            }
        }
    }, [open, initialData, form]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">{initialData ? 'Edit Designation' : 'Add Designation'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-gray-700">Designation Name</FormLabel>
                                <FormControl><Input {...field} className="h-10" placeholder="e.g., Senior Manager" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="level" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-gray-700">Level (1 = Highest)</FormLabel>
                                <FormControl>
                                    <Input type="number" min={1} max={10} {...field} onChange={e => field.onChange(parseInt(e.target.value))} className="h-10" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="departmentId" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-gray-700">Department (Optional)</FormLabel>
                                <FormControl>
                                    <select {...field} className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm">
                                        <option value="">All Departments</option>
                                        {departments?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
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
