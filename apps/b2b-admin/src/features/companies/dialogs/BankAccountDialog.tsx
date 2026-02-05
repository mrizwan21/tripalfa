import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { BankAccount } from '../types';

const bankAccountSchema = z.object({
    bankName: z.string().min(2, "Bank name required"),
    accountNumber: z.string().min(5, "Account number required"),
    accountName: z.string().min(2, "Account name required"),
    swiftCode: z.string().optional(),
    iban: z.string().optional(),
    currency: z.string().min(3, "Currency required"),
    isPrimary: z.boolean(),
    branchId: z.string().optional(),
});

type BankAccountFormValues = z.infer<typeof bankAccountSchema>;

interface BankAccountDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: BankAccountFormValues) => void;
    initialData?: BankAccount | null;
    isLoading?: boolean;
}

export function BankAccountDialog({ open, onOpenChange, onSubmit, initialData, isLoading }: BankAccountDialogProps) {
    const form = useForm<BankAccountFormValues>({
        resolver: zodResolver(bankAccountSchema),
        defaultValues: { bankName: '', accountNumber: '', accountName: '', swiftCode: '', iban: '', currency: 'USD', isPrimary: false, branchId: '' },
    });

    React.useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    bankName: initialData.bankName,
                    accountNumber: initialData.accountNumber,
                    accountName: initialData.accountName,
                    swiftCode: initialData.swiftCode || '',
                    iban: initialData.iban || '',
                    currency: initialData.currency,
                    isPrimary: initialData.isPrimary,
                    branchId: initialData.branchId || '',
                });
            } else {
                form.reset({ bankName: '', accountNumber: '', accountName: '', swiftCode: '', iban: '', currency: 'USD', isPrimary: false, branchId: '' });
            }
        }
    }, [open, initialData, form]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">{initialData ? 'Edit Bank Account' : 'Add Bank Account'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="bankName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700">Bank Name</FormLabel>
                                        <FormControl><Input {...field} className="h-10" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="accountName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700">Account Name</FormLabel>
                                        <FormControl><Input {...field} className="h-10" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="accountNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Account Number</FormLabel>
                                    <FormControl><Input {...field} className="h-10" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="swiftCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700">SWIFT Code</FormLabel>
                                        <FormControl><Input {...field} className="h-10" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="currency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700">Currency</FormLabel>
                                        <FormControl><Input {...field} className="h-10" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="iban"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">IBAN (Optional)</FormLabel>
                                    <FormControl><Input {...field} className="h-10" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={isLoading} className="bg-gray-900 hover:bg-primary">
                                {isLoading ? 'Saving...' : 'Save Account'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
