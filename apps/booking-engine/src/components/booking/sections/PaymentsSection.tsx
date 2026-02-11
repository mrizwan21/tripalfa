import React, { useEffect, useState } from 'react';
import { Booking } from '../../../lib/srs-types';
import { StatusBadge } from '../../ui/StatusBadge';
import { CreditCard, Calendar, Wallet, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { getWalletBalance } from '../../../lib/api';
import { ReceivePaymentModal } from '../../modals/ReceivePaymentModal'; // Now acts as TopUpModal
import { Button } from '../../ui/Button'; // Assuming Button component exists

interface PaymentsSectionProps {
    booking: Booking;
}

export const PaymentsSection: React.FC<PaymentsSectionProps> = ({ booking }) => {
    const [wallet, setWallet] = useState<{ currency: string, amount: number } | null>(null);
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);

    useEffect(() => {
        // Fetch wallet balance
        getWalletBalance(booking.userId || 'current').then(setWallet);
    }, [booking.userId]);

    const handleTopUp = (data: any) => {
        console.log('Top up data:', data);
        // Optimistic update
        if (wallet) {
            setWallet({ ...wallet, amount: wallet.amount + data.amount });
        }
        // In real app, re-fetch balance or handle success via API response
    };

    // Dummy payment data (transaction)
    const payment = {
        method: 'Wallet', // Changed to Wallet
        amount: booking.total.amount,
        currency: booking.total.currency,
        date: booking.createdAt,
        status: booking.paymentStatus || 'Paid',
        transactionId: 'TXN_' + booking.id.substring(0, 8).toUpperCase()
    };

    const isPaid = payment.status.toLowerCase() === 'paid' || payment.status.toLowerCase() === 'completed';

    return (
        <div className="space-y-6">
            {/* Wallet Balance Card */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                    <Wallet className="w-48 h-48" />
                </div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-blue-100 text-sm font-medium mb-1">Total Balance</p>
                            <h2 className="text-3xl font-bold tracking-tight">
                                {wallet ? `${wallet.currency} ${wallet.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '...'}
                            </h2>
                        </div>
                        <button
                            onClick={() => setIsTopUpOpen(true)}
                            className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/30 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Top Up
                        </button>
                    </div>
                </div>
            </div>

            {/* Transaction/Payment Info */}
            <div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Payment Information</h3>
                <div className="border border-[var(--color-border-light)] rounded-lg p-3 bg-[var(--color-bg-secondary)]">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-[var(--color-primary)]/10 rounded-full">
                                <Wallet className="w-4 h-4 text-[var(--color-primary)]" />
                            </div>
                            <span className="font-semibold text-sm">Paid via Wallet</span>
                        </div>
                        <StatusBadge status={payment.status} type={isPaid ? 'success' : 'warning'} />
                    </div>

                    <div className="space-y-2 text-xs text-[var(--color-text-tertiary)]">
                        <div className="flex justify-between">
                            <span>Transaction ID</span>
                            <span className="font-mono text-[var(--color-text-secondary)]">{payment.transactionId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Date</span>
                            <span className="text-[var(--color-text-secondary)]">
                                {payment.date ? format(new Date(payment.date), 'dd MMM yyyy, HH:mm') : '-'}
                            </span>
                        </div>
                    </div>

                    <div className="border-t border-[var(--color-border-light)] mt-3 pt-2 flex justify-between items-center">
                        <span className="text-xs font-medium text-[var(--color-text-tertiary)]">Amount Deducted</span>
                        <span className="font-bold text-sm text-[var(--color-text-primary)]">
                            {payment.currency} {payment.amount.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            <ReceivePaymentModal
                isOpen={isTopUpOpen}
                onClose={() => setIsTopUpOpen(false)}
                onSubmit={handleTopUp}
                bookingId={booking.id}
                currency={wallet?.currency || booking.total.currency}
                outstandingAmount={0} // Not relevant for top-up
            />
        </div>
    );
};
