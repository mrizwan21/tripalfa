import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plane,
  Building2,
  Calendar,
  User,
  CreditCard,
  FileText,
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Download,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Star,
  BadgeCheck,
  Users,
  ArrowLeftRight,
  Info,
  DollarSign,
  RefreshCw,
  Ticket,
  Hotel,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserCheck,
  UserX,
  Receipt,
  FileText as FileTextIcon,
  Printer,
  Share2,
  Copy,
  Globe,
  Zap,
  Tag,
  Map,
  Utensils,
  Wifi,
  Car,
  Coffee,
  ShoppingCart,
  Gift,
  Shield,
  Lock,
  Key,
  Globe2,
  Database,
  Package,
  CreditCard as CreditCardIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';

interface Booking {
  id: string;
  bookingRef: string;
  confirmationNumber?: string;
  type: 'flight' | 'hotel' | 'package';
  status: 'pending' | 'confirmed' | 'hold' | 'cancelled' | 'refunded' | 'amended' | 'imported' | 'ticketed';
  bookingType: 'instant' | 'hold' | 'request' | 'imported';
  customerType: 'B2B' | 'B2C';
  customerId: string;
  companyId?: string;
  branchId?: string;
  productId?: string;
  supplierId?: string;
  serviceDetails: any;
  passengers: Passenger[];
  pricing: Pricing;
  payment: Payment;
  specialRequests: string[];
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
  holdUntil?: Date;
  queueStatus?: 'pending' | 'completed' | 'failed';
  importedAt?: Date;
  importedBy?: string;
  ticketDetails?: any;
  refunds: Refund[];
  amendments: Amendment[];
}

interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  passportNumber?: string;
  nationality?: string;
  type: 'adult' | 'child' | 'infant';
  seatPreference?: string;
  mealPreference?: string;
}

interface Pricing {
  customerPrice: number;
  supplierPrice: number;
  markup: number;
  currency: string;
  taxes: number;
  fees: number;
  discount?: number;
}

interface Payment {
  method: 'wallet' | 'credit_card' | 'debit_card' | 'net_banking' | 'upi' | 'supplier_credit';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  supplierPayment?: {
    method: string;
    terms: string;
    creditLimit?: number;
  };
  transactions: PaymentTransaction[];
}

interface PaymentTransaction {
  id: string;
  amount: number;
  method: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  timestamp: Date;
  transactionId?: string;
  gateway?: string;
  gatewayResponse?: any;
}

interface Refund {
  id: string;
  amount: number;
  reason: string;
  type: 'full' | 'partial';
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
  processedBy?: string;
}

interface Amendment {
  id: string;
  bookingId: string;
  changes: any;
  reason: string;
  priceDifference: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
}

interface BookingDocument {
  id: string;
  bookingId: string;
  type: 'invoice' | 'receipt' | 'credit_note' | 'e_ticket' | 'hotel_voucher' | 'amendment_invoice';
  fileName: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  generatedAt: Date;
  generatedBy: string;
  status: 'generated' | 'sent' | 'downloaded';
  sentTo?: string[];
  downloadCount: number;
}

interface BookingHistory {
  id: string;
  bookingId: string;
  action: string;
  description: string;
  performedBy: string;
  timestamp: Date;
  details: any;
  ipAddress?: string;
  userAgent?: string;
}

export function EnhancedBookingCard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showAmendmentModal, setShowAmendmentModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Payment modal state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Refund modal state
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundTo, setRefundTo] = useState('original');

  // Amendment modal state
  const [amendmentChanges, setAmendmentChanges] = useState('');
  const [amendmentReason, setAmendmentReason] = useState('');

  // Import modal state
  const [gdsType, setGdsType] = useState<'amadeus' | 'sabre' | 'travelport'>('amadeus');
  const [pnr, setPnr] = useState('');
  const [supplierRef, setSupplierRef] = useState('');

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    setLoading(true);
    try {
      // Mock booking data - replace with actual API call
      const mockBooking: Booking = {
        id: id || 'BK-99120',
        bookingRef: 'B2B-1234567890-ABC',
        confirmationNumber: 'XA882J',
        type: 'flight',
        status: 'confirmed',
        bookingType: 'instant',
        customerType: 'B2B',
        customerId: 'user1',
        companyId: 'company1',
        branchId: 'branch1',
        productId: 'product1',
        supplierId: 'supplier1',
        serviceDetails: {
          segments: [{
            from: 'LHR',
            fromCity: 'London',
            to: 'DXB',
            toCity: 'Dubai',
            airline: 'Emirates',
            flightNo: 'EK-02',
            date: '2024-05-15',
            duration: '7h 15m'
          }]
        },
        passengers: [{
          id: 'pax1',
          firstName: 'Alex',
          lastName: 'Johnson',
          email: 'alex.j@example.com',
          phone: '+1 234 567 890',
          dateOfBirth: new Date('1985-06-15'),
          passportNumber: 'AB123456',
          nationality: 'US',
          type: 'adult'
        }],
        pricing: {
          customerPrice: 1240.50,
          supplierPrice: 1100.00,
          markup: 140.50,
          currency: 'USD',
          taxes: 50.00,
          fees: 90.50
        },
        payment: {
          method: 'wallet',
          amount: 1240.50,
          currency: 'USD',
          status: 'completed',
          supplierPayment: {
            method: 'credit',
            terms: 'Net 30',
            creditLimit: 50000
          },
          transactions: [{
            id: 'txn1',
            amount: 1240.50,
            method: 'wallet',
            status: 'completed',
            timestamp: new Date(),
            transactionId: 'WT-1234567890'
          }]
        },
        specialRequests: ['Window seat', 'Vegetarian meal'],
        metadata: {
          gdsType: 'amadeus',
          supplierRef: 'AM-123456',
          importSource: 'GDS'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        refunds: [],
        amendments: []
      };
      setBooking(mockBooking);
    } catch (error) {
      console.error('Error fetching booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      // Mock payment processing
      toast({
        title: "Payment Processed",
        description: `Successfully processed ${paymentAmount} ${booking?.pricing.currency} via ${paymentMethod}`,
      });
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentMethod('wallet');
      setPaymentNotes('');
      fetchBooking(); // Refresh booking data
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "There was an error processing the payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRefund = async () => {
    try {
      // Mock refund processing
      toast({
        title: "Refund Processed",
        description: `Successfully processed ${refundType} refund of ${refundAmount} ${booking?.pricing.currency}`,
      });
      setShowRefundModal(false);
      setRefundType('full');
      setRefundAmount('');
      setRefundReason('');
      setRefundTo('original');
      fetchBooking(); // Refresh booking data
    } catch (error) {
      toast({
        title: "Refund Failed",
        description: "There was an error processing the refund. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAmendment = async () => {
    try {
      // Mock amendment processing
      toast({
        title: "Amendment Requested",
        description: "Amendment request has been submitted for approval.",
      });
      setShowAmendmentModal(false);
      setAmendmentChanges('');
      setAmendmentReason('');
      fetchBooking(); // Refresh booking data
    } catch (error) {
      toast({
        title: "Amendment Failed",
        description: "There was an error submitting the amendment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    try {
      // Mock import processing
      toast({
        title: "Booking Imported",
        description: `Successfully imported booking ${pnr} from ${gdsType}`,
      });
      setShowImportModal(false);
      setGdsType('amadeus');
      setPnr('');
      setSupplierRef('');
      fetchBooking(); // Refresh booking data
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "There was an error importing the booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'confirmed': { bg: 'bg-emerald-500/10', text: 'text-emerald-600', label: 'CONFIRMED' },
      'pending': { bg: 'bg-amber-500/10', text: 'text-amber-600', label: 'PENDING' },
      'hold': { bg: 'bg-blue-500/10', text: 'text-blue-600', label: 'ON HOLD' },
      'cancelled': { bg: 'bg-rose-500/10', text: 'text-rose-600', label: 'CANCELLED' },
      'refunded': { bg: 'bg-purple-500/10', text: 'text-purple-600', label: 'REFUNDED' },
      'amended': { bg: 'bg-orange-500/10', text: 'text-orange-600', label: 'AMENDED' },
      'imported': { bg: 'bg-indigo-500/10', text: 'text-indigo-600', label: 'IMPORTED' },
      'ticketed': { bg: 'bg-green-500/10', text: 'text-green-600', label: 'TICKETED' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge className={`${config.bg} ${config.text} border-none font-black text-[10px] tracking-widest px-3`}>
        {config.label}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'flight': return <Plane className="h-4 w-4 text-indigo-500" />;
      case 'hotel': return <Building2 className="h-4 w-4 text-amber-500" />;
      case 'package': return <Package className="h-4 w-4 text-emerald-500" />;
      default: return <Ticket className="h-4 w-4 text-primary" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-6 animate-in fade-in duration-700">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm border border-gray-100 h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <span className="hover:text-primary transition-colors cursor-pointer">Bookings Hub</span>
              <ArrowRight className="h-3 w-3" />
              <span className="text-secondary-900">Loading...</span>
            </div>
          </div>
          <Card className="border-none shadow-2xl rounded-[2.5rem] bg-gray-900 text-white overflow-hidden">
            <CardContent className="p-10">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-700 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/6 mb-2"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-6 animate-in fade-in duration-700">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm border border-gray-100 h-10 w-10" onClick={() => navigate('/bookings')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <span className="hover:text-primary transition-colors cursor-pointer">Bookings Hub</span>
              <ArrowRight className="h-3 w-3" />
              <span className="text-secondary-900">Not Found</span>
            </div>
          </div>
          <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white p-10 text-center">
            <h2 className="text-2xl font-black text-gray-900 mb-4">Booking Not Found</h2>
            <p className="text-gray-500 mb-8">The booking you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/bookings')} className="bg-gray-900 text-white font-black">
              Back to Bookings
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back & Breadcrumb */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-white shadow-sm border border-gray-100 h-10 w-10"
            onClick={() => navigate('/bookings')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <span className="hover:text-primary transition-colors cursor-pointer">Bookings Hub</span>
            <ArrowRight className="h-3 w-3" />
            <span className="text-secondary-900">{booking.bookingRef}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)} className="border-gray-100 font-black text-gray-600 hover:bg-gray-50">
              <Globe2 className="h-4 w-4 mr-2" />
              Import from GDS
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowDocumentModal(true)} className="border-gray-100 font-black text-gray-600 hover:bg-gray-50">
              <FileTextIcon className="h-4 w-4 mr-2" />
              Documents
            </Button>
          </div>
        </div>

        {/* Main Header Card */}
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Plane className="h-64 w-64 rotate-12" />
          </div>
          <CardContent className="p-10 relative">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
              <div className="flex items-center gap-8">
                <div className="h-24 w-24 rounded-[2rem] bg-primary/20 flex items-center justify-center border border-primary/30 shadow-2xl shadow-primary/20 rotate-3 transition-transform hover:rotate-0 duration-500">
                  {getTypeIcon(booking.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h1 className="text-5xl font-black tracking-tighter">{booking.bookingRef}</h1>
                    {getStatusBadge(booking.status)}
                  </div>
                  <div className="flex flex-wrap items-center gap-6 text-gray-400 font-bold text-sm">
                    <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> {booking.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className="flex items-center gap-2 decoration-primary underline-offset-8 underline underline-dotted decoration-2">PNR: {booking.confirmationNumber || 'N/A'}</span>
                    <span className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full"><BadgeCheck className="h-3.5 w-3.5 text-blue-400" /> {booking.customerType} Booking</span>
                    <span className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full"><ShieldCheck className="h-3.5 w-3.5 text-green-400" /> {booking.bookingType.toUpperCase()}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/10 text-right min-w-[320px] shadow-2xl">
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em] mb-2">Total Reservation Value</p>
                <h2 className="text-6xl font-black tracking-tighter text-white">
                  <span className="text-2xl text-indigo-300 mr-2 font-medium">{booking.pricing.currency}</span>
                  {booking.pricing.customerPrice.toLocaleString()}
                </h2>
                <div className="mt-6 flex flex-col items-end gap-1">
                  <p className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Supplier Payment: {booking.payment.supplierPayment?.terms || 'N/A'}
                  </p>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest italic">Profit Margin: {((booking.pricing.markup / booking.pricing.customerPrice) * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-white/60 backdrop-blur-md rounded-[1.5rem] shadow-xl p-1.5 border border-gray-100 grid grid-cols-4 lg:grid-cols-6 gap-2 h-16 max-w-4xl">
                <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-xl font-black transition-all">
                  <Info className="h-4 w-4 mr-2" />
                  <span className="hidden lg:inline">Overview</span>
                  <span className="lg:hidden">Info</span>
                </TabsTrigger>
                <TabsTrigger value="itinerary" className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-xl font-black transition-all">
                  <Clock className="h-4 w-4 mr-2" />
                  <span className="hidden lg:inline">Itinerary</span>
                  <span className="lg:hidden">Flights</span>
                </TabsTrigger>
                <TabsTrigger value="passengers" className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-xl font-black transition-all">
                  <Users className="h-4 w-4 mr-2" />
                  <span className="hidden lg:inline">Passengers</span>
                  <span className="lg:hidden">Pax</span>
                </TabsTrigger>
                <TabsTrigger value="payments" className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-xl font-black transition-all">
                  <CreditCardIcon className="h-4 w-4 mr-2" />
                  <span className="hidden lg:inline">Payments</span>
                  <span className="lg:hidden">Pay</span>
                </TabsTrigger>
                <TabsTrigger value="documents" className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-xl font-black transition-all">
                  <FileTextIcon className="h-4 w-4 mr-2" />
                  <span className="hidden lg:inline">Documents</span>
                  <span className="lg:hidden">Docs</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-xl font-black transition-all">
                  <Database className="h-4 w-4 mr-2" />
                  <span className="hidden lg:inline">History</span>
                  <span className="lg:hidden">Hist</span>
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-8 space-y-8 animate-in slide-in-from-bottom-5 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Customer Information */}
                  <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-10">
                    <h3 className="text-2xl font-black text-gray-900 mb-8 border-b border-gray-50 pb-4">Customer Information</h3>
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                          <User className="h-7 w-7" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Primary Contact</p>
                          <p className="text-lg font-black text-gray-900">{booking.passengers[0]?.firstName} {booking.passengers[0]?.lastName}</p>
                          <Badge className="bg-indigo-50 text-indigo-600 border-none font-black text-[9px] px-2 mt-1">{booking.customerType}</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</p>
                          <p className="text-gray-900">{booking.passengers[0]?.email}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone</p>
                          <p className="text-gray-900">{booking.passengers[0]?.phone}</p>
                        </div>
                      </div>
                      {booking.companyId && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Company</p>
                          <p className="text-gray-900 font-black">Global Wings B2B</p>
                          <p className="text-xs text-gray-500">Branch: {booking.branchId || 'Main'}</p>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Supplier Information */}
                  <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-10">
                    <h3 className="text-2xl font-black text-gray-900 mb-8 border-b border-gray-50 pb-4">Supplier Information</h3>
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm border border-amber-100">
                          <Building2 className="h-7 w-7" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Service Provider</p>
                          <p className="text-lg font-black text-gray-900">{booking.serviceDetails.segments?.[0]?.airline || 'N/A'}</p>
                          <Badge className="bg-amber-50 text-amber-600 border-none font-black text-[9px] px-2 mt-1">GDS: {booking.metadata.gdsType || 'N/A'}</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Supplier Ref</p>
                          <p className="text-gray-900">{booking.metadata.supplierRef || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Terms</p>
                          <p className="text-gray-900">{booking.payment.supplierPayment?.terms || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Special Requests</p>
                        <div className="flex flex-wrap gap-2">
                          {booking.specialRequests.map((request, index) => (
                            <Badge key={index} variant="outline" className="border-gray-200 text-gray-600 font-bold">
                              {request}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Financial Summary */}
                <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-10">
                  <h3 className="text-2xl font-black text-gray-900 mb-8 border-b border-gray-50 pb-4">Financial Summary</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <DollarSign className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Price</p>
                          <p className="text-2xl font-black text-gray-900">{booking.pricing.currency} {booking.pricing.customerPrice.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        <p>Markup: {booking.pricing.currency} {booking.pricing.markup.toLocaleString()}</p>
                        <p>Margin: {((booking.pricing.markup / booking.pricing.customerPrice) * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                          <CreditCardIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Status</p>
                          <p className="text-2xl font-black text-gray-900">{booking.payment.status.toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        <p>Method: {booking.payment.method}</p>
                        <p>Transaction ID: {booking.payment.transactions[0]?.transactionId || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                          <RefreshCw className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Supplier Cost</p>
                          <p className="text-2xl font-black text-gray-900">{booking.pricing.currency} {booking.pricing.supplierPrice.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        <p>Balance Due: {booking.pricing.currency} {(booking.pricing.supplierPrice - (booking.payment.transactions.reduce((sum, t) => sum + t.amount, 0) || 0)).toLocaleString()}</p>
                        <p>Credit Limit: {booking.pricing.currency} {booking.payment.supplierPayment?.creditLimit?.toLocaleString() || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Itinerary Tab */}
              <TabsContent value="itinerary" className="mt-8 space-y-8 animate-in slide-in-from-bottom-5 duration-500">
                <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden group">
                  <div className="bg-gray-50/50 p-8 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary border border-gray-100">
                        <Plane className="h-6 w-6 font-black" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-gray-900">London to Dubai</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Direct Service • Economy Class</p>
                      </div>
                    </div>
                    <Badge className="bg-indigo-600 text-white border-none font-black text-[10px] px-3 py-1 shadow-lg shadow-indigo-600/20">CONFIRMED</Badge>
                  </div>
                  <CardContent className="p-12 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
                      <h1 className="text-[20rem] font-black uppercase">FLY</h1>
                    </div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative">
                      <div className="text-center md:text-left space-y-2">
                        <h3 className="text-7xl font-black text-gray-900 tracking-tighter group-hover:text-primary transition-colors duration-500">{booking.serviceDetails.segments?.[0]?.from}</h3>
                        <p className="text-sm font-black text-gray-500 uppercase tracking-[0.3em]">{booking.serviceDetails.segments?.[0]?.fromCity}</p>
                        <div className="pt-2">
                          <Badge variant="outline" className="border-gray-200 text-gray-400 font-bold">Terminal 5</Badge>
                        </div>
                      </div>

                      <div className="flex-1 max-w-[200px] flex flex-col items-center gap-6">
                        <div className="w-full h-1 bg-gray-100 rounded-full relative overflow-hidden">
                          <div className="absolute inset-0 bg-primary/20 animate-pulse" />
                          <div className="absolute inset-y-0 left-0 bg-primary w-2/3 shadow-sm rounded-full" />
                        </div>
                        <div className="flex flex-col items-center">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Time en route</p>
                          <span className="text-lg font-black text-primary px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10">{booking.serviceDetails.segments?.[0]?.duration}</span>
                        </div>
                      </div>

                      <div className="text-center md:text-right space-y-2">
                        <h3 className="text-7xl font-black text-gray-900 tracking-tighter group-hover:text-primary transition-colors duration-500">{booking.serviceDetails.segments?.[0]?.to}</h3>
                        <p className="text-sm font-black text-gray-500 uppercase tracking-[0.3em]">{booking.serviceDetails.segments?.[0]?.toCity}</p>
                        <div className="pt-2">
                          <Badge variant="outline" className="border-gray-200 text-gray-400 font-bold">Terminal 3</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-10 border-t border-gray-100">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Operator</p>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded bg-gray-100" />
                          <p className="text-base font-black text-gray-800">{booking.serviceDetails.segments?.[0]?.airline}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Flight ID</p>
                        <p className="text-base font-black text-gray-800 underline decoration-primary/30 underline-offset-4">{booking.serviceDetails.segments?.[0]?.flightNo}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Booking Class</p>
                        <p className="text-base font-black text-gray-800">Premium Flex (M)</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Baggage Allow.</p>
                        <p className="text-base font-black text-emerald-600">30KG (Included)</p>
                      </div>
                    </div>
                  </CardContent>
                  <div className="bg-primary/5 p-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-primary/10">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center border border-primary/10">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                      </div>
                      <p className="text-xs font-bold text-gray-600">Standard COVID coverage and Trip Intelligence applied to this sector.</p>
                    </div>
                    <Button variant="ghost" className="text-primary font-black text-xs uppercase tracking-widest hover:bg-primary/5">
                      Download Segment PDF
                      <Download className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              {/* Passengers Tab */}
              <TabsContent value="passengers" className="mt-8 animate-in slide-in-from-bottom-5 duration-500">
                <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-10 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                    <Users className="h-48 w-48" />
                  </div>
                  <div className="space-y-6 relative">
                    {booking.passengers.map((pax, i) => (
                      <div key={i} className="flex flex-col md:flex-row items-center justify-between p-8 rounded-[2rem] bg-gray-50/50 border border-gray-100 hover:border-primary/20 hover:bg-white hover:shadow-xl transition-all duration-500 group">
                        <div className="flex items-center gap-6">
                          <div className="h-16 w-16 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-primary/20 rotate-3 group-hover:rotate-0 transition-transform">
                            {pax.firstName.charAt(0)}{pax.lastName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h4 className="text-2xl font-black text-gray-900">{pax.firstName} {pax.lastName}</h4>
                              <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black">LEAD</Badge>
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">{pax.type.toUpperCase()} • {pax.nationality} • DOB: {pax.dateOfBirth.toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="mt-6 md:mt-0 text-center md:text-right space-y-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 min-w-[200px]">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Passport Number</p>
                          <p className="text-lg font-black font-mono text-gray-900">{pax.passportNumber}</p>
                          <div className="flex items-center justify-center md:justify-end gap-1.5 pt-1">
                            <BadgeCheck className="h-3 w-3 text-emerald-500" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Verified</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              {/* Payments Tab */}
              <TabsContent value="payments" className="mt-8 animate-in slide-in-from-bottom-5 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Payment History */}
                  <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-10">
                    <h3 className="text-2xl font-black text-gray-900 mb-8 border-b border-gray-50 pb-4">Payment History</h3>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-gray-100 h-16">
                          <TableHead className="font-black text-xs text-gray-400 uppercase tracking-widest">Transaction ID</TableHead>
                          <TableHead className="font-black text-xs text-gray-400 uppercase tracking-widest">Amount</TableHead>
                          <TableHead className="font-black text-xs text-gray-400 uppercase tracking-widest">Method</TableHead>
                          <TableHead className="font-black text-xs text-gray-400 uppercase tracking-widest">Status</TableHead>
                          <TableHead className="font-black text-xs text-gray-400 uppercase tracking-widest text-right">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {booking.payment.transactions.map((txn, index) => (
                          <TableRow key={index} className="hover:bg-gray-50/50 border-gray-50 cursor-pointer group h-16">
                            <TableCell className="font-mono">{txn.transactionId || 'N/A'}</TableCell>
                            <TableCell>{booking.pricing.currency} {txn.amount.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-gray-200 text-gray-600 font-bold">{txn.method}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                txn.status === 'completed' ? 'bg-emerald-500 text-white' :
                                txn.status === 'pending' ? 'bg-amber-500 text-white' :
                                txn.status === 'failed' ? 'bg-rose-500 text-white' :
                                'bg-gray-500 text-white'
                              }>
                                {txn.status.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-gray-500">{txn.timestamp.toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>

                  {/* Payment Actions */}
                  <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-10">
                    <h3 className="text-2xl font-black text-gray-900 mb-8 border-b border-gray-50 pb-4">Payment Actions</h3>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <Button className="h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20" onClick={() => setShowPaymentModal(true)}>
                          <Plus className="h-5 w-5 mr-3" />
                          Process Payment
                        </Button>
                        <Button variant="outline" className="h-16 border-rose-200 bg-rose-50 text-rose-600 font-black rounded-2xl hover:bg-rose-100" onClick={() => setShowRefundModal(true)}>
                          <RefreshCw className="h-5 w-5 mr-3" />
                          Process Refund
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" className="h-16 border-blue-200 bg-blue-50 text-blue-600 font-black rounded-2xl hover:bg-blue-100" onClick={() => setShowAmendmentModal(true)}>
                          <Edit className="h-5 w-5 mr-3" />
                          Request Amendment
                        </Button>
                        <Button variant="outline" className="h-16 border-purple-200 bg-purple-50 text-purple-600 font-black rounded-2xl hover:bg-purple-100">
                          <Ticket className="h-5 w-5 mr-3" />
                          Issue Ticket
                        </Button>
                      </div>
                      <div className="p-4 bg-gray-50/50 rounded-2xl">
                        <p className="text-sm text-gray-600">Balance Due: {booking.pricing.currency} {(booking.pricing.customerPrice - booking.payment.transactions.reduce((sum, t) => sum + t.amount, 0)).toLocaleString()}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="mt-8 animate-in slide-in-from-bottom-5 duration-500">
                <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-10">
                  <h3 className="text-2xl font-black text-gray-900 mb-8 border-b border-gray-50 pb-4">Booking Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { type: 'invoice', name: 'Invoice', icon: FileTextIcon, status: 'generated' },
                      { type: 'receipt', name: 'Receipt', icon: Receipt, status: 'generated' },
                      { type: 'e_ticket', name: 'E-Ticket', icon: Ticket, status: 'generated' },
                      { type: 'credit_note', name: 'Credit Note', icon: FileTextIcon, status: 'none' },
                      { type: 'amendment_invoice', name: 'Amendment Invoice', icon: FileTextIcon, status: 'none' }
                    ].map((doc, index) => (
                      <Card key={index} className="border-none shadow-lg rounded-2xl p-6 hover:shadow-xl transition-shadow cursor-pointer group">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <doc.icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-black text-gray-900">{doc.name}</h4>
                            <p className="text-sm text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={doc.status === 'generated' ? 'default' : 'outline'} className="text-xs">
                              {doc.status === 'generated' ? 'Available' : 'Not Generated'}
                            </Badge>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="mt-8 animate-in slide-in-from-bottom-5 duration-500">
                <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-10">
                  <h3 className="text-2xl font-black text-gray-900 mb-8 border-b border-gray-50 pb-4">Booking History</h3>
                  <div className="space-y-4">
                    {[
                      { action: 'Booking Created', description: 'Initial booking created by admin', performedBy: 'Admin', timestamp: new Date() },
                      { action: 'Payment Processed', description: 'Customer payment received via wallet', performedBy: 'System', timestamp: new Date() },
                      { action: 'Confirmation Sent', description: 'Booking confirmation email sent to customer', performedBy: 'System', timestamp: new Date() },
                      { action: 'Supplier Notified', description: 'Supplier notified of booking details', performedBy: 'System', timestamp: new Date() }
                    ].map((history, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-2xl hover:bg-white transition-colors">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Database className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <span className="font-black text-gray-900">{history.action}</span>
                            <span className="text-xs text-gray-500">{history.timestamp.toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-gray-600">{history.description}</p>
                          <span className="text-xs text-gray-400">Performed by: {history.performedBy}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Actions & Quick Info */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-10">
              <h3 className="text-2xl font-black text-gray-900 mb-8 border-b border-gray-50 pb-4">Quick Actions</h3>
              <div className="space-y-4">
                <Button className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-lg shadow-primary/20" onClick={() => setShowPaymentModal(true)}>
                  <CreditCardIcon className="h-5 w-5 mr-3" />
                  Process Payment
                </Button>
                <Button variant="outline" className="w-full h-14 border-rose-200 bg-rose-50 text-rose-600 font-black rounded-2xl hover:bg-rose-100" onClick={() => setShowRefundModal(true)}>
                  <RefreshCw className="h-5 w-5 mr-3" />
                  Process Refund
                </Button>
                <Button variant="outline" className="w-full h-14 border-blue-200 bg-blue-50 text-blue-600 font-black rounded-2xl hover:bg-blue-100" onClick={() => setShowAmendmentModal(true)}>
                  <Edit className="h-5 w-5 mr-3" />
                  Request Amendment
                </Button>
                <Button variant="outline" className="w-full h-14 border-gray-200 bg-gray-50 text-gray-600 font-black rounded-2xl hover:bg-gray-100">
                  <Printer className="h-5 w-5 mr-3" />
                  Print Documents
                </Button>
                <Button variant="outline" className="w-full h-14 border-gray-200 bg-gray-50 text-gray-600 font-black rounded-2xl hover:bg-gray-100">
                  <Share2 className="h-5 w-5 mr-3" />
                  Share Booking
                </Button>
              </div>
            </Card>

            {/* Booking Status */}
            <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-10">
              <h3 className="text-2xl font-black text-gray-900 mb-8 border-b border-gray-50 pb-4">Booking Status</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-600">Current Status</p>
                    <p className="text-lg font-black text-gray-900">{booking.status.toUpperCase()}</p>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Created</span>
                    <span className="font-bold">{booking.createdAt.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Updated</span>
                    <span className="font-bold">{booking.updatedAt.toLocaleDateString()}</span>
                  </div>
                  {booking.holdUntil && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Hold Until</span>
                      <span className="font-bold text-amber-600">{booking.holdUntil.toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                <Progress value={booking.status === 'confirmed' ? 100 : booking.status === 'pending' ? 50 : 0} className="h-2" />
              </div>
            </Card>

            {/* Supplier Details */}
            <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-10">
              <h3 className="text-2xl font-black text-gray-900 mb-8 border-b border-gray-50 pb-4">Supplier Details</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-black text-gray-900">{booking.serviceDetails.segments?.[0]?.airline || 'N/A'}</p>
                    <p className="text-sm text-gray-500">Supplier ID: {booking.supplierId}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Terms</p>
                    <p className="text-gray-900">{booking.payment.supplierPayment?.terms || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Credit Limit</p>
                    <p className="text-gray-900">{booking.pricing.currency} {booking.payment.supplierPayment?.creditLimit?.toLocaleString() || 'N/A'}</p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50/50 rounded-2xl">
                  <p className="text-sm text-gray-600">Balance with Supplier: {booking.pricing.currency} {(booking.pricing.supplierPrice - (booking.payment.transactions.reduce((sum, t) => sum + t.amount, 0) || 0)).toLocaleString()}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center py-6 px-4 bg-gray-900 text-white rounded-[2rem] shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Last updated: {booking.updatedAt.toLocaleString()}</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Auto-sync enabled</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" className="text-white hover:bg-white/10 font-bold px-6" onClick={() => navigate('/bookings')}>
              Back to List
            </Button>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>Enter payment details for booking {booking.bookingRef}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount ({booking.pricing.currency})</Label>
              <Input value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Enter amount" />
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wallet">Wallet</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="debit_card">Debit Card</SelectItem>
                  <SelectItem value="net_banking">Net Banking</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="Enter payment notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
            <Button onClick={handlePayment}>Process Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Modal */}
      <Dialog open={showRefundModal} onOpenChange={setShowRefundModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>Enter refund details for booking {booking.bookingRef}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Refund Type</Label>
              <Select value={refundType} onValueChange={(v) => setRefundType(v as 'full' | 'partial')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Refund</SelectItem>
                  <SelectItem value="partial">Partial Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {refundType === 'partial' && (
              <div>
                <Label>Amount ({booking.pricing.currency})</Label>
                <Input value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} placeholder="Enter refund amount" />
              </div>
            )}
            <div>
              <Label>Refund Reason</Label>
              <Textarea value={refundReason} onChange={(e) => setRefundReason(e.target.value)} placeholder="Enter refund reason" />
            </div>
            <div>
              <Label>Refund To</Label>
              <Select value={refundTo} onValueChange={setRefundTo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="original">Original Payment Method</SelectItem>
                  <SelectItem value="wallet">Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundModal(false)}>Cancel</Button>
            <Button onClick={handleRefund} className="bg-rose-500 hover:bg-rose-600">Process Refund</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Amendment Modal */}
      <Dialog open={showAmendmentModal} onOpenChange={setShowAmendmentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Amendment</DialogTitle>
            <DialogDescription>Enter amendment details for booking {booking.bookingRef}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Changes</Label>
              <Textarea value={amendmentChanges} onChange={(e) => setAmendmentChanges(e.target.value)} placeholder="Describe the changes needed" />
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea value={amendmentReason} onChange={(e) => setAmendmentReason(e.target.value)} placeholder="Enter reason for amendment" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAmendmentModal(false)}>Cancel</Button>
            <Button onClick={handleAmendment}>Submit Amendment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import from GDS</DialogTitle>
            <DialogDescription>Import booking from GDS system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>GDS Type</Label>
              <Select value={gdsType} onValueChange={(v) => setGdsType(v as 'amadeus' | 'sabre' | 'travelport')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amadeus">Amadeus</SelectItem>
                  <SelectItem value="sabre">Sabre</SelectItem>
                  <SelectItem value="travelport">Travelport</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>PNR</Label>
              <Input value={pnr} onChange={(e) => setPnr(e.target.value)} placeholder="Enter PNR" />
            </div>
            <div>
              <Label>Supplier Reference</Label>
              <Input value={supplierRef} onChange={(e) => setSupplierRef(e.target.value)} placeholder="Enter supplier reference" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportModal(false)}>Cancel</Button>
            <Button onClick={handleImport}>Import Booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EnhancedBookingCard;