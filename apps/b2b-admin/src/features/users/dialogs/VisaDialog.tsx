import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
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
} from '@/components/ui/form';
import { VisaDetail } from '../types';

const visaSchema = z.object({
    country: z.string().min(1, "Country is required"),
    visaNo: z.string().min(1, "Visa number is required"),
    type: z.string().min(1, "Visa type is required"),
    dateOfIssue: z.string().min(1, "Date of issue is required"),
    dateOfExpiry: z.string().min(1, "Date of expiry is required"),
    remarks: z.string().optional(),
});

interface VisaDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: VisaDetail;
    onSave: (data: Partial<VisaDetail>) => void;
}

export function VisaDialog({ open, onOpenChange, initialData, onSave }: VisaDialogProps) {
    const form = useForm<z.infer<typeof visaSchema>>({
        resolver: zodResolver(visaSchema),
        defaultValues: {
            country: initialData?.country || '',
            visaNo: initialData?.visaNo || '',
            type: initialData?.type || '',
            dateOfIssue: initialData?.dateOfIssue || '',
            dateOfExpiry: initialData?.dateOfExpiry || '',
            remarks: initialData?.remarks || '',
        },
    });

    React.useEffect(() => {
        if (open) {
            form.reset({
                country: initialData?.country || '',
                visaNo: initialData?.visaNo || '',
                type: initialData?.type || '',
                dateOfIssue: initialData?.dateOfIssue || '',
                dateOfExpiry: initialData?.dateOfExpiry || '',
                remarks: initialData?.remarks || '',
            });
        }
    }, [open, initialData, form]);

    const onSubmit = (values: z.infer<typeof visaSchema>) => {
        onSave(values);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black flex items-center gap-2">
                        <FileText className="h-6 w-6 text-emerald-600" />
                        {initialData ? 'Edit Visa' : 'Add Visa'}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="country" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Country *</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="e.g. United States" className="h-11 rounded-xl" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="visaNo" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Visa Number *</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Visa / Permit Number" className="h-11 rounded-xl" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <FormField control={form.control} name="type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Visa Type *</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="e.g. Business (B1)" className="h-11 rounded-xl" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="dateOfIssue" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Issue Date *</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} className="h-11 rounded-xl" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="dateOfExpiry" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Expiry Date *</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} className="h-11 rounded-xl" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="remarks" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-gray-700">Remarks</FormLabel>
                                <FormControl>
                                    <Textarea {...field} placeholder="Additional notes like entry type..." className="min-h-[100px] rounded-xl" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">Cancel</Button>
                            <Button type="submit" className="bg-gray-900 hover:bg-primary rounded-xl font-bold">
                                {initialData ? 'Update Visa' : 'Add Visa'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
