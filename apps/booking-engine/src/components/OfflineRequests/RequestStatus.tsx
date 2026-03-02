import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  OfflineChangeRequest,
  OfflineRequestStatus,
} from "@tripalfa/shared-types";

interface RequestStatusProps {
  request: OfflineChangeRequest;
  compact?: boolean;
}

export const RequestStatus = ({
  request,
  compact = false,
}: RequestStatusProps) => {
  const statusProgress = useMemo(() => {
    const stages = [
      OfflineRequestStatus.PENDING_STAFF,
      OfflineRequestStatus.PRICING_SUBMITTED,
      OfflineRequestStatus.PENDING_CUSTOMER_APPROVAL,
      OfflineRequestStatus.APPROVED,
      OfflineRequestStatus.PAYMENT_PENDING,
      OfflineRequestStatus.COMPLETED,
    ];
    const currentIndex = stages.indexOf(request.status);
    return ((currentIndex + 1) / stages.length) * 100;
  }, [request.status]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case OfflineRequestStatus.PENDING_STAFF:
      case OfflineRequestStatus.PRICING_SUBMITTED:
        return <Clock className="w-5 h-5 text-blue-600" />;
      case OfflineRequestStatus.PENDING_CUSTOMER_APPROVAL:
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case OfflineRequestStatus.APPROVED:
      case OfflineRequestStatus.PAYMENT_PENDING:
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case OfflineRequestStatus.COMPLETED:
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case OfflineRequestStatus.REJECTED:
      case OfflineRequestStatus.CANCELLED:
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case OfflineRequestStatus.PENDING_STAFF:
        return "Your request has been received and is awaiting staff review";
      case OfflineRequestStatus.PRICING_SUBMITTED:
        return "Our team is evaluating your request and checking availability";
      case OfflineRequestStatus.PENDING_CUSTOMER_APPROVAL:
        return "Pricing details have been prepared for your approval";
      case OfflineRequestStatus.APPROVED:
        return "Your request has been approved! Proceed to payment";
      case OfflineRequestStatus.PAYMENT_PENDING:
        return "Please complete payment to finalize your booking modification";
      case OfflineRequestStatus.COMPLETED:
        return "Your booking has been successfully updated with new details";
      case OfflineRequestStatus.REJECTED:
        return "Unfortunately, your request could not be accommodated";
      case OfflineRequestStatus.CANCELLED:
        return "Your request has been cancelled";
      default:
        return `Status: ${status.replaceAll("_", " ")}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case OfflineRequestStatus.PENDING_STAFF:
        return "bg-blue-100 text-blue-800 border-blue-300";
      case OfflineRequestStatus.PRICING_SUBMITTED:
        return "bg-orange-100 text-orange-800 border-orange-300";
      case OfflineRequestStatus.PENDING_CUSTOMER_APPROVAL:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case OfflineRequestStatus.APPROVED:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case OfflineRequestStatus.PAYMENT_PENDING:
        return "bg-purple-100 text-purple-800 border-purple-300";
      case OfflineRequestStatus.COMPLETED:
        return "bg-green-100 text-green-800 border-green-300";
      case OfflineRequestStatus.REJECTED:
        return "bg-red-100 text-red-800 border-red-300";
      case OfflineRequestStatus.CANCELLED:
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getCardBgColor = (status: string) => {
    switch (status) {
      case OfflineRequestStatus.PENDING_STAFF:
        return "bg-blue-50 border-blue-200";
      case OfflineRequestStatus.PRICING_SUBMITTED:
        return "bg-orange-50 border-orange-200";
      case OfflineRequestStatus.PENDING_CUSTOMER_APPROVAL:
        return "bg-yellow-50 border-yellow-200";
      case OfflineRequestStatus.APPROVED:
        return "bg-yellow-50 border-yellow-200";
      case OfflineRequestStatus.PAYMENT_PENDING:
        return "bg-purple-50 border-purple-200";
      case OfflineRequestStatus.COMPLETED:
        return "bg-green-50 border-green-200";
      case OfflineRequestStatus.REJECTED:
        return "bg-red-50 border-red-200";
      case OfflineRequestStatus.CANCELLED:
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const calculatePriceChange = () => {
    const original = request.originalBooking?.totalPrice || 0;
    const proposed = request.requestedChanges?.newTotalPrice || 0;
    const difference = proposed - original;
    return { original, proposed, difference };
  };

  const priceChange = calculatePriceChange();

  if (compact) {
    return (
      <div
        className={`p-3 rounded-lg border ${getCardBgColor(request.status)}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {getStatusIcon(request.status)}
            <div>
              <p className="font-medium text-sm text-gray-900">
                Request {request.status.toUpperCase()}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                {new Date(request.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(request.status)}>
            {request.status.replaceAll("_", " ")}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <Card className={`border ${getCardBgColor(request.status)}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(request.status)}
            <div>
              <CardTitle className="text-lg">
                Request #{request.id.slice(0, 8).toUpperCase()}
              </CardTitle>
              <CardDescription className="mt-1">
                {getStatusDescription(request.status)}
              </CardDescription>
            </div>
          </div>
          <Badge className={`${getStatusColor(request.status)} border`}>
            {request.status.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-6">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2 gap-2">
            <p className="text-sm font-medium text-gray-700">
              Request Progress
            </p>
            <p className="text-xs text-gray-600">
              {Math.round(statusProgress)}%
            </p>
          </div>
          <Progress value={statusProgress} className="h-2" />
        </div>

        {/* Timeline Indicators */}
        <div className="flex gap-1 text-xs">
          {["Submitted", "Review", "Approval", "Complete"].map((stage, idx) => (
            <div
              key={stage}
              className={`flex-1 h-1 rounded-full ${
                idx * 33 <= statusProgress ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-2">
          <p className="text-sm font-medium text-gray-900">
            Original Booking Details
          </p>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-600 text-xs">Departure</p>
              <p className="font-medium text-gray-900 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {request.originalBooking?.departureDate
                  ? new Date(
                      request.originalBooking.departureDate,
                    ).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-xs">Route</p>
              <p className="font-medium text-gray-900 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {request.originalBooking?.route || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-xs">Passengers</p>
              <p className="font-medium text-gray-900 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {request.originalBooking?.passengers || 0}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-xs">Price</p>
              <p className="font-medium text-gray-900 flex items-center gap-1">
                <DollarSign className="w-3 h-3" />$
                {request.originalBooking?.totalPrice?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
        </div>

        {/* Requested Changes */}
        {request.requestedChanges && (
          <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-2">
            <p className="text-sm font-medium text-gray-900">
              Requested Changes
            </p>

            <div className="space-y-2 text-sm">
              {request.requestedChanges.newDepartureDate && (
                <p className="text-gray-700">
                  <span className="text-gray-600">📅 New Departure: </span>
                  {new Date(
                    request.requestedChanges.newDepartureDate,
                  ).toLocaleDateString()}
                </p>
              )}

              {request.requestedChanges.newRoute && (
                <p className="text-gray-700">
                  <span className="text-gray-600">📍 New Route: </span>
                  {request.requestedChanges.newRoute}
                </p>
              )}

              {request.requestedChanges.reason && (
                <p className="text-gray-700">
                  <span className="text-gray-600">💬 Reason: </span>
                  {request.requestedChanges.reason}
                </p>
              )}

              {request.requestedChanges.additionalNotes && (
                <p className="text-gray-700">
                  <span className="text-gray-600">📝 Notes: </span>
                  {request.requestedChanges.additionalNotes}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Price Impact */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <p className="text-sm font-medium text-gray-900 mb-2">Price Impact</p>

          <div className="space-y-2">
            {/* Original Price */}
            <div className="flex items-center justify-between text-sm gap-2">
              <span className="text-gray-600">Original Price</span>
              <span className="font-medium text-gray-900">
                ${priceChange.original.toFixed(2)}
              </span>
            </div>

            {/* Price Arrow */}
            <div className="flex justify-center gap-4">
              {priceChange.difference < 0 ? (
                <TrendingDown className="w-4 h-4 text-green-600" />
              ) : priceChange.difference > 0 ? (
                <TrendingUp className="w-4 h-4 text-red-600" />
              ) : null}
            </div>

            {/* New/Proposed Price */}
            <div className="flex items-center justify-between text-sm border-t pt-2 gap-2">
              <span className="text-gray-600">Proposed New Price</span>
              <span className="font-medium text-gray-900">
                ${priceChange.proposed.toFixed(2)}
              </span>
            </div>

            {/* Difference */}
            <div
              className={`flex items-center justify-between p-2 rounded text-sm font-medium ${
                priceChange.difference < 0
                  ? "bg-green-50 text-green-700"
                  : priceChange.difference > 0
                    ? "bg-red-50 text-red-700"
                    : "bg-gray-50 text-gray-700"
              }`}
            >
              <span>
                {priceChange.difference < 0
                  ? "Refund"
                  : priceChange.difference > 0
                    ? "Additional Charge"
                    : "No Change"}
              </span>
              <span>
                {priceChange.difference > 0 ? "+" : ""}$
                {Math.abs(priceChange.difference).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="text-xs text-gray-600 space-y-2">
          <p>📤 Submitted: {new Date(request.createdAt).toLocaleString()}</p>
          <p>🔄 Last Updated: {new Date(request.updatedAt).toLocaleString()}</p>
          {request.reviewDeadline && (
            <p>
              ⏰ Review By: {new Date(request.reviewDeadline).toLocaleString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
