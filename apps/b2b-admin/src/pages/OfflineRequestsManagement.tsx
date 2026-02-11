import { useState, useEffect, useCallback } from 'react';
import { useOfflineRequests } from '@/hooks/useOfflineRequests';
import { RequestQueueTable } from '@/components/OfflineRequests/RequestQueueTable';
import { PricingSubmissionForm } from '@/components/OfflineRequests/PricingSubmissionForm';
import { RequestDetailModal } from '@/components/OfflineRequests/RequestDetailModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { OfflineChangeRequest } from '@tripalfa/shared-types';

export const OfflineRequestsPage = () => {
  const {
    queue,
    currentRequest,
    auditLog,
    loading,
    error,
    pagination,
    fetchQueue,
    getRequest,
    submitPricing,
    getAuditLog,
    cancelRequest,
    addNote,
  } = useOfflineRequests();

  // UI State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPricingFormOpen, setIsPricingFormOpen] = useState(false);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isNoteSubmitting, setIsNoteSubmitting] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  // Initial load
  useEffect(() => {
    loadQueue();
  }, []);

  // Load queue with filters
  const loadQueue = useCallback(
    async (page = 1) => {
      try {
        await fetchQueue({
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
          page,
          pageSize: 50,
        });
        setCurrentPage(page);
      } catch (err) {
        console.error('Failed to load queue:', err);
      }
    },
    [fetchQueue, statusFilter, priorityFilter]
  );

  // Handle request selection
  const handleSelectRequest = useCallback(
    async (request: OfflineChangeRequest) => {
      try {
        await getRequest(request.id);
        await getAuditLog(request.id);
        setIsDetailModalOpen(true);
      } catch (err) {
        console.error('Failed to load request details:', err);
      }
    },
    [getRequest, getAuditLog]
  );

  // Handle pricing submission
  const handlePricingSubmit = useCallback(
    async (request: OfflineChangeRequest) => {
      await getRequest(request.id);
      setIsPricingFormOpen(true);
    },
    [getRequest]
  );

  // Handle pricing form submission
  const handlePricingFormSubmit = useCallback(
    async (baseFare: number, taxes: number, fees: number, notes?: string) => {
      if (!currentRequest) return;

      try {
        await submitPricing(currentRequest.id, baseFare, taxes, fees, notes);
        setIsPricingFormOpen(false);
      } catch (err) {
        console.error('Failed to submit pricing:', err);
      }
    },
    [currentRequest, submitPricing]
  );

  // Handle add note
  const handleAddNote = useCallback(async () => {
    if (!currentRequest || !noteText.trim()) return;

    setIsNoteSubmitting(true);
    try {
      await addNote(currentRequest.id, noteText);
      setNoteText('');
      setIsAddNoteOpen(false);
      // Refresh audit log
      await getAuditLog(currentRequest.id);
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setIsNoteSubmitting(false);
    }
  }, [currentRequest, noteText, addNote, getAuditLog]);

  // Handle cancel request
  const handleCancelRequest = useCallback(async () => {
    if (!currentRequest || !cancelReason.trim()) return;

    try {
      await cancelRequest(currentRequest.id, cancelReason);
      setCancelReason('');
      setIsDetailModalOpen(false);
      await loadQueue();
    } catch (err) {
      console.error('Failed to cancel request:', err);
    }
  }, [currentRequest, cancelReason, cancelRequest, loadQueue]);

  // Stats calculation
  const stats = {
    total: pagination.total,
    pending: queue.filter((r) => r.status === 'pending').length,
    submitted: queue.filter((r) => r.status === 'submitted').length,
    approved: queue.filter((r) => r.status === 'approved').length,
    completed: queue.filter((r) => r.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900">Offline Booking Requests</h1>
          <p className="text-gray-600">Manage customer change requests and submission pricing</p>
        </div>
        <Button
          onClick={() => loadQueue(1)}
          variant="outline"
          className="gap-2"
          disabled={loading}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-600">Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-600">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority-filter">Priority</Label>
              <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val)}>
                <SelectTrigger id="priority-filter">
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => loadQueue(1)}
                className="w-full"
                disabled={loading}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Error Loading Requests</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Queue Table */}
      <Card>
        <CardHeader>
          <CardTitle>Request Queue</CardTitle>
          <CardDescription>
            Showing {queue.length} of {pagination.total} requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RequestQueueTable
            requests={queue}
            onSelectRequest={handleSelectRequest}
            onPricingSubmit={handlePricingSubmit}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => loadQueue(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || loading}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => loadQueue(Math.min(pagination.totalPages, currentPage + 1))}
            disabled={currentPage === pagination.totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}

      {/* Detail Modal */}
      <RequestDetailModal
        request={currentRequest}
        auditLog={auditLog}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setIsPricingFormOpen(false);
          setIsAddNoteOpen(false);
        }}
        onAddNote={() => setIsAddNoteOpen(true)}
      />

      {/* Pricing Form Modal */}
      <Dialog open={isPricingFormOpen} onOpenChange={setIsPricingFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Pricing for Request {currentRequest?.id}</DialogTitle>
          </DialogHeader>
          {currentRequest && (
            <PricingSubmissionForm
              request={currentRequest}
              onSubmit={handlePricingFormSubmit}
              onCancel={() => setIsPricingFormOpen(false)}
              isLoading={loading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Note Modal */}
      <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Internal Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="note">Note (Staff Only)</Label>
              <textarea
                id="note"
                className="w-full min-h-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add an internal note about this request..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddNoteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote} disabled={!noteText.trim() || isNoteSubmitting}>
              {isNoteSubmitting ? 'Adding...' : 'Add Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
