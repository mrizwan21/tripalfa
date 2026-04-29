import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Eye, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '../context/CustomerContext';
import { BookingQueuePage } from '@tripalfa/shared-features';

export default function BookingQueuesPage() {
  const navigate = useNavigate();
  const { addNotification } = useCustomer();

  const handleViewBooking = (bookingId: string) => {
    navigate(`/booking/${bookingId}`);
  };

  return (
    <div className="max-w-[1700px] mx-auto pb-20 px-6">
      <div className="mb-8 border-b border-gray-200 pb-6">
        <h1 className="text-4xl font-light tracking-tight mb-2 text-gray-900">
          Booking <span className="font-semibold">Queues</span>
        </h1>
        <p className="text-sm text-gray-500">
          Manage and monitor all booking queues.
        </p>
      </div>

      <BookingQueuePage 
        onViewBooking={handleViewBooking}
        showBackButton={false}
      />
    </div>
  );
}