import React from 'react';
import { Booking } from '../../../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';
import { Clock, User } from 'lucide-react';

interface HistorySectionProps {
    booking: Booking;
}

export const HistorySection: React.FC<HistorySectionProps> = ({ booking }) => {
    const auditTrail = booking.auditTrail || [];

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-base font-medium">Activity History</CardTitle>
            </CardHeader>
            <CardContent>
                {auditTrail.length === 0 ? (
                    <div className="text-center py-8 text-[var(--color-text-tertiary)]">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No activity history available</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {auditTrail.map((log, index) => (
                            <div key={index} className="flex items-start gap-3 pb-4 border-b border-[var(--color-border-light)] last:border-b-0 last:pb-0">
                                <div className="flex-shrink-0 w-8 h-8 bg-[var(--color-bg-secondary)] rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                                            {log.actionType}
                                        </p>
                                        <span className="text-xs text-[var(--color-text-tertiary)]">
                                            {new Date(log.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                                        {log.resourceType} - {log.resourceId}
                                    </p>
                                    {log.details && Object.keys(log.details).length > 0 && (
                                        <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                                            Details: {JSON.stringify(log.details)}
                                        </p>
                                    )}
                                    <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                                        by {log.userName}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
