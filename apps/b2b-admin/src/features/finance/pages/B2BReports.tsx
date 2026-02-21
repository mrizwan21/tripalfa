import { useState, useEffect } from "react";
import { DataTable } from "@tripalfa/ui-components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@tripalfa/ui-components/ui/badge";
import { Button } from "@tripalfa/ui-components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@tripalfa/ui-components/ui/tabs";
import { Input } from "@tripalfa/ui-components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@tripalfa/ui-components/ui/select";
import { 
  Download, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users,
  Calendar,
  ArrowUpDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@tripalfa/ui-components/ui/card";
import { 
  B2BCompanyReport, 
  reportsService, 
  DateRange,
  FinancialSummary,
  ServiceBreakdown,
  TopDestination 
} from "../../../services/ReportsService";

// Table columns for B2B Companies
export const b2bColumns: ColumnDef<B2BCompanyReport>[] = [
  {
    accessorKey: "companyName",
    header: "Company",
    cell: ({ row }) => {
      const name = row.getValue("companyName") as string;
      return (
        <div className="font-medium">{name}</div>
      );
    },
  },
  {
    accessorKey: "totalBookings",
    header: "Total Bookings",
    cell: ({ row }) => {
      const bookings = row.getValue("totalBookings") as number;
      return <span className="font-mono">{bookings}</span>;
    },
  },
  {
    accessorKey: "confirmedBookings",
    header: "Confirmed",
    cell: ({ row }) => {
      const confirmed = row.getValue("confirmedBookings") as number;
      return <Badge variant="default">{confirmed}</Badge>;
    },
  },
  {
    accessorKey: "pendingBookings",
    header: "Pending",
    cell: ({ row }) => {
      const pending = row.getValue("pendingBookings") as number;
      return pending > 0 ? <Badge variant="outline">{pending}</Badge> : <span className="text-slate-400">0</span>;
    },
  },
  {
    accessorKey: "cancelledBookings",
    header: "Cancelled",
    cell: ({ row }) => {
      const cancelled = row.getValue("cancelledBookings") as number;
      return cancelled > 0 ? <Badge variant="destructive">{cancelled}</Badge> : <span className="text-slate-400">0</span>;
    },
  },
  {
    accessorKey: "totalRevenue",
    header: "Total Revenue",
    cell: ({ row }) => {
      const revenue = row.getValue("totalRevenue") as number;
      return (
        <span className="font-mono font-semibold">
          ${revenue.toLocaleString()}
        </span>
      );
    },
  },
  {
    accessorKey: "averageBookingValue",
    header: "Avg. Value",
    cell: ({ row }) => {
      const avg = row.getValue("averageBookingValue") as number;
      return <span className="font-mono">${avg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
    },
  },
  {
    accessorKey: "commissionEarned",
    header: "Commission",
    cell: ({ row }) => {
      const commission = row.getValue("commissionEarned") as number;
      return (
        <span className="font-mono text-green-600">
          ${commission.toLocaleString()}
        </span>
      );
    },
  },
  {
    accessorKey: "pendingPayments",
    header: "Pending Payments",
    cell: ({ row }) => {
      const pending = row.getValue("pendingPayments") as number;
      return pending > 0 ? (
        <span className="font-mono text-amber-600">${pending.toLocaleString()}</span>
      ) : (
        <span className="text-slate-400">$0</span>
      );
    },
  },
  {
    accessorKey: "lastBookingDate",
    header: "Last Booking",
    cell: ({ row }) => {
      const date = row.getValue("lastBookingDate") as string | null;
      return date ? <span className="text-sm">{date}</span> : <span className="text-slate-400">-</span>;
    },
  },
];

export default function B2BReportsPage() {
  const [data, setData] = useState<B2BCompanyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [serviceBreakdown, setServiceBreakdown] = useState<ServiceBreakdown[]>([]);
  const [topDestinations, setTopDestinations] = useState<TopDestination[]>([]);
  const [dateRange, setDateRange] = useState<string>("30");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const range: DateRange | undefined = getDateRange(dateRange);
      
      const [b2bData, summary, services, destinations] = await Promise.all([
        reportsService.getB2BReports(range),
        reportsService.getFinancialSummary(range),
        reportsService.getServiceBreakdown(range),
        reportsService.getTopDestinations(10, range),
      ]);
      
      setData(b2bData);
      setFinancialSummary(summary);
      setServiceBreakdown(services);
      setTopDestinations(destinations);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (days: string): DateRange | undefined => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - parseInt(days));
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await reportsService.exportToCSV('b2b', getDateRange(dateRange));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `b2b-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
    } finally {
      setExporting(false);
    }
  };

  const totalRevenue = data.reduce((sum, c) => sum + c.totalRevenue, 0);
  const totalBookings = data.reduce((sum, c) => sum + c.totalBookings, 0);
  const totalCommission = data.reduce((sum, c) => sum + c.commissionEarned, 0);
  const totalPending = data.reduce((sum, c) => sum + c.pendingPayments, 0);

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">B2B Reports</h1>
          <p className="text-slate-500 mt-1">
            Monitor B2B company performance and transactions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            <Download className="mr-2 h-4 w-4" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-slate-500 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +12.5% from last period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings.toLocaleString()}</div>
            <p className="text-xs text-slate-500 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +8.2% from last period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalCommission.toLocaleString()}</div>
            <p className="text-xs text-slate-500 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +15.3% from last period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">${totalPending.toLocaleString()}</div>
            <p className="text-xs text-slate-500 flex items-center mt-1">
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              -5.2% from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Service Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Service Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {serviceBreakdown.map((service) => (
                <div key={service.serviceType} className="flex items-center">
                  <div className="w-24 text-sm font-medium">{service.serviceType}</div>
                  <div className="flex-1 mx-4">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${service.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-20 text-sm text-right">
                    <span className="font-mono">{service.count}</span>
                  </div>
                  <div className="w-28 text-sm text-right">
                    <span className="font-mono font-semibold">${service.revenue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Destinations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topDestinations.slice(0, 5).map((dest, index) => (
                <div key={dest.destination} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-400 w-4">{index + 1}</span>
                    <span className="text-sm">{dest.destination}</span>
                  </div>
                  <div className="text-sm text-slate-500">
                    {dest.bookings} bookings
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Company Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={b2bColumns} 
            data={data} 
            searchKey="companyName"
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
