import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PaymentGateway } from '../types';

const gatewaySchema = z.object({
    provider: z.enum(['stripe', 'paypal', 'adyen', 'worldpay', 'cybersource']),
    merchantId: z.string().min(3, "Merchant ID required"),
    isLive: z.boolean(),
    supportedCurrencies: z.string().min(3, "At least one currency required"),
    branchId: z.string().optional(),
});

type GatewayFormValues = z.infer<typeof gatewaySchema>;

interface PaymentGatewayDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: GatewayFormValues) => void;
    initialData?: PaymentGateway | null;
    isLoading?: boolean;
}

export function PaymentGatewayDialog({ open, onOpenChange, onSubmit, initialData, isLoading }: PaymentGatewayDialogProps) {
    const form = useForm<GatewayFormValues>({
        resolver: zodResolver(gatewaySchema),
        defaultValues: { provider: 'stripe', merchantId: '', isLive: false, supportedCurrencies: '', branchId: '' },
    });

    React.useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset({
                    provider: initialData.provider,
                    merchantId: initialData.merchantId,
                    isLive: initialData.isLive,
                    supportedCurrencies: initialData.supportedCurrencies.join(', '),
                    branchId: initialData.branchId || '',
                });
            } else {
                form.reset({ provider: 'stripe', merchantId: '', isLive: false, supportedCurrencies: '', branchId: '' });
            }
        }
    }, [open, initialData, form]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">{initialData ? 'Edit Gateway' : 'Add Gateway'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="provider"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Provider</FormLabel>
                                    <FormControl>
                                        <select {...field} className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm">
                                            <option value="stripe">Stripe</option>
                                            <option value="paypal">PayPal</option>
                                            <option value="adyen">Adyen</option>
                                            <option value="worldpay">Worldpay</option>
                                            <option value="cybersource">Cybersource</option>
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="merchantId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Merchant ID</FormLabel>
                                    <FormControl><Input {...field} className="h-10" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="supportedCurrencies"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Supported Currencies (comma separated)</FormLabel>
                                    <FormControl><Input {...field} className="h-10" placeholder="USD, EUR, GBP" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="isLive"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Live Mode</FormLabel>
                                        <div className="text-sm text-gray-500">Enable real transactions</div>
                                    </div>
                                    <FormControl>
                                        <input
                                            type="checkbox"
                                            checked={field.value}
                                            onChange={field.onChange}
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={isLoading} className="bg-gray-900 hover:bg-primary">
                                {isLoading ? 'Saving...' : 'Save Gateway'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
