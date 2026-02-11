import React, { useEffect, useState } from 'react';
import { Booking } from '../../../../types';
import { Calendar, CheckCircle2, Wallet, User as UserIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { walletApi } from '../../../../lib/api';


interface PaymentsSectionProps {
    booking: Booking;
}

export const PaymentsSection: React.FC<PaymentsSectionProps> = ({ booking }) => {
    const [wallet, setWallet] = useState<{ currency: string, amount: number } | null>(null);

    useEffect(() => {
        // Fetch wallet balance
        walletApi.getWalletBalance(booking.userId || 'current').then(setWallet);
    }, [booking.userId]);

    // Use actual payment info from booking
    const payment = {
        method: booking.paymentInfo.method,
        amount: booking.pricing.sellingAmount,
        currency: booking.pricing.currency,
        date: booking.paymentInfo.paymentDate || booking.createdAt,
        status: booking.paymentInfo.status,
        transactionId: booking.paymentInfo.transactionId || 'N/A'
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">Wallet Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            <Wallet className="w-6 h-6 text-[var(--color-primary)]" />
                            {wallet ? `${wallet.currency} ${wallet.amount.toLocaleString()}` : '...'}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">Payment Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <StatusBadge status={payment.status} type={payment.status === 'completed' ? 'success' : 'warning'} />
                    </CardContent>
                </Card>
            </div>

            <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-medium">Transaction Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-[var(--color-bg-secondary)] rounded-lg">
                            <div className="p-2 bg-white rounded-md shadow-sm">
                                <Wallet className="h-5 w-5 text-[var(--color-primary)]" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Paid via Wallet</p>
                                <p className="text-xs text-[var(--color-text-tertiary)]">Deducted from user balance</p>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-[var(--color-text-tertiary)] flex items-center gap-2">
                                    <Calendar className="w-3 h-3" /> Date
                                </span>
                                <span className="font-medium text-[var(--color-text-secondary)]">{new Date(payment.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[var(--color-text-tertiary)] flex items-center gap-2">
                                    <CheckCircle2 className="w-3 h-3" /> Transaction ID
                                </span>
                                <span className="font-medium text-[var(--color-text-secondary)] font-mono text-xs">{payment.transactionId}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
