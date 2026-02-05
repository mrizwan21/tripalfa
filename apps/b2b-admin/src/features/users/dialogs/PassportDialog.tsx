import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calendar, Globe, User, Shield, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/checkbox';
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
import { PassportDetail } from '../types';

const passportSchema = z.object({
    passportNo: z.string().min(1, "Passport number is required"),
    nationality: z.string().min(1, "Nationality is required"),
    issuingCountry: z.string().min(1, "Issuing country is required"),
    placeOfIssue: z.string().min(1, "Place of issue is required"),
    dob: z.string().optional(), // Often passport forms might ask this to verify but it's on the user profile
    expiry: z.string().min(1, "Expiry date is required"),
    isPrimary: z.boolean().default(false),
    status: z.enum(['ACTIVE', 'EXPIRED', 'ABOUT_TO_EXPIRE']).default('ACTIVE'),
});

interface PassportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: PassportDetail;
    onSave: (data: Partial<PassportDetail>) => void;
}

export function PassportDialog({ open, onOpenChange, initialData, onSave }: PassportDialogProps) {
    const form = useForm<z.infer<typeof passportSchema>>({
        resolver: zodResolver(passportSchema),
        defaultValues: {
            passportNo: initialData?.passportNo || '',
            nationality: initialData?.nationality || '',
            issuingCountry: initialData?.issuingCountry || '',
            placeOfIssue: initialData?.placeOfIssue || '',
            dob: initialData?.dob || '',
            expiry: initialData?.expiry || '',
            isPrimary: initialData?.isPrimary || false,
            status: initialData?.status || 'ACTIVE',
        },
    });

    React.useEffect(() => {
        if (open) {
            form.reset({
                passportNo: initialData?.passportNo || '',
                nationality: initialData?.nationality || '',
                issuingCountry: initialData?.issuingCountry || '',
                placeOfIssue: initialData?.placeOfIssue || '',
                dob: initialData?.dob || '',
                expiry: initialData?.expiry || '',
                isPrimary: initialData?.isPrimary || false,
                status: initialData?.status || 'ACTIVE',
            });
        }
    }, [open, initialData, form]);

    const onSubmit = (values: z.infer<typeof passportSchema>) => {
        onSave(values);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black flex items-center gap-2">
                        <Globe className="h-6 w-6 text-indigo-600" />
                        {initialData ? 'Edit Passport' : 'Add Passport'}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="passportNo" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Passport Number *</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Enter passport number" className="h-11 rounded-xl" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="nationality" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Nationality *</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="e.g. British" className="h-11 rounded-xl" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="issuingCountry" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Issuing Country *</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="e.g. UK" className="h-11 rounded-xl" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="placeOfIssue" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Place of Issue *</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="e.g. London" className="h-11 rounded-xl" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="expiry" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Expiry Date *</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} className="h-11 rounded-xl" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="dob" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Date of Birth (on Passport)</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} className="h-11 rounded-xl" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="isPrimary" render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border p-4">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel className="font-bold text-gray-700">
                                        Primary Passport
                                    </FormLabel>
                                    <FormDescription>
                                        Use this passport for all bookings by default
                                    </FormDescription>
                                </div>
                            </FormItem>
                        )} />

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">Cancel</Button>
                            <Button type="submit" className="bg-gray-900 hover:bg-primary rounded-xl font-bold">
                                {initialData ? 'Update Passport' : 'Add Passport'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
