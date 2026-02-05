import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import {
    Plus,
    Search,
    Filter,
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    CreditCard,
    DollarSign,
    MoreHorizontal,
    TrendingUp,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

import { WalletAccount, WalletTransaction } from './types';
import { WalletTransferDialog } from './dialogs/WalletTransferDialog';
import { companyService } from './MockCompanyService';

interface CompanyWalletManagementProps {
    companyId?: string;
}

export const CompanyWalletManagement = ({ companyId: propCompanyId }: CompanyWalletManagementProps = {}) => {
    const { companyId: paramCompanyId } = useParams();
    const companyId = propCompanyId || paramCompanyId;
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isTransferOpen, setIsTransferOpen] = React.useState(false);

    // Queries
    const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery({
        queryKey: ['wallet-accounts', companyId],
        queryFn: () => companyService.getWalletAccounts(companyId),
    });

    const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
        queryKey: ['wallet-transactions', companyId],
        queryFn: () => companyService.getWalletTransactions(),
    });

    // Mutations
    const transferMutation = useMutation({
        mutationFn: (data: any) => companyService.createWalletTransfer(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wallet-accounts'] });
            queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
            toast.success('Transfer initialized successfully');
            setIsTransferOpen(false);
        },
    });

    // Columns
    const accountColumns: ColumnDef<WalletAccount>[] = [
        {
            accessorKey: 'name',
            header: 'Account Name',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">{row.original.name}</div>
                        <div className="text-sm text-gray-500">{row.original.walletId}</div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'balance',
            header: 'Available Balance',
            cell: ({ row }) => (
                <div className="font-semibold text-gray-900">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: row.original.currency }).format(row.original.balance)}
                </div>
            ),
        },
        {
            accessorKey: 'branch',
            header: 'Assigned Branch',
            cell: ({ row }) => (
                row.original.branchName ? (
                    <Badge variant="outline">{row.original.branchName}</Badge>
                ) : (
                    <span className="text-gray-400 text-sm">Global</span>
                )
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant="secondary" className={row.original.status === 'active' ? "bg-green-100 text-green-800 hover:bg-green-100 capitalize" : "capitalize"}>
                    {row.original.status}
                </Badge>
            ),
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setIsTransferOpen(true)}>
                            Transfer Funds
                        </DropdownMenuItem>
                        <DropdownMenuItem>View Statement</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                            Freeze Account
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    const transactionColumns: ColumnDef<WalletTransaction>[] = [
        {
            accessorKey: 'date',
            header: 'Date',
            cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
        },
        {
            accessorKey: 'description',
            header: 'Description',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${row.original.toAccountId === '1' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                        {row.original.toAccountId === '1' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">
                            {row.original.toAccountId === '1' ? `Received from ${row.original.fromAccountName}` : `Sent to ${row.original.toAccountName}`}
                        </div>
                        <div className="text-xs text-gray-500">{row.original.note}</div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }) => (
                <span className={`font-medium ${row.original.toAccountId === '1' ? 'text-green-600' : 'text-gray-900'
                    }`}>
                    {row.original.toAccountId === '1' ? '+' : '-'}
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: row.original.currency }).format(row.original.amount)}
                </span>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant="outline" className="capitalize">
                    {row.original.status}
                </Badge>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Wallet & Transactions</h2>
                    <p className="text-sm text-gray-500">Manage corporate wallets and fund transfers</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Top-up Wallet
                    </Button>
                    <Button onClick={() => setIsTransferOpen(true)}>
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        Transfer Funds
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$73,000.00</div>
                        <p className="text-xs text-muted-foreground">
                            Across all wallets
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$12,450.00</div>
                        <p className="text-xs text-muted-foreground">
                            +15% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Wallets</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{accounts.length}</div>
                        <p className="text-xs text-muted-foreground">
                            For different branches/depts
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Wallet Accounts */}
            <Card>
                <CardHeader>
                    <CardTitle>Wallet Accounts</CardTitle>
                    <CardDescription>All wallets associated with this company</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        columns={accountColumns}
                        data={accounts}
                        isLoading={isLoadingAccounts}
                    />
                </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Latest fund movements and payments</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        columns={transactionColumns}
                        data={transactions}
                        isLoading={isLoadingTransactions}
                    />
                </CardContent>
            </Card>

            <WalletTransferDialog
                open={isTransferOpen}
                onOpenChange={setIsTransferOpen}
                onSubmit={(values) => transferMutation.mutate(values)}
                accounts={accounts}
                isLoading={transferMutation.isPending}
            />
        </div>
    );
};
