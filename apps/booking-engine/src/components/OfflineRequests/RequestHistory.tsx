import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
} from "lucide-react";
import { AuditLog, OfflineChangeRequest } from "@tripalfa/shared-types";

interface RequestHistoryProps {
  request: OfflineChangeRequest;
  auditLogs?: AuditLog[];
}

export const RequestHistory = ({
  request,
  auditLogs = [],
}: RequestHistoryProps) => {
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "submitted":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "under_review":
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "rejected":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "note_added":
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      case "price_adjusted":
        return <DollarSign className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "submitted":
        return "Request Submitted";
      case "under_review":
        return "Moved to Review";
      case "approved":
        return "Request Approved";
      case "rejected":
        return "Request Rejected";
      case "accepted":
        return "Changes Accepted";
      case "declined":
        return "Changes Declined";
      case "completed":
        return "Booking Updated";
      case "note_added":
        return "Note Added";
      case "price_adjusted":
        return "Price Adjusted";
      default:
        return action.replaceAll("_", " ");
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "submitted":
      case "under_review":
        return "bg-blue-50 border-blue-200";
      case "approved":
      case "accepted":
      case "completed":
        return "bg-green-50 border-green-200";
      case "rejected":
      case "declined":
        return "bg-red-50 border-red-200";
      case "note_added":
        return "bg-purple-50 border-purple-200";
      case "price_adjusted":
        return "bg-amber-50 border-amber-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const renderLogDetails = (log: AuditLog) => {
    const details = (log.details as Record<string, any>) || {};

    return (
      <div className="space-y-2 text-sm">
        {log.action === "price_adjusted" && (
          <div className="grid grid-cols-2 gap-2">
            {details.oldPrice && (
              <div>
                <p className="text-gray-600 text-xs">Old Price</p>
                <p className="font-medium text-gray-900">
                  ${details.oldPrice.toFixed(2)}
                </p>
              </div>
            )}
            {details.newPrice && (
              <div>
                <p className="text-gray-600 text-xs">New Price</p>
                <p className="font-medium text-gray-900">
                  ${details.newPrice.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        )}

        {log.action === "note_added" && details.note && (
          <div className="bg-white rounded p-2 border border-gray-200">
            <p className="text-gray-700 italic">{details.note}</p>
          </div>
        )}

        {log.action === "submitted" && details.changes && (
          <div className="space-y-2">
            <p className="text-gray-600 text-xs font-medium">
              Requested Changes:
            </p>
            {details.changes.newDepartureDate && (
              <p className="text-gray-700">
                <span className="text-gray-600">• New Departure: </span>
                {new Date(
                  details.changes.newDepartureDate,
                ).toLocaleDateString()}
              </p>
            )}
            {details.changes.newRoute && (
              <p className="text-gray-700">
                <span className="text-gray-600">• New Route: </span>
                {details.changes.newRoute}
              </p>
            )}
            {details.changes.reason && (
              <p className="text-gray-700">
                <span className="text-gray-600">• Reason: </span>
                {details.changes.reason}
              </p>
            )}
          </div>
        )}

        {log.action === "approved" && (
          <div className="space-y-2">
            <p className="text-gray-600 text-xs font-medium">
              Approval Summary:
            </p>
            {details.approvalNotes && (
              <p className="text-gray-700">
                <span className="text-gray-600">• Notes: </span>
                {details.approvalNotes}
              </p>
            )}
            {details.newPrice !== undefined && (
              <p className="text-gray-700">
                <span className="text-gray-600">• Final Price: </span>$
                {details.newPrice.toFixed(2)}
              </p>
            )}
          </div>
        )}

        {log.action === "rejected" && details.reason && (
          <div className="bg-white rounded p-2 border border-gray-200">
            <p className="text-gray-600 text-xs font-medium mb-1">
              Rejection Reason:
            </p>
            <p className="text-gray-700">{details.reason}</p>
          </div>
        )}

        {log.action === "completed" && details.bookingUpdated && (
          <div className="space-y-2">
            <p className="text-gray-600 text-xs font-medium">
              Update Confirmation:
            </p>
            {details.newFlights && (
              <p className="text-gray-700">
                <span className="text-gray-600">• New Flights Assigned</span>
              </p>
            )}
            {details.ticketsGenerated && (
              <p className="text-gray-700">
                <span className="text-gray-600">• New E-Tickets Generated</span>
              </p>
            )}
          </div>
        )}

        {!log.details && (
          <p className="text-gray-500 italic">No additional details</p>
        )}
      </div>
    );
  };

  // Combine request status changes with audit logs
  const timeline = [
    {
      id: `status-${request.status}`,
      timestamp: request.updatedAt,
      action: request.status,
      actor: "System",
      details: null,
      type: "status",
    },
    ...(auditLogs?.map((log) => ({
      id: log.id,
      timestamp: log.createdAt,
      action: log.action,
      actor:
        log.actorId === "system" ? "System" : `Staff Member (${log.actorId})`,
      details: log.details,
      type: "audit",
    })) || []),
  ].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Request History</CardTitle>
        <CardDescription>
          Timeline of all status changes, approvals, and staff updates
        </CardDescription>
      </CardHeader>

      <CardContent>
        {timeline.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No history to display yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {timeline.map((entry, index) => (
              <div key={entry.id} className="relative">
                {/* Timeline line */}
                {index !== timeline.length - 1 && (
                  <div className="absolute left-4 top-12 w-0.5 h-8 bg-gray-200" />
                )}

                {/* Timeline entry */}
                <div
                  className={`border rounded-lg p-3 ${getActionColor(entry.action)}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1 gap-4">
                      {getActionIcon(entry.action)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 gap-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-gray-900">
                            {getActionLabel(entry.action)}
                          </p>
                          <p className="text-sm text-gray-600 mt-0.5">
                            {new Date(entry.timestamp).toLocaleString()} •{" "}
                            {entry.actor}
                          </p>
                        </div>

                        {/* Badge */}
                        {entry.type === "status" && (
                          <Badge className="flex-shrink-0 gap-4">
                            {entry.action.toUpperCase()}
                          </Badge>
                        )}
                      </div>

                      {/* Details */}
                      {entry.details && (
                        <div className="mt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleLogExpansion(entry.id)}
                            className="text-xs px-0 h-auto p-0"
                          >
                            {expandedLogs.has(entry.id) ? (
                              <>
                                <ChevronUp className="w-4 h-4 mr-1" />
                                Hide Details
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4 mr-1" />
                                Show Details
                              </>
                            )}
                          </Button>

                          {expandedLogs.has(entry.id) && (
                            <div className="mt-3 pt-3 border-t border-gray-300/50">
                              {renderLogDetails(entry as any)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Documents Section */}
        {request.status === "completed" && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documents
            </h4>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <FileText className="w-4 h-4 mr-2" />
                E-Ticket
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <FileText className="w-4 h-4 mr-2" />
                Receipt & Confirmation
              </Button>
              {request.requestedChanges?.newTotalPrice &&
                request.requestedChanges.newTotalPrice !==
                  request.originalBooking?.totalPrice && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Price Adjustment Invoice
                  </Button>
                )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
