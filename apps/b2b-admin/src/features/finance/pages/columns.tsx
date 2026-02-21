import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@tripalfa/ui-components/ui/badge"

export type FinanceRecord = {
  id: string
  type: "invoice" | "payment" | "refund" | "charge"
  reference: string
  amount: number
  currency: string
  status: "pending" | "completed" | "failed"
  date: string
  description: string
}

export const columns: ColumnDef<FinanceRecord>[] = [
  {
    accessorKey: "reference",
    header: "Reference",
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string
      return (
        <Badge variant={type === "payment" ? "default" : type === "invoice" ? "secondary" : "outline"}>
          {type}
        </Badge>
      )
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const currency = row.original.currency
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(amount)
      return <div>{formatted}</div>
    },
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
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"))
      return <div>{date.toLocaleDateString()}</div>
    },
  },
  {
    accessorKey: "description",
    header: "Description",
  },
]
