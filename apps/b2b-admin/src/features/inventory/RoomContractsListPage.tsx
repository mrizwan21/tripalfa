import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, FileText, Calendar, DollarSign, MoreVertical, Edit, Trash2, Search, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

export interface RoomContract {
  id: string;
  hotelId: string;
  hotelName?: string;
  roomId: string;
  roomName?: string;
  contractType: 'allocation' | 'guarantee' | 'dynamic' | 'static';
  startDate: string;
  endDate: string;
  price: number;
  currency: string;
  terms?: string;
  createdBy?: string;
  status?: 'active' | 'expired' | 'pending';
}

const contractSchema = z.object({
  hotelId: z.string().min(1, "Hotel is required"),
  roomId: z.string().min(1, "Room is required"),
  contractType: z.enum(['allocation', 'guarantee', 'dynamic', 'static']),
  startDate: z.string().min(1, "Start date required"),
  endDate: z.string().min(1, "End date required"),
  price: z.coerce.number().min(0, "Price must be positive"),
  currency: z.string().min(1, "Currency required"),
  terms: z.string().optional(),
});

type ContractFormValues = z.infer<typeof contractSchema>;

export default function RoomContractsListPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingContract, setEditingContract] = React.useState<RoomContract | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  const { data: contracts, isLoading } = useQuery('roomContracts', async () => {
    // const res = await axios.get('/api/inventory/room-contracts');
    // return res.data;
    return [
      { id: '1', hotelId: 'h1', hotelName: 'Grand Palace Hotel', roomId: 'r1', roomName: 'Deluxe Suite', contractType: 'allocation', startDate: '2026-01-01', endDate: '2026-06-30', price: 150, currency: 'USD', terms: 'Minimum 3-night stay', createdBy: 'Admin', status: 'active' },
      { id: '2', hotelId: 'h2', hotelName: 'Ocean View Resort', roomId: 'r2', roomName: 'Standard Double', contractType: 'guarantee', startDate: '2026-02-01', endDate: '2026-12-31', price: 95, currency: 'USD', terms: 'No cancellation', createdBy: 'Manager', status: 'active' },
      { id: '3', hotelId: 'h1', hotelName: 'Grand Palace Hotel', roomId: 'r3', roomName: 'Presidential Suite', contractType: 'dynamic', startDate: '2025-06-01', endDate: '2025-12-31', price: 450, currency: 'USD', terms: 'Seasonal pricing', createdBy: 'Admin', status: 'expired' },
    ] as RoomContract[];
  });

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      hotelId: '',
      roomId: '',
      contractType: 'allocation',
      startDate: '',
      endDate: '',
      price: 0,
      currency: 'USD',
      terms: '',
    },
  });

  React.useEffect(() => {
    if (editingContract) {
      form.reset({
        hotelId: editingContract.hotelId,
        roomId: editingContract.roomId,
        contractType: editingContract.contractType,
        startDate: editingContract.startDate,
        endDate: editingContract.endDate,
        price: editingContract.price,
        currency: editingContract.currency,
        terms: editingContract.terms || '',
      });
    } else {
      form.reset({
        hotelId: '',
        roomId: '',
        contractType: 'allocation',
        startDate: '',
        endDate: '',
        price: 0,
        currency: 'USD',
        terms: '',
      });
    }
  }, [editingContract, form]);

  const mutation = useMutation(
    async (values: ContractFormValues) => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return values;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('roomContracts');
        setIsModalOpen(false);
        toast.success(editingContract ? "Contract updated" : "Contract created");
      },
      onError: () => {
        toast.error("Failed to save contract");
      },
    }
  );

  const deleteMutation = useMutation(
    async (id: string) => {
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('roomContracts');
        toast.success("Contract deleted");
      },
    }
  );

  const filteredContracts = contracts?.filter((c: RoomContract) =>
    c.hotelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.roomName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contractType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getContractTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      allocation: 'bg-blue-100 text-blue-700',
      guarantee: 'bg-green-100 text-green-700',
      dynamic: 'bg-purple-100 text-purple-700',
      static: 'bg-gray-100 text-gray-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getStatusBadge = (status?: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      expired: 'bg-red-100 text-red-700',
      pending: 'bg-yellow-100 text-yellow-700',
    };
    return colors[status || 'active'] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Room Contracts</h1>
            <p className="text-gray-500 font-medium text-sm">Manage pricing agreements with hotel partners</p>
          </div>
        </div>
        <Button
          onClick={() => { setEditingContract(null); setIsModalOpen(true); }}
          className="h-12 bg-gray-900 hover:bg-primary transition-all px-6 rounded-2xl font-bold shadow-lg" > <Plus className="mr-2 h-5 w-5" />
          New Contract
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-lg bg-white rounded-3xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Total Contracts</p>
              <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{contracts?.length || 0}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-white rounded-3xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Active</p>
              <h3 className="text-3xl font-extrabold text-green-600 mt-1">{contracts?.filter(c => c.status === 'active').length || 0}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
              <Calendar className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-white rounded-3xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Expired</p>
              <h3 className="text-3xl font-extrabold text-red-600 mt-1">{contracts?.filter(c => c.status === 'expired').length || 0}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <Calendar className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg bg-white rounded-3xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Avg. Price</p>
              <h3 className="text-3xl font-extrabold text-gray-900 mt-1">
                ${contracts?.length ? Math.round(contracts.reduce((sum, c) => sum + c.price, 0) / contracts.length) : 0}
              </h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <DollarSign className="h-6 w-6" />
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
              placeholder="Search contracts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-all rounded-xl"
            />
          </div>
        </div>
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="font-bold text-gray-900 py-4 pl-6">Hotel / Room</TableHead>
              <TableHead className="font-bold text-gray-900 py-4">Contract Type</TableHead>
              <TableHead className="font-bold text-gray-900 py-4">Period</TableHead>
              <TableHead className="font-bold text-gray-900 py-4">Price</TableHead>
              <TableHead className="font-bold text-gray-900 py-4">Status</TableHead>
              <TableHead className="font-bold text-gray-900 py-4 pr-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-gray-500">Loading...</TableCell>
              </TableRow>
            ) : filteredContracts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-gray-500">No contracts found.</TableCell>
              </TableRow>
            ) : (
              filteredContracts?.map((contract: RoomContract) => (
                <TableRow key={contract.id} className="hover:bg-gray-50/80 transition-colors">
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{contract.hotelName || contract.hotelId}</p>
                        <p className="text-xs text-gray-500">{contract.roomName || contract.roomId}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getContractTypeBadge(contract.contractType)} border-none font-bold px-2.5 py-0.5 shadow-sm capitalize`}>
                      {contract.contractType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">{new Date(contract.startDate).toLocaleDateString()}</p>
                      <p className="text-gray-500">{new Date(contract.endDate).toLocaleDateString()}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-gray-900">
                    {contract.currency} {contract.price.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusBadge(contract.status)} border-none font-bold px-2.5 py-0.5 shadow-sm capitalize`}>
                      {contract.status || 'active'}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-primary rounded-lg" onClick={() => { setEditingContract(contract); setIsModalOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500 rounded-lg" onClick={() => deleteMutation.mutate(contract.id)}>
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
              {editingContract ? 'Edit Contract' : 'New Room Contract'}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="hotelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-gray-700">Hotel ID</FormLabel>
                      <FormControl>
                        <Input placeholder="h1" {...field} className="h-11 border-gray-200 bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="roomId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-gray-700">Room ID</FormLabel>
                      <FormControl>
                        <Input placeholder="r1" {...field} className="h-11 border-gray-200 bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contractType"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="font-bold text-gray-700">Contract Type</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                          <option value="allocation">Allocation</option>
                          <option value="guarantee">Guarantee</option>
                          <option value="dynamic">Dynamic</option>
                          <option value="static">Static</option>
                        </select>
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
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-gray-700">Price per Night</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="150" {...field} className="h-11 border-gray-200 bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-gray-700">Currency</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="AED">AED</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="font-bold text-gray-700">Contract Terms</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter contract terms and conditions..." {...field} className="border-gray-200 bg-white min-h-[80px]" />
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
                  {mutation.isLoading ? 'Saving...' : 'Save Contract'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
