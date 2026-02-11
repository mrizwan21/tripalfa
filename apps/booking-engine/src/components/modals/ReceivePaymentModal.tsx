import React, { useState } from 'react';
import { CreditCard, Wallet, Building2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button'; // Assuming Button component exists or using HTML button
import { Modal } from '../ui/Modal';

interface ReceivePaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    bookingId: string;
    currency: string;
    outstandingAmount: number; // Kept for interface compatibility, but UI focuses on Wallet
}

export const ReceivePaymentModal: React.FC<ReceivePaymentModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    bookingId,
    currency,
    outstandingAmount
}) => {
    // Default to outstanding amount, but allowing top-up of any amount
    const [amount, setAmount] = useState<string>(outstandingAmount > 0 ? outstandingAmount.toString() : '0');
    const [method, setMethod] = useState<'card' | 'cash' | 'transfer'>('card');
    const [reference, setReference] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            amount: parseFloat(amount),
            currency,
            method,
            reference,
            date,
            type: 'wallet_credit', // Changed from 'payment'
            description: `Wallet Top-up via ${method}`
        });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Top Up Wallet"
        >
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700 mb-4">
                    All payments are processed as wallet top-ups. Funds will be added to the customer's wallet and can be used for this or future bookings.
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Top-up Method</label>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            className={cn(
                                "flex flex-col items-center justify-center p-3 rounded-lg border text-sm transition-all",
                                method === 'card'
                                    ? "border-[var(--color-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]"
                                    : "border-[var(--color-border-light)] hover:bg-gray-50 text-[var(--color-text-secondary)]"
                            )}
                            onClick={() => setMethod('card')}
                        >
                            <CreditCard className="w-5 h-5 mb-1" />
                            Card
                        </button>
                        <button
                            type="button"
                            className={cn(
                                "flex flex-col items-center justify-center p-3 rounded-lg border text-sm transition-all",
                                method === 'transfer'
                                    ? "border-[var(--color-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]"
                                    : "border-[var(--color-border-light)] hover:bg-gray-50 text-[var(--color-text-secondary)]"
                            )}
                            onClick={() => setMethod('transfer')}
                        >
                            <Building2 className="w-5 h-5 mb-1" />
                            Transfer
                        </button>
                        <button
                            type="button"
                            className={cn(
                                "flex flex-col items-center justify-center p-3 rounded-lg border text-sm transition-all",
                                method === 'cash'
                                    ? "border-[var(--color-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]"
                                    : "border-[var(--color-border-light)] hover:bg-gray-50 text-[var(--color-text-secondary)]"
                            )}
                            onClick={() => setMethod('cash')}
                        >
                            <Wallet className="w-5 h-5 mb-1" />
                            Cash
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Top-up Amount ({currency})</label>
                    <input
                        type="number"
                        step="0.01"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-[var(--color-border-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Reference / Transaction ID</label>
                    <input
                        type="text"
                        placeholder="e.g. TXN-12345"
                        required
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-[var(--color-border-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Date</label>
                    <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-[var(--color-border-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        className="w-full py-2.5 px-4 bg-[var(--color-primary)] hover:brightness-90 text-white font-medium rounded-lg transition-all shadow-sm active:scale-[0.98]"
                    >
                        Confirm Top-up
                    </button>
                </div>
            </form>
        </Modal>
    );
};
