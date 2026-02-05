import React from 'react';
import {
    Receipt,
    Search,
    Download,
    Printer,
    Mail,
    MoreVertical,
    FileText,
    Calendar,
    CheckCircle2,
    Clock,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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
    DialogTrigger,
} from '@/components/ui/dialog';

interface Invoice {
    id: string;
    invoiceNumber: string;
    recipient: string;
    recipientType: 'Company' | 'Subagent';
    date: string;
    dueDate: string;
    amount: number;
    status: 'Paid' | 'Unpaid' | 'Overdue';
}

export function InvoiceManagement() {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedInvoice, setSelectedInvoice] = React.useState<Invoice | null>(null);

    const invoices: Invoice[] = [
        { id: '1', invoiceNumber: 'INV-2024-001', recipient: 'TravelPro International', recipientType: 'Company', date: '2024-03-01', dueDate: '2024-03-15', amount: 5000.00, status: 'Paid' },
        { id: '2', invoiceNumber: 'INV-2024-002', recipient: 'Al Rayan Travels', recipientType: 'Subagent', date: '2024-03-10', dueDate: '2024-03-24', amount: 350.50, status: 'Unpaid' },
        { id: '3', invoiceNumber: 'INV-2024-003', recipient: 'Global Wings LLC', recipientType: 'Subagent', date: '2024-02-15', dueDate: '2024-02-28', amount: 1200.00, status: 'Overdue' },
    ];

    return (
        <div className="space-y-6">
            {/* Actions Bar */}
            <div className="flex justify-between items-center">
                <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search invoice # or recipient..."
                        className="pl-10 h-11 rounded-xl border-gray-200"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl h-11 border-gray-200 font-bold">
                        Generate SOA
                    </Button>
                    <Button className="rounded-xl h-11 bg-gray-900 hover:bg-primary font-bold shadow-lg shadow-gray-200">
                        <Receipt className="h-4 w-4 mr-2" /> New Invoice
                    </Button>
                </div>
            </div>

            {/* Invoices Table */}
            <Card className="border-none shadow-lg rounded-3xl overflow-hidden bg-white">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            <TableHead className="py-4 pl-6 font-bold text-gray-500 uppercase text-[10px] tracking-widest">Invoice Details</TableHead>
                            <TableHead className="py-4 font-bold text-gray-500 uppercase text-[10px] tracking-widest">Recipient</TableHead>
                            <TableHead className="py-4 font-bold text-gray-500 uppercase text-[10px] tracking-widest">Due Date</TableHead>
                            <TableHead className="py-4 font-bold text-gray-500 uppercase text-[10px] tracking-widest text-right">Amount</TableHead>
                            <TableHead className="py-4 font-bold text-gray-500 uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                            <TableHead className="py-4 pr-6 text-right font-bold text-gray-500 uppercase text-[10px] tracking-widest">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.map((inv) => (
                            <TableRow key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                                <TableCell className="pl-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900">{inv.invoiceNumber}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Issued: {inv.date}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{inv.recipient}</p>
                                        <Badge variant="outline" className="mt-1 rounded-md border-gray-100 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider px-1.5 py-0">
                                            {inv.recipientType}
                                        </Badge>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5 text-sm font-bold text-gray-600">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        {inv.dueDate}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className="font-black text-lg text-gray-900">${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </TableCell>
                                <TableCell className="text-center">
                                    {inv.status === 'Paid' && (
                                        <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold rounded-lg px-2"><CheckCircle2 className="h-3 w-3 mr-1" /> Paid</Badge>
                                    )}
                                    {inv.status === 'Unpaid' && (
                                        <Badge className="bg-orange-100 text-orange-700 border-none font-bold rounded-lg px-2"><Clock className="h-3 w-3 mr-1" /> Unpaid</Badge>
                                    )}
                                    {inv.status === 'Overdue' && (
                                        <Badge className="bg-rose-100 text-rose-700 border-none font-bold rounded-lg px-2"><AlertCircle className="h-3 w-3 mr-1" /> Overdue</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="pr-6 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-100 text-gray-500" onClick={() => setSelectedInvoice(inv)}>
                                                    <Printer className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 overflow-hidden border-none rounded-3xl shadow-2xl">
                                                <div className="bg-gray-900 p-4 flex justify-between items-center text-white">
                                                    <span className="font-bold flex items-center gap-2"><Receipt className="h-4 w-4" /> Invoice Preview</span>
                                                    <Button size="sm" variant="secondary" className="font-bold h-8 rounded-lg"><Download className="h-3 w-3 mr-2" /> PDF</Button>
                                                </div>
                                                <div className="flex-1 bg-gray-100 p-8 overflow-y-auto flex justify-center">
                                                    <div className="bg-white shadow-xl w-full max-w-xl min-h-[600px] p-8">
                                                        {/* Mock Invoice Layout */}
                                                        <div className="flex justify-between border-b pb-8">
                                                            <h1 className="text-4xl font-black text-gray-900">INVOICE</h1>
                                                            <div className="text-right space-y-1">
                                                                <p className="font-bold text-gray-900">TripAlfa B2B Platform</p>
                                                                <p className="text-sm text-gray-500">123 Business Bay, Dubai</p>
                                                            </div>
                                                        </div>
                                                        <div className="mt-8 flex justify-between">
                                                            <div>
                                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Bill To</p>
                                                                <h3 className="text-xl font-bold mt-2">{selectedInvoice?.recipient}</h3>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Details</p>
                                                                <p className="font-bold text-gray-900 mt-2">#{selectedInvoice?.invoiceNumber}</p>
                                                                <p className="text-sm text-gray-500">Due: {selectedInvoice?.dueDate}</p>
                                                            </div>
                                                        </div>
                                                        <div className="mt-12 space-y-4">
                                                            <div className="flex justify-between font-bold border-b pb-2 text-sm text-gray-500 uppercase">
                                                                <span>Description</span>
                                                                <span>Amount</span>
                                                            </div>
                                                            <div className="flex justify-between py-2 font-medium">
                                                                <span>Flight Booking Services (March 2024)</span>
                                                                <span>${selectedInvoice?.amount.toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                        <div className="mt-12 pt-8 border-t flex justify-end">
                                                            <div className="w-48 space-y-2">
                                                                <div className="flex justify-between font-bold text-gray-500">
                                                                    <span>Subtotal</span>
                                                                    <span>${selectedInvoice?.amount.toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex justify-between font-black text-xl text-gray-900 pt-2 border-t">
                                                                    <span>Total</span>
                                                                    <span>${selectedInvoice?.amount.toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl p-1 w-40">
                                                <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer font-medium text-sm">
                                                    <Mail className="h-4 w-4" /> Send Reminder
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
