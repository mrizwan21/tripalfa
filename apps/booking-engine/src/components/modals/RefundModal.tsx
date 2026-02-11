import React, { useState } from 'react';
import { RefreshCw, Wallet } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Modal } from '../ui/Modal';

interface RefundModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    bookingId: string;
    currency: string;
    maxAuthAmount: number;
}

export const RefundModal: React.FC<RefundModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    bookingId,
    currency,
    maxAuthAmount
}) => {
    const [amount, setAmount] = useState<string>('');
    const [reason, setReason] = useState('cancellation');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            amount: parseFloat(amount),
            currency,
            reason,
            notes,
            type: 'wallet_refund' // Specific type for wallet refund
        });
        onClose();
    };

    const title = (
        <div className="flex items-center gap-2 text-red-700">
            <Wallet className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Refund to Wallet</h3>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            headerClassName="bg-red-50"
            closeButtonClassName="text-red-700 hover:text-red-900 bg-red-100 hover:bg-red-200"
        >
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div className="bg-red-50 p-3 rounded-lg text-sm text-red-700 flex gap-2 items-start">
                    <RefreshCw className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>
                        Refunds are credited directly to the customer's wallet. Max refundable: <strong>{currency} {maxAuthAmount.toFixed(2)}</strong>
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Refund Amount ({currency})</label>
                    <input
                        type="number"
                        step="0.01"
                        max={maxAuthAmount}
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-[var(--color-border-light)] focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="0.00"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Reason</label>
                    <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-[var(--color-border-light)] focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    >
                        <option value="cancellation">Booking Cancellation</option>
                        <option value="amendment">Booking Amendment</option>
                        <option value="duplicate">Duplicate Charge</option>
                        <option value="waiver">Service Waiver</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Internal Notes</label>
                    <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-[var(--color-border-light)] focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Optional notes for audit logs..."
                    />
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all shadow-sm active:scale-[0.98]"
                    >
                        Credit Wallet
                    </button>
                </div>
            </form>
        </Modal>
    );
};
