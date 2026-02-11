import React, { useState, useEffect } from 'react';
import { Booking } from '../../../lib/srs-types';
import { BookingHistoryTimeline, HistoryEvent } from '../../shared/BookingHistoryTimeline';
import { HistoryFilters } from '../../shared/HistoryFilters';
import { ExportButton } from '../../shared/ExportButton';
import { getBookingHistory } from '../../../lib/api';

interface HistorySectionProps {
    booking: Booking;
}

export const HistorySection: React.FC<HistorySectionProps> = ({ booking }) => {
    const [events, setEvents] = useState<HistoryEvent[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<HistoryEvent[]>([]);
    const [filters, setFilters] = useState({ type: 'all', dateRange: 'all', user: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadHistory() {
            try {
                // Fetch history from API (which now includes mock login events)
                const historyData = await getBookingHistory(booking.id);
                // Map API response to HistoryEvent if needed, or assume it matches
                // For now, api.ts returns compatible structure
                const mappedEvents = historyData.map((e: any) => ({
                    id: e.id,
                    action: e.action,
                    date: e.date,
                    type: e.type,
                    description: e.description,
                    user: e.user
                }));
                setEvents(mappedEvents);
                setFilteredEvents(mappedEvents);
            } catch (error) {
                console.error("Failed to load history:", error);
            } finally {
                setLoading(false);
            }
        }
        loadHistory();
    }, [booking.id]);

    useEffect(() => {
        let result = events;

        if (filters.type !== 'all') {
            result = result.filter(e => e.type === filters.type);
        }

        if (filters.user) {
            result = result.filter(e => e.user?.toLowerCase().includes(filters.user.toLowerCase()));
        }

        if (filters.dateRange !== 'all') {
            const now = new Date();
            const eventDate = (date: string) => new Date(date);

            if (filters.dateRange === 'today') {
                result = result.filter(e => eventDate(e.date).toDateString() === now.toDateString());
            } else if (filters.dateRange === 'week') {
                const weekAgo = new Date(now.setDate(now.getDate() - 7));
                result = result.filter(e => eventDate(e.date) >= weekAgo);
            } else if (filters.dateRange === 'month') {
                const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
                result = result.filter(e => eventDate(e.date) >= monthAgo);
            }
        }

        setFilteredEvents(result);
    }, [filters, events]);

    const handleExport = (format: 'csv' | 'pdf') => {
        console.log(`Exporting history as ${format}...`);
        // Implementation for export logic would go here
        alert(`Export to ${format.toUpperCase()} started...`);
    };

    if (loading) {
        return <div className="p-4 text-center text-[var(--color-text-tertiary)]">Loading history...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                <HistoryFilters onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))} />
                <ExportButton onExport={handleExport} />
            </div>

            <div className="bg-white p-6 rounded-xl border border-[var(--color-border-light)] shadow-sm">
                <BookingHistoryTimeline events={filteredEvents} />
            </div>
        </div>
    );
};
