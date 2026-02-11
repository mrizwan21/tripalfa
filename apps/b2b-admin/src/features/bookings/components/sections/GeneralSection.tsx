import React from 'react';
import { Booking } from '../../../../types';
import { Plane, Building2, Calendar, MapPin, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';
import { StatusBadge } from '../../../../components/ui/StatusBadge';

interface GeneralSectionProps {
    booking: Booking;
}

export const GeneralSection: React.FC<GeneralSectionProps> = ({ booking }) => {
    const isFlight = booking.type === 'flight';
    const isHotel = booking.type === 'hotel';

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                    {isFlight ? 'Flight Overview' : isHotel ? 'Hotel Overview' : 'General Info'}
                </CardTitle>
                <StatusBadge status={booking.status} type={booking.status === 'CONFIRMED' ? 'success' : 'warning'} />
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 mt-2">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-[var(--color-bg-secondary)] rounded-lg">
                            {isFlight ? <Plane className="h-5 w-5 text-[var(--color-primary)]" /> : <Building2 className="h-5 w-5 text-[var(--color-primary)]" />}
                        </div>
                        <div>
                            <p className="text-sm font-medium leading-none">
                                {booking.reference}
                            </p>
                            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                                {booking.type.charAt(0).toUpperCase() + booking.type.slice(1)} Booking
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-[var(--color-text-tertiary)]">Booking Date</span>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-[var(--color-text-tertiary)]" />
                                <span>{new Date(booking.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-[var(--color-text-tertiary)]">Travel Date</span>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-[var(--color-text-tertiary)]" />
                                <span>{new Date(booking.timeline.travelDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {booking.timeline.returnDate && (
                        <div className="flex flex-col gap-1 text-sm">
                            <span className="text-xs text-[var(--color-text-tertiary)]">Return Date</span>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-[var(--color-text-tertiary)]" />
                                <span>{new Date(booking.timeline.returnDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
