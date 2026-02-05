import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { 
  BookingDetails, 
  HotelBooking,
  HotelCustomerCosting,
  HotelSupplierCosting,
  Passenger, 
  RequestType, 
  SupplierDetails 
} from '@/features/manual-booking/types';
import { BookingDetailsCard } from '../shared/BookingDetailsCard';
import { PassengerTable } from '../shared/PassengerTable';
import { SupplierDetailsCard } from '../shared/SupplierDetailsCard';
import { NotificationPanel } from '../shared/NotificationPanel';
import { HotelBookingCard, HotelCustomerCostingTable, HotelSupplierCostingTable } from './HotelComponents';
import { 
  Hotel, 
  FileText, 
  DollarSign, 
  Users, 
  MessageSquare, 
  X,
  Check,
  Eye,
  Calculator
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HotelBookingFormProps {
  mode: 'new' | 'view' | 'edit';
  initialData?: Partial<HotelBookingFormData>;
  onSubmit?: (data: HotelBookingFormData) => void;
  onCancel?: () => void;
}

export interface HotelBookingFormData {
  queueNo: string;
  requestType: RequestType;
  customerId: string;
  customerMessage: string;
  oldDetails?: BookingDetails;
  newDetails?: BookingDetails;
  passengers: Passenger[];
  hotelBooking: HotelBooking;
  customerCosting: HotelCustomerCosting[];
  supplierCosting: HotelSupplierCosting[];
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

const defaultHotelBooking: HotelBooking = {
  id: crypto.randomUUID(),
  hotelName: '',
  checkIn: new Date(),
  checkOut: new Date(Date.now() + 86400000),
  roomType: '',
  numberOfRooms: 1,
  ratePerNight: 0,
  totalNights: 1,
  mealPlan: 'BB',
};

export function HotelBookingForm({ mode, initialData, onSubmit, onCancel }: HotelBookingFormProps) {
  const { toast } = useToast();
  const isReadOnly = mode === 'view';

  const [activeTab, setActiveTab] = useState('request');
  const [queueNo, setQueueNo] = useState(initialData?.queueNo || 'Q1');
  const [requestType, setRequestType] = useState<RequestType>(initialData?.requestType || 'confirm');
  const [customerId, setCustomerId] = useState(initialData?.customerId || '');
  const [customerMessage, setCustomerMessage] = useState(initialData?.customerMessage || '');
  const [oldDetails, setOldDetails] = useState<BookingDetails>(initialData?.oldDetails || defaultBookingDetails);
  const [newDetails, setNewDetails] = useState<BookingDetails>(initialData?.newDetails || defaultBookingDetails);
  const [passengers, setPassengers] = useState<Passenger[]>(initialData?.passengers || []);
  const [hotelBooking, setHotelBooking] = useState<HotelBooking>(initialData?.hotelBooking || defaultHotelBooking);
  const [customerCosting, setCustomerCosting] = useState<HotelCustomerCosting[]>(initialData?.customerCosting || []);
  const [supplierCosting, setSupplierCosting] = useState<HotelSupplierCosting[]>(initialData?.supplierCosting || []);
  const [supplierDetails, setSupplierDetails] = useState<SupplierDetails>(initialData?.supplierDetails || defaultSupplierDetails);

  const handleSubmit = () => {
    const data: HotelBookingFormData = {
      queueNo,
      requestType,
      customerId,
      customerMessage,
      oldDetails: requestType !== 'confirm' ? oldDetails : undefined,
      newDetails: requestType !== 'confirm' ? newDetails : undefined,
      passengers,
      hotelBooking,
      customerCosting,
      supplierCosting,
      supplierDetails,
    };

    onSubmit?.(data);
    toast({
      title: "Booking Submitted",
      description: "Your hotel booking has been submitted successfully.",
    });
  };

  const handleNotificationSend = (notification: any) => {
    toast({
      title: "Notification Sent",
      description: `${notification.type} notification sent to customer.`,
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
          <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center">
            <Hotel className="h-6 w-6 text-secondary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Hotel Booking</h1>
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
          <TabsTrigger value="hotel" className="flex items-center gap-2">
            <Hotel className="h-4 w-4" />
            <span className="hidden sm:inline">Hotel Details</span>
            <span className="sm:hidden">Hotel</span>
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
                onSend={handleNotificationSend}
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
                Guest Details
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

        {/* Hotel Details Tab */}
        <TabsContent value="hotel" className="space-y-6 mt-6">
          <HotelBookingCard 
            booking={hotelBooking}
            onUpdate={setHotelBooking}
            readOnly={isReadOnly}
          />
        </TabsContent>

        {/* Costing Tab */}
        <TabsContent value="costing" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <HotelCustomerCostingTable 
              costing={customerCosting}
              onUpdate={setCustomerCosting}
              readOnly={isReadOnly}
            />
            <HotelSupplierCostingTable 
              costing={supplierCosting}
              onUpdate={setSupplierCosting}
              readOnly={isReadOnly}
            />
          </div>

          <Card className="border-secondary/20 bg-secondary/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calculator className="h-5 w-5 text-secondary" />
                  <span className="font-medium">Profit Summary</span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Profit</p>
                  <p className={`text-2xl font-bold ${calculateProfit() >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {calculateProfit() >= 0 ? '+' : ''}{calculateProfit().toFixed(2)}
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
