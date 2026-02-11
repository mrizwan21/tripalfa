import React from 'react';
import { Booking } from '../../../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';

interface CostingSectionProps {
    booking: Booking;
}

export const CostingSection: React.FC<CostingSectionProps> = ({ booking }) => {
    const pricing = booking.pricing;
    const total = pricing.sellingAmount;

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-base font-medium">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-[var(--color-text-secondary)]">Net Amount</span>
                        <span className="font-medium">{pricing.currency} {pricing.netAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[var(--color-text-secondary)]">Taxes</span>
                        <span className="font-medium">{pricing.currency} {pricing.taxes.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[var(--color-text-secondary)]">Fees</span>
                        <span className="font-medium">{pricing.currency} {pricing.fees.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[var(--color-text-secondary)]">Commission</span>
                        <span className="font-medium">{pricing.currency} {pricing.commission.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-[var(--color-border-light)] pt-3 mt-3">
                        <span className="font-bold text-[var(--color-text-primary)]">Total Amount</span>
                        <span className="font-bold text-[var(--color-primary)]">{pricing.currency} {total.toFixed(2)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
