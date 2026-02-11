import React from 'react';
import { Booking } from '../../../../types';
import { FileText, Download, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';

interface InvoicesSectionProps {
    booking: Booking;
}

export const InvoicesSection: React.FC<InvoicesSectionProps> = ({ booking }) => {
    // Dummy Data
    const invoice = {
        id: 'INV-' + booking.id.substring(0, 6).toUpperCase(),
        date: booking.createdAt,
        amount: booking.pricing.sellingAmount,
        currency: booking.pricing.currency,
        status: 'Issued'
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-base font-medium">Invoices</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between p-3 border border-[var(--color-border-light)] rounded-lg hover:border-[var(--color-primary)] transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--color-bg-secondary)] rounded-md group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">{invoice.id}</p>
                            <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(invoice.date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    <button className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                        <Download className="h-4 w-4" />
                    </button>
                </div>
            </CardContent>
        </Card>
    );
};
