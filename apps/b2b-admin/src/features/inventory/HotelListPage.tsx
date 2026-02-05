import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { Plus, Search, MapPin, Star, MoreVertical, Edit2, Trash2, Globe, LayoutGrid, List, Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddEditHotelModal } from './AddEditHotelModal';
import { toast } from 'sonner';

export interface Hotel {
  id: string;
  name: string;
  address?: string;
  features?: string[];
  description?: string;
  images?: string[];
  videos?: string[];
}

const fetchHotels = async () => {
  try {
    const { data } = await axios.get<Hotel[]>('/api/inventory/hotels');
    return data;
  } catch (error) {
    console.error('Failed to fetch hotels:', error);
    return [];
  }
};

export default function HotelListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const queryClient = useQueryClient();

  const { data: hotels, isLoading } = useQuery('hotels', fetchHotels, {
    retry: 1,
    refetchOnWindowFocus: false
  });

  const deleteMutation = useMutation(
    (id: string) => axios.delete(`/api/inventory/hotels/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('hotels');
        toast.success('Property deleted successfully');
      },
      onError: () => {
        toast.error("Failed to delete property");
      },
    }
  );

  const saveMutation = useMutation(
    (formData: FormData) => {
      const id = selectedHotel?.id;
      return id
        ? axios.put(`/api/inventory/hotels/${id}`, formData)
        : axios.post('/api/inventory/hotels', formData);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('hotels');
        setIsModalOpen(false);
        toast.success(selectedHotel ? "Property updated" : "Property added");
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || "Error saving property");
      },
    }
  );

  const filteredHotels = hotels?.filter(h =>
    h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedHotel(null);
    setIsModalOpen(true);
  };

  return (
    <div className="animate-in fade-in duration-700 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Property Inventory</h1>
          <p className="text-gray-500 mt-2 font-medium">Manage your global hotel & resort portfolio.</p>
        </div>
        <Button
          onClick={handleAdd}
          className="h-12 px-6 bg-gray-900 hover:bg-primary transition-all shadow-lg hover:shadow-primary/25 font-bold rounded-xl"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Property
        </Button>
      </div>

      <div className="bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-gray-100 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search by name, city or address..."
            className="pl-12 h-12 bg-transparent border-none focus-visible:ring-0 text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 pr-2">
          <Button
            variant="ghost"
            size="icon"
            className={`h-10 w-10 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gray-100 text-primary' : 'text-gray-400'}`}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-10 w-10 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gray-100 text-primary' : 'text-gray-400'}`}
            onClick={() => setViewMode('list')}
          >
            <List className="h-5 w-5" />
          </Button>
          <div className="w-px h-6 bg-gray-200 mx-2" />
          <Button variant="outline" className="h-10 px-4 border-gray-200 font-bold rounded-lg text-gray-600">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[420px] rounded-3xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "flex flex-col gap-4"}>
          {filteredHotels?.map((hotel) => (
            <Card
              key={hotel.id}
              className={`group overflow-hidden border-none bg-white shadow-md hover:shadow-2xl transition-all duration-500 rounded-3xl ${viewMode === 'list' ? 'flex flex-row h-48' : 'flex flex-col h-full'}`}
            >
              <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-64' : 'h-52'}`}>
                <img
                  src={hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800'}
                  alt={hotel.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" /> <div className="absolute top-4 left-4">
                  <Badge className="bg-white/90 backdrop-blur-sm text-gray-900 border-none px-3 py-1 font-bold shadow-lg">
                    <Star className="h-3 w-3 mr-1 fill-amber-400 text-amber-400" />
                    4.8
                  </Badge>
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm shadow-xl">
                        <MoreVertical className="h-5 w-5 text-gray-900" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl p-2">
                      <DropdownMenuItem onClick={() => handleEdit(hotel)} className="rounded-lg cursor-pointer">
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit Property
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(hotel.address, '_blank')} className="rounded-lg cursor-pointer">
                        <Globe className="mr-2 h-4 w-4" />
                        View on Site
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 rounded-lg cursor-pointer"
                        onClick={() => deleteMutation.mutate(hotel.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                    {hotel.name}
                  </CardTitle>
                </div>

                <div className="flex items-center text-gray-500 text-sm mb-4 font-medium">
                  <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                  <span className="line-clamp-1">{hotel.address || 'Location not specified'}</span>
                </div>

                <div className="flex flex-wrap gap-2 mt-auto">
                  {hotel.features?.slice(0, 3).map((feat, i) => (
                    <Badge key={i} variant="outline" className="bg-gray-50 border-gray-100 text-gray-600 font-semibold">
                      {feat}
                    </Badge>
                  ))}
                  {(hotel.features?.length || 0) > 3 && (
                    <Badge variant="outline" className="bg-gray-50 border-gray-100 text-gray-600">
                      +{(hotel.features?.length || 0) - 3} more
                    </Badge>
                  )}
                </div>
              </CardContent>

              {viewMode === 'grid' && (
                <CardFooter className="px-6 pb-6 pt-0">
                  <Button
                    variant="outline"
                    className="w-full h-11 border-gray-200 hover:border-primary hover:text-primary font-bold rounded-xl transition-all"
                    onClick={() => handleEdit(hotel)}
                  >
                    Manage Details
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}

      <AddEditHotelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        hotel={selectedHotel}
        onSave={(formData) => saveMutation.mutate(formData)}
      />
    </div>
  );
}
