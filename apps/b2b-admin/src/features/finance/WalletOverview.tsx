import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Building2,
    Search,
    MoreVertical,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    AlertTriangle,
    CreditCard,
    Plus,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { walletService, LedgerAccount } from '@/services/walletService';
import { PaymentTransactionDialog } from './dialogs/PaymentTransactionDialog';
import { toast } from 'sonner';

// Fetch all wallets - using a system-level query for admin overview
const fetchAllWallets = async (): Promise<LedgerAccount[]> => {
    // For admin overview, we fetch COMPANY wallets as an example
    // In production, this would be a separate "list all" endpoint
    try {
        const response = await fetch('http://localhost:3007/api/v1/ledger/COMPANY/all');
        const result = await response.json();
        return result.data || [];
    } catch {
        return [];
    }
};

export function WalletOverview() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = React.useState(false);
    const [adjustmentType, setAdjustmentType] = React.useState<'credit' | 'debit'>('credit');
    const [adjustmentAmount, setAdjustmentAmount] = React.useState('');
    const [adjustmentReference, setAdjustmentReference] = React.useState('');

    // Transfer form state
    const [isTransferModalOpen, setIsTransferModalOpen] = React.useState(false);
    const [fromAccountId, setFromAccountId] = React.useState('');
    const [toAccountId, setToAccountId] = React.useState('');
    const [transferAmount, setTransferAmount] = React.useState('');
    const [transferDescription, setTransferDescription] = React.useState('');

    // Payment transaction dialog
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = React.useState(false);
    const [preselectedAccountId, setPreselectedAccountId] = React.useState('');

    // Fetch wallets from live API
    const { data: wallets = [], isLoading } = useQuery({
        queryKey: ['ledger-wallets'],
        queryFn: fetchAllWallets,
    });

    // Transfer mutation
    const transferMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch('http://localhost:3007/api/v1/ledger/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromAccountId,
                    toAccountId,
                    amount: parseFloat(transferAmount),
                    description: transferDescription || 'Inter-account Transfer'
                })
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ledger-wallets'] });
            toast.success('Transfer completed successfully!');
            setIsTransferModalOpen(false);
            setFromAccountId('');
            setToAccountId('');
            setTransferAmount('');
            setTransferDescription('');
        },
        onError: (err: Error) => {
            toast.error(err.message);
        }
    });

    // Helper to determine wallet status
    const getWalletStatus = (balance: number): 'Active' | 'Low Balance' | 'Frozen' => {
        if (balance < 0) return 'Frozen';
        if (balance < 500) return 'Low Balance';
        return 'Active';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="relative w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search wallets by entity name..."
                        className="pl-10 h-11 rounded-xl border-gray-200"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => setIsPaymentDialogOpen(true)} className="rounded-xl h-11 bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Add Payment
                    </Button>
                    <Button onClick={() => setIsTransferModalOpen(true)} variant="outline" className="rounded-xl h-11 border-emerald-200 text-emerald-700 font-bold hover:bg-emerald-50">
                        <ArrowUpRight className="h-4 w-4 mr-2" />
                        Transfer Funds
                    </Button>
                    <Button variant="outline" className="rounded-xl h-11 border-gray-200 font-bold">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Low Balance ({wallets.filter(w => parseFloat(w.balance) < 500).length})
                    </Button>
                    <Button className="rounded-xl h-11 bg-gray-900 hover:bg-primary font-bold shadow-lg shadow-gray-200">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Wallet
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-lg rounded-3xl overflow-hidden bg-white">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead className="py-4 pl-6 font-bold text-gray-500 uppercase text-[10px] tracking-widest">Entity Account</TableHead>
                            <TableHead className="py-4 font-bold text-gray-500 uppercase text-[10px] tracking-widest">Type</TableHead>
                            <TableHead className="py-4 font-bold text-gray-500 uppercase text-[10px] tracking-widest text-right">Available Balance</TableHead>
                            <TableHead className="py-4 font-bold text-gray-500 uppercase text-[10px] tracking-widest text-right">Credit Limit</TableHead>
                            <TableHead className="py-4 font-bold text-gray-500 uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                            <TableHead className="py-4 pr-6 text-right font-bold text-gray-500 uppercase text-[10px] tracking-widest">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {wallets.map((wallet) => (
                            <TableRow key={wallet.id} className="hover:bg-gray-50/50 transition-colors group">
                                <TableCell className="pl-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 font-black text-sm">
                                            <Wallet className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{wallet.name}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">ID: {wallet.id.slice(0, 8)}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="rounded-lg font-bold border-gray-200 text-gray-600 bg-gray-50">
                                        {wallet.entityType}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="font-black text-gray-900 text-lg">
                                        {wallet.currency} {parseFloat(wallet.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="text-sm font-bold text-gray-400">
                                        {wallet.allowOverdraft ? 'Overdraft Allowed' : 'No Credit'}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    {(() => {
                                        const status = getWalletStatus(parseFloat(wallet.balance));
                                        return (
                                            <Badge className={`rounded-xl border-none font-bold ${status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                                                status === 'Low Balance' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {status}
                                            </Badge>
                                        );
                                    })()}
                                </TableCell>
                                <TableCell className="pr-6 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-2xl p-2 w-48 shadow-xl border-gray-100">
                                            <DropdownMenuItem onClick={() => setIsAdjustmentModalOpen(true)} className="rounded-xl gap-3 py-2.5 font-bold cursor-pointer">
                                                <ArrowUpRight className="h-4 w-4 text-emerald-600" /> Credit Adjustment
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setIsAdjustmentModalOpen(true)} className="rounded-xl gap-3 py-2.5 font-bold cursor-pointer">
                                                <ArrowDownRight className="h-4 w-4 text-red-600" /> Debit Adjustment
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="rounded-xl gap-3 py-2.5 font-bold cursor-pointer text-gray-600">
                                                <CreditCard className="h-4 w-4" /> View Transactions
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Adjustment Modal */}
            <Dialog open={isAdjustmentModalOpen} onOpenChange={setIsAdjustmentModalOpen}>
                <DialogContent className="max-w-md rounded-3xl overflow-hidden p-0 border-none shadow-2xl">
                    <div className="bg-gray-900 p-6 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black flex items-center gap-2">
                                <Wallet className="h-5 w-5 text-primary" />
                                Manual Adjustment
                            </DialogTitle>
                        </DialogHeader>
                    </div>
                    <div className="p-6 bg-white space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Type</label>
                                <select className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold">
                                    <option>Credit (Deposit)</option>
                                    <option>Debit (Charge)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Amount</label>
                                <Input type="number" placeholder="0.00" className="h-11 rounded-xl border-gray-200 font-bold" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Reference / Reason</label>
                            <Input placeholder="e.g. Bank Transfer Ref: #12345" className="h-11 rounded-xl border-gray-200" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Admin Note (Internal)</label>
                            <textarea className="w-full h-24 rounded-xl border border-gray-200 p-3 text-sm resize-none" placeholder="Add justification for audit..." />
                        </div>
                    </div>
                    <DialogFooter className="p-6 bg-gray-50 gap-3">
                        <Button variant="ghost" className="rounded-xl" onClick={() => setIsAdjustmentModalOpen(false)}>Cancel</Button>
                        <Button className="rounded-xl font-bold bg-gray-900 hover:bg-primary">Confirm Adjustment</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Transfer Modal */}
            <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
                <DialogContent className="max-w-md rounded-3xl overflow-hidden p-0 border-none shadow-2xl">
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black flex items-center gap-2">
                                <ArrowUpRight className="h-5 w-5" />
                                Inter-Account Transfer
                            </DialogTitle>
                        </DialogHeader>
                    </div>
                    <div className="p-6 bg-white space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">From Account</label>
                            <select
                                className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold"
                                value={fromAccountId}
                                onChange={(e) => setFromAccountId(e.target.value)}
                            >
                                <option value="">Select source account...</option>
                                {wallets.map((w) => (
                                    <option key={w.id} value={w.id}>{w.name} ({w.currency} {parseFloat(w.balance).toLocaleString()})</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">To Account</label>
                            <select
                                className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold"
                                value={toAccountId}
                                onChange={(e) => setToAccountId(e.target.value)}
                            >
                                <option value="">Select destination account...</option>
                                {wallets.filter(w => w.id !== fromAccountId).map((w) => (
                                    <option key={w.id} value={w.id}>{w.name} ({w.currency})</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Amount</label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                className="h-11 rounded-xl border-gray-200 font-bold"
                                value={transferAmount}
                                onChange={(e) => setTransferAmount(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                            <Input
                                placeholder="e.g. Monthly allocation"
                                className="h-11 rounded-xl border-gray-200"
                                value={transferDescription}
                                onChange={(e) => setTransferDescription(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="p-6 bg-gray-50 gap-3">
                        <Button variant="ghost" className="rounded-xl" onClick={() => setIsTransferModalOpen(false)}>Cancel</Button>
                        <Button
                            onClick={() => transferMutation.mutate()}
                            disabled={!fromAccountId || !toAccountId || !transferAmount || transferMutation.isPending}
                            className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700"
                        >
                            {transferMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Confirm Transfer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Payment Transaction Dialog */}
            <PaymentTransactionDialog
                open={isPaymentDialogOpen}
                onOpenChange={setIsPaymentDialogOpen}
                wallets={wallets}
                preselectedAccountId={preselectedAccountId}
            />
        </div>
    );
}
