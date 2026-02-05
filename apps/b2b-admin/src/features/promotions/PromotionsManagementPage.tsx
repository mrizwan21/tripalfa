import { useState, useEffect } from 'react';
import {
  Tag,
  Gift,
  Users,
  TrendingUp,
  Zap,
  Target,
  BarChart3,
  Plus,
  Settings,
  Percent,
  Award,
  Clock,
  Flame,
  PieChart,
  Search,
  Filter,
  ArrowUpRight,
  Play,
  Trash2,
  Edit2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/Input';
import { useParams, useNavigate } from 'react-router-dom';

interface Promotion {
  id: string;
  name: string;
  type: string;
  value: number;
  code?: string;
  isActive: boolean;
  usageCount: number;
  revenueImpact: number;
}

export default function PromotionsManagementPage() {
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
    navigate(`/promotions/${value}`);
  };

  const [promotions] = useState<Promotion[]>([
    { id: '1', name: 'Summer Escape 2024', type: 'percentage', value: 15, code: 'SUMMER24', isActive: true, usageCount: 1240, revenueImpact: 45200 },
    { id: '2', name: 'First Booking Bonus', type: 'fixed', value: 50, code: 'WELCOME50', isActive: true, usageCount: 850, revenueImpact: 12100 },
    { id: '3', name: 'Corporate Early Bird', type: 'percentage', value: 10, isActive: false, usageCount: 420, revenueImpact: 8400 },
  ]);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-[2rem] bg-rose-600 text-white flex items-center justify-center shadow-2xl shadow-rose-200 -rotate-3 transition-transform hover:rotate-0 duration-500">
              <Tag className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Growth Engine</h1>
              <p className="text-gray-500 font-medium">AI-Driven Dynamic Pricing & Promotions</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-14 px-8 border-gray-100 bg-white font-black rounded-2xl shadow-xl hover:shadow-2xl transition-all">
              <Settings className="h-5 w-5 mr-3" />
              Rules
            </Button>
            <Button className="h-14 px-8 bg-gray-900 text-white font-black rounded-2xl shadow-2xl shadow-gray-200 hover:-translate-y-1 transition-all">
              <Plus className="h-5 w-5 mr-3" />
              Launch Campaign
            </Button>
          </div>
        </div>

        {/* Performance HUD */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Active Promos', value: '12', icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Conversion Lift', value: '+24.5%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Promo Revenue', value: '$84.2k', icon: Gift, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Loyalty Base', value: '12.4k', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          ].map((stat) => (
            <Card key={stat.label} className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden group hover:shadow-2xl transition-all">
              <CardContent className="p-7">
                <div className="flex justify-between items-start">
                  <div className={`h-14 w-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <stat.icon className="h-7 w-7" />
                  </div>
                  <Badge className="bg-gray-900 text-white border-none font-black text-[9px] uppercase tracking-widest px-2 py-1">Real-time</Badge>
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
            <TabsTrigger value="overview" className="rounded-[1.5rem] data-[state=active]:bg-gray-900 data-[state=active]:text-white font-black py-4">
              Insights
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="rounded-[1.5rem] data-[state=active]:bg-gray-900 data-[state=active]:text-white font-black py-4">
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="rounded-[1.5rem] data-[state=active]:bg-gray-900 data-[state=active]:text-white font-black py-4">
              Loyalty
            </TabsTrigger>
            <TabsTrigger value="testing" className="rounded-[1.5rem] data-[state=active]:bg-gray-900 data-[state=active]:text-white font-black py-4">
              A/B Experiments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="animate-in slide-in-from-bottom-10 duration-700">
            <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                  <h2 className="text-3xl font-black text-gray-900">Active Campaigns</h2>
                  <p className="text-gray-500 font-medium">Real-time monitoring of active market incentives</p>
                </div>
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input className="pl-12 h-12 w-64 bg-gray-50 border-none rounded-2xl font-bold" placeholder="Find Campaign..." />
                  </div>
                  <Button variant="outline" className="h-12 w-12 rounded-2xl border-gray-100 p-0">
                    <Filter className="h-5 w-5 text-gray-400" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {promotions.map((promo) => (
                  <Card key={promo.id} className="border-none shadow-xl rounded-[2.5rem] bg-gray-50/50 hover:bg-white hover:shadow-2xl transition-all border border-transparent hover:border-gray-100 group">
                    <CardContent className="p-8">
                      <div className="flex justify-between items-start mb-6">
                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-black ${promo.isActive ? 'bg-rose-600 text-white shadow-xl shadow-rose-100' : 'bg-gray-200 text-gray-400'
                          }`}>
                          {promo.type === 'percentage' ? <Percent className="h-6 w-6" /> : <Gift className="h-6 w-6" />}
                        </div>
                        <Badge className={`${promo.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'} border-none font-black text-[9px] uppercase tracking-widest px-3 py-1.5`}>
                          {promo.isActive ? 'Active' : 'Paused'}
                        </Badge>
                      </div>
                      <h4 className="text-xl font-black text-gray-900 mb-2">{promo.name}</h4>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Code: <span className="text-gray-900 bg-white px-2 py-1 rounded-lg ml-1">{promo.code || 'Auto-Apply'}</span></p>

                      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Usages</p>
                          <p className="text-lg font-black text-gray-900">{promo.usageCount.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Revenue</p>
                          <p className="text-lg font-black text-emerald-600">${promo.revenueImpact.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-8 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                        <Button size="sm" variant="outline" className="flex-1 h-11 rounded-xl font-black">
                          <Edit2 className="h-3 w-3 mr-2" /> Edit
                        </Button>
                        <Button size="sm" variant="outline" className={`flex-1 h-11 rounded-xl font-black ${promo.isActive ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {promo.isActive ? <Zap className="h-3 w-3 mr-2" /> : <Play className="h-3 w-3 mr-2" />}
                          {promo.isActive ? 'Pause' : 'Start'}
                        </Button>
                        <Button size="sm" variant="outline" className="h-11 w-11 rounded-xl p-0 text-rose-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="overview" className="animate-in slide-in-from-bottom-10 duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-none shadow-2xl rounded-[3rem] bg-gray-900 p-10 text-white">
                <h2 className="text-2xl font-black mb-8">Experimentation Lab</h2>
                <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 mb-8">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Live Test</p>
                      <h4 className="text-xl font-black">Pricing Variance B</h4>
                    </div>
                    <Badge className="bg-indigo-600 text-white border-none font-black text-[10px] uppercase px-3 py-1">Running</Badge>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-300">Variant A (Control)</span>
                      <span className="font-black">12.4% CR</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div className="bg-gray-400 h-full w-[62%]"></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-300">Variant B (Active)</span>
                      <span className="font-black text-indigo-400">15.8% CR</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-400 h-full w-[79%]"></div>
                    </div>
                  </div>
                </div>
                <Button className="w-full h-16 rounded-[1.5rem] bg-white text-gray-900 font-extrabold text-lg hover:bg-gray-100 transition-all shadow-2xl">
                  Launch New Experiment
                </Button>
              </Card>

              <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-10">
                <h2 className="text-2xl font-black text-gray-900 mb-8">Loyalty Program Health</h2>
                <div className="space-y-6">
                  {[
                    { tier: 'Diamond', members: 1240, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { tier: 'Gold', members: 4850, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { tier: 'Silver', members: 8200, color: 'text-gray-400', bg: 'bg-gray-100' },
                  ].map((tier) => (
                    <div key={tier.tier} className="flex items-center justify-between p-5 bg-gray-50/50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-xl ${tier.bg} ${tier.color} flex items-center justify-center`}>
                          <Award className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-black text-gray-900">{tier.tier} Elite</p>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{tier.members} Active Members</p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full h-14 mt-8 rounded-2xl border-gray-100 font-black text-gray-900 hover:bg-gray-50 transition-all">
                  Manage Tiers
                </Button>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

