import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { VirtualCreditCard } from '../types';

const cardSchema = z.object({
    cardholderName: z.string().min(2, "Cardholder name required"),
    creditLimit: z.number().min(10, "Minimum limit is 10"),
    currency: z.string().min(3, "Currency required"),
    branchId: z.string().optional(),
    validUntil: z.string().optional(), // Date string YYYY-MM-DD
});

type CardFormValues = z.infer<typeof cardSchema>;

interface VirtualCardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: CardFormValues) => void;
    initialData?: VirtualCreditCard | null;
    isLoading?: boolean;
}

export function VirtualCardDialog({ open, onOpenChange, onSubmit, initialData, isLoading }: VirtualCardDialogProps) {
    const form = useForm<CardFormValues>({
        resolver: zodResolver(cardSchema),
        defaultValues: { cardholderName: '', creditLimit: 1000, currency: 'USD', branchId: '' },
    });

    React.useEffect(() => {
        if (open) {
            // Virtual cards are usually not editable in the same way, but let's support it for now
            if (initialData) {
                form.reset({
                    cardholderName: initialData.cardholderName,
                    creditLimit: initialData.creditLimit,
                    currency: initialData.currency,
                    branchId: initialData.branchId || '',
                });
            } else {
                form.reset({ cardholderName: '', creditLimit: 1000, currency: 'USD', branchId: '' });
            }
        }
    }, [open, initialData, form]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">{initialData ? 'Edit Virtual Card' : 'Request Virtual Card'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="cardholderName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Cardholder Name</FormLabel>
                                    <FormControl><Input {...field} className="h-10" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="creditLimit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-gray-700">Limit</FormLabel>
                                        <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} className="h-10" /></FormControl>
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
                            name="validUntil"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Valid Until (Optional)</FormLabel>
                                    <FormControl><Input type="date" {...field} className="h-10" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={isLoading} className="bg-gray-900 hover:bg-primary">
                                {isLoading ? 'Processing...' : 'Request Card'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
