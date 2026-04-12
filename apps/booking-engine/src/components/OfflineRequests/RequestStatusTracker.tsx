import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDateTime } from '@tripalfa/shared-utils/date-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '../ui/button';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { OfflineChangeRequest, OfflineRequestStatus } from '@tripalfa/shared-types';
import offlineRequestApi from '@/api/offlineRequestApi';

interface RequestStatusTrackerProps {
  requestId: string;
  requestRef?: string;
  onStatusChange?: (status: string) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const STATUS_STEPS = [
  {
    key: OfflineRequestStatus.PENDING_STAFF,
    label: 'Request Submitted',
    description: 'Your change request has been received',
    icon: CheckCircle2,
  },
  {
    key: OfflineRequestStatus.PRICING_SUBMITTED,
    label: 'Pricing Submitted',
    description: 'Our team has submitted pricing for your request',
    icon: Clock,
  },
  {
    key: OfflineRequestStatus.PENDING_CUSTOMER_APPROVAL,
    label: 'Pending Customer Approval',
    description: 'Waiting for your approval of the pricing',
    icon: AlertCircle,
  },
  {
    key: OfflineRequestStatus.APPROVED,
    label: 'Approved',
    description: 'You have approved the changes',
    icon: CheckCircle2,
  },
  {
    key: OfflineRequestStatus.PAYMENT_PENDING,
    label: 'Payment Pending',
    description: 'Complete payment for the price difference',
    icon: Clock,
  },
  {
    key: OfflineRequestStatus.COMPLETED,
    label: 'Completed',
    description: 'Your request has been completed successfully',
    icon: CheckCircle2,
  },
];

export const RequestStatusTracker: React.FC<RequestStatusTrackerProps> = ({
  requestId,
  requestRef,
  onStatusChange,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}) => {
  const [expandedDetails, setExpandedDetails] = useState(false);
  const [lastStatus, setLastStatus] = useState<string | null>(null);

  // Fetch request details with auto-refresh
  const {
    data: request,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['offline-request', requestId],
    queryFn: () => offlineRequestApi.getRequest(requestId),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 10000, // 10 seconds
  });

  // Trigger callback when status changes
  useEffect(() => {
    if (request?.status && lastStatus !== request.status) {
      setLastStatus(request.status);
      onStatusChange?.(request.status);
    }
  }, [request?.status]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      [OfflineRequestStatus.PENDING_STAFF]: {
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: <Clock className="w-4 h-4" />,
        label: '⏳ Pending Staff Review',
      },
      [OfflineRequestStatus.PRICING_SUBMITTED]: {
        color: 'bg-orange-100 text-orange-800 border-orange-300',
        icon: <AlertCircle className="w-4 h-4" />,
        label: '🔍 Under Review',
      },
      [OfflineRequestStatus.PENDING_CUSTOMER_APPROVAL]: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: <AlertCircle className="w-4 h-4" />,
        label: '✓ Pricing Available',
      },
      [OfflineRequestStatus.APPROVED]: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: <CheckCircle2 className="w-4 h-4" />,
        label: '✓ Approved',
      },
      [OfflineRequestStatus.PAYMENT_PENDING]: {
        color: 'bg-purple-100 text-purple-800 border-purple-300',
        icon: <Clock className="w-4 h-4" />,
        label: '💳 Payment Pending',
      },
      [OfflineRequestStatus.COMPLETED]: {
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: <CheckCircle2 className="w-4 h-4" />,
        label: '✓ Completed',
      },
      [OfflineRequestStatus.REJECTED]: {
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: <XCircle className="w-4 h-4" />,
        label: '✗ Rejected',
      },
      [OfflineRequestStatus.CANCELLED]: {
        color: 'bg-muted text-foreground border-border',
        icon: <XCircle className="w-4 h-4" />,
        label: '✗ Cancelled',
      },
    };

    const config = statusConfig[status] || {
      color: 'bg-muted text-foreground border-border',
      icon: <Clock className="w-4 h-4" />,
      label: status.replace(/_/g, ' ').toUpperCase(),
    };

    return (
      <Badge className={`${config.color} border flex items-center gap-2 px-3 py-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getStepStatus = (stepKey: string, currentStatus: string) => {
    const statusOrder = [
      OfflineRequestStatus.PENDING_STAFF,
      OfflineRequestStatus.PRICING_SUBMITTED,
      OfflineRequestStatus.PENDING_CUSTOMER_APPROVAL,
      OfflineRequestStatus.APPROVED,
      OfflineRequestStatus.PAYMENT_PENDING,
      OfflineRequestStatus.COMPLETED,
    ];

    const stepIndex = statusOrder.indexOf(stepKey);
    const currentIndex = statusOrder.indexOf(currentStatus);

    if (stepIndex < currentIndex) {
      return 'completed';
    } else if (stepIndex === currentIndex) {
      return 'active';
    } else {
      return 'pending';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center gap-4">
          <div className="animate-spin">
            <RefreshCw className="w-6 h-6 text-indigo-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !request) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-8 flex gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5 gap-4" />
          <div>
            <p className="font-semibold text-red-900">Unable to Load Request Status</p>
            <p className="text-sm text-red-700 mt-1">
              {error instanceof Error
                ? error.message
                : 'An error occurred while loading the request.'}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div>
              <CardTitle>Change Request Status</CardTitle>
              <CardDescription>
                Request Reference: {requestRef || request.requestRef}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => refetch()} className="h-8 w-8">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between">
            <div>
              {getStatusBadge(request.status)}
              <p className="text-sm text-muted-foreground mt-3">
                Submitted on {request.createdAt ? formatDateTime(request.createdAt) : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative space-y-6">
            {STATUS_STEPS.map((step, index) => {
              const status = getStepStatus(step.key, request.status);
              const Icon = step.icon;
              const isCompleted = status === 'completed';
              const isActive = status === 'active';
              const isPending = status === 'pending';

              return (
                <div key={step.key} className="relative">
                  {/* Connector line */}
                  {index < STATUS_STEPS.length - 1 && (
                    <div
                      className={`absolute left-6 top-16 w-1 h-12 ${
                        isCompleted || isActive ? 'bg-green-500' : 'bg-muted'
                      }`}
                    />
                  )}

                  {/* Step */}
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? 'bg-green-100 text-green-700'
                            : isActive
                              ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300'
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-2 gap-4">
                      <div>
                        <h4
                          className={`font-semibold ${
                            isCompleted || isActive ? 'text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          {step.label}
                        </h4>
                        <p
                          className={`text-sm ${
                            isCompleted || isActive
                              ? 'text-muted-foreground'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {step.description}
                        </p>

                        {/* Timeline dates from request */}
                        {step.key === OfflineRequestStatus.PENDING_STAFF && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {request.timeline?.requestedAt
                              ? formatDateTime(request.timeline.requestedAt)
                              : 'N/A'}
                          </p>
                        )}
                        {step.key === OfflineRequestStatus.PRICING_SUBMITTED && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {request.timeline?.staffPricedAt
                              ? formatDateTime(request.timeline.staffPricedAt)
                              : 'In Progress'}
                          </p>
                        )}
                        {step.key === OfflineRequestStatus.PENDING_CUSTOMER_APPROVAL && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {request.timeline?.customerNotifiedAt
                              ? formatDateTime(request.timeline.customerNotifiedAt)
                              : 'Pending'}
                          </p>
                        )}
                        {step.key === OfflineRequestStatus.APPROVED && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {request.timeline?.customerApprovedAt
                              ? formatDateTime(request.timeline.customerApprovedAt)
                              : 'Pending'}
                          </p>
                        )}
                        {step.key === OfflineRequestStatus.PAYMENT_PENDING && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {request.timeline?.paymentCompletedAt
                              ? formatDateTime(request.timeline.paymentCompletedAt)
                              : 'Pending'}
                          </p>
                        )}
                        {step.key === OfflineRequestStatus.COMPLETED && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {request.timeline?.completedAt
                              ? formatDateTime(request.timeline.completedAt)
                              : 'Pending'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Details Section */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setExpandedDetails(!expandedDetails)}>
          <div className="flex justify-between items-center gap-4">
            <CardTitle className="text-base">Request Details</CardTitle>
            {expandedDetails ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
        </CardHeader>
        {expandedDetails && (
          <CardContent className="space-y-3 border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Request Type</p>
                <p className="font-medium">
                  {request.requestType.replace(/_/g, ' ').toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Priority</p>
                <p className="font-medium">{request.priority?.toUpperCase() || 'MEDIUM'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Booking Reference</p>
                <p className="font-medium">{request.bookingRef}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="font-medium text-sm">
                  {request.createdAt ? formatDateTime(request.createdAt) : 'N/A'}
                </p>
              </div>
            </div>

            {request.staffPricing && (
              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground mb-2">Staff Pricing</p>
                <div className="bg-muted/50 rounded p-3 space-y-2">
                  <div className="flex justify-between text-sm gap-4">
                    <span>Base Fare:</span>
                    <span className="font-medium">${request.staffPricing.newBaseFare || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm gap-4">
                    <span>Taxes:</span>
                    <span className="font-medium">${request.staffPricing.newTaxes || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t pt-1 gap-4">
                    <span>Total:</span>
                    <span>${request.staffPricing.newTotalPrice}</span>
                  </div>
                </div>
              </div>
            )}

            {request.priceDifference && (
              <div className="pt-3 border-t bg-yellow-50 rounded p-3">
                <p className="text-xs text-muted-foreground mb-2">Price Difference</p>
                <p className="text-lg font-bold text-yellow-800">
                  ${request.priceDifference.totalDiff}
                </p>
              </div>
            )}

            {request.requestedChanges?.changeReason && (
              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground mb-2">Reason for Change</p>
                <p className="text-sm text-foreground">{request.requestedChanges.changeReason}</p>
              </div>
            )}

            {request.internalNotes && request.internalNotes.length > 0 && (
              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground mb-2">Internal Notes</p>
                <ul className="space-y-2">
                  {request.internalNotes.map((note, idx) => (
                    <li key={idx} className="text-sm text-foreground">
                      • {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900 leading-relaxed">
          <strong>What's happening?</strong> Our team is reviewing your request and checking
          availability with suppliers. You'll receive a notification with pricing details within 24
          hours. You can then approve or reject the changes. Once approved, you'll proceed to
          payment.
        </p>
      </div>
    </div>
  );
};
