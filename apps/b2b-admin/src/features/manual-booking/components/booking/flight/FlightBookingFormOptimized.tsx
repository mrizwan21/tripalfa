import React, { useMemo, useCallback } from 'react';
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
  CustomerCosting, 
  FlightSegment, 
  Passenger, 
  RequestType, 
  SupplierCosting, 
  SupplierDetails 
} from '@/features/manual-booking/types';
import { BookingDetailsCard } from '../shared/BookingDetailsCard';
import { PassengerTable } from '../shared/PassengerTable';
import { SupplierDetailsCard } from '../shared/SupplierDetailsCard';
import { NotificationPanel } from '../shared/NotificationPanel';
import { FlightSegmentTable } from './FlightSegmentTable';
import { CustomerCostingTable, SupplierCostingTable } from './FlightCostingTable';
import { 
  Plane, 
  FileText, 
  DollarSign, 
  Users, 
  MessageSquare, 
  Send, 
  X,
  Check,
  Eye,
  Calculator
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FlightBookingFormProps {
  mode: 'new' | 'view' | 'edit';
  initialData?: Partial<FlightBookingFormData>;
  onSubmit?: (data: FlightBookingFormData) => void;
  onCancel?: () => void;
}

export interface FlightBookingFormData {
  queueNo: string;
  requestType: RequestType;
  customerId: string;
  customerMessage: string;
  oldDetails?: BookingDetails;
  newDetails?: BookingDetails;
  passengers: Passenger[];
  segments: FlightSegment[];
  customerCosting: CustomerCosting[];
  supplierCosting: SupplierCosting[];
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

// Memoized calculation function
const calculateProfit = (customerCosting: CustomerCosting[], supplierCosting: SupplierCosting[]): number => {
  const totalCustomer = customerCosting.reduce((acc, c) => acc + c.netCost, 0);
  const totalSupplier = supplierCosting.reduce((acc, c) => acc + c.netCost, 0);
  return totalCustomer - totalSupplier;
};

// Memoized profit calculation
const useProfitCalculation = (customerCosting: CustomerCosting[], supplierCosting: SupplierCosting[]) => {
  return useMemo(() => calculateProfit(customerCosting, supplierCosting), [customerCosting, supplierCosting]);
};

// Memoized handlers
const useFlightBookingHandlers = (onSubmit?: (data: FlightBookingFormData) => void) => {
  const handleSubmit = useCallback((data: FlightBookingFormData) => {
    onSubmit?.(data);
  }, [onSubmit]);

  return { handleSubmit };
};

export function FlightBookingFormOptimized({ mode, initialData, onSubmit, onCancel }: FlightBookingFormProps) {
  const { toast } = useToast();
  const isReadOnly = mode === 'view';

  const [activeTab, setActiveTab] = React.useState('request');
  const [queueNo, setQueueNo] = React.useState(initialData?.queueNo || 'Q1');
  const [requestType, setRequestType] = React.useState<RequestType>(initialData?.requestType || 'confirm');
  const [customerId, setCustomerId] = React.useState(initialData?.customerId || '');
  const [customerMessage, setCustomerMessage] = React.useState(initialData?.customerMessage || '');
  const [oldDetails, setOldDetails] = React.useState<BookingDetails>(initialData?.oldDetails || defaultBookingDetails);
  const [newDetails, setNewDetails] = React.useState<BookingDetails>(initialData?.newDetails || defaultBookingDetails);
  const [passengers, setPassengers] = React.useState<Passenger[]>(initialData?.passengers || []);
  const [segments, setSegments] = React.useState<FlightSegment[]>(initialData?.segments || []);
  const [customerCosting, setCustomerCosting] = React.useState<CustomerCosting[]>(initialData?.customerCosting || []);
  const [supplierCosting, setSupplierCosting] = React.useState<SupplierCosting[]>(initialData?.supplierCosting || []);
  const [supplierDetails, setSupplierDetails] = React.useState<SupplierDetails>(initialData?.supplierDetails || defaultSupplierDetails);

  // Memoized profit calculation
  const profit = useProfitCalculation(customerCosting, supplierCosting);

  // Memoized handlers
  const { handleSubmit } = useFlightBookingHandlers(onSubmit);

  const handleNotificationSend = useCallback((notification: any) => {
    toast({
      title: "Notification Sent",
      description: `${notification.type} notification sent to customer.`,
    });
  }, [toast]);

  const handleSave = useCallback(() => {
    const data: FlightBookingFormData = {
      queueNo,
      requestType,
      customerId,
      customerMessage,
      oldDetails: requestType !== 'confirm' ? oldDetails : undefined,
      newDetails: requestType !== 'confirm' ? newDetails : undefined,
      passengers,
      segments,
      customerCosting,
      supplierCosting,
      supplierDetails,
    };

    handleSubmit(data);
    toast({
      title: "Booking Submitted",
      description: "Your flight booking has been submitted successfully.",
    });
  }, [queueNo, requestType, customerId, customerMessage, oldDetails, newDetails, passengers, segments, customerCosting, supplierCosting, supplierDetails, handleSubmit, toast]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Plane className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Flight Booking</h1>
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
          <TabsTrigger value="itinerary" className="flex items-center gap-2">
            <Plane className="h-4 w-4" />
            <span className="hidden sm:inline">Itinerary</span>
            <span className="sm:hidden">Flights</span>
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
            {/* Request Type & Customer ID */}
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
                        <SelectItem value="reissue">Reissue</SelectItem>
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

            {/* Notification Panel */}
            {!isReadOnly && (
              <NotificationPanel 
                customerId={customerId} 
                onNotificationSent={handleNotificationSend}
              />
            )}
          </div>

          {/* Old/New Details (for amendments) */}
          {(requestType === 'amendment' || requestType === 'reissue') && (
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

          {/* Passenger Details */}
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

          {/* Customer Message */}
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

        {/* Itinerary Tab */}
        <TabsContent value="itinerary" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Plane className="h-4 w-4" />
                Flight Segments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FlightSegmentTable 
                segments={segments}
                onUpdate={setSegments}
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

          {/* Profit Summary */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calculator className="h-5 w-5 text-primary" />
                  <span className="font-medium">Profit Summary</span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Profit</p>
                  <p className={`text-2xl font-bold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {profit >= 0 ? '+' : ''}{profit.toFixed(2)}
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
          <Button onClick={handleSave}>
            <Check className="h-4 w-4 mr-2" />
            {mode === 'new' ? 'Submit Booking' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
}