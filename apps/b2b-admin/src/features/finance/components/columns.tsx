"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

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

export type Transaction = {
  id: string
  type: "deposit" | "withdrawal" | "booking_payment" | "refund"
  amount: number
  currency: string
  status: "completed" | "pending" | "failed"
  reference: string
  date: string
}

export const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
        return new Date(row.getValue("date")).toLocaleDateString()
    }
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
        const type = row.getValue("type") as string
        return <span className="capitalize">{type.replace("_", " ")}</span>
    }
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
      
      const isPositive = row.original.type === "deposit" || row.original.type === "refund"

      return <div className={`text-right font-medium ${isPositive ? "text-green-600" : ""}`}>{isPositive ? "+" : ""}{formatted}</div>
    },
  },
  {
      accessorKey: "reference",
      header: "Reference",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
            <Badge variant={status === "completed" ? "default" : status === "pending" ? "secondary" : "destructive"}>
                {status}
            </Badge>
        )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const transaction = row.original

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
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(transaction.id)}
            >
              Copy Transaction ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem>Download Receipt</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
