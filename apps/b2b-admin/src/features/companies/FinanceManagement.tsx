import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import {
    Plus,
    Search,
    CreditCard,
    Landmark,
    Globe,
    MoreHorizontal,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

import { BankAccount, PaymentGateway, VirtualCreditCard } from './types';
import { BankAccountDialog } from './dialogs/BankAccountDialog';
import { PaymentGatewayDialog } from './dialogs/PaymentGatewayDialog';
import { VirtualCardDialog } from './dialogs/VirtualCardDialog';
import { companyService } from './MockCompanyService';

interface FinanceManagementProps {
    companyId?: string;
}

export const FinanceManagement = ({ companyId: propCompanyId }: FinanceManagementProps = {}) => {
    const { companyId: paramCompanyId } = useParams();
    const companyId = propCompanyId || paramCompanyId;
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = React.useState("bank-accounts");

    // Dialog States
    const [isBankDialogOpen, setIsBankDialogOpen] = React.useState(false);
    const [isGatewayDialogOpen, setIsGatewayDialogOpen] = React.useState(false);
    const [isCardDialogOpen, setIsCardDialogOpen] = React.useState(false);

    // Editing States
    const [editingBank, setEditingBank] = React.useState<BankAccount | null>(null);
    const [editingGateway, setEditingGateway] = React.useState<PaymentGateway | null>(null);
    const [editingCard, setEditingCard] = React.useState<VirtualCreditCard | null>(null);

    // Queries
    const { data: bankAccounts = [], isLoading: isLoadingBanks } = useQuery({
        queryKey: ['bank-accounts', companyId],
        queryFn: () => companyService.getBankAccounts(companyId),
    });

    const { data: gateways = [], isLoading: isLoadingGateways } = useQuery({
        queryKey: ['payment-gateways', companyId],
        queryFn: () => companyService.getPaymentGateways(companyId),
    });

    const { data: cards = [], isLoading: isLoadingCards } = useQuery({
        queryKey: ['virtual-cards', companyId],
        queryFn: () => companyService.getVirtualCards(companyId),
    });

    // Mutations
    const bankMutation = useMutation({
        mutationFn: (data: any) => {
            if (editingBank) {
                return companyService.updateBankAccount(editingBank.id, data);
            }
            return companyService.createBankAccount({ ...data, companyId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
            toast.success(editingBank ? 'Bank account updated' : 'Bank account added');
            setIsBankDialogOpen(false);
            setEditingBank(null);
        },
    });

    const gatewayMutation = useMutation({
        mutationFn: (data: any) => {
            if (editingGateway) {
                return companyService.updatePaymentGateway(editingGateway.id, data);
            }
            return companyService.createPaymentGateway({ ...data, companyId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-gateways'] });
            toast.success(editingGateway ? 'Gateway updated' : 'Gateway added');
            setIsGatewayDialogOpen(false);
            setEditingGateway(null);
        },
    });

    const cardMutation = useMutation({
        mutationFn: (data: any) => {
            if (editingCard) {
                return companyService.updateVirtualCard(editingCard.id, data);
            }
            return companyService.createVirtualCard({ ...data, companyId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['virtual-cards'] });
            toast.success(editingCard ? 'Card updated' : 'Card requested');
            setIsCardDialogOpen(false);
            setEditingCard(null);
        },
    });

    // Columns Definitions
    const bankColumns: ColumnDef<BankAccount>[] = [
        {
            accessorKey: 'bankName',
            header: 'Bank Name',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        <Landmark className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">{row.original.bankName}</div>
                        <div className="text-sm text-gray-500">{row.original.accountName}</div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'accountNumber',
            header: 'Account Number',
            cell: ({ row }) => <span className="font-mono">{row.original.accountNumber}</span>,
        },
        {
            accessorKey: 'currency',
            header: 'Currency',
            cell: ({ row }) => <Badge variant="outline">{row.original.currency}</Badge>,
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
                        <DropdownMenuItem onClick={() => { setEditingBank(row.original); setIsBankDialogOpen(true); }}>
                            Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Remove Account</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    const gatewayColumns: ColumnDef<PaymentGateway>[] = [
        {
            accessorKey: 'provider',
            header: 'Provider',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                        <Globe className="h-5 w-5" />
                    </div>
                    <div className="font-medium text-gray-900 capitalize">{row.original.provider}</div>
                </div>
            ),
        },
        {
            accessorKey: 'merchantId',
            header: 'Merchant ID',
            cell: ({ row }) => <span className="font-mono text-sm">{row.original.merchantId}</span>,
        },
        {
            accessorKey: 'mode',
            header: 'Mode',
            cell: ({ row }) => (
                <Badge variant={row.original.isLive ? 'default' : 'secondary'}>
                    {row.original.isLive ? 'Live' : 'Sandbox'}
                </Badge>
            ),
        },
        {
            accessorKey: 'currencies',
            header: 'Supported Currencies',
            cell: ({ row }) => (
                <div className="flex gap-1">
                    {row.original.supportedCurrencies.map(c => (
                        <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                    ))}
                </div>
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
                        <DropdownMenuItem onClick={() => { setEditingGateway(row.original); setIsGatewayDialogOpen(true); }}>
                            Edit Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Disable</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    const cardColumns: ColumnDef<VirtualCreditCard>[] = [
        {
            accessorKey: 'cardholder',
            header: 'Cardholder',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                        <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">{row.original.cardholderName}</div>
                        <div className="text-sm text-gray-500">{row.original.provider} •••• {row.original.cardNumber.slice(-4)}</div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'limit',
            header: 'Credit Limit',
            cell: ({ row }) => (
                <div className="font-medium">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: row.original.currency }).format(row.original.creditLimit)}
                </div>
            ),
        },
        {
            accessorKey: 'expiry',
            header: 'Expires',
            cell: ({ row }) => row.original.expiryDate,
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
                        <DropdownMenuItem onClick={() => { setEditingCard(row.original); setIsCardDialogOpen(true); }}>
                            Edit Card
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Cancel Card</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Finance Settings</h2>
                    <p className="text-sm text-gray-500">Manage bank accounts, gateways, and virtual cards</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between mb-4">
                    <TabsList>
                        <TabsTrigger value="bank-accounts">Bank Accounts</TabsTrigger>
                        <TabsTrigger value="gateways">Payment Gateways</TabsTrigger>
                        <TabsTrigger value="virtual-cards">Virtual Cards</TabsTrigger>
                    </TabsList>

                    {activeTab === "bank-accounts" && (
                        <Button onClick={() => { setEditingBank(null); setIsBankDialogOpen(true); }}>
                            <Plus className="mr-2 h-4 w-4" /> Add Bank Account
                        </Button>
                    )}
                    {activeTab === "gateways" && (
                        <Button onClick={() => { setEditingGateway(null); setIsGatewayDialogOpen(true); }}>
                            <Plus className="mr-2 h-4 w-4" /> Add Gateway
                        </Button>
                    )}
                    {activeTab === "virtual-cards" && (
                        <Button onClick={() => { setEditingCard(null); setIsCardDialogOpen(true); }}>
                            <Plus className="mr-2 h-4 w-4" /> Request Card
                        </Button>
                    )}
                </div>

                <TabsContent value="bank-accounts">
                    <Card>
                        <CardHeader>
                            <CardTitle>Bank Accounts</CardTitle>
                            <CardDescription>Manage connected bank accounts for settlements</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable
                                columns={bankColumns}
                                data={bankAccounts}
                                isLoading={isLoadingBanks}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="gateways">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Gateways</CardTitle>
                            <CardDescription>Configure payment providers for transaction processing</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable
                                columns={gatewayColumns}
                                data={gateways}
                                isLoading={isLoadingGateways}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="virtual-cards">
                    <Card>
                        <CardHeader>
                            <CardTitle>Virtual Credit Cards</CardTitle>
                            <CardDescription>Manage virtual cards for corporate expenses</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable
                                columns={cardColumns}
                                data={cards}
                                isLoading={isLoadingCards}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <BankAccountDialog
                open={isBankDialogOpen}
                onOpenChange={setIsBankDialogOpen}
                onSubmit={(values) => bankMutation.mutate(values)}
                initialData={editingBank}
                isLoading={bankMutation.isPending}
            />

            <PaymentGatewayDialog
                open={isGatewayDialogOpen}
                onOpenChange={setIsGatewayDialogOpen}
                onSubmit={(values) => gatewayMutation.mutate(values)}
                initialData={editingGateway}
                isLoading={gatewayMutation.isPending}
            />

            <VirtualCardDialog
                open={isCardDialogOpen}
                onOpenChange={setIsCardDialogOpen}
                onSubmit={(values) => cardMutation.mutate(values)}
                initialData={editingCard}
                isLoading={cardMutation.isPending}
            />
        </div>
    );
};
