import { Button } from "@tripalfa/ui-components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@tripalfa/ui-components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@tripalfa/ui-components/ui/table";
import { Badge } from "@tripalfa/ui-components/ui/badge";
import * as Icons from 'lucide-react';

const {
  FileText,
  Download,
  Eye,
  Search,
  MoreVertical,
  File,
  FileCheck,
  AlertTriangle
} = Icons as any;
import { Input } from "@tripalfa/ui-components/ui/input";

type DocumentStatus = 'PAID' | 'DRAFT' | 'ISSUED' | 'ACTIVE' | 'OVERDUE';

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  status: DocumentStatus;
}

const getStatusBadgeVariant = (status: DocumentStatus): "default" | "destructive" | "secondary" | "outline" => {
  switch (status) {
    case 'PAID':
      return 'default';
    case 'OVERDUE':
      return 'destructive';
    case 'DRAFT':
      return 'secondary';
    case 'ISSUED':
    case 'ACTIVE':
      return 'outline';
    default:
      return 'secondary';
  }
};

export default function DocumentManager() {
  const documents: Document[] = [
    { id: "INV-2024-001", name: "Invoice #001 - Hilton Booking", type: "PDF", size: "2.4 MB", date: "Feb 12, 2026", status: "PAID" },
    { id: "REP-2024-Q1", name: "Q1 Financial Report", type: "XLSX", size: "1.1 MB", date: "Feb 10, 2026", status: "DRAFT" },
    { id: "TKT-88219", name: "E-Ticket - Flight DXB-LHR", type: "PDF", size: "850 KB", date: "Feb 09, 2026", status: "ISSUED" },
    { id: "CTR-2024", name: "Supplier Contract - Hotelston", type: "DOCX", size: "4.2 MB", date: "Jan 28, 2026", status: "ACTIVE" },
    { id: "INV-2024-002", name: "Invoice #002 - Duffel Air", type: "PDF", size: "1.8 MB", date: "Jan 25, 2026", status: "OVERDUE" },
  ];

  return (
    <div className="space-y-6 pt-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
          <p className="text-muted-foreground mt-1">Centralized document storage for invoices, tickets, and contracts.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline">Upload New</Button>
            <Button>Generate Report</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Storage</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">45.2 GB</div>
                <div className="h-1.5 w-full bg-primary/20 mt-2 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[45%] rounded-full" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">45% used of 100 GB</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Invoices</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">1,204</div>
                <p className="text-xs text-muted-foreground">Total generated this year</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Contracts</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">Active supplier agreements</p>
            </CardContent>
        </Card>
         <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">E-Tickets</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">8,921</div>
                <p className="text-xs text-muted-foreground">Issued to customers</p>
            </CardContent>
        </Card>
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <div className="p-4 flex items-center justify-between border-b">
           <div className="relative max-w-sm w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search files..." className="pl-8" />
           </div>
           <Button variant="ghost" size="sm">Filter</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[400px]">Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-muted/50 flex items-center justify-center border">
                        {doc.type === 'PDF' ? <FileText className="h-4 w-4 text-red-500" /> :
                         doc.type === 'XLSX' ? <File className="h-4 w-4 text-emerald-500" /> :
                         <FileCheck className="h-4 w-4 text-blue-500" />}
                    </div>
                    <div>
                        <div className="font-semibold">{doc.name}</div>
                        <div className="text-xs text-muted-foreground">{doc.id}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline">{doc.type}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{doc.size}</TableCell>
                <TableCell>{doc.date}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(doc.status)} className="rounded-full font-normal">
                    {doc.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary">
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary">
                            <Download className="h-4 w-4" />
                        </Button>
                         <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
