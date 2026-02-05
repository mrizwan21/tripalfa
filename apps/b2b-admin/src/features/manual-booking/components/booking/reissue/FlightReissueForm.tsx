import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/Badge';
import { 
  BookingDetails, 
  CustomerCosting, 
  FlightSegment, 
  Passenger, 
  ReissueRequest,
  SupplierCosting, 
  SupplierDetails 
} from '@/features/manual-booking/types';
import { BookingDetailsCard } from '../shared/BookingDetailsCard';
import { PassengerTable } from '../shared/PassengerTable';
import { SupplierDetailsCard } from '../shared/SupplierDetailsCard';
import { FlightSegmentTable } from '../flight/FlightSegmentTable';
import { CustomerCostingTable, SupplierCostingTable } from '../flight/FlightCostingTable';
import { 
  RotateCcw, 
  FileText, 
  DollarSign, 
  Users, 
  Plane,
  Ticket,
  X,
  Check,
  Eye,
  Calculator,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

interface FlightReissueFormProps {
  mode: 'new' | 'view' | 'edit';
  initialData?: Partial<FlightReissueFormData>;
  onSubmit?: (data: FlightReissueFormData) => void;
  onCancel?: () => void;
}

export interface FlightReissueFormData {
  originalBookingRef: string;
  originalTickets: { pNo: number; passengerName: string; ticketNumber: string }[];
  newTickets: { pNo: number; passengerName: string; ticketNumber: string }[];
  reason: string;
  oldDetails: BookingDetails;
  newDetails: BookingDetails;
  passengers: Passenger[];
  oldItinerary: FlightSegment[];
  newItinerary: FlightSegment[];
  customerCosting: CustomerCosting[];
  supplierCosting: SupplierCosting[];
  reissueFee: number;
  fareDifference: number;
  taxDifference: number;
  totalCharge: number;
  supplierDetails: SupplierDetails;
}

const defaultSupplierDetails: SupplierDetails = {
  supplierId: '',
  supplierName: '',
  contactMode: 'email',
  contactName: '',
  contactEmail: '',
};

const defaultBookingDetails: BookingDetails = {
  bookingRef: '',
  invoice: '',
  supplierRef: '',
  date: new Date(),
  time: '',
  status: 'pending',
};

export function FlightReissueForm({ mode, initialData, onSubmit, onCancel }: FlightReissueFormProps) {
  const { toast } = useToast();
  const isReadOnly = mode === 'view';

  const [activeTab, setActiveTab] = useState('details');
  const [originalBookingRef, setOriginalBookingRef] = useState(initialData?.originalBookingRef || '');
  const [originalTickets, setOriginalTickets] = useState(initialData?.originalTickets || []);
  const [newTickets, setNewTickets] = useState(initialData?.newTickets || []);
  const [reason, setReason] = useState(initialData?.reason || '');
  const [oldDetails, setOldDetails] = useState<BookingDetails>(initialData?.oldDetails || { ...defaultBookingDetails, status: 'issued' });
  const [newDetails, setNewDetails] = useState<BookingDetails>(initialData?.newDetails || { ...defaultBookingDetails, status: 'issued' });
  const [passengers, setPassengers] = useState<Passenger[]>(initialData?.passengers || []);
  const [oldItinerary, setOldItinerary] = useState<FlightSegment[]>(initialData?.oldItinerary || []);
  const [newItinerary, setNewItinerary] = useState<FlightSegment[]>(initialData?.newItinerary || []);
  const [customerCosting, setCustomerCosting] = useState<CustomerCosting[]>(initialData?.customerCosting || []);
  const [supplierCosting, setSupplierCosting] = useState<SupplierCosting[]>(initialData?.supplierCosting || []);
  const [reissueFee, setReissueFee] = useState(initialData?.reissueFee || 0);
  const [fareDifference, setFareDifference] = useState(initialData?.fareDifference || 0);
  const [taxDifference, setTaxDifference] = useState(initialData?.taxDifference || 0);
  const [supplierDetails, setSupplierDetails] = useState<SupplierDetails>(initialData?.supplierDetails || defaultSupplierDetails);

  const totalCharge = reissueFee + fareDifference + taxDifference;

  const addTicketRow = (type: 'original' | 'new') => {
    const newRow = { pNo: type === 'original' ? originalTickets.length + 1 : newTickets.length + 1, passengerName: '', ticketNumber: '' };
    if (type === 'original') {
      setOriginalTickets([...originalTickets, newRow]);
    } else {
      setNewTickets([...newTickets, newRow]);
    }
  };

  const updateTicket = (type: 'original' | 'new', pNo: number, field: string, value: string) => {
    const tickets = type === 'original' ? originalTickets : newTickets;
    const setTickets = type === 'original' ? setOriginalTickets : setNewTickets;
    const updated = tickets.map(t => t.pNo === pNo ? { ...t, [field]: value } : t);
    setTickets(updated);
  };

  const handleSubmit = () => {
    const data: FlightReissueFormData = {
      originalBookingRef,
      originalTickets,
      newTickets,
      reason,
      oldDetails,
      newDetails,
      passengers,
      oldItinerary,
      newItinerary,
      customerCosting,
      supplierCosting,
      reissueFee,
      fareDifference,
      taxDifference,
      totalCharge,
      supplierDetails,
    };

    onSubmit?.(data);
    toast({
      title: "Reissue Submitted",
      description: "Your flight reissue has been submitted for processing.",
    });
  };

  const calculateProfit = () => {
    const totalCustomer = customerCosting.reduce((acc, c) => acc + c.netCost, 0);
    const totalSupplier = supplierCosting.reduce((acc, c) => acc + c.netCost, 0);
    return totalCustomer - totalSupplier;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-info/20 flex items-center justify-center">
            <RotateCcw className="h-6 w-6 text-info" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Flight Reissue</h1>
            <p className="text-muted-foreground">
              {mode === 'new' ? 'Create reissue request' : mode === 'edit' ? 'Edit reissue' : 'View reissue details'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-base px-4 py-1">
            Ref: {originalBookingRef || 'New'}
          </Badge>
          <Badge className="bg-info text-info-foreground">
            Reissue
          </Badge>
        </div>
      </div>

      {/* Alert */}
      <Card className="border-info/50 bg-info/5">
        <CardContent className="py-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-info" />
            <p className="text-sm">
              Reissue will generate new ticket numbers. Original tickets will be voided after reissue completion.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Details</span>
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            <span className="hidden sm:inline">Tickets</span>
          </TabsTrigger>
          <TabsTrigger value="itinerary" className="flex items-center gap-2">
            <Plane className="h-4 w-4" />
            <span className="hidden sm:inline">Itinerary</span>
          </TabsTrigger>
          <TabsTrigger value="costing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span>Costing</span>
          </TabsTrigger>
          <TabsTrigger value="supplier" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Supplier</span>
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Reissue Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Original Booking Reference</Label>
                  <Input
                    value={originalBookingRef}
                    onChange={(e) => setOriginalBookingRef(e.target.value)}
                    placeholder="ET123456"
                    disabled={isReadOnly}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Reason for Reissue</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe the reason for this reissue..."
                    rows={3}
                    disabled={isReadOnly}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Reissue Charges</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Reissue Fee</Label>
                    <Input
                      type="number"
                      value={reissueFee}
                      onChange={(e) => setReissueFee(parseFloat(e.target.value) || 0)}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fare Difference</Label>
                    <Input
                      type="number"
                      value={fareDifference}
                      onChange={(e) => setFareDifference(parseFloat(e.target.value) || 0)}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tax Difference</Label>
                    <Input
                      type="number"
                      value={taxDifference}
                      onChange={(e) => setTaxDifference(parseFloat(e.target.value) || 0)}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Charge</span>
                    <span className="text-2xl font-bold text-info">
                      {totalCharge.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <BookingDetailsCard 
              title="Old Details" 
              details={oldDetails}
              variant="old"
            />
            <BookingDetailsCard 
              title="New Details" 
              details={newDetails}
              variant="new"
            />
          </div>
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
                  <Ticket className="h-4 w-4" />
                  Original Tickets (To Be Voided)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-16">P No.</TableHead>
                        <TableHead>Passenger Name</TableHead>
                        <TableHead>Ticket Number</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {originalTickets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            No tickets added
                          </TableCell>
                        </TableRow>
                      ) : (
                        originalTickets.map((ticket) => (
                          <TableRow key={ticket.pNo}>
                            <TableCell>{ticket.pNo}</TableCell>
                            <TableCell>
                              <Input
                                value={ticket.passengerName}
                                onChange={(e) => updateTicket('original', ticket.pNo, 'passengerName', e.target.value)}
                                placeholder="Name"
                                className="h-8"
                                disabled={isReadOnly}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={ticket.ticketNumber}
                                onChange={(e) => updateTicket('original', ticket.pNo, 'ticketNumber', e.target.value)}
                                placeholder="176-4401 786 543"
                                className="h-8"
                                disabled={isReadOnly}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {!isReadOnly && (
                  <Button variant="outline" size="sm" onClick={() => addTicketRow('original')} className="mt-3">
                    Add Ticket
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="border-info/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-info">
                  <Ticket className="h-4 w-4" />
                  New Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-16">P No.</TableHead>
                        <TableHead>Passenger Name</TableHead>
                        <TableHead>New Ticket Number</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {newTickets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            No tickets added
                          </TableCell>
                        </TableRow>
                      ) : (
                        newTickets.map((ticket) => (
                          <TableRow key={ticket.pNo}>
                            <TableCell>{ticket.pNo}</TableCell>
                            <TableCell>
                              <Input
                                value={ticket.passengerName}
                                onChange={(e) => updateTicket('new', ticket.pNo, 'passengerName', e.target.value)}
                                placeholder="Name"
                                className="h-8"
                                disabled={isReadOnly}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={ticket.ticketNumber}
                                onChange={(e) => updateTicket('new', ticket.pNo, 'ticketNumber', e.target.value)}
                                placeholder="176-4401 786 544"
                                className="h-8"
                                disabled={isReadOnly}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {!isReadOnly && (
                  <Button variant="outline" size="sm" onClick={() => addTicketRow('new')} className="mt-3">
                    Add Ticket
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Passenger Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PassengerTable 
                passengers={passengers}
                onUpdate={setPassengers}
                readOnly={isReadOnly}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Itinerary Tab */}
        <TabsContent value="itinerary" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
                <Plane className="h-4 w-4" />
                Old Itinerary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FlightSegmentTable 
                segments={oldItinerary}
                onUpdate={setOldItinerary}
                readOnly={true}
              />
            </CardContent>
          </Card>

          <Card className="border-info/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-info">
                <Plane className="h-4 w-4" />
                New Itinerary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FlightSegmentTable 
                segments={newItinerary}
                onUpdate={setNewItinerary}
                readOnly={isReadOnly}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Costing Tab */}
        <TabsContent value="costing" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <CustomerCostingTable 
              costing={customerCosting}
              onUpdate={setCustomerCosting}
              readOnly={isReadOnly}
            />
            <SupplierCostingTable 
              costing={supplierCosting}
              onUpdate={setSupplierCosting}
              readOnly={isReadOnly}
            />
          </div>

          <Card className="border-info/20 bg-info/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calculator className="h-5 w-5 text-info" />
                  <span className="font-medium">Reissue Summary</span>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center justify-end gap-4 text-sm">
                    <span className="text-muted-foreground">Reissue Fee:</span>
                    <span className="font-medium">{reissueFee.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-end gap-4 text-sm">
                    <span className="text-muted-foreground">Fare Difference:</span>
                    <span className="font-medium">{fareDifference.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-end gap-4 text-sm">
                    <span className="text-muted-foreground">Tax Difference:</span>
                    <span className="font-medium">{taxDifference.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-end gap-4 pt-2 border-t">
                    <span className="text-muted-foreground">Total Charge:</span>
                    <span className="text-xl font-bold">{totalCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-end gap-4 text-sm">
                    <span className="text-muted-foreground">Profit:</span>
                    <span className={`font-medium ${calculateProfit() >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {calculateProfit() >= 0 ? '+' : ''}{calculateProfit().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Supplier Tab */}
        <TabsContent value="supplier" className="space-y-6 mt-6">
          <SupplierDetailsCard 
            details={supplierDetails}
            onUpdate={setSupplierDetails}
            readOnly={isReadOnly}
          />
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      {!isReadOnly && (
        <div className="flex items-center justify-end gap-3 pt-6 border-t">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
          <Button variant="secondary">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSubmit} className="bg-info text-info-foreground hover:bg-info/90">
            <Check className="h-4 w-4 mr-2" />
            Submit Reissue
          </Button>
        </div>
      )}
    </div>
  );
}
