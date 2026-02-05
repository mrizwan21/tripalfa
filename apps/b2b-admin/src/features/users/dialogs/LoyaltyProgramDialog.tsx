import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Award, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { LoyaltyProgram } from '../types';

const loyaltySchema = z.object({
    provider: z.string().min(1, "Provider is required"), // e.g. "Emirates Skywards"
    type: z.enum(['AIRLINE', 'HOTEL', 'CAR']),
    membershipNumber: z.string().min(1, "Membership number is required"),
    expiryDate: z.string().optional(),
});

interface LoyaltyProgramDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: LoyaltyProgram;
    onSave: (data: Partial<LoyaltyProgram>) => void;
}

export function LoyaltyProgramDialog({ open, onOpenChange, initialData, onSave }: LoyaltyProgramDialogProps) {
    const form = useForm<z.infer<typeof loyaltySchema>>({
        resolver: zodResolver(loyaltySchema),
        defaultValues: {
            provider: initialData?.provider || '',
            type: initialData?.type || 'AIRLINE',
            membershipNumber: initialData?.membershipNumber || '',
            expiryDate: initialData?.expiryDate || '',
        },
    });

    React.useEffect(() => {
        if (open) {
            form.reset({
                provider: initialData?.provider || '',
                type: initialData?.type || 'AIRLINE',
                membershipNumber: initialData?.membershipNumber || '',
                expiryDate: initialData?.expiryDate || '',
            });
        }
    }, [open, initialData, form]);

    const onSubmit = (values: z.infer<typeof loyaltySchema>) => {
        onSave(values);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black flex items-center gap-2">
                        <Award className="h-6 w-6 text-amber-500" />
                        {initialData ? 'Edit Loyalty Program' : 'Add Loyalty Program'}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Program Type *</FormLabel>
                                    <FormControl>
                                        <select {...field} className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm">
                                            <option value="AIRLINE">Airline</option>
                                            <option value="HOTEL">Hotel</option>
                                            <option value="CAR">Car Rental</option>
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="expiryDate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Expiry Date</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} className="h-11 rounded-xl" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="provider" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-gray-700">Program / Provider Name *</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="e.g. Emirates Skywards" className="h-11 rounded-xl" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="membershipNumber" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-gray-700">Membership Number *</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Membership ID" className="h-11 rounded-xl font-mono" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">Cancel</Button>
                            <Button type="submit" className="bg-gray-900 hover:bg-primary rounded-xl font-bold">
                                {initialData ? 'Update Program' : 'Add Program'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
