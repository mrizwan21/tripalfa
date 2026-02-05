import { useState, useEffect } from 'react';
import {
  Calculator,
  Receipt,
  FileText,
  CheckCircle,
  AlertCircle,
  Euro,
  DollarSign,
  TrendingUp,
  Globe,
  Shield,
  History,
  FileCheck,
  ArrowUpRight,
  Search,
  Filter,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/Input';
import { useParams, useNavigate } from 'react-router-dom';

interface TaxRate {
  id: string;
  countryCode: string;
  countryName: string;
  taxType: 'VAT' | 'GST' | 'Sales Tax' | 'Consumption Tax';
  standardRate: number;
  isActive: boolean;
}

interface VATReclaimRequest {
  id: string;
  companyId: string;
  period: { startDate: string; endDate: string };
  totalReclaimAmount: number;
  status: string;
  submittedAt?: string;
  approvedAt?: string;
}

export default function TaxManagementPage() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(tab || 'overview');

  useEffect(() => {
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [tab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/tax/${value}`);
  };

  const [taxRates, setTaxRates] = useState<TaxRate[]>([
    { id: '1', countryCode: 'GB', countryName: 'United Kingdom', taxType: 'VAT', standardRate: 20, isActive: true },
    { id: '2', countryCode: 'DE', countryName: 'Germany', taxType: 'VAT', standardRate: 19, isActive: true },
    { id: '3', countryCode: 'FR', countryName: 'France', taxType: 'VAT', standardRate: 20, isActive: true },
    { id: '4', countryCode: 'AE', countryName: 'United Arab Emirates', taxType: 'VAT', standardRate: 5, isActive: true },
  ]);
  const [reclaimRequests, setReclaimRequests] = useState<VATReclaimRequest[]>([
    { id: 'R-1001', companyId: 'C-202', period: { startDate: '2023-12-01', endDate: '2023-12-31' }, totalReclaimAmount: 4250.50, status: 'approved', submittedAt: '2024-01-05', approvedAt: '2024-01-10' },
    { id: 'R-1002', companyId: 'C-305', period: { startDate: '2023-12-01', endDate: '2023-12-31' }, totalReclaimAmount: 1840.00, status: 'submitted', submittedAt: '2024-01-08' },
    { id: 'R-1003', companyId: 'C-112', period: { startDate: '2023-11-01', endDate: '2023-11-30' }, totalReclaimAmount: 12100.25, status: 'paid', submittedAt: '2023-12-02', approvedAt: '2023-12-15' },
  ]);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-200 rotate-3 transition-transform hover:rotate-0 duration-500">
              <Calculator className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Tax Gateway</h1>
              <p className="text-gray-500 font-medium">VAT, GST & Global Tax Compliance Engine</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-14 px-8 border-gray-100 bg-white font-black rounded-2xl shadow-xl hover:shadow-2xl transition-all">
              <Download className="h-5 w-5 mr-3" />
              Tax Audit
            </Button>
            <Button className="h-14 px-8 bg-gray-900 text-white font-black rounded-2xl shadow-2xl shadow-gray-200 hover:-translate-y-1 transition-all">
              <Calculator className="h-5 w-5 mr-3" />
              Run Calculation
            </Button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Active Regions', value: '42', icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Pending Reclaims', value: '€24.8k', icon: Receipt, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Audit Health', value: '99.2%', icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Tax Liability', value: '€142k', icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50' },
          ].map((stat) => (
            <Card key={stat.label} className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden group hover:shadow-2xl transition-all">
              <CardContent className="p-7">
                <div className="flex justify-between items-start">
                  <div className={`h-14 w-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <stat.icon className="h-7 w-7" />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl uppercase tracking-widest">
                    <ArrowUpRight className="h-3 w-3" />
                    Stable
                  </div>
                </div>
                <div className="mt-6">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{stat.label}</p>
                  <h3 className="text-3xl font-black text-gray-900 mt-1">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="bg-white rounded-[2rem] shadow-2xl p-2 border border-gray-100 grid grid-cols-4 gap-2 mb-10 max-w-3xl mx-auto">
            <TabsTrigger value="overview" className="rounded-[1.5rem] data-[state=active]:bg-gray-900 data-[state=active]:text-white font-black py-4 transition-all">
              Overview
            </TabsTrigger>
            <TabsTrigger value="rates" className="rounded-[1.5rem] data-[state=active]:bg-gray-900 data-[state=active]:text-white font-black py-4 transition-all">
              Tax Rates
            </TabsTrigger>
            <TabsTrigger value="reclaims" className="rounded-[1.5rem] data-[state=active]:bg-gray-900 data-[state=active]:text-white font-black py-4 transition-all">
              Reclaims
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-[1.5rem] data-[state=active]:bg-gray-900 data-[state=active]:text-white font-black py-4 transition-all">
              Audit History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="animate-in slide-in-from-bottom-10 duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 border-none shadow-2xl rounded-[3rem] bg-white p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                  <FileCheck className="h-64 w-64" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
                  <History className="h-6 w-6 text-indigo-600" />
                  Global Compliance Status
                </h2>
                <div className="space-y-6">
                  {taxRates.map((rate) => (
                    <div key={rate.id} className="flex items-center justify-between p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 hover:bg-white hover:shadow-xl transition-all group">
                      <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-white shadow-lg flex items-center justify-center font-black text-gray-900 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          {rate.countryCode}
                        </div>
                        <div>
                          <p className="font-black text-gray-900">{rate.countryName}</p>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{rate.taxType} • Standard</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-gray-900">{rate.standardRate}%</p>
                        <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[10px] uppercase">Active</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="border-none shadow-2xl rounded-[3rem] bg-gray-900 p-10 text-white relative overflow-hidden">
                <div className="absolute bottom-0 right-0 p-12 opacity-10 pointer-events-none">
                  <Calculator className="h-48 w-48 text-white" />
                </div>
                <h2 className="text-2xl font-black mb-8">Quick Reconciler</h2>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base Amount</label>
                    <Input className="h-14 bg-white/10 border-none rounded-2xl text-white font-black" placeholder="Enter Base Amount..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Market</label>
                    <select className="w-full h-14 bg-white/10 border-none rounded-2xl px-5 text-white font-black outline-none appearance-none">
                      {taxRates.map(r => <option key={r.id} value={r.id}>{r.countryName}</option>)}
                    </select>
                  </div>
                  <div className="pt-6 border-t border-white/10">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Estimated Tax Balance</p>
                    <h3 className="text-5xl font-black text-white">$0.00</h3>
                  </div>
                  <Button className="w-full h-16 rounded-[1.5rem] bg-white text-gray-900 font-extrabold text-lg hover:bg-gray-100 transition-all shadow-2xl">
                    Initiate Settlement
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reclaims" className="animate-in slide-in-from-bottom-10 duration-700">
            <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                  <h2 className="text-3xl font-black text-gray-900">VAT Reclaim Ledger</h2>
                  <p className="text-gray-500 font-medium">Monitoring cross-border tax recovery operations</p>
                </div>
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input className="pl-12 h-12 w-64 bg-gray-50 border-none rounded-2xl font-bold" placeholder="Search Reclaims..." />
                  </div>
                  <Button variant="outline" className="h-12 w-12 rounded-2xl border-gray-100 p-0">
                    <Filter className="h-5 w-5 text-gray-400" />
                  </Button>
                </div>
              </div>

              <div className="space-y-5">
                {reclaimRequests.map((reclaim) => (
                  <div key={reclaim.id} className="flex flex-col md:flex-row items-center justify-between p-8 bg-gray-50/50 rounded-[2.5rem] border border-gray-100 hover:bg-white hover:shadow-2xl transition-all group">
                    <div className="flex items-center gap-6 mb-4 md:mb-0">
                      <div className={`h-16 w-16 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-all group-hover:rotate-6 ${reclaim.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                        reclaim.status === 'approved' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                        <Receipt className="h-8 w-8" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-black text-xl text-gray-900">{reclaim.id}</h4>
                          <Badge className={`${reclaim.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                            reclaim.status === 'approved' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                            } border-none font-black text-[10px] uppercase px-3 py-1`}>
                            {reclaim.status}
                          </Badge>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Entity: {reclaim.companyId} • Period: Q4 2023</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-12">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Reclaim Value</p>
                        <p className="text-3xl font-black text-gray-900">€{reclaim.totalReclaimAmount.toLocaleString()}</p>
                      </div>
                      <Button variant="outline" className="h-14 px-8 border-gray-100 bg-white font-black rounded-2xl group-hover:border-indigo-600 group-hover:text-indigo-600 transition-all">
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

