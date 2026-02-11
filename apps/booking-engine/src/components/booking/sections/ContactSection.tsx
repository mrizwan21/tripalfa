import React from 'react';
import { Booking } from '../../../lib/srs-types';
import { User, Mail, Phone, Building2 } from 'lucide-react';

interface ContactSectionProps {
    booking: Booking;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ booking }) => {
    // Using dummy data if unavailable in props, as Booking interface is minimal
    const contact = {
        name: 'Mohamed Jubran',
        email: 'mohamed@example.com',
        phone: '+971 50 123 4567'
    };

    const agent = {
        name: 'Mansi Sachdeva',
        agency: 'QuadTravels-Noida',
        email: 'mansi@quadtravels.com',
        phone: '+91 97112 73450'
    };

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Customer Details</h4>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                        <span className="text-[var(--color-text-secondary)]">{contact.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                        <span className="text-[var(--color-text-secondary)]">{contact.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                        <span className="text-[var(--color-text-secondary)]">{contact.phone}</span>
                    </div>
                </div>
            </div>

            <div className="border-t border-[var(--color-border-light)] pt-4 space-y-3">
                <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Booking Agent</h4>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3">
                        <Building2 className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                        <span className="text-[var(--color-text-secondary)]">{agent.agency}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                        <span className="text-[var(--color-text-secondary)]">{agent.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                        <span className="text-[var(--color-text-secondary)]">{agent.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                        <span className="text-[var(--color-text-secondary)]">{agent.phone}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
