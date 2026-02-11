import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OfflineChangeRequest } from '@tripalfa/shared-types';

interface RequestQueueTableProps {
  requests: OfflineChangeRequest[];
  onSelectRequest: (request: OfflineChangeRequest) => void;
  onPricingSubmit: (request: OfflineChangeRequest) => void;
  loading?: boolean;
}

interface SortConfig {
  key: keyof OfflineChangeRequest | 'createdAt';
  direction: 'asc' | 'desc';
}

export const RequestQueueTable = ({
  requests,
  onSelectRequest,
  onPricingSubmit,
  loading = false,
}: RequestQueueTableProps) => {
  // Sort config
  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-orange-100 text-orange-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-gray-100 text-gray-800',
      expired: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadgeColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-50 text-green-700 border border-green-200',
      medium: 'bg-blue-50 text-blue-700 border border-blue-200',
      high: 'bg-orange-50 text-orange-700 border border-orange-200',
      urgent: 'bg-red-50 text-red-700 border border-red-200',
    };
    return colors[priority] || 'bg-gray-50 text-gray-700';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  // Calculate price differences for display
  const enrichedRequests = useMemo(() => {
    return requests.map((req) => {
      const originalTotal =
        (req.originalBooking?.totalPrice || 0) +
        (req.originalBooking?.baseFare || 0) +
        (req.originalBooking?.taxes || 0);
      const newTotal = (req.requestedChanges?.newTotalPrice || 0);
      const difference = newTotal - originalTotal;

      return {
        ...req,
        priceDifference: difference,
        originalTotal,
      };
    });
  }, [requests]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-gray-500">Loading requests...</div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48">
        <p className="text-gray-500 mb-2">No offline requests found</p>
        <p className="text-sm text-gray-400">Check back soon for new requests</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="font-semibold">Booking ID</TableHead>
            <TableHead className="font-semibold">Customer</TableHead>
            <TableHead className="font-semibold">Route</TableHead>
            <TableHead className="font-semibold">Priority</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Price Difference</TableHead>
            <TableHead className="font-semibold">Created</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enrichedRequests.map((request) => (
            <TableRow key={request.id} className="hover:bg-gray-50">
              <TableCell className="font-mono text-sm">{request.bookingId}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{request.customerEmail}</span>
                  <span className="text-xs text-gray-500">{request.customerId}</span>
                </div>
              </TableCell>
              <TableCell className="text-sm">
                <div className="flex flex-col">
                  <span>{request.originalBooking?.departureCity} → {request.originalBooking?.arrivalCity}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(request.originalBooking?.departureDate || '').toLocaleDateString()}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getPriorityBadgeColor(request.priority || 'medium')}>
                  {request.priority || 'Medium'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getStatusBadgeColor(request.status)}>{request.status}</Badge>
              </TableCell>
              <TableCell>
                <span
                  className={`font-semibold ${
                    (request as any).priceDifference >= 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {formatCurrency((request as any).priceDifference || 0)}
                </span>
              </TableCell>
              <TableCell className="text-sm text-gray-600">{formatDate(request.createdAt)}</TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectRequest(request)}
                  >
                    View
                  </Button>
                  {(request.status === 'submitted' || request.status === 'under_review') && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onPricingSubmit(request)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Submit Pricing
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
