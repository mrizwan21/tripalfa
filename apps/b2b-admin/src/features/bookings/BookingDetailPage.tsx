import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

export function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock booking data
  const booking = {
    id: id,
    ref: 'REF-889120',
    type: 'FLIGHT',
    status: 'CONFIRMED',
    pnr: 'XA882J',
    createdAt: new Date().toISOString(),
    totalAmount: 1240.50,
    currency: 'USD',
    customer: {
      name: 'Alex Johnson',
      email: 'alex.j@example.com',
      phone: '+1 234 567 890',
      company: 'Global Wings B2B'
    },
    segments: [
      {
        from: 'LHR',
        fromCity: 'London',
        to: 'DXB',
        toCity: 'Dubai',
        airline: 'Emirates',
        flightNo: 'EK-02',
        date: '2024-05-15',
        duration: '7h 15m'
      }
    ],
    passengers: [
      { name: 'Alex Johnson', type: 'Adult', ticket: '176-2200192881' }
    ],
    ledger: [
      { type: 'Payment', amount: 1240.50, method: 'Wallet (Prepaid)', date: '2024-05-10' }
    ]
  };

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
            <Link to="/bookings" className="hover:text-primary transition-colors">Bookings Hub</Link>
            <ArrowRight className="h-3 w-3" />
            <span className="text-secondary-900">{booking.ref}</span>
          </div>
        </div>

        {/* Main Header Card */}
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-gray-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Plane className="h-64 w-64 rotate-12" />
          </div>
          <CardContent className="p-10 relative">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
              <div className="flex items-center gap-8">
                <div className="h-24 w-24 rounded-[2rem] bg-primary/20 flex items-center justify-center border border-primary/30 shadow-2xl shadow-primary/20 rotate-3 transition-transform hover:rotate-0 duration-500">
                  <Plane className="h-12 w-12 text-primary" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h1 className="text-5xl font-black tracking-tighter">{booking.ref}</h1>
                    <Badge className="bg-emerald-500 text-white border-none font-black text-[10px] px-3 py-1 uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                      {booking.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-6 text-gray-400 font-bold text-sm">
                    <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> {new Date(booking.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className="flex items-center gap-2 decoration-primary underline-offset-8 underline underline-dotted decoration-2">PNR: {booking.pnr}</span>
                    <span className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full"><BadgeCheck className="h-3.5 w-3.5 text-blue-400" /> GDS Verified</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/10 text-right min-w-[320px] shadow-2xl">
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em] mb-2">Total Reservation Value</p>
                <h2 className="text-6xl font-black tracking-tighter text-white">
                  <span className="text-2xl text-indigo-300 mr-2 font-medium">$</span>
                  {booking.totalAmount.toLocaleString()}
                </h2>
                <div className="mt-6 flex flex-col items-end gap-1">
                  <p className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Auto-Fulfillment Executed
                  </p>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest italic">via Worldspan Engine</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-8">
            <Tabs defaultValue="itinerary" className="w-full">
              <TabsList className="bg-white/60 backdrop-blur-md rounded-[1.5rem] shadow-xl p-1.5 border border-gray-100 grid grid-cols-3 gap-2 h-16 max-w-2xl">
                <TabsTrigger value="itinerary" className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-xl font-black transition-all">
                  <Clock className="h-4 w-4 mr-2" />
                  Itinerary
                </TabsTrigger>
                <TabsTrigger value="passengers" className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-xl font-black transition-all">
                  <User className="h-4 w-4 mr-2" />
                  Pax Details
                </TabsTrigger>
                <TabsTrigger value="ledger" className="rounded-xl data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-xl font-black transition-all">
                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                  Financials
                </TabsTrigger>
              </TabsList>

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
                        <h3 className="text-7xl font-black text-gray-900 tracking-tighter group-hover:text-primary transition-colors duration-500">{booking.segments[0].from}</h3>
                        <p className="text-sm font-black text-gray-500 uppercase tracking-[0.3em]">{booking.segments[0].fromCity}</p>
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
                          <span className="text-lg font-black text-primary px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10">{booking.segments[0].duration}</span>
                        </div>
                      </div>

                      <div className="text-center md:text-right space-y-2">
                        <h3 className="text-7xl font-black text-gray-900 tracking-tighter group-hover:text-primary transition-colors duration-500">{booking.segments[0].to}</h3>
                        <p className="text-sm font-black text-gray-500 uppercase tracking-[0.3em]">{booking.segments[0].toCity}</p>
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
                          <p className="text-base font-black text-gray-800">{booking.segments[0].airline}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Flight ID</p>
                        <p className="text-base font-black text-gray-800 underline decoration-primary/30 underline-offset-4">{booking.segments[0].flightNo}</p>
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

              <TabsContent value="passengers" className="mt-8">
                <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-10 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                    <Users className="h-48 w-48" />
                  </div>
                  <div className="space-y-6 relative">
                    {booking.passengers.map((pax, i) => (
                      <div key={i} className="flex flex-col md:flex-row items-center justify-between p-8 rounded-[2rem] bg-gray-50/50 border border-gray-100 hover:border-primary/20 hover:bg-white hover:shadow-xl transition-all duration-500 group">
                        <div className="flex items-center gap-6">
                          <div className="h-16 w-16 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-primary/20 rotate-3 group-hover:rotate-0 transition-transform">
                            {pax.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h4 className="text-2xl font-black text-gray-900">{pax.name}</h4>
                              <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black">LEAD</Badge>
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">{pax.type} • MALE • DOB: 12-OCT-1988</p>
                          </div>
                        </div>
                        <div className="mt-6 md:mt-0 text-center md:text-right space-y-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 min-w-[200px]">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ETKT Number</p>
                          <p className="text-lg font-black font-mono text-gray-900">{pax.ticket}</p>
                          <div className="flex items-center justify-center md:justify-end gap-1.5 pt-1">
                            <BadgeCheck className="h-3 w-3 text-emerald-500" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Sync Done</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Partner & Actions */}
          <div className="space-y-8">
            <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-50 rounded-bl-[4rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-700">
                <Building2 className="h-10 w-10 text-indigo-200" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-8 border-b border-gray-50 pb-4">Partner Identity</h3>
              <div className="space-y-8">
                <div className="flex items-center gap-5">
                  <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                    <Building2 className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">B2B Order Source</p>
                    <p className="text-lg font-black text-gray-900 leading-tight">{booking.customer.company}</p>
                    <Badge className="bg-indigo-50 text-indigo-600 border-none font-black text-[9px] px-2 mt-1">RETAIL BRANCH</Badge>
                  </div>
                </div>
                <div className="space-y-4 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-4 text-gray-500 hover:text-primary transition-colors cursor-pointer group/link">
                    <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover/link:bg-primary/10 transition-colors">
                      <Mail className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold truncate">{booking.customer.email}</span>
                  </div>
                  <div className="flex items-center gap-4 text-gray-500 hover:text-primary transition-colors cursor-pointer group/link">
                    <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover/link:bg-primary/10 transition-colors">
                      <Phone className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold">{booking.customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-4 text-gray-500 hover:text-primary transition-colors cursor-pointer group/link">
                    <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover/link:bg-primary/10 transition-colors">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold">London HQ, UK</span>
                  </div>
                </div>
                <Button className="w-full h-12 bg-white border border-gray-100 shadow-sm text-gray-900 font-bold rounded-2xl hover:bg-gray-50 mt-4">
                  View Parent Account
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </Card>

            <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-10">
              <h3 className="text-2xl font-black text-gray-900 mb-8 border-b border-gray-50 pb-4">Internal Commands</h3>
              <div className="space-y-4">
                <Button className="w-full h-16 bg-gray-900 text-white font-black rounded-2xl shadow-xl shadow-gray-200 transition-all hover:bg-primary hover:-translate-y-1">
                  <FileText className="h-5 w-5 mr-3" />
                  Generate Invoice PDF
                </Button>
                <Button variant="outline" className="w-full h-14 border-gray-100 font-black rounded-2xl text-gray-700 hover:bg-gray-50">
                  <Mail className="h-4 w-4 mr-3" />
                  Trigger Auto-Itinerary
                </Button>
                <div className="h-px bg-gray-100 my-6" />
                <Button variant="ghost" className="w-full h-14 border border-rose-100 text-rose-600 hover:bg-rose-50 font-black rounded-2xl group">
                  <AlertCircle className="h-4 w-4 mr-3 transition-transform group-hover:rotate-12" />
                  Void Registration
                </Button>
              </div>
              <div className="mt-8 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex gap-3 text-amber-700">
                <Info className="h-5 w-5 shrink-0" />
                <p className="text-[10px] font-bold leading-relaxed italic">Admin Note: Cancellation rules for this PNR are subject to Emirates T&Cs. 24h grace period ended.</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingDetailPage;
