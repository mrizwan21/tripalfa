import React from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { CalendarCheck, Search, Filter, Plus, CalendarRange, User, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
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

export interface Allocation {
  id: string;
  roomId: string;
  startDate: string;
  endDate: string;
  status: 'allocated' | 'released' | 'blocked';
  guestName?: string;
  bookingId?: string;
}

const fetchAllocations = async (): Promise<Allocation[]> => {
  return [
    { id: '1', roomId: '101', startDate: '2024-03-01', endDate: '2024-03-05', status: 'allocated', guestName: 'Alice Johnson', bookingId: 'BK-001' },
    { id: '2', roomId: '102', startDate: '2024-03-02', endDate: '2024-03-04', status: 'allocated', guestName: 'Bob Smith', bookingId: 'BK-002' },
    { id: '3', roomId: '201', startDate: '2024-03-10', endDate: '2024-03-15', status: 'blocked', guestName: 'Maintenance', bookingId: 'MNT-001' },
    { id: '4', roomId: '103', startDate: '2024-03-20', endDate: '2024-03-22', status: 'released', guestName: 'Charlie Brown', bookingId: 'BK-003' },
  ];
};

export default function AllocationsListPage() {
  const { data: allocations, isLoading } = useQuery('allocations', fetchAllocations);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'allocated': return 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200';
      case 'released': return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
      case 'blocked': return 'bg-red-100 text-red-700 hover:bg-red-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Allocations</h2>
          <p className="text-gray-500 font-medium">Track room assignments and availability calendar</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl border-gray-200 font-bold text-gray-600">
            <CalendarRange className="h-4 w-4 mr-2" />
            View Calendar
          </Button>
          <Button className="rounded-xl font-bold bg-gray-900 hover:bg-primary shadow-lg hover:shadow-primary/25">
            <Plus className="h-4 w-4 mr-2" />
            New Allocation
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search allocations..." className="pl-10 rounded-xl bg-gray-50 border-gray-200" />
          </div>
          <Button variant="outline" className="rounded-xl border-gray-200 font-bold text-gray-600">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold text-gray-500 uppercase text-xs py-4 pl-6">Room</TableHead>
                <TableHead className="font-bold text-gray-500 uppercase text-xs py-4">Guest</TableHead>
                <TableHead className="font-bold text-gray-500 uppercase text-xs py-4">Duration</TableHead>
                <TableHead className="font-bold text-gray-500 uppercase text-xs py-4">Status</TableHead>
                <TableHead className="font-bold text-gray-500 uppercase text-xs py-4">Booking Ref</TableHead>
                <TableHead className="text-right font-bold text-gray-500 uppercase text-xs py-4 pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocations?.map((alloc) => (
                <TableRow key={alloc.id} className="hover:bg-gray-50/50 transition-colors border-gray-100">
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-xs">
                        {alloc.roomId}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {alloc.guestName && <User className="h-4 w-4 text-gray-400" />}
                      <span className="font-medium text-gray-900">{alloc.guestName || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-500">FROM: {alloc.startDate}</span>
                      <span className="text-xs font-bold text-gray-500">TO: {alloc.endDate}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`${getStatusColor(alloc.status)} border-none capitalize`}>
                      {alloc.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-indigo-600 font-medium cursor-pointer hover:underline">
                      <FileText className="h-3 w-3" />
                      {alloc.bookingId || '-'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Button variant="ghost" size="sm" className="font-bold text-gray-500 hover:text-gray-900">Details</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
