import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Plus,
  AlertCircle,
  Loader2,
  Eye,
  Trash2,
  MessageSquare,
  Filter,
} from 'lucide-react';
import { useCustomerOfflineRequests } from '@/hooks/useCustomerOfflineRequests';
import {
  RequestChangeModal,
  RequestApprovalFlow,
  RequestHistory,
  RequestStatus,
  RequestDetailSection,
} from '@/components/OfflineRequests';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OfflineChangeRequest, OfflineRequestStatus } from '@tripalfa/shared-types';

export default function MyOfflineRequests() {
  // State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date');
  const [selectedRequest, setSelectedRequest] = useState<OfflineChangeRequest | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [changeModalOpen, setChangeModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  // API Integration
  const { getMyRequests, submitChangeRequest, cancelRequest, trackStatus, loading, error } =
    useCustomerOfflineRequests();

  // Get booking ID from URL params or props
  // This should come from the current booking context
  const bookingId = selectedBookingId || 'current-booking-id';

  // Fetch Requests
  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ['my-offline-requests'],
    queryFn: async () => {
      try {
        const result = await getMyRequests({
          bookingId,
          limit: 50,
          offset: 0,
        });
        return result.requests || [];
      } catch (err) {
        console.error('Failed to fetch requests:', err);
        return [];
      }
    },
  });

  // Cancel Request Mutation
  const { mutate: handleCancelRequest, isPending: isCancelling } = useMutation({
    mutationFn: async (requestId: string) => {
      await cancelRequest(requestId, 'Customer requested cancellation');
    },
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Failed to cancel request:', error);
    },
  });

  // Filter & Search
  const filteredRequests = requests
    .filter((req) => {
      // Status filter
      if (statusFilter !== 'all' && req.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        req.id.toLowerCase().includes(query) ||
        req.originalBooking?.route?.toLowerCase().includes(query) ||
        req.originalBooking?.departureDate?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        return a.status.localeCompare(b.status);
      }
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case OfflineRequestStatus.PENDING_STAFF:
        return 'bg-blue-100 text-blue-800';
      case OfflineRequestStatus.PRICING_SUBMITTED:
        return 'bg-orange-100 text-orange-800';
      case OfflineRequestStatus.PENDING_CUSTOMER_APPROVAL:
        return 'bg-yellow-100 text-yellow-800';
      case OfflineRequestStatus.APPROVED:
        return 'bg-yellow-100 text-yellow-800';
      case OfflineRequestStatus.PAYMENT_PENDING:
        return 'bg-purple-100 text-purple-800';
      case OfflineRequestStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case OfflineRequestStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      case OfflineRequestStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case OfflineRequestStatus.PENDING_STAFF:
        return '⏳';
      case OfflineRequestStatus.PRICING_SUBMITTED:
        return '🔄';
      case OfflineRequestStatus.PENDING_CUSTOMER_APPROVAL:
        return '🔍';
      case OfflineRequestStatus.APPROVED:
        return '✅';
      case OfflineRequestStatus.PAYMENT_PENDING:
        return '💳';
      case OfflineRequestStatus.COMPLETED:
        return '✓';
      case OfflineRequestStatus.REJECTED:
        return '❌';
      case OfflineRequestStatus.CANCELLED:
        return '✗';
      default:
        return '•';
    }
  };

  // Stats
  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === OfflineRequestStatus.PENDING_STAFF || r.status === OfflineRequestStatus.PRICING_SUBMITTED).length,
    approved: requests.filter((r) => r.status === OfflineRequestStatus.APPROVED).length,
    completed: requests.filter((r) => r.status === OfflineRequestStatus.COMPLETED).length,
    rejected: requests.filter((r) => r.status === OfflineRequestStatus.REJECTED).length,
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Change Requests</h1>
        <p className="text-gray-600 mt-2">
          Track and manage your booking change requests. View approvals, pricing updates, and booking modifications.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-600 mt-1">Total Requests</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.pending}</p>
              <p className="text-sm text-blue-700 mt-1">Pending</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">{stats.approved}</p>
              <p className="text-sm text-yellow-700 mt-1">Awaiting Decision</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-sm text-green-700 mt-1">Completed</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
              <p className="text-sm text-red-700 mt-1">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by booking ID, route, or date..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={OfflineRequestStatus.PENDING_STAFF}>Pending Staff</SelectItem>
                <SelectItem value={OfflineRequestStatus.PRICING_SUBMITTED}>Pricing Submitted</SelectItem>
                <SelectItem value={OfflineRequestStatus.PENDING_CUSTOMER_APPROVAL}>Pending Customer Approval</SelectItem>
                <SelectItem value={OfflineRequestStatus.APPROVED}>Approved</SelectItem>
                <SelectItem value={OfflineRequestStatus.PAYMENT_PENDING}>Payment Pending</SelectItem>
                <SelectItem value={OfflineRequestStatus.COMPLETED}>Completed</SelectItem>
                <SelectItem value={OfflineRequestStatus.REJECTED}>Rejected</SelectItem>
                <SelectItem value={OfflineRequestStatus.CANCELLED}>Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'date' | 'status')}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Newest First</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>

            {/* New Request Button */}
            <Button
              onClick={() => setChangeModalOpen(true)}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Requests</CardTitle>
          <CardDescription>
            {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
              <span className="ml-2 text-gray-600">Loading your requests...</span>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-gray-600 mb-4">No requests found</p>
              <Button
                onClick={() => setChangeModalOpen(true)}
                variant="outline"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Your First Request
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Booking Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Price Change</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredRequests.map((request) => {
                    const priceChange =
                      (request.requestedChanges?.newTotalPrice || 0) -
                      (request.originalBooking?.totalPrice || 0);

                    return (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono text-sm">
                          {request.id.slice(0, 12).toUpperCase()}
                        </TableCell>

                        <TableCell className="text-sm">
                          <div>
                            <p className="font-medium text-gray-900">
                              {request.originalBooking?.route || 'N/A'}
                            </p>
                            <p className="text-gray-600 text-xs">
                              {request.originalBooking?.departureDate
                                ? new Date(request.originalBooking.departureDate).toLocaleDateString()
                                : 'N/A'}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusIcon(request.status)} {request.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-sm text-gray-600">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </TableCell>

                        <TableCell className={`font-medium text-sm ${
                          priceChange < 0
                            ? 'text-green-600'
                            : priceChange > 0
                              ? 'text-red-600'
                              : 'text-gray-600'
                        }`}>
                          {priceChange > 0 ? '+' : ''}
                          ${Math.abs(priceChange).toFixed(2)}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setDetailsModalOpen(true);
                              }}
                              className="gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>

                            {request.status !== OfflineRequestStatus.COMPLETED &&
                              request.status !== OfflineRequestStatus.REJECTED &&
                              request.status !== OfflineRequestStatus.CANCELLED && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleCancelRequest(request.id)
                                  }
                                  disabled={isCancelling}
                                  className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Cancel
                                </Button>
                              )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              Complete information about your booking change request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Status Overview */}
              <RequestStatus request={selectedRequest} />

              {/* Approval Flow (if applicable) */}
              {selectedRequest.status === OfflineRequestStatus.APPROVED && (
                <RequestApprovalFlow request={selectedRequest} />
              )}

              {/* Detail Comparison */}
              <RequestDetailSection request={selectedRequest} />

              {/* History */}
              <RequestHistory request={selectedRequest} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Request Modal */}
      <RequestChangeModal
        isOpen={changeModalOpen}
        onClose={() => setChangeModalOpen(false)}
        bookingDetails={{
          departureCity: 'JFK',
          arrivalCity: 'LHR',
          departureDate: new Date().toISOString().split('T')[0],
          returnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          passengers: {
            adults: 2,
            children: 1,
          },
        }}
        onSubmit={async (formData) => {
          try {
            // Map form data to CreateOfflineRequestPayload
            // Construct FlightItinerary from available information
            const newItinerary = {
              type: 'flight' as const,
              segments: [
                {
                  origin: formData.newRoute?.split('-')[0] || 'JFK',
                  destination: formData.newRoute?.split('-')[1] || 'LHR',
                  departureDate: formData.newDepartureDate || new Date().toISOString().split('T')[0],
                  arrivalDate: formData.newReturnDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                },
              ],
              passengers: [
                ...Array(formData.newAdultPassengers || 2).fill({ type: 'adult' as const }),
                ...Array(formData.newChildPassengers || 0).fill({ type: 'child' as const }),
              ].map((p, i) => ({
                firstName: `Passenger${i + 1}`,
                lastName: 'TBD',
                type: p.type,
              })),
            };

            const payload = {
              bookingId,
              bookingRef: 'booking-ref', // Should get from booking context
              requestType: 'flight_change' as const,
              requestedChanges: {
                serviceType: 'flight' as const,
                newItinerary,
                changeReason: formData.reasonForChange,
                customerNotes: formData.additionalNotes,
              },
              priority: (formData.priority || 'medium') as 'low' | 'medium' | 'high',
            };
            
            await submitChangeRequest(payload);
            refetch();
          } catch (error) {
            console.error('Failed to submit change request:', error);
            throw error;
          }
        }}
      />
    </div>
  );
}
