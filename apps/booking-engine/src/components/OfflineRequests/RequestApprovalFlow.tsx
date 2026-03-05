import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "../ui/button";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  FileText,
  DollarSign,
} from "lucide-react";
import {
  OfflineChangeRequest,
  OfflineRequestStatus,
} from "@tripalfa/shared-types";

interface RequestApprovalFlowProps {
  request: OfflineChangeRequest;
  onAccept?: () => void;
  onReject?: () => void;
  isLoading?: boolean;
}

export const RequestApprovalFlow = ({
  request,
  onAccept,
  onReject,
  isLoading = false,
}: RequestApprovalFlowProps) => {
  const [timeElapsed, setTimeElapsed] = useState<string>("");

  // Calculate time since submission
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const created = new Date(request.createdAt);
      const diff = now.getTime() - created.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeElapsed(`${hours}h ${minutes}m ago`);
      } else {
        setTimeElapsed(`${minutes}m ago`);
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [request.createdAt]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case OfflineRequestStatus.PENDING_STAFF:
        return <Clock className="w-5 h-5 text-blue-600" />;
      case OfflineRequestStatus.PRICING_SUBMITTED:
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case OfflineRequestStatus.PENDING_CUSTOMER_APPROVAL:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case OfflineRequestStatus.APPROVED:
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case OfflineRequestStatus.REJECTED:
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case OfflineRequestStatus.CANCELLED:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case OfflineRequestStatus.PENDING_STAFF:
        return "bg-blue-50 border-blue-200";
      case OfflineRequestStatus.PRICING_SUBMITTED:
        return "bg-orange-50 border-orange-200";
      case OfflineRequestStatus.PENDING_CUSTOMER_APPROVAL:
        return "bg-yellow-50 border-yellow-200";
      case OfflineRequestStatus.APPROVED:
        return "bg-green-50 border-green-200";
      case OfflineRequestStatus.REJECTED:
        return "bg-red-50 border-red-200";
      case OfflineRequestStatus.CANCELLED:
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case OfflineRequestStatus.PENDING_STAFF:
        return "Request Submitted - Awaiting Staff Review";
      case OfflineRequestStatus.PRICING_SUBMITTED:
        return "Pricing Submitted - Awaiting Customer Approval";
      case OfflineRequestStatus.PENDING_CUSTOMER_APPROVAL:
        return "Pending Customer Approval";
      case OfflineRequestStatus.APPROVED:
        return "Approved - Awaiting Your Decision";
      case OfflineRequestStatus.PAYMENT_PENDING:
        return "Payment Pending";
      case OfflineRequestStatus.COMPLETED:
        return "Completed";
      case OfflineRequestStatus.REJECTED:
        return "Not Approved";
      case OfflineRequestStatus.CANCELLED:
        return "Cancelled";
      default:
        return status.replaceAll("_", " ");
    }
  };

  const calculatePriceImpact = () => {
    const original =
      (request.originalBooking?.baseFare || 0) +
      (request.originalBooking?.taxes || 0) +
      (request.originalBooking?.fees || 0);

    const approved =
      (request.requestedChanges?.newBaseFare || 0) +
      (request.requestedChanges?.newTaxes || 0) +
      (request.requestedChanges?.newFees || 0);

    const difference = approved - original;
    return { original, approved, difference };
  };

  const priceImpact = calculatePriceImpact();
  const canAcceptReject = request.status === OfflineRequestStatus.APPROVED;

  return (
    <Card className={`border ${getStatusColor(request.status)}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(request.status)}
              <CardTitle className="text-lg">
                {getStatusText(request.status)}
              </CardTitle>
            </div>
            <CardDescription>
              Request submitted {timeElapsed || "recently"}
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600 mb-1">Priority</p>
            <Badge className="bg-blue-100 text-blue-800">
              {request.priority || "Medium"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-6">
        {/* Status Timeline */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 gap-4">
              <p className="font-medium text-gray-900">Request Submitted</p>
              <p className="text-xs text-gray-600">
                {new Date(request.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                [
                  OfflineRequestStatus.PRICING_SUBMITTED,
                  OfflineRequestStatus.PENDING_CUSTOMER_APPROVAL,
                  OfflineRequestStatus.APPROVED,
                  OfflineRequestStatus.PAYMENT_PENDING,
                  OfflineRequestStatus.COMPLETED,
                ].includes(request.status)
                  ? "bg-blue-100"
                  : "bg-gray-100"
              }`}
            >
              {[
                OfflineRequestStatus.PRICING_SUBMITTED,
                OfflineRequestStatus.PENDING_CUSTOMER_APPROVAL,
                OfflineRequestStatus.APPROVED,
                OfflineRequestStatus.PAYMENT_PENDING,
                OfflineRequestStatus.COMPLETED,
              ].includes(request.status) ? (
                <CheckCircle className="w-5 h-5 text-blue-600" />
              ) : (
                <Clock className="w-5 h-5 text-gray-600" />
              )}
            </div>
            <div className="flex-1 gap-4">
              <p className="font-medium text-gray-900">Under Review</p>
              <p className="text-xs text-gray-600">
                Our team is evaluating your request
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                [
                  OfflineRequestStatus.APPROVED,
                  OfflineRequestStatus.PAYMENT_PENDING,
                  OfflineRequestStatus.COMPLETED,
                ].includes(request.status)
                  ? "bg-green-100"
                  : "bg-gray-100"
              }`}
            >
              {[
                OfflineRequestStatus.APPROVED,
                OfflineRequestStatus.PAYMENT_PENDING,
                OfflineRequestStatus.COMPLETED,
              ].includes(request.status) ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Clock className="w-5 h-5 text-gray-600" />
              )}
            </div>
            <div className="flex-1 gap-4">
              <p className="font-medium text-gray-900">Approval Complete</p>
              <p className="text-xs text-gray-600">
                Awaiting your decision on updated pricing
              </p>
            </div>
          </div>
        </div>

        {/* Requested Changes */}
        {request.requestedChanges && (
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-sm font-medium text-gray-900 mb-2">
              Changes Requested
            </p>
            <div className="space-y-2 text-sm">
              {request.requestedChanges.newDepartureDate && (
                <p className="text-gray-700">
                  <span className="text-gray-600">New Departure: </span>
                  {new Date(
                    request.requestedChanges.newDepartureDate,
                  ).toLocaleDateString()}
                </p>
              )}
              {request.requestedChanges.newRoute && (
                <p className="text-gray-700">
                  <span className="text-gray-600">New Route: </span>
                  {request.requestedChanges.newRoute}
                </p>
              )}
              {request.requestedChanges.additionalNotes && (
                <p className="text-gray-700">
                  <span className="text-gray-600">Notes: </span>
                  {request.requestedChanges.additionalNotes}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Price Impact */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-gray-600" />
            <p className="text-sm font-medium text-gray-900">Price Update</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-gray-600 text-xs">Original</p>
              <p className="font-semibold text-gray-900">
                ${priceImpact.original.toFixed(2)}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
            <div>
              <p className="text-gray-600 text-xs">New Price</p>
              <p className="font-semibold text-gray-900">
                ${priceImpact.approved.toFixed(2)}
              </p>
            </div>
          </div>
          <div
            className={`mt-2 p-2 rounded text-sm font-medium ${
              priceImpact.difference < 0
                ? "bg-green-50 text-green-700"
                : priceImpact.difference > 0
                  ? "bg-red-50 text-red-700"
                  : "bg-gray-50 text-gray-700"
            }`}
          >
            {priceImpact.difference < 0
              ? `Refund: $${Math.abs(priceImpact.difference).toFixed(2)}`
              : priceImpact.difference > 0
                ? `Additional Charge: $${priceImpact.difference.toFixed(2)}`
                : "No price change"}
          </div>
        </div>

        {/* Action Buttons - Only show for approved requests */}
        {canAcceptReject && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-3">
              Your Decision Required
            </h4>
            <div className="flex gap-2">
              <Button
                onClick={onAccept}
                disabled={isLoading}
                className="flex-1 hover: gap-4"
              >
                {isLoading ? "Processing..." : "Accept Changes"}
              </Button>
              <Button
                onClick={onReject}
                disabled={isLoading}
                variant="outline"
                className="flex-1 gap-4"
              >
                {isLoading ? "Processing..." : "Keep Original"}
              </Button>
            </div>
            <p className="text-xs text-green-700 mt-2">
              ✓ You can can change your mind and come back to this later
            </p>
          </div>
        )}

        {/* Completed Status */}
        {request.status === OfflineRequestStatus.COMPLETED && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5 gap-4" />
              <div>
                <p className="font-medium text-green-900">Booking Updated</p>
                <p className="text-sm text-green-700 mt-0.5">
                  Your booking has been updated with the approved changes. Check
                  your email for confirmation and documents.
                </p>
              </div>
            </div>
            {request.requestedChanges?.newTotalPrice && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <a
                  href="#"
                  className="text-sm text-green-600 font-medium hover:text-green-700 flex items-center gap-1"
                >
                  <FileText className="w-4 h-4" />
                  View E-Ticket & Documents
                </a>
              </div>
            )}
          </div>
        )}

        {/* Rejected Status */}
        {request.status === OfflineRequestStatus.REJECTED && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5 gap-4" />
              <div>
                <p className="font-medium text-red-900">Request Not Approved</p>
                <p className="text-sm text-red-700 mt-0.5">
                  Unfortunately, your requested changes could not be
                  accommodated. Please contact support for more information.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
