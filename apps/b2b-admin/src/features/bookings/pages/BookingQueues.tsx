import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Clock,
  RefreshCw,
  Loader2,
  MoreVertical,
  Zap,
} from "lucide-react";
import { DataTable } from "@tripalfa/ui-components/ui/data-table";
import { Badge } from "@tripalfa/ui-components/ui/badge";
import { Button } from "@tripalfa/ui-components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@tripalfa/ui-components/ui/dropdown-menu";
import api from "@/shared/lib/api";

import FlightAmendmentWorkflow, {
  type FlightAmendmentRequest,
} from "../components/FlightAmendmentWorkflow";

type QueueItem = {
  id: string;
  reference: string;
  traveler: string;
  product: string;
  status: "Pending" | "Confirmed" | "Hold" | "Cancelled";
  priority: "high" | "medium" | "low";
  amount: number;
  currency: string;
  createdAt: string;
  channel: string;
};

type AdminBooking = {
  id?: string;
  queueId?: string;
  reference?: string;
  bookingRef?: string;
  traveler?: string;
  customerName?: string;
  product?: string;
  type?: string;
  status?: string;
  queueStatus?: string;
  priority?: string;
  amount?: number;
  total?: number;
  currency?: string;
  createdAt?: string;
  issuedDate?: string;
  channel?: string;
  source?: string;
};

const mockQueues: QueueItem[] = [
  {
    id: "Q-101",
    reference: "BK-9001",
    traveler: "Sarah Green",
    product: "Hotel",
    status: "Pending",
    priority: "high",
    amount: 420,
    currency: "USD",
    createdAt: "2024-02-01T10:32:00Z",
    channel: "API",
  },
  {
    id: "Q-102",
    reference: "BK-9002",
    traveler: "Adam Lee",
    product: "Flight",
    status: "Hold",
    priority: "medium",
    amount: 780,
    currency: "USD",
    createdAt: "2024-02-01T12:15:00Z",
    channel: "Manual",
  },
  {
    id: "Q-103",
    reference: "BK-9003",
    traveler: "Noor Khan",
    product: "Package",
    status: "Confirmed",
    priority: "low",
    amount: 1290,
    currency: "USD",
    createdAt: "2024-02-02T08:05:00Z",
    channel: "Online",
  },
];

const statusVariant: Record<
  QueueItem["status"],
  "default" | "secondary" | "destructive"
> = {
  Confirmed: "default",
  Pending: "secondary",
  Hold: "secondary",
  Cancelled: "destructive",
};

const nextStatusMap: Record<QueueItem["status"], QueueItem["status"][]> = {
  Pending: ["Confirmed", "Hold", "Cancelled"],
  Hold: ["Confirmed", "Pending", "Cancelled"],
  Confirmed: ["Hold", "Cancelled"],
  Cancelled: ["Pending"],
};

const priorityTone: Record<QueueItem["priority"], string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-emerald-100 text-emerald-700",
};

export default function BookingQueuesPage() {
  const [data, setData] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [selectedAmendment, setSelectedAmendment] =
    useState<FlightAmendmentRequest | null>(null);
  const [amendmentDialogOpen, setAmendmentDialogOpen] = useState(false);

  const handleStatusUpdate = async (
    queueId: string,
    newStatus: QueueItem["status"],
  ) => {
    setUpdating(queueId);
    setUpdateError(null);
    try {
      await api.post(`/admin/bookings/${queueId}/status`, {
        status: newStatus,
      });
      setData((prevData) =>
        prevData.map((item) =>
          item.id === queueId ? { ...item, status: newStatus } : item,
        ),
      );
    } catch (err) {
      console.error("Failed to update queue status", err);
      setUpdateError("Failed to update status. Please try again.");
    } finally {
      setUpdating(null);
    }
  };

  const handleOpenAmendment = async (queueItem: QueueItem) => {
    try {
      // Fetch amendment request details from API
      const res = await api.get(
        `/admin/bookings/${queueItem.id}/amendment-request`,
      );
      const amendmentData = res.data as FlightAmendmentRequest;
      setSelectedAmendment(amendmentData);
      setAmendmentDialogOpen(true);
    } catch (err) {
      console.error("Failed to load amendment request", err);
      setUpdateError("Unable to load amendment details. Please try again.");
    }
  };

  const columns: ColumnDef<QueueItem>[] = [
    {
      accessorKey: "reference",
      header: "Reference",
    },
    {
      accessorKey: "traveler",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Traveler
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "product",
      header: "Product",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={statusVariant[row.original.status]}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => (
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${priorityTone[row.original.priority]}`}
        >
          {row.original.priority.toUpperCase()}
        </span>
      ),
    },
    {
      accessorKey: "amount",
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }) => {
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: row.original.currency,
        }).format(row.original.amount);
        return <div className="text-right font-medium">{formatted}</div>;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
    },
    {
      accessorKey: "channel",
      header: "Channel",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const queueItem = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {nextStatusMap[queueItem.status]?.map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => handleStatusUpdate(queueItem.id, status)}
                  disabled={updating === queueItem.id}
                >
                  {updating === queueItem.id && (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  )}
                  Mark {status}
                </DropdownMenuItem>
              ))}
              {queueItem.product === "Flight" && (
                <DropdownMenuItem
                  onClick={() => handleOpenAmendment(queueItem)}
                  className="text-blue-600"
                >
                  <Zap className="mr-2 h-3 w-3" />
                  Amend Flight
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-blue-600">
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem className="text-muted-foreground">
                View Audit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  useEffect(() => {
    const controller = new AbortController();

    async function fetchQueues() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/admin/bookings/queues", {
          signal: controller.signal,
        });
        const raw =
          (res.data?.queues as AdminBooking[]) ||
          (res.data?.data as AdminBooking[]) ||
          [];
        const normalized: QueueItem[] = raw.map((q) => ({
          id: String(
            q.id ??
              q.queueId ??
              q.reference ??
              `tmp-${Math.random().toString(36).slice(2)}`,
          ),
          reference: q.reference ?? q.bookingRef ?? "N/A",
          traveler: q.traveler ?? q.customerName ?? "Unknown",
          product: q.product ?? q.type ?? "-",
          status:
            (q.status as QueueItem["status"]) ??
            (q.queueStatus as QueueItem["status"]) ??
            "Pending",
          priority: (q.priority as QueueItem["priority"]) ?? "medium",
          amount: Number(q.amount ?? q.total ?? 0),
          currency: q.currency ?? "USD",
          createdAt: q.createdAt ?? q.issuedDate ?? new Date().toISOString(),
          channel: q.channel ?? q.source ?? "unknown",
        }));

        setData(normalized.length ? normalized : mockQueues);
      } catch (err: unknown) {
        if (!(err instanceof Error && err.name === "CanceledError")) {
          console.error("Failed to load booking queues", err);
          setError("Unable to load booking queues. Showing fallback data.");
          setData(mockQueues);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchQueues();
    return () => controller.abort();
  }, []);

  const refreshQueues = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/admin/bookings/queues");
      const raw =
        (res.data?.queues as any[]) || (res.data?.data as any[]) || [];
      const normalized: QueueItem[] = raw.map((q) => ({
        id: String(
          q.id ??
            q.queueId ??
            q.reference ??
            `tmp-${Math.random().toString(36).slice(2)}`,
        ),
        reference: q.reference ?? q.bookingRef ?? "N/A",
        traveler: q.traveler ?? q.customerName ?? "Unknown",
        product: q.product ?? q.type ?? "-",
        status:
          (q.status as QueueItem["status"]) ??
          (q.queueStatus as QueueItem["status"]) ??
          "Pending",
        priority: (q.priority as QueueItem["priority"]) ?? "medium",
        amount: Number(q.amount ?? q.total ?? 0),
        currency: q.currency ?? "USD",
        createdAt: q.createdAt ?? q.issuedDate ?? new Date().toISOString(),
        channel: q.channel ?? q.source ?? "unknown",
      }));
      setData(normalized.length ? normalized : mockQueues);
    } catch (err) {
      console.error("Failed to refresh queues", err);
      setError("Unable to refresh queues. Showing cached data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Booking Queues
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor and action queued bookings, holds, and manual reviews.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/bookings/new/online">
            <Button variant="outline" size="sm">
              Start Online Booking
            </Button>
          </Link>
          <Link to="/bookings/new/offline">
            <Button variant="outline" size="sm">
              Manual Booking
            </Button>
          </Link>
          <Button
            size="sm"
            variant="secondary"
            onClick={refreshQueues}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />{" "}
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Queues synced from booking-service via API manager; falling back to
          mock data if unavailable.
        </div>
        {error && (
          <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {error}
          </div>
        )}
        {updateError && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {updateError}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUpdateError(null)}
              className="ml-2 font-semibold hover:underline"
            >
              Dismiss
            </Button>
          </div>
        )}
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading queues...
          </div>
        ) : (
          <DataTable columns={columns} data={data} searchKey="traveler" />
        )}
      </div>

      <FlightAmendmentWorkflow
        amendment={selectedAmendment}
        open={amendmentDialogOpen}
        onOpenChange={setAmendmentDialogOpen}
        onAmendmentComplete={(result) => {
          console.log("Amendment completed:", result);
          // Refresh queue after amendment
          refreshQueues();
          setAmendmentDialogOpen(false);
        }}
      />
    </div>
  );
}
