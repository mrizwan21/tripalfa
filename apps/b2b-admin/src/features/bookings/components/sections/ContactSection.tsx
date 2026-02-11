import React from 'react';
import { Booking } from '../../../../types';
import { User, Mail, Phone, Building2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';

interface ContactSectionProps {
    booking: Booking;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ booking }) => {
    const customer = booking.customerInfo;
    const agent = booking.assignedAgent || booking.createdByUser;

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-base font-medium">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h4 className="text-xs font-semibold uppercase text-[var(--color-text-tertiary)] tracking-wider mb-3">
                        {customer.type === 'corporate' ? 'Company' : 'Customer'}
                    </h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-3">
                            <User className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                            <span className="text-[var(--color-text-secondary)]">{customer.name}</span>
                        </div>
                        {customer.companyName && (
                            <div className="flex items-center gap-3">
                                <Building2 className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                                <span className="text-[var(--color-text-secondary)]">{customer.companyName}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                            <span className="text-[var(--color-text-secondary)] truncate">{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                            <span className="text-[var(--color-text-secondary)]">{customer.phone}</span>
                        </div>
                    </div>
                </div>

                {agent && (
                    <div className="border-t border-[var(--color-border-light)] pt-4">
                        <h4 className="text-xs font-semibold uppercase text-[var(--color-text-tertiary)] tracking-wider mb-3">
                            {booking.assignedAgent ? 'Assigned Agent' : 'Created By'}
                        </h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-3">
                                <User className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                                <span className="text-[var(--color-text-secondary)]">{agent.name}</span>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
