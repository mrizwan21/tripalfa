import React from 'react';
import { Booking } from '../../../lib/srs-types';
import { FileText, Download } from 'lucide-react';
import { format } from 'date-fns';

interface InvoicesSectionProps {
    booking: Booking;
}

export const InvoicesSection: React.FC<InvoicesSectionProps> = ({ booking }) => {
    // Dummy invoice data
    const invoice = {
        id: 'INV-' + booking.id.substring(0, 6).toUpperCase(),
        date: booking.createdAt,
        amount: booking.total.amount,
        currency: booking.total.currency,
        status: 'Issued'
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-[var(--color-border-light)] rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center text-[var(--color-text-tertiary)]">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-semibold text-sm">{invoice.id}</div>
                        <div className="text-xs text-[var(--color-text-tertiary)]">
                            {invoice.date ? format(new Date(invoice.date), 'dd MMM yyyy') : '-'}
                        </div>
                    </div>
                </div>

                <button className="p-2 text-[var(--color-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-full transition-colors" title="Download Invoice">
                    <Download className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
