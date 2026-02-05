import React from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { Bed, Search, Filter, Plus, Hotel, Users, Maximize } from 'lucide-react';
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

export interface RoomType {
  id: string;
  name: string;
  description?: string;
  features?: string[];
  hotelId: string;
}

const fetchRoomTypes = async (): Promise<RoomType[]> => {
  // Mock data for now since backend might not be ready
  return [
    { id: '1', name: 'Deluxe King', description: 'Spacious room with king bed', features: ['Ocean View', 'Balcony'], hotelId: 'H-101' },
    { id: '2', name: 'Standard Twin', description: 'Comfortable twin room', features: ['City View', 'Wifi'], hotelId: 'H-101' },
    { id: '3', name: 'Executive Suite', description: 'Luxury suite with lounge access', features: ['Lounge Access', 'Jacuzzi'], hotelId: 'H-102' },
  ];
};

export default function RoomTypeListPage() {
  const { data: roomTypes, isLoading } = useQuery('roomTypes', fetchRoomTypes);

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Room Types</h2>
          <p className="text-gray-500 font-medium">Define and manage room categories across properties</p>
        </div>
        <Button className="rounded-xl font-bold bg-gray-900 hover:bg-primary shadow-lg hover:shadow-primary/25">
          <Plus className="h-4 w-4 mr-2" />
          Add Room Type
        </Button>
      </div>

      <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search room types..." className="pl-10 rounded-xl bg-gray-50 border-gray-200" />
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
                <TableHead className="font-bold text-gray-500 uppercase text-xs py-4 pl-6">Type Name</TableHead>
                <TableHead className="font-bold text-gray-500 uppercase text-xs py-4">Description</TableHead>
                <TableHead className="font-bold text-gray-500 uppercase text-xs py-4">Features</TableHead>
                <TableHead className="font-bold text-gray-500 uppercase text-xs py-4">Hotel ID</TableHead>
                <TableHead className="text-right font-bold text-gray-500 uppercase text-xs py-4 pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roomTypes?.map((rt) => (
                <TableRow key={rt.id} className="hover:bg-gray-50/50 transition-colors border-gray-100">
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Bed className="h-5 w-5" />
                      </div>
                      <span className="font-bold text-gray-900">{rt.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500 font-medium">{rt.description}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {rt.features?.map((f, i) => (
                        <Badge key={i} variant="outline" className="bg-white border-gray-200 text-gray-600 font-semibold">{f}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500 font-medium">{rt.hotelId}</TableCell>
                  <TableCell className="text-right pr-6">
                    <Button variant="ghost" size="sm" className="font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!roomTypes || roomTypes.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-gray-500 font-medium">No room types found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
