import { useState, useEffect } from "react";
import { DataTable } from "@tripalfa/ui-components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@tripalfa/ui-components/ui/badge";
import { Button } from "@tripalfa/ui-components/ui/button";
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
  UserPlus,
  Repeat
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@tripalfa/ui-components/ui/card";
import { 
  B2CCustomerReport, 
  reportsService, 
  DateRange,
  BookingTrend 
} from "../../../services/ReportsService";

// Table columns for B2C Customers
export const b2cColumns: ColumnDef<B2CCustomerReport>[] = [
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => {
      const name = row.getValue("customerName") as string;
      const email = row.original.customerEmail;
      return (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-xs text-slate-500">{email}</div>
        </div>
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
    accessorKey: "totalSpent",
    header: "Total Spent",
    cell: ({ row }) => {
      const spent = row.getValue("totalSpent") as number;
      return (
        <span className="font-mono font-semibold">
          ${spent.toLocaleString()}
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
    accessorKey: "customerLifetimeValue",
    header: "Lifetime Value",
    cell: ({ row }) => {
      const clv = row.getValue("customerLifetimeValue") as number;
      return (
        <span className="font-mono font-semibold text-indigo-600">
          ${clv.toLocaleString()}
        </span>
      );
    },
  },
  {
    accessorKey: "firstBookingDate",
    header: "First Booking",
    cell: ({ row }) => {
      const date = row.getValue("firstBookingDate") as string | null;
      return date ? <span className="text-sm">{date}</span> : <span className="text-slate-400">-</span>;
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

export default function B2CReportsPage() {
  const [data, setData] = useState<B2CCustomerReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingTrends, setBookingTrends] = useState<BookingTrend[]>([]);
  const [customerAnalytics, setCustomerAnalytics] = useState<any>(null);
  const [dateRange, setDateRange] = useState<string>("30");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const range: DateRange | undefined = getDateRange(dateRange);
      
      const [b2cData, trends, analytics] = await Promise.all([
        reportsService.getB2CReports(range),
        reportsService.getBookingTrends(range!),
        reportsService.getCustomerAnalytics(range),
      ]);
      
      setData(b2cData);
      setBookingTrends(trends);
      setCustomerAnalytics(analytics);
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
      const blob = await reportsService.exportToCSV('b2c', getDateRange(dateRange));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `b2c-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
    } finally {
      setExporting(false);
    }
  };

  // Calculate totals
  const totalSpent = data.reduce((sum, c) => sum + c.totalSpent, 0);
  const totalBookings = data.reduce((sum, c) => sum + c.totalBookings, 0);
  const totalCustomers = data.length;
  const avgCustomerValue = totalCustomers > 0 ? totalSpent / totalCustomers : 0;
  
  // Calculate new vs returning
  const newCustomers = data.filter(c => c.totalBookings === 1).length;
  const returningCustomers = totalCustomers - newCustomers;

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">B2C Reports</h1>
          <p className="text-slate-500 mt-1">
            Monitor customer analytics and consumer behavior
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
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerAnalytics?.totalCustomers || totalCustomers}</div>
            <p className="text-xs text-slate-500 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +{customerAnalytics?.newCustomers || newCustomers} new this period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpent.toLocaleString()}</div>
            <p className="text-xs text-slate-500 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +18.2% from last period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Customer Value</CardTitle>
            <UserPlus className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">${(customerAnalytics?.averageCustomerValue || avgCustomerValue).toLocaleString()}</div>
            <p className="text-xs text-slate-500 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              +5.4% from last period
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returning Customers</CardTitle>
            <Repeat className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerAnalytics?.returningCustomers || returningCustomers}</div>
            <p className="text-xs text-slate-500 flex items-center mt-1">
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              {((customerAnalytics?.returningCustomers || returningCustomers) / totalCustomers * 100).toFixed(1)}% retention rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Booking Trends Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Booking Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-end gap-1">
            {bookingTrends.slice(-14).map((trend, index) => {
              const maxRevenue = Math.max(...bookingTrends.map(t => t.revenue));
              const height = (trend.revenue / maxRevenue) * 100;
              
              return (
                <div 
                  key={trend.date} 
                  className="flex-1 flex flex-col items-center gap-1 group"
                >
                  <div 
                    className="w-full bg-indigo-500 rounded-t hover:bg-indigo-600 transition-colors relative"
                    style={{ height: `${height}%` }}
                  >
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ${trend.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(trend.date).getDate()}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-4 text-xs text-slate-500">
            <span>Last 14 days</span>
            <span>Daily Revenue</span>
          </div>
        </CardContent>
      </Card>

      {/* Customer Segments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Segments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">New Customers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold">{newCustomers}</span>
                  <span className="text-xs text-slate-500">
                    ({(newCustomers / totalCustomers * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span className="text-sm">Returning Customers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold">{returningCustomers}</span>
                  <span className="text-xs text-slate-500">
                    ({(returningCustomers / totalCustomers * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking Frequency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-4xl font-bold text-indigo-600">
                  {customerAnalytics?.bookingFrequency || (totalBookings / totalCustomers).toFixed(1)}
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  average bookings per customer
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={b2cColumns} 
            data={data} 
            searchKey="customerName"
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
