import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plane,
  Building2,
  Calendar,
  User,
  ChevronRight,
  Download,
  Plus,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Ticket
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const mockBookings = [
  {
    id: 'BK-99120',
    ref: 'REF-889120',
    customer: 'Alex Johnson',
    agency: 'Global Wings B2B',
    type: 'FLIGHT',
    status: 'CONFIRMED',
    amount: 1240.50,
    createdAt: new Date().toISOString(),
    pnr: 'XA882J'
  },
  {
    id: 'BK-99121',
    ref: 'REF-889121',
    customer: 'Maria Garcia',
    agency: 'SunTravels LLC',
    type: 'HOTEL',
    status: 'PENDING',
    amount: 450.00,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    hotel: 'Burj Al Arab'
  },
  {
    id: 'BK-99122',
    ref: 'REF-889122',
    customer: 'David Smith',
    agency: 'Atlas Holidays',
    type: 'FLIGHT',
    status: 'FAILED',
    amount: 890.20,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    pnr: 'ZZ112P'
  },
  {
    id: 'BK-99123',
    ref: 'REF-889123',
    customer: 'Yuki Tanaka',
    agency: 'Zenith Global',
    type: 'FLIGHT',
    status: 'CONFIRMED',
    amount: 2150.00,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    pnr: 'JP776L'
  }
];

export function BookingsListPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[10px] tracking-widest px-3">CONFIRMED</Badge>;
      case 'PENDING': return <Badge className="bg-amber-500/10 text-amber-600 border-none font-black text-[10px] tracking-widest px-3">PENDING</Badge>;
      case 'FAILED': return <Badge className="bg-rose-500/10 text-rose-600 border-none font-black text-[10px] tracking-widest px-3">FAILED</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-600 border-none font-black text-[10px] tracking-widest px-3">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'FLIGHT': return <Plane className="h-4 w-4 text-indigo-500" />;
      case 'HOTEL': return <Building2 className="h-4 w-4 text-amber-500" />;
      default: return <Ticket className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Universal Booking Hub</h1>
            <p className="text-gray-500 mt-1 font-medium">Global oversight of all Flight, Hotel, and Package reservations</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl h-11 border-gray-100 bg-white font-bold text-gray-600">
              <Download className="h-4 w-4 mr-2" />
              Report
            </Button>
            <Button
              className="rounded-xl h-11 bg-gray-900 text-white font-bold hover:bg-primary shadow-lg shadow-gray-200" onClick={() => navigate('/bookings/new')} > <Plus className="h-4 w-4 mr-2" />
              Manual Entry
            </Button>
          </div>
        </div>

        {/* Performance Mini-Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-none shadow-lg rounded-3xl bg-white p-6">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Bookings (24h)</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-black text-gray-900">1,280</h3>
              <div className="flex items-center text-emerald-500 text-xs font-bold gap-1 pb-1">
                <ArrowUpRight className="h-3 w-3" />
                12%
              </div>
            </div>
          </Card>
          <Card className="border-none shadow-lg rounded-3xl bg-white p-6">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Confirmation Rate</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-black text-gray-900">94.8%</h3>
              <div className="flex items-center text-emerald-500 text-xs font-bold gap-1 pb-1">
                <ArrowUpRight className="h-3 w-3" />
                3.2%
              </div>
            </div>
          </Card>
          <Card className="border-none shadow-lg rounded-3xl bg-white p-6">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Failed Trans.</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-black text-gray-900">14</h3>
              <div className="flex items-center text-rose-500 text-xs font-bold gap-1 pb-1">
                <ArrowDownRight className="h-3 w-3" />
                5%
              </div>
            </div>
          </Card>
          <Card className="border-none shadow-lg rounded-3xl bg-white p-6">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active GDS Sync</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-black text-gray-900">Live</h3>
              <div className="flex items-center gap-2 pb-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Healthy</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-none shadow-xl rounded-[2rem] bg-white p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search by PAX Name, Agency, or PNR..."
                className="pl-12 h-12 bg-gray-50/50 border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/20 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="h-12 px-6 rounded-2xl border-gray-100 font-bold text-gray-600 hover:bg-gray-50">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
          </div>
        </Card>

        {/* Bookings Table */}
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-gray-100 h-16">
                <TableHead className="font-black text-xs text-gray-400 uppercase tracking-widest pl-8">Type & Ref</TableHead>
                <TableHead className="font-black text-xs text-gray-400 uppercase tracking-widest">Passenger / Account</TableHead>
                <TableHead className="font-black text-xs text-gray-400 uppercase tracking-widest text-center">Status</TableHead>
                <TableHead className="font-black text-xs text-gray-400 uppercase tracking-widest text-right">Value</TableHead>
                <TableHead className="font-black text-xs text-gray-400 uppercase tracking-widest text-right pr-8">Context</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockBookings.map((bk) => (
                <TableRow
                  key={bk.id}
                  className="hover:bg-primary/5 transition-all duration-300 border-gray-50 cursor-pointer group h-20"
                  onClick={() => navigate(`/bookings/${bk.id}`)}
                >
                  <TableCell className="pl-8">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-white group-hover:scale-110 transition-all duration-500">
                        {getTypeIcon(bk.type)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 tracking-tight">{bk.ref}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{bk.type}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {bk.customer.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-800">{bk.customer}</p>
                        <p className="text-[10px] font-bold text-gray-400">{bk.agency}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(bk.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <p className="text-sm font-black text-gray-900">${bk.amount.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">PAID</p>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex items-center justify-end gap-3 text-gray-400">
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest">
                          {bk.pnr || bk.hotel || 'N/A'}
                        </p>
                        <p className="text-[9px] font-bold flex items-center justify-end gap-1">
                          <Clock className="h-2 w-2" />
                          {new Date(bk.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-white hover:shadow-md transition-all">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Footer Insight */}
        <div className="flex justify-between items-center py-6 px-4 bg-gray-900 text-white rounded-[2rem] shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium">Viewing settlements for <span className="text-primary font-black">May 2024</span> cycle. Data refreshed 2 mins ago.</p>
          </div>
          <Button variant="ghost" className="text-white hover:bg-white/10 font-bold px-6">
            System Sync Log
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BookingsListPage;
