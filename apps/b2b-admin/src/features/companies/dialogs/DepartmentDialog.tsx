import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Department } from '../types';

const departmentSchema = z.object({
    name: z.string().min(2, "Department name required"),
    code: z.string().min(2, "Department code required"),
    headId: z.string().optional(),
    parentDepartmentId: z.string().optional(),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

interface DepartmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: DepartmentFormValues) => void;
    initialData?: Department | null;
    departments?: Department[];
    isLoading?: boolean;
}

export function DepartmentDialog({ open, onOpenChange, onSubmit, initialData, departments = [], isLoading }: DepartmentDialogProps) {
    const form = useForm<DepartmentFormValues>({
        resolver: zodResolver(departmentSchema),
        defaultValues: { name: '', code: '', headId: '', parentDepartmentId: '' },
    });

    React.useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    name: initialData.name,
                    code: initialData.code,
                    headId: initialData.headId || '',
                    parentDepartmentId: initialData.parentDepartmentId || '',
                });
            } else {
                form.reset({ name: '', code: '', headId: '', parentDepartmentId: '' });
            }
        }
    }, [open, initialData, form]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">{initialData ? 'Edit Department' : 'Add Department'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-gray-700">Department Name</FormLabel>
                                <FormControl><Input {...field} className="h-10" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="code" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-gray-700">Department Code</FormLabel>
                                <FormControl><Input {...field} className="h-10" placeholder="e.g., SALES" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="parentDepartmentId" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-gray-700">Parent Department (Optional)</FormLabel>
                                <FormControl>
                                    <select {...field} className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm">
                                        <option value="">None (Root Department)</option>
                                        {departments?.map(d => (
                                            initialData?.id !== d.id && <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
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
