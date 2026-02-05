export type NotificationType = 'SSR' | 'ITINERARY_CHANGE' | 'CONFIRMATION' | 'AMENDMENT' | 'SYSTEM';

export type NotificationStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'INFO' | 'CANCELLED';

export interface NotificationItem {
    id: string;
    type: NotificationType;
    title: string;
    description: string;
    date: string; // ISO string or display string
    status: NotificationStatus;
    passengerName?: string;
    segment?: string;
    price?: number;
    currency?: string;
    remarks?: string;
    isRead?: boolean;
}

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
    {
        id: '1',
        type: 'CONFIRMATION',
        title: 'Booking Confirmed',
        description: 'Your booking has been successfully confirmed.',
        date: '2023-09-15T10:30:00',
        status: 'CONFIRMED',
        isRead: true
    },
    {
        id: '2',
        type: 'SSR',
        title: 'Special Meal Request',
        description: 'Asian Veg-Meal requested for Nooran Alqamoudi',
        date: '2023-09-15T10:35:00',
        status: 'PENDING',
        passengerName: 'Nooran Alqamoudi',
        segment: 'Frankfurt - London',
        price: 150,
        currency: 'SAR',
        isRead: false
    },
    {
        id: '3',
        type: 'SSR',
        title: 'Seat Selection',
        description: 'Seat 19D selected',
        date: '2023-09-15T10:35:00',
        status: 'CONFIRMED',
        passengerName: 'Mohamed Jubran',
        segment: 'Frankfurt - London',
        price: 0,
        currency: 'SAR',
        isRead: true
    },
    {
        id: '4',
        type: 'ITINERARY_CHANGE',
        title: 'Flight Schedule Change',
        description: 'Flight EY123 departure time changed from 10:00 to 10:30',
        date: '2023-09-20T09:00:00',
        status: 'INFO',
        segment: 'Frankfurt - London',
        isRead: false
    },
    {
        id: '5',
        type: 'AMENDMENT',
        title: 'Date Change Request',
        description: 'Request to change return flight date to 25 Oct 2023',
        date: '2023-09-21T14:20:00',
        status: 'REJECTED',
        remarks: 'No seats available in same class',
        isRead: false
    }
];
