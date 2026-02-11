export type NotificationType = 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR' | 'SSR' | 'ITINERARY_CHANGE' | 'AMENDMENT' | 'SYSTEM';

export type NotificationStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'INFO' | 'CANCELLED' | 'CONFIRMATION';

export interface NotificationItem {
    id: string;
    type: NotificationType;
    title: string;
    description: string;
    message?: string; // Alias for description from API
    when: string; // ISO string for display date
    read: boolean; // Whether the notification has been read
    status?: NotificationStatus;
    passengerName?: string;
    segment?: string;
    price?: number;
    currency?: string;
    remarks?: string;
}

/**
 * Maps API notification response to NotificationItem for UI display
 * Converts API field names to UI expected field names
 */
export function mapApiNotificationToItem(apiNotification: any): NotificationItem {
    // Map API notification type to UI notification type
    const typeMap: Record<string, NotificationType> = {
        'booking_created': 'INFO',
        'booking_confirmed': 'SUCCESS',
        'booking_cancelled': 'WARNING',
        'booking_updated': 'INFO',
        'payment_received': 'SUCCESS',
        'payment_failed': 'ERROR',
        'payment_refunded': 'INFO',
        'agent_assigned': 'INFO',
        'booking_reminder': 'INFO',
        'payment_reminder': 'WARNING',
        'ssr': 'SSR',
        'itinerary_change': 'ITINERARY_CHANGE',
        'amendment': 'AMENDMENT',
        'system': 'SYSTEM'
    };

    // Map API status to UI status (read boolean)
    // API status: 'pending' | 'sent' | 'failed' | 'delivered'
    // UI read boolean: true if delivered or sent successfully
    const isRead = apiNotification.status === 'delivered' || apiNotification.status === 'sent';

    return {
        id: apiNotification.id,
        type: typeMap[apiNotification.type] || 'INFO' as NotificationType,
        title: apiNotification.title,
        description: apiNotification.message || apiNotification.description || '',
        message: apiNotification.message || apiNotification.description || '', // Include for backward compatibility
        when: apiNotification.createdAt || new Date().toISOString(),
        read: isRead,
        status: mapApiStatusToUIStatus(apiNotification.status),
        passengerName: apiNotification.passengerName,
        segment: apiNotification.segment,
        price: apiNotification.price,
        currency: apiNotification.currency,
        remarks: apiNotification.remarks
    };
}

/**
 * Maps API notification status to UI NotificationStatus
 */
function mapApiStatusToUIStatus(apiStatus: string): NotificationStatus {
    const statusMap: Record<string, NotificationStatus> = {
        'pending': 'PENDING',
        'sent': 'CONFIRMED',
        'delivered': 'CONFIRMED',
        'failed': 'REJECTED',
        'cancelled': 'CANCELLED',
        'confirmed': 'CONFIRMATION'
    };
    return statusMap[apiStatus] || 'INFO';
}

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
    {
        id: '1',
        type: 'SUCCESS',
        title: 'Booking Confirmed',
        description: 'Your booking has been successfully confirmed.',
        when: new Date(Date.now() - 3600000).toISOString(),
        read: true,
        status: 'CONFIRMED'
    },
    {
        id: '2',
        type: 'INFO',
        title: 'Special Meal Request',
        description: 'Asian Veg-Meal requested for Nooran Alqamoudi',
        when: new Date(Date.now() - 1800000).toISOString(),
        read: false,
        status: 'PENDING',
        passengerName: 'Nooran Alqamoudi',
        segment: 'Frankfurt - London',
        price: 150,
        currency: 'SAR'
    },
    {
        id: '3',
        type: 'SUCCESS',
        title: 'Seat Selection',
        description: 'Seat 19D selected',
        when: new Date(Date.now() - 900000).toISOString(),
        read: false,
        status: 'CONFIRMED',
        passengerName: 'Mohamed Jubran',
        segment: 'Frankfurt - London',
        price: 0,
        currency: 'SAR'
    },
    {
        id: '4',
        type: 'INFO',
        title: 'Flight Schedule Change',
        description: 'Flight EY123 departure time changed from 10:00 to 10:30',
        when: new Date(Date.now() - 432000000).toISOString(),
        read: false,
        status: 'INFO',
        segment: 'Frankfurt - London'
    },
    {
        id: '5',
        type: 'WARNING',
        title: 'Date Change Request',
        description: 'Request to change return flight date to 25 Oct 2023',
        when: new Date(Date.now() - 518400000).toISOString(),
        read: false,
        status: 'REJECTED',
        remarks: 'No seats available in same class'
    }
];
