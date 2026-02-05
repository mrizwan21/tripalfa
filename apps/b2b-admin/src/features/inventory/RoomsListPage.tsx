import React from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { DoorOpen, Search, Filter, Plus, Home, MoreVertical, Key } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface Room {
  id: string;
  typeId: string;
  number: string;
  status: 'available' | 'occupied' | 'maintenance' | 'blocked';
  features?: string[];
  hotelId: string;
}

const fetchRooms = async (): Promise<Room[]> => {
  return [
    { id: '101', typeId: '1', number: '101', status: 'available', features: ['Ocean View'], hotelId: 'H-101' },
    { id: '102', typeId: '2', number: '102', status: 'occupied', features: ['City View'], hotelId: 'H-101' },
    { id: '103', typeId: '1', number: '103', status: 'maintenance', features: ['Balcony'], hotelId: 'H-101' },
    { id: '201', typeId: '3', number: '201', status: 'blocked', features: ['Lounge Access'], hotelId: 'H-102' },
    { id: '202', typeId: '3', number: '202', status: 'available', features: ['Jacuzzi'], hotelId: 'H-102' },
  ];
};

export default function RoomsListPage() {
  const { data: rooms, isLoading } = useQuery('rooms', fetchRooms);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200';
      case 'occupied': return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
      case 'maintenance': return 'bg-orange-100 text-orange-700 hover:bg-orange-200';
      case 'blocked': return 'bg-red-100 text-red-700 hover:bg-red-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Rooms</h2>
          <p className="text-gray-500 font-medium">Manage individual room status and availability</p>
        </div>
        <Button className="rounded-xl font-bold bg-gray-900 hover:bg-primary shadow-lg hover:shadow-primary/25">
          <Plus className="h-4 w-4 mr-2" />
          Add Room
        </Button>
      </div>

      <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search rooms..." className="pl-10 rounded-xl bg-gray-50 border-gray-200" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl border-gray-200 font-bold text-gray-600">
              <Filter className="h-4 w-4 mr-2" />
              Status
            </Button>
            <Button variant="outline" className="rounded-xl border-gray-200 font-bold text-gray-600">
              <Home className="h-4 w-4 mr-2" />
              Property
            </Button>
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold text-gray-500 uppercase text-xs py-4 pl-6">Room Number</TableHead>
                <TableHead className="font-bold text-gray-500 uppercase text-xs py-4">Status</TableHead>
                <TableHead className="font-bold text-gray-500 uppercase text-xs py-4">Type ID</TableHead>
                <TableHead className="font-bold text-gray-500 uppercase text-xs py-4">Features</TableHead>
                <TableHead className="font-bold text-gray-500 uppercase text-xs py-4">Hotel ID</TableHead>
                <TableHead className="text-right font-bold text-gray-500 uppercase text-xs py-4 pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms?.map((room) => (
                <TableRow key={room.id} className="hover:bg-gray-50/50 transition-colors border-gray-100">
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getStatusColor(room.status)} bg-opacity-20`}>
                        <Key className="h-5 w-5" />
                      </div>
                      <span className="font-bold text-gray-900 text-lg">#{room.number}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`${getStatusColor(room.status)} border-none capitalize`}>
                      {room.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500 font-medium">Type-{room.typeId}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {room.features?.map((f, i) => (
                        <Badge key={i} variant="outline" className="bg-white border-gray-200 text-gray-600">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500 font-medium">{room.hotelId}</TableCell>
                  <TableCell className="text-right pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem className="font-medium">Edit Details</DropdownMenuItem>
                        <DropdownMenuItem className="font-medium">Block Room</DropdownMenuItem>
                        <DropdownMenuItem className="font-medium text-red-600">Mark Maintenance</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
