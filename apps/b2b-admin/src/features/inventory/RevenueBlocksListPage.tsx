import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Lock, Calendar, Building2, MoreVertical, Edit, Trash2, Search, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export interface RevenueBlock {
  id: string;
  hotelId: string;
  hotelName?: string;
  startDate: string;
  endDate: string;
  blockType: 'self-inventory' | 'pre-blocking';
  roomsBlocked: number;
  roomType?: string;
  reason?: string;
  createdBy?: string;
  status?: 'active' | 'released' | 'expired';
}

const blockSchema = z.object({
  hotelId: z.string().min(1, "Hotel is required"),
  startDate: z.string().min(1, "Start date required"),
  endDate: z.string().min(1, "End date required"),
  blockType: z.enum(['self-inventory', 'pre-blocking']),
  roomsBlocked: z.coerce.number().min(1, "At least 1 room required"),
  roomType: z.string().optional(),
  reason: z.string().optional(),
});

type BlockFormValues = z.infer<typeof blockSchema>;

export default function RevenueBlocksListPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingBlock, setEditingBlock] = React.useState<RevenueBlock | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  const { data: blocks, isLoading } = useQuery('revenueBlocks', async () => {
    // const res = await axios.get('/api/inventory/revenue-blocks');
    // return res.data;
    return [
      { id: '1', hotelId: 'h1', hotelName: 'Grand Palace Hotel', startDate: '2026-02-01', endDate: '2026-02-28', blockType: 'self-inventory', roomsBlocked: 10, roomType: 'Deluxe Suite', reason: 'Corporate event', createdBy: 'Admin', status: 'active' },
      { id: '2', hotelId: 'h2', hotelName: 'Ocean View Resort', startDate: '2026-03-15', endDate: '2026-03-20', blockType: 'pre-blocking', roomsBlocked: 25, roomType: 'Standard Double', reason: 'Wedding group', createdBy: 'Sales', status: 'active' },
      { id: '3', hotelId: 'h1', hotelName: 'Grand Palace Hotel', startDate: '2025-12-20', endDate: '2025-12-31', blockType: 'self-inventory', roomsBlocked: 15, roomType: 'All Types', reason: 'Holiday season', createdBy: 'Manager', status: 'expired' },
    ] as RevenueBlock[];
  });

  const form = useForm<BlockFormValues>({
    resolver: zodResolver(blockSchema),
    defaultValues: {
      hotelId: '',
      startDate: '',
      endDate: '',
      blockType: 'self-inventory',
      roomsBlocked: 1,
      roomType: '',
      reason: '',
    },
  });

  React.useEffect(() => {
    if (editingBlock) {
      form.reset({
        hotelId: editingBlock.hotelId,
        startDate: editingBlock.startDate,
        endDate: editingBlock.endDate,
        blockType: editingBlock.blockType,
        roomsBlocked: editingBlock.roomsBlocked,
        roomType: editingBlock.roomType || '',
        reason: editingBlock.reason || '',
      });
    } else {
      form.reset({
        hotelId: '',
        startDate: '',
        endDate: '',
        blockType: 'self-inventory',
        roomsBlocked: 1,
        roomType: '',
        reason: '',
      });
    }
  }, [editingBlock, form]);

  const mutation = useMutation(
    async (values: BlockFormValues) => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return values;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('revenueBlocks');
        setIsModalOpen(false);
        toast.success(editingBlock ? "Block updated" : "Block created");
      },
      onError: () => {
        toast.error("Failed to save block");
      },
    }
  );

  const deleteMutation = useMutation(
    async (id: string) => {
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('revenueBlocks');
        toast.success("Block released");
      },
    }
  );

  const filteredBlocks = blocks?.filter((b: RevenueBlock) =>
    b.hotelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.blockType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBlockTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      'self-inventory': 'bg-purple-100 text-purple-700',
      'pre-blocking': 'bg-orange-100 text-orange-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getStatusBadge = (status?: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      released: 'bg-blue-100 text-blue-700',
      expired: 'bg-red-100 text-red-700',
    };
    return colors[status || 'active'] || 'bg-gray-100 text-gray-700';
  };

  const totalRoomsBlocked = blocks?.reduce((sum, b) => sum + b.roomsBlocked, 0) || 0;
  const activeBlocks = blocks?.filter(b => b.status === 'active') || [];

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Revenue Blocks</h1>
            <p className="text-gray-500 font-medium text-sm">Reserve inventory for special events and groups</p>
          </div>
        </div>
        <Button
          onClick={() => { setEditingBlock(null); setIsModalOpen(true); }}
          className="h-12 bg-gray-900 hover:bg-primary transition-all px-6 rounded-2xl font-bold shadow-lg" > <Plus className="mr-2 h-5 w-5" />
          Create Block
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-lg bg-white rounded-3xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Total Blocks</p>
              <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{blocks?.length || 0}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Lock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-white rounded-3xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Rooms Blocked</p>
              <h3 className="text-3xl font-extrabold text-purple-600 mt-1">{totalRoomsBlocked}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-white rounded-3xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Active Blocks</p>
              <h3 className="text-3xl font-extrabold text-green-600 mt-1">{activeBlocks.length}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
              <Calendar className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-white rounded-3xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Utilization</p>
              <h3 className="text-3xl font-extrabold text-gray-900 mt-1">78%</h3>
              <p className="text-green-600 text-xs font-bold flex items-center"><TrendingUp className="h-3 w-3 mr-1" />+5%</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search blocks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-all rounded-xl"
            />
          </div>
        </div>
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="font-bold text-gray-900 py-4 pl-6">Hotel</TableHead>
              <TableHead className="font-bold text-gray-900 py-4">Block Type</TableHead>
              <TableHead className="font-bold text-gray-900 py-4">Period</TableHead>
              <TableHead className="font-bold text-gray-900 py-4">Rooms</TableHead>
              <TableHead className="font-bold text-gray-900 py-4">Reason</TableHead>
              <TableHead className="font-bold text-gray-900 py-4">Status</TableHead>
              <TableHead className="font-bold text-gray-900 py-4 pr-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center text-gray-500">Loading...</TableCell>
              </TableRow>
            ) : filteredBlocks?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center text-gray-500">No blocks found.</TableCell>
              </TableRow>
            ) : (
              filteredBlocks?.map((block: RevenueBlock) => (
                <TableRow key={block.id} className="hover:bg-gray-50/80 transition-colors">
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{block.hotelName || block.hotelId}</p>
                        <p className="text-xs text-gray-500">{block.roomType || 'All room types'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getBlockTypeBadge(block.blockType)} border-none font-bold px-2.5 py-0.5 shadow-sm`}>
                      {block.blockType === 'self-inventory' ? 'Self Inventory' : 'Pre-Blocking'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">{new Date(block.startDate).toLocaleDateString()}</p>
                      <p className="text-gray-500">{new Date(block.endDate).toLocaleDateString()}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-purple-600 text-lg">{block.roomsBlocked}</span>
                    <span className="text-gray-500 text-sm ml-1">rooms</span>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-600 max-w-[150px] truncate">{block.reason || '-'}</p>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusBadge(block.status)} border-none font-bold px-2.5 py-0.5 shadow-sm capitalize`}>
                      {block.status || 'active'}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-primary rounded-lg" onClick={() => { setEditingBlock(block); setIsModalOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500 rounded-lg" onClick={() => deleteMutation.mutate(block.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl rounded-3xl bg-white/95 backdrop-blur-xl border-white/20 p-8 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-gray-900">
              {editingBlock ? 'Edit Revenue Block' : 'Create Revenue Block'}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="hotelId"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="font-bold text-gray-700">Hotel</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                          <option value="">Select hotel...</option>
                          <option value="h1">Grand Palace Hotel</option>
                          <option value="h2">Ocean View Resort</option>
                          <option value="h3">Mountain Lodge</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="blockType"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="font-bold text-gray-700">Block Type</FormLabel>
                      <FormControl>
                        <div className="flex gap-4">
                          {[
                            { value: 'self-inventory', label: 'Self Inventory', desc: 'Hold for your own sales' },
                            { value: 'pre-blocking', label: 'Pre-Blocking', desc: 'Reserve for groups/events' }
                          ].map((type) => (
                            <div
                              key={type.value}
                              className={`
                                  flex-1 p-4 rounded-xl border cursor-pointer transition-all
                                  ${field.value === type.value
                                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                  : 'border-gray-200 bg-white hover:border-gray-300'}
                                `}
                              onClick={() => field.onChange(type.value)}
                            >
                              <p className="font-bold text-gray-900">{type.label}</p>
                              <p className="text-xs text-gray-500 mt-1">{type.desc}</p>
                            </div>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-gray-700">Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="h-11 border-gray-200 bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-gray-700">End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="h-11 border-gray-200 bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="roomsBlocked"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-gray-700">Number of Rooms</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} placeholder="10" {...field} className="h-11 border-gray-200 bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="roomType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-gray-700">Room Type (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Deluxe Suite" {...field} className="h-11 border-gray-200 bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="font-bold text-gray-700">Reason / Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g. Corporate retreat, Wedding group..." {...field} className="border-gray-200 bg-white min-h-[80px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0 sm:justify-between pt-4 border-t border-gray-100">
                <Button type="button" variant="ghost" className="rounded-xl font-bold h-12" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button
                  type="submit"
                  disabled={mutation.isLoading}
                  className="rounded-xl font-extrabold px-8 h-12 bg-gray-900 hover:bg-primary transition-all shadow-xl"
                >
                  {mutation.isLoading ? 'Saving...' : 'Save Block'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
