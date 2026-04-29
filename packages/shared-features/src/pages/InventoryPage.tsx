import { useState, useEffect } from 'react';
import { 
  Plus, 
  Plane, 
  Hotel, 
  TrendingUp, 
  ChevronRight,
  Layers,
  History,
  Users,
  Activity,
  BarChart3,
  DollarSign,
  PieChart,
  ArrowUpRight,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { useTenant } from '../context/TenantContext';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';
import { NodalPageHeader } from '../index';
import { Layout } from '../components/Layout';

interface InventoryBlock {
  id: string;
  type: 'Flight' | 'Hotel';
  provider: string;
  reference: string;
  totalQuantity: number;
  availableQuantity: number;
  costPerUnit: number;
  sellPricePerUnit: number;
  expiryDate: string;
}

export default function InventoryPage() {
  const { tenant } = useTenant();
  const { agent } = useApp();
  const [blocks, setBlocks] = useState<InventoryBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'profitability'>('inventory');

  useEffect(() => {
    // Mock data for demo
    setBlocks([
      { id: '1', type: 'Flight', provider: 'Gulf Air', reference: 'RUH-DXB-BLOCK', totalQuantity: 100, availableQuantity: 45, costPerUnit: 200, sellPricePerUnit: 250, expiryDate: '2026-12-31' },
      { id: '2', type: 'Hotel', provider: 'Marriott Riyadh', reference: 'RAMADAN-2026', totalQuantity: 50, availableQuantity: 12, costPerUnit: 500, sellPricePerUnit: 700, expiryDate: '2026-05-30' },
    ]);
    setLoading(false);
  }, []);

  return (
    <Layout>
      <div className="max-w-[1700px] mx-auto pb-48 px-6 lg:px-12 animate-fade pt-8">
        <NodalPageHeader
          icon={Layers}
          title="Inventory"
          highlightedTitle="Portfolio"
          nodeName="INVENTORY_ENG"
          subtitle="Manage bulk purchases, algorithmic allocation, and real-time yield tracking."
          actions={
            <div className="flex bg-black/5 p-1 rounded-xl">
              <button onClick={() => setActiveTab('inventory')} className={cn("px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", activeTab === 'inventory' ? "bg-white text-black shadow-sm" : "text-black/40")}>Grid</button>
              <button onClick={() => setActiveTab('profitability')} className={cn("px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", activeTab === 'profitability' ? "bg-white text-black shadow-sm" : "text-black/40")}>Analytics</button>
            </div>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 my-12">
          <StatCard title="Total Capacity" value="150 Units" icon={Layers} trend="OPTIMAL" positive />
          <StatCard title="Air Assets" value="45 / 100" icon={Plane} trend="ACTIVE" positive />
          <StatCard title="Room Blocks" value="12 / 50" icon={Hotel} trend="LOW" positive={false} />
          <StatCard title="Portfolio Value" value={`BHD 85,000`} icon={TrendingUp} trend="+14%" positive />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {blocks.map(block => {
            const utilization = ((block.totalQuantity - block.availableQuantity) / block.totalQuantity) * 100;
            return (
              <div key={block.id} className="bg-white rounded-[2.5rem] border border-black/5 overflow-hidden shadow-sm hover:shadow-xl transition-all group">
                <div className="p-10 pb-4">
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-black text-apple-blue rounded-2xl flex items-center justify-center shadow-lg">
                        {block.type === 'Flight' ? <Plane size={24} /> : <Hotel size={24} />}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-black">{block.provider}</h3>
                        <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest">{block.reference}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-black/20">
                      <span>Utilization</span>
                      <span className="text-black">{utilization.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                      <div className={cn("h-full transition-all duration-1000", utilization > 80 ? "bg-apple-blue" : "bg-black")} style={{ width: `${utilization}%` }} />
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-black/[0.01] border-t border-black/5 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-black/20 uppercase tracking-widest">Available Units</p>
                    <p className="text-xl font-bold text-black">{block.availableQuantity} <span className="text-xs text-black/20">/ {block.totalQuantity}</span></p>
                  </div>
                  <button className="px-6 py-2.5 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all">Details</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, icon: Icon, trend, positive }: { title: string; value: string; icon: any; trend: string; positive: boolean }) {
  return (
    <div className="bg-white p-10 rounded-[2rem] border border-black/5 shadow-sm hover:shadow-xl transition-all group">
      <div className="flex items-start justify-between mb-8">
        <div className="w-14 h-14 bg-black text-apple-blue rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <Icon size={24} />
        </div>
        <span className={cn(
          "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border",
          positive ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
        )}>
          {trend}
        </span>
      </div>
      <h4 className="text-[10px] font-bold text-black/20 uppercase tracking-widest mb-1">{title}</h4>
      <p className="text-3xl font-bold text-black">{value}</p>
    </div>
  );
}
