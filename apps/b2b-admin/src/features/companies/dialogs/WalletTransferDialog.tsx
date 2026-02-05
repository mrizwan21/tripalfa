import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeftRight } from 'lucide-react';
import { WalletAccount } from '../types';

interface TransferFormValues {
    fromAccountId: string;
    toAccountId: string;
    amount: string;
    note: string;
}

interface WalletTransferDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: TransferFormValues) => void;
    accounts?: WalletAccount[];
    isLoading?: boolean;
}

export function WalletTransferDialog({ open, onOpenChange, onSubmit, accounts = [], isLoading }: WalletTransferDialogProps) {
    const [form, setForm] = React.useState<TransferFormValues>({
        fromAccountId: '',
        toAccountId: '',
        amount: '',
        note: '',
    });

    React.useEffect(() => {
        if (open) {
            setForm({ fromAccountId: '', toAccountId: '', amount: '', note: '' });
        }
    }, [open]);

    const handleSubmit = () => {
        onSubmit(form);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <ArrowLeftRight className="h-5 w-5" />
                        Internal Transfer
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <label className="text-sm font-bold text-gray-700 mb-2 block">From Account</label>
                        <select
                            value={form.fromAccountId}
                            onChange={(e) => setForm(prev => ({ ...prev, fromAccountId: e.target.value }))}
                            className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" > <option value="">Select source account</option>
                            {accounts?.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name} (${acc.balance.toLocaleString()})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 mb-2 block">To Account</label>
                        <select
                            value={form.toAccountId}
                            onChange={(e) => setForm(prev => ({ ...prev, toAccountId: e.target.value }))}
                            className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                        >
                            <option value="">Select destination account</option>
                            {accounts?.filter(a => a.id !== form.fromAccountId).map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 mb-2 block">Amount (USD)</label>
                        <Input
                            type="number"
                            value={form.amount}
                            onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                            placeholder="0.00"
                            className="h-11"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 mb-2 block">Note (Optional)</label>
                        <Input
                            value={form.note}
                            onChange={(e) => setForm(prev => ({ ...prev, note: e.target.value }))}
                            placeholder="Transfer reason"
                            className="h-11"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isLoading} className="bg-gray-900 hover:bg-primary">
                        {isLoading ? 'Processing...' : 'Transfer'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
