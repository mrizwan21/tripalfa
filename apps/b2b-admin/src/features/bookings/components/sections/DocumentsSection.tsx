import React, { useState } from 'react';
import { FileText, Download, Printer, Mail, Ticket, AlertCircle, FileCheck, CreditCard, CheckCircle2 } from 'lucide-react';
import { Booking } from '../../../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';
import { StatusBadge } from '../../../../components/ui/StatusBadge';

interface DocumentsSectionProps {
    booking: Booking;
}

export const DocumentsSection: React.FC<DocumentsSectionProps> = ({ booking }) => {
    const isIssued = booking.status === 'CONFIRMED' || booking.status === 'REFUNDED';

    const documents = [
        {
            id: 'itinerary',
            name: 'Flight Itinerary',
            type: 'PDF',
            date: booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : '-',
            icon: <FileText className="w-5 h-5 text-blue-600" />,
            available: true
        },
        {
            id: 'invoice',
            name: 'Commercial Invoice',
            type: 'PDF',
            date: booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : '-',
            icon: <CreditCard className="w-5 h-5 text-green-600" />,
            available: true
        },
        {
            id: 'ticket',
            name: booking.type === 'hotel' ? 'Hotel Voucher' : 'E-Ticket',
            type: 'PDF',
            date: isIssued ? new Date().toLocaleDateString() : '-',
            icon: <Ticket className="w-5 h-5 text-purple-600" />,
            available: isIssued
        },
        {
            id: 'receipt',
            name: 'Payment Receipt',
            type: 'PDF',
            date: isIssued ? new Date().toLocaleDateString() : '-',
            icon: <FileCheck className="w-5 h-5 text-teal-600" />,
            available: isIssued
        },
        {
            id: 'credit-note',
            name: 'Credit Note',
            type: 'PDF',
            date: booking.status === 'REFUNDED' ? new Date().toLocaleDateString() : '-',
            icon: <FileText className="w-5 h-5 text-red-600" />,
            available: booking.status === 'REFUNDED'
        }
    ];

    return (
        <div className="space-y-4">
            {/* Status Banner */}
            <div className={`flex items-center gap-3 p-4 rounded-lg border ${isIssued
                ? 'bg-green-50 text-green-800 border-green-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                {isIssued ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <div className="text-sm">
                    <span className="font-semibold">{isIssued ? 'Ticket Issued' : 'Pending Issuance'}</span>
                    <span className="ml-2 opacity-70">
                        {isIssued
                            ? 'All documents are available for download.'
                            : 'Only Itinerary and Invoice are available until ticket is issued.'}
                    </span>
                </div>
            </div>

            {/* Document Grid */}
            <div className="space-y-2">
                {documents.map((doc) => (
                    <div
                        key={doc.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${doc.available
                            ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer'
                            : 'border-dashed border-gray-200 opacity-40'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                                {doc.icon}
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-900">{doc.name}</h4>
                                <p className="text-xs text-gray-500">
                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-medium mr-2">{doc.type}</span>
                                    {doc.available ? doc.date : 'Pending'}
                                </p>
                            </div>
                        </div>

                        {doc.available && (
                            <div className="flex items-center gap-1">
                                <button className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors">
                                    <Printer className="w-4 h-4" />
                                </button>
                                <button className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors">
                                    <Mail className="w-4 h-4" />
                                </button>
                                <button className="px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-50 flex items-center gap-1.5 transition-colors">
                                    <Download className="w-3.5 h-3.5" />
                                    Download
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
