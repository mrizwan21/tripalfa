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
  AmendmentRequest,
  BookingDetails, 
  CustomerCosting, 
  FlightSegment, 
  Passenger, 
  SupplierCosting, 
  SupplierDetails 
} from '@/features/manual-booking/types';
import { BookingDetailsCard } from '../shared/BookingDetailsCard';
import { PassengerTable } from '../shared/PassengerTable';
import { SupplierDetailsCard } from '../shared/SupplierDetailsCard';
import { FlightSegmentTable } from '../flight/FlightSegmentTable';
import { CustomerCostingTable, SupplierCostingTable } from '../flight/FlightCostingTable';
import { 
  RefreshCw, 
  FileText, 
  DollarSign, 
  Users, 
  Plane,
  X,
  Check,
  Eye,
  Calculator,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FlightAmendmentFormProps {
  mode: 'new' | 'view' | 'edit';
  initialData?: Partial<FlightAmendmentFormData>;
  onSubmit?: (data: FlightAmendmentFormData) => void;
  onCancel?: () => void;
}

export interface FlightAmendmentFormData {
  originalBookingRef: string;
  amendmentType: AmendmentRequest['amendmentType'];
  reason: string;
  oldDetails: BookingDetails;
  newDetails: BookingDetails;
  passengers: Passenger[];
  oldItinerary: FlightSegment[];
  newItinerary: FlightSegment[];
  customerCosting: CustomerCosting[];
  supplierCosting: SupplierCosting[];
  amendmentFee: number;
  fareDifference: number;
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

const amendmentTypes = [
  { value: 'date_change', label: 'Date Change' },
  { value: 'name_change', label: 'Name Change' },
  { value: 'route_change', label: 'Route Change' },
  { value: 'class_upgrade', label: 'Class Upgrade' },
  { value: 'add_service', label: 'Add Service' },
  { value: 'remove_service', label: 'Remove Service' },
];

export function FlightAmendmentForm({ mode, initialData, onSubmit, onCancel }: FlightAmendmentFormProps) {
  const { toast } = useToast();
  const isReadOnly = mode === 'view';

  const [activeTab, setActiveTab] = useState('details');
  const [originalBookingRef, setOriginalBookingRef] = useState(initialData?.originalBookingRef || '');
  const [amendmentType, setAmendmentType] = useState<AmendmentRequest['amendmentType']>(initialData?.amendmentType || 'date_change');
  const [reason, setReason] = useState(initialData?.reason || '');
  const [oldDetails, setOldDetails] = useState<BookingDetails>(initialData?.oldDetails || { ...defaultBookingDetails, status: 'issued' });
  const [newDetails, setNewDetails] = useState<BookingDetails>(initialData?.newDetails || { ...defaultBookingDetails, status: 'confirmed' });
  const [passengers, setPassengers] = useState<Passenger[]>(initialData?.passengers || []);
  const [oldItinerary, setOldItinerary] = useState<FlightSegment[]>(initialData?.oldItinerary || []);
  const [newItinerary, setNewItinerary] = useState<FlightSegment[]>(initialData?.newItinerary || []);
  const [customerCosting, setCustomerCosting] = useState<CustomerCosting[]>(initialData?.customerCosting || []);
  const [supplierCosting, setSupplierCosting] = useState<SupplierCosting[]>(initialData?.supplierCosting || []);
  const [amendmentFee, setAmendmentFee] = useState(initialData?.amendmentFee || 0);
  const [fareDifference, setFareDifference] = useState(initialData?.fareDifference || 0);
  const [supplierDetails, setSupplierDetails] = useState<SupplierDetails>(initialData?.supplierDetails || defaultSupplierDetails);

  const totalCharge = amendmentFee + fareDifference;

  const handleSubmit = () => {
    const data: FlightAmendmentFormData = {
      originalBookingRef,
      amendmentType,
      reason,
      oldDetails,
      newDetails,
      passengers,
      oldItinerary,
      newItinerary,
      customerCosting,
      supplierCosting,
      amendmentFee,
      fareDifference,
      totalCharge,
      supplierDetails,
    };

    onSubmit?.(data);
    toast({
      title: "Amendment Submitted",
      description: "Your flight amendment has been submitted for processing.",
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
          <div className="h-12 w-12 rounded-lg bg-warning/20 flex items-center justify-center">
            <RefreshCw className="h-6 w-6 text-warning" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Flight Amendment</h1>
            <p className="text-muted-foreground">
              {mode === 'new' ? 'Create amendment request' : mode === 'edit' ? 'Edit amendment' : 'View amendment details'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-base px-4 py-1">
            Ref: {originalBookingRef || 'New'}
          </Badge>
          <Badge className="bg-warning text-warning-foreground">
            Amendment
          </Badge>
        </div>
      </div>

      {/* Alert */}
      <Card className="border-warning/50 bg-warning/5">
        <CardContent className="py-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <p className="text-sm">
              Amendment requests require approval. Ensure all details are accurate before submission.
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
          <TabsTrigger value="passengers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Passengers</span>
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
                <CardTitle className="text-base">Amendment Information</CardTitle>
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
                  <Label>Amendment Type</Label>
                  <Select 
                    value={amendmentType} 
                    onValueChange={(v) => setAmendmentType(v as AmendmentRequest['amendmentType'])}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {amendmentTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Reason for Amendment</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe the reason for this amendment..."
                    rows={3}
                    disabled={isReadOnly}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Amendment Charges</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amendment Fee</Label>
                    <Input
                      type="number"
                      value={amendmentFee}
                      onChange={(e) => setAmendmentFee(parseFloat(e.target.value) || 0)}
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
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Charge</span>
                    <span className="text-2xl font-bold text-primary">
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

        {/* Passengers Tab */}
        <TabsContent value="passengers" className="space-y-6 mt-6">
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

          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-primary">
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

          <Card className="border-warning/20 bg-warning/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calculator className="h-5 w-5 text-warning" />
                  <span className="font-medium">Amendment Summary</span>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center justify-end gap-4 text-sm">
                    <span className="text-muted-foreground">Amendment Fee:</span>
                    <span className="font-medium">{amendmentFee.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-end gap-4 text-sm">
                    <span className="text-muted-foreground">Fare Difference:</span>
                    <span className="font-medium">{fareDifference.toFixed(2)}</span>
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
          <Button onClick={handleSubmit} className="bg-warning text-warning-foreground hover:bg-warning/90">
            <Check className="h-4 w-4 mr-2" />
            Submit Amendment
          </Button>
        </div>
      )}
    </div>
  );
}
