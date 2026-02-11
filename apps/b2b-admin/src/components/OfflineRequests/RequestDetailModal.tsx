import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OfflineChangeRequest, OfflineRequestAuditLog } from '@tripalfa/shared-types';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

interface RequestDetailModalProps {
  request: OfflineChangeRequest | null;
  auditLog?: OfflineRequestAuditLog[];
  isOpen: boolean;
  onClose: () => void;
  onAddNote?: () => void;
  onCancel?: () => void;
}

export const RequestDetailModal = ({
  request,
  auditLog = [],
  isOpen,
  onClose,
  onAddNote,
  onCancel,
}: RequestDetailModalProps) => {
  if (!request) {
    return null;
  }

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(date));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const getReasonIcon = (reason: string) => {
    const reasonLower = reason.toLowerCase();
    if (reasonLower.includes('price')) return <AlertCircle className="w-4 h-4" />;
    if (reasonLower.includes('schedule')) return <Clock className="w-4 h-4" />;
    if (reasonLower.includes('date')) return <Calendar className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  const getAuditIcon = (action: string) => {
    switch (action) {
      case 'CREATED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'SUBMITTED':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Offline Request Details</span>
            <Badge className="ml-auto">{request.status}</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Request Details</TabsTrigger>
            <TabsTrigger value="changes">Changes Requested</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            {/* Request Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">Request ID</p>
                <p className="text-sm font-mono text-gray-900">{request.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Booking ID</p>
                <p className="text-sm font-mono text-gray-900">{request.bookingId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Customer Email</p>
                <p className="text-sm text-gray-900">{request.customerEmail}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Customer ID</p>
                <p className="text-sm font-mono text-gray-900">{request.customerId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Priority</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{request.priority || 'Medium'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Created</p>
                <p className="text-sm text-gray-900">{formatDate(request.createdAt)}</p>
              </div>
            </div>

            {/* Reason for Change */}
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 font-medium mb-2">Reason for Change</p>
              <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                {getReasonIcon(request.reasonForChange || '')}
                <p className="text-sm text-gray-900">{request.reasonForChange || 'No reason provided'}</p>
              </div>
            </div>

            {/* Original Booking Info */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Original Booking</h4>
              <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-blue-700 font-medium">Route</p>
                  <p className="text-sm font-medium text-gray-900">
                    {request.originalBooking?.departureCity} → {request.originalBooking?.arrivalCity}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 font-medium">Departure</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(request.originalBooking?.departureDate || '').toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 font-medium">Passengers</p>
                  <p className="text-sm font-medium text-gray-900">
                    {request.originalBooking?.adultPassengers || 0} adult(s), {request.originalBooking?.childPassengers || 0} child(ren)
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 font-medium">Total Price</p>
                  <p className="text-sm font-bold text-gray-900">
                    {formatCurrency((request.originalBooking?.totalPrice || 0) + (request.originalBooking?.baseFare || 0) + (request.originalBooking?.taxes || 0))}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-blue-700 font-medium mb-2">Breakdown</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-sm">
                      <span className="text-gray-600">Base: </span>
                      <span className="font-medium">{formatCurrency(request.originalBooking?.baseFare || 0)}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Taxes: </span>
                      <span className="font-medium">{formatCurrency(request.originalBooking?.taxes || 0)}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Fees: </span>
                      <span className="font-medium">{formatCurrency(request.originalBooking?.fees || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Changes Tab */}
          <TabsContent value="changes" className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Requested Changes</h4>
              <div className="space-y-3 bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">New Departure Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {request.requestedChanges?.newDepartureDate 
                        ? new Date(request.requestedChanges.newDepartureDate).toLocaleDateString() 
                        : 'Not changed'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">New Return Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {request.requestedChanges?.newReturnDate
                        ? new Date(request.requestedChanges.newReturnDate).toLocaleDateString()
                        : 'Not changed'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">New Route</p>
                    <p className="text-sm font-medium text-gray-900">
                      {request.requestedChanges?.newRoute || 'Not changed'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">New Passengers</p>
                    <p className="text-sm font-medium text-gray-900">
                      {request.requestedChanges?.newAdultPassengers || 'N/A'} adult(s), {request.requestedChanges?.newChildPassengers || 'N/A'} child(ren)
                    </p>
                  </div>
                </div>

                {request.requestedChanges && (
                  <div className="mt-4 p-3 bg-white rounded border border-orange-200">
                    <p className="text-sm font-semibold text-gray-900 mb-2">Price Comparison</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Original: </span>
                        <span className="font-medium">
                          {formatCurrency(
                            (request.originalBooking?.baseFare || 0) +
                            (request.originalBooking?.taxes || 0) +
                            (request.originalBooking?.fees || 0)
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">New: </span>
                        <span className="font-medium">
                          {formatCurrency(
                            (request.requestedChanges.newBaseFare || 0) +
                            (request.requestedChanges.newTaxes || 0) +
                            (request.requestedChanges.newFees || 0)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {request.requestedChanges?.additionalNotes && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Additional Notes from Customer</p>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-900">
                  {request.requestedChanges.additionalNotes}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit" className="space-y-3">
            {auditLog.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">No audit history available</p>
            ) : (
              <div className="space-y-3">
                {auditLog.map((log) => (
                  <div key={log.id} className="flex gap-3 p-3 border border-gray-200 rounded-lg">
                    <div className="flex-shrink-0">
                      {getAuditIcon(log.action)}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {log.action.replaceAll('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDate(log.createdAt)}
                      </p>
                      {log.changedFields && Object.keys(log.changedFields).length > 0 && (
                        <div className="mt-2 text-xs text-gray-700 bg-gray-50 p-2 rounded">
                          <p className="font-medium mb-1">Changes:</p>
                          <ul className="space-y-0.5">
                            {Object.entries(log.changedFields).map(([key, value]) => (
                              <li key={key}>
                                <span className="text-gray-600">{key}:</span> {String(value || '-')}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-2 justify-end">
          {onCancel && request.status !== 'completed' && request.status !== 'cancelled' && (
            <Button variant="destructive" onClick={onCancel}>
              Cancel Request
            </Button>
          )}
          {onAddNote && (
            <Button variant="outline" onClick={onAddNote}>
              Add Note
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Import Calendar icon
import { Calendar } from 'lucide-react';
