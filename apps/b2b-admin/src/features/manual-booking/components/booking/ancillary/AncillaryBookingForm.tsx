import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { 
  AncillaryService,
  BookingDetails, 
  Passenger, 
  RequestType, 
  SupplierDetails 
} from '@/features/manual-booking/types';
import { BookingDetailsCard } from '../shared/BookingDetailsCard';
import { PassengerTable } from '../shared/PassengerTable';
import { SupplierDetailsCard } from '../shared/SupplierDetailsCard';
import { NotificationPanel } from '../shared/NotificationPanel';
import { 
  Package, 
  FileText, 
  DollarSign, 
  Users, 
  MessageSquare, 
  X,
  Check,
  Eye,
  Calculator,
  Plus,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AncillaryBookingFormProps {
  mode: 'new' | 'view' | 'edit';
  initialData?: Partial<AncillaryBookingFormData>;
  onSubmit?: (data: AncillaryBookingFormData) => void;
  onCancel?: () => void;
}

export interface AncillaryBookingFormData {
  queueNo: string;
  requestType: RequestType;
  customerId: string;
  customerMessage: string;
  oldDetails?: BookingDetails;
  newDetails?: BookingDetails;
  passengers: Passenger[];
  services: AncillaryService[];
  supplierDetails: SupplierDetails;
}

interface AncillaryCosting {
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  taxes: number;
  markup: number;
  netCost: number;
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

const serviceTypes = [
  { value: 'visa', label: 'Visa' },
  { value: 'insurance', label: 'Travel Insurance' },
  { value: 'transfer', label: 'Airport Transfer' },
  { value: 'tour', label: 'Tour/Excursion' },
  { value: 'baggage', label: 'Extra Baggage' },
  { value: 'seat', label: 'Seat Selection' },
  { value: 'meal', label: 'Special Meal' },
  { value: 'lounge', label: 'Lounge Access' },
  { value: 'other', label: 'Other' },
];

export function AncillaryBookingForm({ mode, initialData, onSubmit, onCancel }: AncillaryBookingFormProps) {
  const { toast } = useToast();
  const isReadOnly = mode === 'view';

  const [activeTab, setActiveTab] = useState('request');
  const [queueNo, setQueueNo] = useState(initialData?.queueNo || 'Q1');
  const [requestType, setRequestType] = useState<RequestType>(initialData?.requestType || 'confirm');
  const [customerId, setCustomerId] = useState(initialData?.customerId || '');
  const [customerMessage, setCustomerMessage] = useState(initialData?.customerMessage || '');
  const [oldDetails] = useState<BookingDetails>(initialData?.oldDetails || defaultBookingDetails);
  const [newDetails] = useState<BookingDetails>(initialData?.newDetails || defaultBookingDetails);
  const [passengers, setPassengers] = useState<Passenger[]>(initialData?.passengers || []);
  const [services, setServices] = useState<AncillaryService[]>(initialData?.services || []);
  const [supplierDetails, setSupplierDetails] = useState<SupplierDetails>(initialData?.supplierDetails || defaultSupplierDetails);
  const [costing, setCosting] = useState<AncillaryCosting[]>([]);

  const addService = () => {
    const newService: AncillaryService = {
      id: crypto.randomUUID(),
      serviceType: 'other',
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    };
    setServices([...services, newService]);
    
    // Add corresponding costing row
    const newCosting: AncillaryCosting = {
      serviceId: newService.id,
      serviceName: '',
      quantity: 1,
      unitPrice: 0,
      taxes: 0,
      markup: 0,
      netCost: 0,
    };
    setCosting([...costing, newCosting]);
  };

  const removeService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
    setCosting(costing.filter(c => c.serviceId !== id));
  };

  const updateService = (id: string, field: keyof AncillaryService, value: any) => {
    const updated = services.map(s => {
      if (s.id !== id) return s;
      const updatedService = { ...s, [field]: value };
      updatedService.totalPrice = updatedService.quantity * updatedService.unitPrice;
      return updatedService;
    });
    setServices(updated);
  };

  const updateCosting = (serviceId: string, field: keyof AncillaryCosting, value: any) => {
    const updated = costing.map(c => {
      if (c.serviceId !== serviceId) return c;
      const updatedRow = { ...c, [field]: value };
      updatedRow.netCost = (updatedRow.quantity * updatedRow.unitPrice) + updatedRow.taxes + updatedRow.markup;
      return updatedRow;
    });
    setCosting(updated);
  };

  const handleSubmit = () => {
    const data: AncillaryBookingFormData = {
      queueNo,
      requestType,
      customerId,
      customerMessage,
      oldDetails: requestType !== 'confirm' ? oldDetails : undefined,
      newDetails: requestType !== 'confirm' ? newDetails : undefined,
      passengers,
      services,
      supplierDetails,
    };

    onSubmit?.(data);
    toast({
      title: "Booking Submitted",
      description: "Your ancillary booking has been submitted successfully.",
    });
  };

  const handleNotificationSend = (notification: any) => {
    toast({
      title: "Notification Sent",
      description: `${notification.type} notification sent to customer.`,
    });
  };

  const calculateTotalServices = () => {
    return services.reduce((acc, s) => acc + s.totalPrice, 0);
  };

  const calculateTotalCosting = () => {
    return costing.reduce((acc, c) => acc + c.netCost, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-accent/20 flex items-center justify-center">
            <Package className="h-6 w-6 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Ancillary Services</h1>
            <p className="text-muted-foreground">
              {mode === 'new' ? 'Create new booking' : mode === 'edit' ? 'Edit booking' : 'View booking details'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-base px-4 py-1">
            Queue: {queueNo}
          </Badge>
          <Badge className={
            requestType === 'confirm' ? 'bg-success text-success-foreground' :
            requestType === 'pricing' ? 'bg-info text-info-foreground' :
            requestType === 'amendment' ? 'bg-warning text-warning-foreground' :
            'bg-primary text-primary-foreground'
          }>
            {requestType.charAt(0).toUpperCase() + requestType.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="request" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Customer Request</span>
            <span className="sm:hidden">Request</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>Services</span>
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

        {/* Customer Request Tab */}
        <TabsContent value="request" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Request Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Request Type</Label>
                    <Select 
                      value={requestType} 
                      onValueChange={(v) => setRequestType(v as RequestType)}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirm">Confirm Request</SelectItem>
                        <SelectItem value="pricing">Pricing Request</SelectItem>
                        <SelectItem value="amendment">Amendment</SelectItem>
                        <SelectItem value="cancellation">Cancellation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Customer ID</Label>
                    <Input
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      placeholder="Customer ID"
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {!isReadOnly && (
              <NotificationPanel 
                customerId={customerId} 
                onNotificationSent={handleNotificationSend}
              />
            )}
          </div>

          {(requestType === 'amendment') && (
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
          )}

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

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Customer Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={customerMessage}
                onChange={(e) => setCustomerMessage(e.target.value)}
                placeholder="Enter customer request message..."
                rows={4}
                disabled={isReadOnly}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Ancillary Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-40">Service Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-20 text-right">Qty</TableHead>
                      <TableHead className="w-28 text-right">Unit Price</TableHead>
                      <TableHead className="w-28 text-right">Total</TableHead>
                      <TableHead>Linked Passenger</TableHead>
                      {!isReadOnly && <TableHead className="w-12"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isReadOnly ? 6 : 7} className="text-center text-muted-foreground py-8">
                          No services added
                        </TableCell>
                      </TableRow>
                    ) : (
                      services.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell>
                            {isReadOnly ? (
                              serviceTypes.find(t => t.value === service.serviceType)?.label
                            ) : (
                              <Select
                                value={service.serviceType}
                                onValueChange={(v) => updateService(service.id, 'serviceType', v)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {serviceTypes.map(type => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell>
                            {isReadOnly ? service.description : (
                              <Input
                                value={service.description}
                                onChange={(e) => updateService(service.id, 'description', e.target.value)}
                                placeholder="Service description"
                                className="h-8"
                              />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isReadOnly ? service.quantity : (
                              <Input
                                type="number"
                                min={1}
                                value={service.quantity}
                                onChange={(e) => updateService(service.id, 'quantity', parseInt(e.target.value) || 1)}
                                className="h-8 w-16 text-right"
                              />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isReadOnly ? service.unitPrice.toFixed(2) : (
                              <Input
                                type="number"
                                min={0}
                                value={service.unitPrice}
                                onChange={(e) => updateService(service.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="h-8 text-right"
                              />
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {service.totalPrice.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {isReadOnly ? service.linkedPassenger : (
                              <Select
                                value={service.linkedPassenger || ''}
                                onValueChange={(v) => updateService(service.id, 'linkedPassenger', v)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">All Passengers</SelectItem>
                                  {passengers.map(p => (
                                    <SelectItem key={p.id} value={p.id}>
                                      {p.name || `Passenger ${p.pNo}`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          {!isReadOnly && (
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => removeService(service.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                    {services.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="font-semibold bg-muted/50">Total</TableCell>
                        <TableCell className="text-right font-semibold bg-muted/50">
                          {calculateTotalServices().toFixed(2)}
                        </TableCell>
                        <TableCell colSpan={isReadOnly ? 1 : 2} className="bg-muted/50"></TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {!isReadOnly && (
                <Button variant="outline" size="sm" onClick={addService} className="mt-3">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Costing Tab */}
        <TabsContent value="costing" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Service Costing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table className="costing-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead className="w-20 text-right">Qty</TableHead>
                      <TableHead className="w-28 text-right">Unit Price</TableHead>
                      <TableHead className="w-24 text-right">Taxes</TableHead>
                      <TableHead className="w-24 text-right">Markup</TableHead>
                      <TableHead className="w-28 text-right">Net Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costing.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Add services to see costing
                        </TableCell>
                      </TableRow>
                    ) : (
                      costing.map((row) => (
                        <TableRow key={row.serviceId}>
                          <TableCell>
                            {isReadOnly ? row.serviceName : (
                              <Input
                                value={row.serviceName}
                                onChange={(e) => updateCosting(row.serviceId, 'serviceName', e.target.value)}
                                placeholder="Service name"
                                className="h-8"
                              />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isReadOnly ? row.quantity : (
                              <Input
                                type="number"
                                value={row.quantity}
                                onChange={(e) => updateCosting(row.serviceId, 'quantity', parseInt(e.target.value) || 0)}
                                className="h-8 w-16 text-right"
                              />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isReadOnly ? row.unitPrice.toFixed(2) : (
                              <Input
                                type="number"
                                value={row.unitPrice}
                                onChange={(e) => updateCosting(row.serviceId, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="h-8 text-right"
                              />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isReadOnly ? row.taxes.toFixed(2) : (
                              <Input
                                type="number"
                                value={row.taxes}
                                onChange={(e) => updateCosting(row.serviceId, 'taxes', parseFloat(e.target.value) || 0)}
                                className="h-8 text-right"
                              />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isReadOnly ? row.markup.toFixed(2) : (
                              <Input
                                type="number"
                                value={row.markup}
                                onChange={(e) => updateCosting(row.serviceId, 'markup', parseFloat(e.target.value) || 0)}
                                className="h-8 text-right"
                              />
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">{row.netCost.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    )}
                    {costing.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="font-semibold">Total</TableCell>
                        <TableCell className="text-right font-semibold">
                          {calculateTotalCosting().toFixed(2)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calculator className="h-5 w-5 text-accent-foreground" />
                  <span className="font-medium">Total Services Value</span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Net Total</p>
                  <p className="text-2xl font-bold text-foreground">
                    {calculateTotalCosting().toFixed(2)}
                  </p>
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
          <Button onClick={handleSubmit}>
            <Check className="h-4 w-4 mr-2" />
            {mode === 'new' ? 'Submit Booking' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
}
