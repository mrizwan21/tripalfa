import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
  AlertCircle,
  CheckCircle2,
  Loader2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { OfflineChangeRequest } from "@tripalfa/shared-types";
import offlineRequestApi from "@/api/offlineRequestApi";

interface PricingApprovalViewProps {
  request: OfflineChangeRequest;
  onApproved?: () => void;
  onRejected?: () => void;
  onPaymentRequired?: () => void;
}

interface PricingBreakdown {
  originalBaseFare: number;
  originalTaxes: number;
  originalMarkup: number;
  newBaseFare: number;
  newTaxes: number;
  newMarkup: number;
  currency: string;
}

export const PricingApprovalView: React.FC<PricingApprovalViewProps> = ({
  request,
  onApproved,
  onRejected,
  onPaymentRequired,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Approve pricing mutation
  const approveMutation = useMutation({
    mutationFn: () => offlineRequestApi.approveRequest(request.id, true),
    onSuccess: () => {
      if (priceDifference > 0) {
        onPaymentRequired?.();
      } else {
        onApproved?.();
      }
    },
  });

  // Reject pricing mutation
  const rejectMutation = useMutation({
    mutationFn: () =>
      offlineRequestApi.approveRequest(request.id, false, rejectionReason),
    onSuccess: () => {
      onRejected?.();
    },
  });

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const getPricingBreakdown = (): PricingBreakdown => {
    const originalDetails = request.originalDetails || {};
    const staffPricing = request.staffPricing || {};

    return {
      originalBaseFare: originalDetails.pricing?.baseFare || 0,
      originalTaxes: originalDetails.pricing?.taxes || 0,
      originalMarkup: originalDetails.pricing?.markup || 0,
      newBaseFare: staffPricing.newBaseFare || 0,
      newTaxes: staffPricing.newTaxes || 0,
      newMarkup: staffPricing.newMarkup || 0,
      currency: staffPricing.currency || "USD",
    };
  };

  const breakdown = getPricingBreakdown();
  const originalTotal =
    breakdown.originalBaseFare +
    breakdown.originalTaxes +
    breakdown.originalMarkup;
  const newTotal =
    breakdown.newBaseFare + breakdown.newTaxes + breakdown.newMarkup;
  const priceDifference = newTotal - originalTotal;
  const isIncrease = priceDifference > 0;

  const getItineraryDisplay = () => {
    const original = request.originalDetails;
    const requested = request.requestedChanges;

    if (
      request.requestType === "schedule_change" ||
      request.requestType === "flight_change"
    ) {
      return {
        original: {
          type: "Flight",
          details: `${original?.departure?.airport} → ${original?.arrival?.airport}`,
          datetime: original?.departure?.time
            ? new Date(original.departure.time).toLocaleString()
            : "N/A",
          airline: `${original?.airline} ${original?.flightNumber}`,
        },
        new: {
          type: "Flight",
          details: `${requested?.newItinerary?.departure?.airport} → ${requested?.newItinerary?.arrival?.airport}`,
          datetime: requested?.newItinerary?.departure?.time
            ? new Date(requested.newItinerary.departure.time).toLocaleString()
            : "N/A",
          airline: `${requested?.newItinerary?.airline} ${requested?.newItinerary?.flightNumber}`,
        },
      };
    } else {
      return {
        original: {
          type: "Hotel",
          details: original?.name || "N/A",
          datetime: `${original?.checkInDate} to ${original?.checkOutDate}`,
          airline: original?.location || "N/A",
        },
        new: {
          type: "Hotel",
          details: requested?.newItinerary?.name || "N/A",
          datetime: `${requested?.newItinerary?.checkInDate} to ${requested?.newItinerary?.checkOutDate}`,
          airline: requested?.newItinerary?.location || "N/A",
        },
      };
    }
  };

  const itinerary = getItineraryDisplay();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Alert */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5 gap-4" />
        <div>
          <p className="font-semibold text-green-900">✓ Pricing Available!</p>
          <p className="text-sm text-green-700 mt-1">
            Our team has confirmed availability and pricing for your requested
            changes. Please review the details below and approve to proceed with
            payment.
          </p>
        </div>
      </div>

      {/* Itinerary Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>{itinerary.original.type} Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Original */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3 text-xl font-semibold tracking-tight">
                Original
              </h3>
              <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
                <p className="text-lg font-bold text-foreground">
                  {itinerary.original.details}
                </p>
                <p className="text-sm text-muted-foreground">
                  {itinerary.original.datetime}
                </p>
                <p className="text-sm text-muted-foreground">
                  {itinerary.original.airline}
                </p>
              </div>
            </div>

            {/* New */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3 text-xl font-semibold tracking-tight">
                New
              </h3>
              <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 space-y-2">
                <p className="text-lg font-bold text-foreground">
                  {itinerary.new.details}
                </p>
                <p className="text-sm text-muted-foreground">
                  {itinerary.new.datetime}
                </p>
                <p className="text-sm text-muted-foreground">
                  {itinerary.new.airline}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Original Pricing */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4 text-xl font-semibold tracking-tight">
                Original Pricing
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b gap-4">
                  <span className="text-foreground">Base Fare</span>
                  <span className="font-medium">
                    {formatCurrency(
                      breakdown.originalBaseFare,
                      breakdown.currency,
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b gap-4">
                  <span className="text-foreground">Taxes & Fees</span>
                  <span className="font-medium">
                    {formatCurrency(
                      breakdown.originalTaxes,
                      breakdown.currency,
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b gap-4">
                  <span className="text-foreground">Service Fee</span>
                  <span className="font-medium">
                    {formatCurrency(
                      breakdown.originalMarkup,
                      breakdown.currency,
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-border font-bold text-lg gap-4">
                  <span>Total Paid</span>
                  <span>
                    {formatCurrency(originalTotal, breakdown.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* New Pricing */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4 text-xl font-semibold tracking-tight">
                New Pricing
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b gap-4">
                  <span className="text-foreground">Base Fare</span>
                  <span className="font-medium">
                    {formatCurrency(breakdown.newBaseFare, breakdown.currency)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b gap-4">
                  <span className="text-foreground">Taxes & Fees</span>
                  <span className="font-medium">
                    {formatCurrency(breakdown.newTaxes, breakdown.currency)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b gap-4">
                  <span className="text-foreground">Service Fee</span>
                  <span className="font-medium">
                    {formatCurrency(breakdown.newMarkup, breakdown.currency)}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-border font-bold text-lg gap-4">
                  <span>New Total</span>
                  <span>{formatCurrency(newTotal, breakdown.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Price Difference Box */}
          <div
            className={`mt-6 p-6 rounded-lg text-center border-2 ${
              isIncrease
                ? "bg-yellow-50 border-yellow-300"
                : "bg-green-50 border-green-300"
            }`}
          >
            <p
              className={`text-sm font-semibold ${isIncrease ? "text-yellow-900" : "text-green-900"}`}
            >
              {isIncrease ? "Additional Payment Required" : "Credit Applied"}
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              {isIncrease ? (
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-green-600" />
              )}
              <p
                className={`text-3xl font-bold ${isIncrease ? "text-yellow-800" : "text-green-800"}`}
              >
                {formatCurrency(Math.abs(priceDifference), breakdown.currency)}
              </p>
            </div>
            <p
              className={`text-sm mt-2 ${isIncrease ? "text-yellow-700" : "text-green-700"}`}
            >
              {isIncrease
                ? "This amount will be charged to your payment method"
                : "This credit will be applied to your next booking"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Details Toggle */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => setShowDetails(!showDetails)}
        >
          <div className="flex justify-between items-center gap-4">
            <CardTitle className="text-base">Additional Details</CardTitle>
            <Badge variant="outline">{showDetails ? "▼" : "▶"}</Badge>
          </div>
        </CardHeader>
        {showDetails && (
          <CardContent className="space-y-4 border-t pt-4">
            {request.staffPricing?.staffNotes && (
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">
                  Staff Notes
                </p>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                  {request.staffPricing.staffNotes}
                </p>
              </div>
            )}

            {request.staffPricing?.supplierReference && (
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  Supplier Reference
                </p>
                <p className="text-sm font-mono text-muted-foreground">
                  {request.staffPricing.supplierReference}
                </p>
              </div>
            )}

            {request.requestedChanges?.changeReason && (
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">
                  Your Reason for Change
                </p>
                <p className="text-sm text-muted-foreground">
                  {request.requestedChanges.changeReason}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm font-semibold text-foreground mb-2">
                Request ID
              </p>
              <p className="text-sm font-mono text-muted-foreground">
                {request.requestRef}
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Approval Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-900">
              By approving these changes, you agree to pay the{" "}
              <strong>{isIncrease ? "additional amount" : "credit"}</strong> of{" "}
              <strong>
                {formatCurrency(Math.abs(priceDifference), breakdown.currency)}
              </strong>
              . Your original booking will be cancelled and a new one will be
              issued.
            </p>
          </div>

          <div className="space-y-3">
            {!showRejectForm ? (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectForm(true)}
                  className="flex-1 gap-4"
                  disabled={
                    rejectMutation.isPending || approveMutation.isPending
                  }
                >
                  Reject Changes
                </Button>
                <Button
                  onClick={() => approveMutation.mutate()}
                  disabled={
                    approveMutation.isPending || rejectMutation.isPending
                  }
                  className="flex-1 bg-green-600 hover:bg-green-700 gap-4"
                >
                  {approveMutation.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {priceDifference > 0
                    ? "Approve & Proceed to Payment"
                    : "Approve Changes"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3 border-t pt-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Why are you rejecting these changes?
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Your feedback will help us improve our service..."
                    className="w-full min-h-20 p-2 border border-border rounded text-sm"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectForm(false)}
                    className="flex-1 gap-4"
                    disabled={rejectMutation.isPending}
                  >
                    Back to Pricing
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => rejectMutation.mutate()}
                    disabled={rejectMutation.isPending}
                    className="flex-1 gap-4"
                  >
                    {rejectMutation.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Submit Rejection
                  </Button>
                </div>
              </div>
            )}
          </div>

          {approveMutation.error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded p-3 flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5 gap-4" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  Error Approving Request
                </p>
                <p className="text-sm text-red-700">
                  {approveMutation.error instanceof Error
                    ? approveMutation.error.message
                    : "An unexpected error occurred"}
                </p>
              </div>
            </div>
          )}

          {rejectMutation.error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded p-3 flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5 gap-4" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  Error Rejecting Request
                </p>
                <p className="text-sm text-red-700">
                  {rejectMutation.error instanceof Error
                    ? rejectMutation.error.message
                    : "An unexpected error occurred"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
