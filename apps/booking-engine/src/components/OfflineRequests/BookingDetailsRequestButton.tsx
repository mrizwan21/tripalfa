import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { RequestChangeModal } from '@/components/OfflineRequests';
import { OfflineChangeRequest } from '@tripalfa/shared-types';

interface BookingDetailsRequestButtonProps {
  bookingId: string;
  bookingDetails: {
    route: string;
    departureDate: string;
    passengers: number;
    totalPrice: number;
  };
  linkedRequests?: OfflineChangeRequest[];
  onRequestCreated?: () => void;
}

export const BookingDetailsRequestButton = ({
  bookingId,
  bookingDetails,
  linkedRequests = [],
  onRequestCreated,
}: BookingDetailsRequestButtonProps) => {
  const [showModal, setShowModal] = useState(false);

  const pendingRequests = linkedRequests.filter(
    (r) => r.status !== 'completed' && r.status !== 'rejected'
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'submitted':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'under_review':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'under_review':
        return 'bg-orange-100 text-orange-800';
      case 'approved':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            Request a Change
          </CardTitle>
          <CardDescription>
            Need to modify your booking? Submit a change request and we'll review it for you.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Booking Summary */}
          <div className="bg-white rounded-lg p-3 border border-gray-200 text-sm space-y-1">
            <p className="text-gray-600">
              <span className="font-medium">Route:</span> {bookingDetails.route}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Departure:</span>{' '}
              {new Date(bookingDetails.departureDate).toLocaleDateString()}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Passengers:</span> {bookingDetails.passengers}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Current Price:</span> ${bookingDetails.totalPrice.toFixed(2)}
            </p>
          </div>

          {/* Pending Requests List */}
          {pendingRequests.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">Active Change Requests</p>
              <div className="space-y-2">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      <span className="text-gray-700">
                        {request.requestedChanges?.newDepartureDate
                          ? `Change to ${new Date(
                              request.requestedChanges.newDepartureDate
                            ).toLocaleDateString()}`
                          : 'Change request submitted'}
                      </span>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <p className="text-sm text-gray-700 mb-3">
              ✓ Compare prices before decide<br/>
              ✓ Track your request status in real-time<br/>
              ✓ Get notified about approvals instantly
            </p>
            <Button
              onClick={() => setShowModal(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Plus className="w-4 h-4" />
              Submit Change Request
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-600">
            Our team typically reviews requests within 24-48 hours. You'll be notified via email when there's
            an update or we're ready with new pricing options.
          </p>
        </CardContent>
      </Card>

      {/* Modal */}
      <RequestChangeModal
        open={showModal}
        onOpenChange={setShowModal}
        initialBookingId={bookingId}
        onSubmit={() => {
          setShowModal(false);
          onRequestCreated?.();
        }}
      />
    </>
  );
};
