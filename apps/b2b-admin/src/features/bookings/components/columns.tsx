"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import api from "@/shared/lib/api"

import { Button } from "@tripalfa/ui-components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tripalfa/ui-components/ui/dropdown-menu"
import { Badge } from "@tripalfa/ui-components/ui/badge"

// This type is used to define the shape of our data.
export type Booking = {
  id: string
  reference: string
  status: "pending" | "confirmed" | "cancelled" | "failed"
  userEmail: string
  amount: number
  currency: string
  createdAt: string
  pnr?: string
  phone?: string
  supplier?: string
  channel?: string
  kind?: "flight" | "hotel" | "other"
  onHold?: boolean
}

export const columns: ColumnDef<Booking>[] = [
  {
    accessorKey: "reference",
    header: "Reference",
  },
  {
    accessorKey: "kind",
    header: "Type",
    cell: ({ row }) => {
      const kind = (row.getValue("kind") as string) || "—"
      return kind.charAt(0).toUpperCase() + kind.slice(1)
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge
          variant={
            status === "confirmed"
              ? "default" // default in shadcn is usually primary color
              : status === "pending"
              ? "secondary"
              : "destructive"
          }
        >
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "userEmail",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: row.original.currency,
      }).format(amount)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
        return new Date(row.getValue("createdAt")).toLocaleDateString()
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const booking = row.original
      const isFlight = booking.kind === "flight"
      const isHotel = booking.kind === "hotel"

      const actionCall = async (path: string, success: string) => {
        try {
          await api.post(path)
          alert(success)
        } catch (err) {
          console.error(`Action failed for ${path}`, err)
          alert("Action failed. Please retry or check logs.")
        }
      }

      const handle = (action: string) => {
        const base = `/admin/bookings/${booking.id}`
        switch (action) {
          case "view":
            window.location.href = `/bookings/${booking.id}`
            break
          case "cancel-flight":
            void actionCall(`${base}/cancel`, "Flight booking cancelled")
            break
          case "refund-flight":
            void actionCall(`${base}/refund`, "Flight booking refunded")
            break
          case "reissue-flight":
            void actionCall(`${base}/reissue`, "Flight booking re-issued")
            break
          case "pay-flight":
            void actionCall(`${base}/pay`, "Payment completed")
            break
          case "cancel-hotel":
            void actionCall(`${base}/cancel`, "Hotel booking cancelled")
            break
          case "amend-hotel":
            void actionCall(`${base}/amend`, "Hotel booking amendment submitted")
            break
          case "cancel-generic":
            void actionCall(`${base}/cancel`, "Booking cancelled")
            break
          default:
            break
        }
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>

            <DropdownMenuItem onClick={() => handle("view")}>
              View
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            {isFlight && (
              <>
                <DropdownMenuItem onClick={() => handle("cancel-flight")}>
                  Cancel (Flight)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handle("refund-flight")}>
                  Refund (Flight)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handle("reissue-flight")}>
                  Re-issue (Flight)
                </DropdownMenuItem>
                {booking.onHold && (
                  <DropdownMenuItem onClick={() => handle("pay-flight")}>
                    Pay (On hold)
                  </DropdownMenuItem>
                )}
              </>
            )}

            {isHotel && (
              <>
                <DropdownMenuItem onClick={() => handle("cancel-hotel")}>
                  Cancel (Hotel)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handle("amend-hotel")}>
                  Amend (Hotel)
                </DropdownMenuItem>
              </>
            )}

            {!isFlight && !isHotel && (
              <DropdownMenuItem onClick={() => handle("cancel-generic")}>
                Cancel
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
