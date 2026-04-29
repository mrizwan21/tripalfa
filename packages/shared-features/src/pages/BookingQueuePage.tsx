import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { useQuery } from '@tanstack/react-query';
import { apiManager, cn, NodalTable, TableBodyState, NodalPageHeader } from '../index';
import { 
  FileText, Search, Filter, RefreshCw, 
  Eye, CheckCircle2, Clock, DollarSign
} from 'lucide-react';

export default function BookingQueuePage({ onViewBooking, showBackButton = true }: { onViewBooking?: (id: string) => void, showBackButton?: boolean }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['booking-queue', searchQuery, filterStatus],
    queryFn: () => apiManager.getBookings(),
  });

  const headers = [
    <span key="ref">REFERENCE</span>,
    <span key="pax">PASSENGER</span>,
    <span key="date">BOOKING DATE</span>,
    <span key="status">STATUS</span>,
    <span key="amount">AMOUNT</span>,
    <span key="actions" className="text-right">ACTIONS</span>
  ];

  return (
    <Layout>
      <div className="max-w-[1550px] mx-auto pb-20 px-6 pt-8">
        <NodalPageHeader
          title="Booking"
          subtitle="Real-time queue of all travel bookings across nodes"
          icon={FileText}
          nodeName="Queue Hub"
        />

        <div className="bg-white rounded-[2.5rem] border border-black/5 p-12 my-12 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 mb-12">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Reference, Passenger..." 
                className="w-full bg-black/5 border-2 border-transparent focus:border-apple-blue rounded-xl pl-16 pr-8 py-4 text-sm font-bold outline-none transition-all" 
              />
            </div>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-black/5 rounded-xl px-8 py-4 text-sm font-bold outline-none cursor-pointer"
            >
              <option value="All">All States</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <NodalTable
            headers={headers}
            isEmpty={!bookings || bookings.length === 0}
            isLoading={isLoading}
          >
            <TableBodyState 
              loading={isLoading} 
              isEmpty={!bookings || bookings.length === 0} 
              colSpan={headers.length}
            >
              {bookings?.map((booking: any) => (
                <tr key={booking.id} className="hover:bg-black/[0.01] transition-all group">
                  <td className="px-10 py-8 font-bold text-black">{booking.referenceNo}</td>
                  <td className="px-6 py-8 text-sm font-medium text-black/60">{booking.passengerName}</td>
                  <td className="px-6 py-8 text-sm font-medium text-black/60">{booking.bookingDate}</td>
                  <td className="px-6 py-8">
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border",
                      booking.status === 'Confirmed' ? "bg-green-50 text-green-700 border-green-200" : "bg-orange-50 text-orange-700 border-orange-200"
                    )}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-8 font-bold text-black">{booking.currency} {booking.amount}</td>
                  <td className="px-10 py-8 text-right">
                    <button 
                      onClick={() => onViewBooking?.(booking.id)}
                      className="p-3 bg-black/5 rounded-xl text-black/40 hover:bg-black hover:text-white transition-all group-hover:scale-110"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </TableBodyState>
          </NodalTable>
        </div>
      </div>
    </Layout>
  );
}
