import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CreditCard, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
import { PaymentCard } from '../types';

const cardSchema = z.object({
    cardName: z.string().min(1, "Card nickname is required"), // e.g. "Personal Visa"
    type: z.enum(['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER']),
    nameOnCard: z.string().min(1, "Name on card is required"),
    cardNumberMasked: z.string().min(12, "Card number is required"), // treating as full number for input, masked storage
    expiry: z.string().regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, "Invalid expiry format (MM/YY)"),
});

interface CreditCardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: PaymentCard;
    onSave: (data: Partial<PaymentCard>) => void;
}

export function CreditCardDialog({ open, onOpenChange, initialData, onSave }: CreditCardDialogProps) {
    const form = useForm<z.infer<typeof cardSchema>>({
        resolver: zodResolver(cardSchema),
        defaultValues: {
            cardName: initialData?.cardName || '',
            type: initialData?.type || 'VISA',
            nameOnCard: initialData?.nameOnCard || '',
            cardNumberMasked: initialData?.cardNumberMasked || '',
            expiry: initialData?.expiry || '',
        },
    });

    React.useEffect(() => {
        if (open) {
            form.reset({
                cardName: initialData?.cardName || '',
                type: initialData?.type || 'VISA',
                nameOnCard: initialData?.nameOnCard || '',
                cardNumberMasked: initialData?.cardNumberMasked || '',
                expiry: initialData?.expiry || '',
            });
        }
    }, [open, initialData, form]);

    const onSubmit = (values: z.infer<typeof cardSchema>) => {
        // In a real app, we'd tokenize the card number here.
        // For now, we'll just mask it if it looks like a full number (approx)
        let masked = values.cardNumberMasked;
        if (masked.length > 4 && !masked.includes('*')) {
            masked = `**** **** **** ${masked.slice(-4)}`;
        }

        onSave({ ...values, cardNumberMasked: masked });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black flex items-center gap-2">
                        <CreditCard className="h-6 w-6 text-indigo-600" />
                        {initialData ? 'Edit Card' : 'Add Card'}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        <FormField control={form.control} name="cardName" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-gray-700">Card Nickname *</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="e.g. My Personal Visa" className="h-11 rounded-xl" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Card Type *</FormLabel>
                                    <FormControl>
                                        <select {...field} className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm">
                                            <option value="VISA">Visa</option>
                                            <option value="MASTERCARD">Mastercard</option>
                                            <option value="AMEX">Amex</option>
                                            <option value="DISCOVER">Discover</option>
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="expiry" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-gray-700">Expiry (MM/YY) *</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="12/26" className="h-11 rounded-xl" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="cardNumberMasked" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-gray-700">Card Number *</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="0000 0000 0000 0000" className="h-11 rounded-xl font-mono" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="nameOnCard" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-gray-700">Name on Card *</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="JOHN DOE" className="h-11 rounded-xl" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">Cancel</Button>
                            <Button type="submit" className="bg-gray-900 hover:bg-primary rounded-xl font-bold">
                                {initialData ? 'Update Card' : 'Add Card'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
