import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@tripalfa/ui-components/ui/badge';

export type Booking = {
  id: string;
  reference: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'failed';
  userEmail: string;
  amount: number;
  currency: string;
  createdAt: string;
  pnr: string;
  phone: string;
  supplier: string;
  channel: string;
  kind: 'flight' | 'hotel' | 'other';
  onHold: boolean;
};

export const columns: ColumnDef<Booking>[] = [
  {
    accessorKey: 'reference',
    header: 'Reference',
  },
  {
    accessorKey: 'userEmail',
    header: 'Email',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <Badge
          variant={
            status === 'confirmed'
              ? 'default'
              : status === 'cancelled'
                ? 'destructive'
                : 'secondary'
          }
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'));
      const currency = row.original.currency;
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);
      return <div>{formatted}</div>;
    },
  },
  {
    accessorKey: 'kind',
    header: 'Type',
    cell: ({ row }) => {
      const kind = row.getValue('kind') as string;
      return (
        <Badge variant={kind === 'flight' ? 'default' : kind === 'hotel' ? 'secondary' : 'outline'}>
          {kind}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'));
      return <div>{date.toLocaleDateString()}</div>;
    },
  },
];
