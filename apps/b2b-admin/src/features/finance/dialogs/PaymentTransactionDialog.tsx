import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import {
    ArrowUpRight,
    ArrowDownRight,
    RefreshCcw,
    FileEdit,
    CreditCard,
    Building2,
    Wallet,
    Banknote,
    Upload,
    Loader2,
    CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { LedgerAccount } from '@/services/walletService';

// Transaction types
const TRANSACTION_TYPES = [
    { value: 'TOPUP', label: 'Top-up / Deposit', icon: ArrowUpRight, color: 'emerald', description: 'Add funds to wallet' },
    { value: 'REFUND', label: 'Refund', icon: ArrowDownRight, color: 'blue', description: 'Return funds to customer' },
    { value: 'REISSUE', label: 'Reissue', icon: RefreshCcw, color: 'purple', description: 'Re-issue with payment' },
    { value: 'AMENDMENT', label: 'Amendment', icon: FileEdit, color: 'orange', description: 'Modify booking payment' },
] as const;

// Payment methods
const PAYMENT_METHODS = [
    { value: 'CARD', label: 'Credit/Debit Card', icon: CreditCard, description: 'Visa, Mastercard, Amex' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: Building2, description: 'Bank-to-bank transfer' },
    { value: 'STRIPE', label: 'Stripe', icon: Wallet, description: 'Stripe checkout' },
    { value: 'PAYPAL', label: 'PayPal', icon: Wallet, description: 'PayPal payment' },
    { value: 'OFFLINE', label: 'Offline / Cash', icon: Banknote, description: 'Cash or manual entry' },
] as const;

// Form schema
const paymentFormSchema = z.object({
    transactionType: z.enum(['TOPUP', 'REFUND', 'REISSUE', 'AMENDMENT']),
    paymentMethod: z.enum(['CARD', 'BANK_TRANSFER', 'STRIPE', 'PAYPAL', 'OFFLINE']),
    amount: z.string().min(1, 'Amount is required'),
    currency: z.string().min(1, 'Currency is required'),
    accountId: z.string().min(1, 'Account is required'),
    reference: z.string().optional(),
    paymentReference: z.string().optional(),
    adminNotes: z.string().optional(),
    cardLast4: z.string().optional(),
    bankName: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentTransactionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    wallets: LedgerAccount[];
    preselectedAccountId?: string;
}

export function PaymentTransactionDialog({
    open,
    onOpenChange,
    wallets,
    preselectedAccountId
}: PaymentTransactionDialogProps) {
    const queryClient = useQueryClient();
    const [step, setStep] = React.useState(1);

    const form = useForm<PaymentFormValues>({
        resolver: zodResolver(paymentFormSchema),
        defaultValues: {
            transactionType: 'TOPUP',
            paymentMethod: 'CARD',
            amount: '',
            currency: 'USD',
            accountId: preselectedAccountId || '',
            reference: '',
            paymentReference: '',
            adminNotes: '',
            cardLast4: '',
            bankName: '',
        },
    });

    React.useEffect(() => {
        if (open) {
            setStep(1);
            form.reset({
                transactionType: 'TOPUP',
                paymentMethod: 'CARD',
                amount: '',
                currency: 'USD',
                accountId: preselectedAccountId || '',
                reference: '',
                paymentReference: '',
                adminNotes: '',
            });
        }
    }, [open, preselectedAccountId, form]);

    const transactionType = form.watch('transactionType');
    const paymentMethod = form.watch('paymentMethod');
    const selectedAccount = wallets.find(w => w.id === form.watch('accountId'));

    // Submit mutation
    const submitMutation = useMutation({
        mutationFn: async (values: PaymentFormValues) => {
            // Determine if this is a deposit (TOPUP) or other transaction
            const isDeposit = values.transactionType === 'TOPUP';
            const endpoint = isDeposit
                ? 'http://localhost:3007/api/v1/ledger/deposit'
                : 'http://localhost:3007/api/v1/ledger/payment';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountId: values.accountId,
                    amount: parseFloat(values.amount),
                    description: `${values.transactionType} via ${values.paymentMethod}`,
                    reference: values.reference || values.paymentReference,
                    metadata: {
                        transactionType: values.transactionType,
                        paymentMethod: values.paymentMethod,
                        paymentReference: values.paymentReference,
                        adminNotes: values.adminNotes,
                        cardLast4: values.cardLast4,
                        bankName: values.bankName,
                    }
                })
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ledger-wallets'] });
            toast.success('Payment transaction logged successfully!');
            onOpenChange(false);
        },
        onError: (err: Error) => {
            toast.error(err.message);
        }
    });

    const handleSubmit = (values: PaymentFormValues) => {
        submitMutation.mutate(values);
    };

    const nextStep = () => setStep(s => Math.min(s + 1, 3));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const getStepTitle = () => {
        switch (step) {
            case 1: return 'Transaction Details';
            case 2: return 'Payment Method';
            case 3: return 'Confirm & Submit';
            default: return '';
        }
    };

    const selectedTransactionType = TRANSACTION_TYPES.find(t => t.value === transactionType);
    const selectedPaymentMethod = PAYMENT_METHODS.find(m => m.value === paymentMethod);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg rounded-3xl overflow-hidden p-0 border-none shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                                <Wallet className="h-5 w-5" />
                            </div>
                            Log Payment Transaction
                        </DialogTitle>
                        <p className="text-gray-400 text-sm mt-1">{getStepTitle()} • Step {step} of 3</p>
                    </DialogHeader>
                    {/* Progress bar */}
                    <div className="flex gap-2 mt-4">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-emerald-500' : 'bg-white/20'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)}>
                        <div className="p-6 bg-white space-y-4">
                            {/* Step 1: Transaction Details */}
                            {step === 1 && (
                                <>
                                    {/* Transaction Type Selection */}
                                    <FormField
                                        control={form.control}
                                        name="transactionType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-gray-500 uppercase">Transaction Type</FormLabel>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {TRANSACTION_TYPES.map((type) => {
                                                        const Icon = type.icon;
                                                        const isSelected = field.value === type.value;
                                                        return (
                                                            <button
                                                                key={type.value}
                                                                type="button"
                                                                onClick={() => field.onChange(type.value)}
                                                                className={`p-4 rounded-xl border-2 text-left transition-all ${isSelected
                                                                        ? `border-${type.color}-500 bg-${type.color}-50`
                                                                        : 'border-gray-200 hover:border-gray-300'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <Icon className={`h-5 w-5 ${isSelected ? `text-${type.color}-600` : 'text-gray-400'}`} />
                                                                    <span className="font-bold text-sm">{type.label}</span>
                                                                </div>
                                                                <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Account Selection */}
                                    <FormField
                                        control={form.control}
                                        name="accountId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-gray-500 uppercase">Wallet Account</FormLabel>
                                                <FormControl>
                                                    <select
                                                        {...field}
                                                        className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold"
                                                    >
                                                        <option value="">Select account...</option>
                                                        {wallets.map((w) => (
                                                            <option key={w.id} value={w.id}>
                                                                {w.name} ({w.currency} {parseFloat(w.balance).toLocaleString()})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Amount & Currency */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="amount"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold text-gray-500 uppercase">Amount</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="0.00"
                                                            className="h-11 rounded-xl border-gray-200 font-bold text-lg"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="currency"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold text-gray-500 uppercase">Currency</FormLabel>
                                                    <FormControl>
                                                        <select
                                                            {...field}
                                                            className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold"
                                                        >
                                                            <option value="USD">USD</option>
                                                            <option value="EUR">EUR</option>
                                                            <option value="GBP">GBP</option>
                                                            <option value="AED">AED</option>
                                                            <option value="SAR">SAR</option>
                                                        </select>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Reference (for refund/reissue/amendment) */}
                                    {transactionType !== 'TOPUP' && (
                                        <FormField
                                            control={form.control}
                                            name="reference"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold text-gray-500 uppercase">Booking Reference</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            placeholder="e.g. BK-2024-001234"
                                                            className="h-11 rounded-xl border-gray-200"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </>
                            )}

                            {/* Step 2: Payment Method */}
                            {step === 2 && (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="paymentMethod"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-gray-500 uppercase">Payment Method</FormLabel>
                                                <div className="space-y-3">
                                                    {PAYMENT_METHODS.map((method) => {
                                                        const Icon = method.icon;
                                                        const isSelected = field.value === method.value;
                                                        return (
                                                            <button
                                                                key={method.value}
                                                                type="button"
                                                                onClick={() => field.onChange(method.value)}
                                                                className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${isSelected
                                                                        ? 'border-emerald-500 bg-emerald-50'
                                                                        : 'border-gray-200 hover:border-gray-300'
                                                                    }`}
                                                            >
                                                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${isSelected ? 'bg-emerald-100' : 'bg-gray-100'
                                                                    }`}>
                                                                    <Icon className={`h-5 w-5 ${isSelected ? 'text-emerald-600' : 'text-gray-400'}`} />
                                                                </div>
                                                                <div>
                                                                    <span className="font-bold text-sm">{method.label}</span>
                                                                    <p className="text-xs text-gray-500">{method.description}</p>
                                                                </div>
                                                                {isSelected && (
                                                                    <CheckCircle2 className="h-5 w-5 text-emerald-600 ml-auto" />
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Method-specific fields */}
                                    {paymentMethod === 'CARD' && (
                                        <FormField
                                            control={form.control}
                                            name="cardLast4"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold text-gray-500 uppercase">Card Last 4 Digits</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} maxLength={4} placeholder="1234" className="h-11 rounded-xl border-gray-200" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    {paymentMethod === 'BANK_TRANSFER' && (
                                        <>
                                            <FormField
                                                control={form.control}
                                                name="bankName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold text-gray-500 uppercase">Bank Name</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} placeholder="e.g. Emirates NBD" className="h-11 rounded-xl border-gray-200" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="paymentReference"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold text-gray-500 uppercase">Transfer Reference</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} placeholder="Bank transfer reference number" className="h-11 rounded-xl border-gray-200" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </>
                                    )}

                                    {(paymentMethod === 'STRIPE' || paymentMethod === 'PAYPAL') && (
                                        <FormField
                                            control={form.control}
                                            name="paymentReference"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold text-gray-500 uppercase">Transaction ID</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder={`${paymentMethod} transaction ID`} className="h-11 rounded-xl border-gray-200" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    {paymentMethod === 'OFFLINE' && (
                                        <FormField
                                            control={form.control}
                                            name="adminNotes"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold text-gray-500 uppercase">Admin Notes</FormLabel>
                                                    <FormControl>
                                                        <textarea
                                                            {...field}
                                                            className="w-full h-24 rounded-xl border border-gray-200 p-3 text-sm resize-none"
                                                            placeholder="Describe the offline payment (cash collected by, bank transfer details, etc.)"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </>
                            )}

                            {/* Step 3: Confirmation */}
                            {step === 3 && (
                                <div className="space-y-4">
                                    <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                                        <h3 className="font-bold text-gray-900">Transaction Summary</h3>

                                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                            <span className="text-gray-500">Type</span>
                                            <Badge className={`bg-${selectedTransactionType?.color}-100 text-${selectedTransactionType?.color}-700`}>
                                                {selectedTransactionType?.label}
                                            </Badge>
                                        </div>

                                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                            <span className="text-gray-500">Account</span>
                                            <span className="font-bold">{selectedAccount?.name}</span>
                                        </div>

                                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                            <span className="text-gray-500">Amount</span>
                                            <span className="font-black text-xl text-gray-900">
                                                {form.watch('currency')} {parseFloat(form.watch('amount') || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-gray-500">Payment Method</span>
                                            <div className="flex items-center gap-2">
                                                {selectedPaymentMethod && <selectedPaymentMethod.icon className="h-4 w-4" />}
                                                <span className="font-bold">{selectedPaymentMethod?.label}</span>
                                            </div>
                                        </div>

                                        {form.watch('reference') && (
                                            <div className="flex justify-between items-center py-2 border-t border-gray-200">
                                                <span className="text-gray-500">Reference</span>
                                                <span className="font-mono text-sm">{form.watch('reference')}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                                        <strong>Note:</strong> This transaction will be logged for audit purposes. Please verify all details before confirming.
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <DialogFooter className="p-6 bg-gray-50 gap-3">
                            {step > 1 && (
                                <Button type="button" variant="ghost" onClick={prevStep} className="rounded-xl">
                                    Back
                                </Button>
                            )}
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
                                Cancel
                            </Button>
                            {step < 3 ? (
                                <Button
                                    type="button"
                                    onClick={nextStep}
                                    disabled={
                                        (step === 1 && (!form.watch('accountId') || !form.watch('amount')))
                                    }
                                    className="rounded-xl font-bold bg-gray-900 hover:bg-primary" > Continue </Button> ) : ( <Button type="submit"
                                    disabled={submitMutation.isPending}
                                    className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700"
                                >
                                    {submitMutation.isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Processing...
                                        </>
                                    ) : (
                                        'Confirm Transaction'
                                    )}
                                </Button>
                            )}
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
