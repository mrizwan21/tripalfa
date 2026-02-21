import React from 'react';
import { Booking, Flight, Hotel } from '../../../lib/srs-types';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { StatusBadge } from '../../ui/StatusBadge';
import { MapPin, Calendar, Users, Plane, Bed } from 'lucide-react';
import { format } from 'date-fns';

interface GeneralSectionProps {
    booking: Booking;
}

export const GeneralSection: React.FC<GeneralSectionProps> = ({ booking }) => {
    const isFlight = booking.product === 'flight';
    const isHotel = booking.product === 'hotel';

    // Cast details based on product type
    // Note: Assuming details matches structure. In real app, adds guards.
    const flightDetails = isFlight ? (booking.details as Flight) : null;
    const hotelDetails = isHotel ? (booking.details as Hotel) : null;

    return (
        <div className="space-y-4">
            {/* Booking Summary */}
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex flex-col">
                    <span className="text-[var(--color-text-tertiary)]">Booking Type</span>
                    <span className="font-semibold capitalize">{booking.product}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[var(--color-text-tertiary)]">Booking Ref</span>
                    <span className="font-semibold">{booking.reference || booking.bookingId || booking.id}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[var(--color-text-tertiary)]">Booking Date</span>
                    <span className="font-semibold">
                        {booking.createdAt ? format(new Date(booking.createdAt), 'dd MMM yyyy') : '-'}
                    </span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[var(--color-text-tertiary)]">Status</span>
                    <div>
                        <StatusBadge status={booking.status} type={booking.status === 'Issued' || booking.status === 'Confirmed' ? 'success' : 'neutral'} />
                    </div>
                </div>
            </div>

            {/* Product Details */}
            {isFlight && flightDetails && (
                <Card className="bg-[var(--color-bg-secondary)] border-[var(--color-border-light)] shadow-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Plane className="w-4 h-4" />
                            Flight Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold">{flightDetails.airline} {flightDetails.flightNumber}</span>
                            <span className="text-xs text-[var(--color-text-tertiary)]">{flightDetails.duration}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="font-bold text-lg">{flightDetails.origin}</span>
                                <span className="text-xs text-[var(--color-text-tertiary)]">
                                    {flightDetails.departureTime ? format(new Date(flightDetails.departureTime), 'HH:mm') : ''}
                                </span>
                            </div>
                            <div className="flex-1 border-t border-dashed border-[var(--color-border-dark)] mx-4 relative top-[-8px]"></div>
                            <div className="flex flex-col text-right">
                                <span className="font-bold text-lg">{flightDetails.destination}</span>
                                <span className="text-xs text-[var(--color-text-tertiary)]">
                                    {flightDetails.arrivalTime ? format(new Date(flightDetails.arrivalTime), 'HH:mm') : ''}
                                </span>
                            </div>
                        </div>
                        <div className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {flightDetails.departureTime ? format(new Date(flightDetails.departureTime), 'EEE, dd MMM yyyy') : ''}
                        </div>
                    </CardContent>
                </Card>
            )}

            {isHotel && hotelDetails && (
                <Card className="bg-[var(--color-bg-secondary)] border-[var(--color-border-light)] shadow-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Bed className="w-4 h-4" />
                            Hotel Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                        <div className="font-semibold">{hotelDetails.name}</div>
                        {hotelDetails.address && (
                            <div className="flex items-start gap-1 text-[var(--color-text-tertiary)]">
                                <MapPin className="w-3.5 h-3.5 mt-0.5" />
                                <span>
                                    {[hotelDetails.address.street, hotelDetails.address.city, hotelDetails.address.country].filter(Boolean).join(', ')}
                                </span>
                            </div>
                        )}
                        {/* Room details would go here if available in proper structure */}
                    </CardContent>
                </Card>
            )}

            {/* Passenger List Placeholder */}
            <div className="pt-2">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Passengers
                </h4>
                <div className="border border-[var(--color-border-light)] rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-[var(--color-bg-secondary)]">
                            <tr className="text-left text-xs text-[var(--color-text-tertiary)]">
                                <th className="p-2 font-medium">Name</th>
                                <th className="p-2 font-medium">Type</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border-light)]">
                            {/* 
                  Assuming passengers are in details or separate. 
                  SrsTypes definitions showed `passengers` is missing on Booking interface but might be in details
               */}
                            <tr>
                                <td className="p-2">Guest User</td>
                                <td className="p-2 text-[var(--color-text-tertiary)]">Adult</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
