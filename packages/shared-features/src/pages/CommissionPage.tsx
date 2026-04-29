import { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import { Edit2, Trash2, Plus, TrendingUp, DollarSign, Calendar, Activity, X } from 'lucide-react';
import { apiManager } from '../services/apiManager';
import { ProfileLayout } from './ProfilePage';
import { NodalPageHeader, cn } from '../index';

interface CommissionRule {
  id: string;
  name: string;
  description?: string;
  sourceType: 'Airline' | 'HotelSupplier' | 'GDS' | 'DirectContract';
  serviceType: 'Flight' | 'Hotel' | 'All';
  commissionType: 'Percentage' | 'Fixed';
  baseCommission: number;
  airlineCode?: string;
  destinationCode?: string;
  cabinClass?: string;
  hotelChain?: string;
  hotelStars?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  isActive: boolean;
  sharingRules?: any[];
}

export default function CommissionPage() {
  const { tenant } = useTenant();
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);
  const [activeTab, setActiveTab] = useState<'rules' | 'transactions' | 'summary'>('rules');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sourceType: 'Airline' as const,
    serviceType: 'Flight' as const,
    commissionType: 'Percentage' as const,
    baseCommission: '',
    airlineCode: '',
    destinationCode: '',
    cabinClass: '',
    hotelChain: '',
    hotelStars: '',
    effectiveFrom: '',
    effectiveTo: '',
    isActive: true
  });

  useEffect(() => {
    loadCommissionRules();
  }, []);

  const loadCommissionRules = async () => {
    setIsLoading(true);
    try {
      const rules = await apiManager.getCommissionRules();
      setCommissionRules(rules as unknown as CommissionRule[]);
    } catch (error) {
      console.error('Failed to load commission rules:', error);
      setCommissionRules([
        { id: '1', name: 'Master Flight Commission', sourceType: 'Airline', serviceType: 'Flight', commissionType: 'Percentage', baseCommission: 7, isActive: true },
        { id: '2', name: 'Hotel Bedbank Margin', sourceType: 'HotelSupplier', serviceType: 'Hotel', commissionType: 'Fixed', baseCommission: 15, isActive: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        baseCommission: parseFloat(formData.baseCommission) || 0,
        hotelStars: formData.hotelStars ? parseInt(formData.hotelStars) : undefined,
      };
      if (editingRule) {
        await apiManager.updateCommissionRule(editingRule.id, payload);
      } else {
        await apiManager.createCommissionRule(payload);
      }
      setShowCreateModal(false);
      resetForm();
      loadCommissionRules();
    } catch (error) {
      console.error('Failed to save commission rule:', error);
    }
  };  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;
    try {
      await apiManager.deleteCommissionRule(id);
      loadCommissionRules();
    } catch (error) {
      console.error('Failed to delete commission rule:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sourceType: 'Airline',
      serviceType: 'Flight',
      commissionType: 'Percentage',
      baseCommission: '',
      airlineCode: '',
      destinationCode: '',
      cabinClass: '',
      hotelChain: '',
      hotelStars: '',
      effectiveFrom: '',
      effectiveTo: '',
      isActive: true
    });
    setEditingRule(null);
  };

  return (
    <ProfileLayout>
      <div className="animate-fade space-y-8 px-6 lg:px-12 pb-24 pt-8">
        <NodalPageHeader
          title="Yield"
          highlightedTitle="Optimization"
          nodeName="COMMISSION_ENG"
          subtitle="Manage supplier commissions and algorithmic sharing rules."
          actions={
            <button
              onClick={() => { resetForm(); setShowCreateModal(true); }}
              className="px-8 py-4 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-xl flex items-center gap-3"
            >
              <Plus size={18} /> New Commission Rule
            </button>
          }
        />

        <div className="flex gap-12 border-b border-black/5 pb-0 overflow-x-auto no-scrollbar">
          {(['rules', 'transactions', 'summary'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-4 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2",
                activeTab === tab ? "border-black text-black" : "border-transparent text-black/20 hover:text-black/40"
              )}
            >
              {tab === 'rules' ? 'Commission Policies' : tab}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-48 gap-8">
            <TrendingUp className="animate-pulse text-apple-blue" size={48} />
            <div className="text-xs font-bold text-black/20 uppercase tracking-widest">Optimizing yields...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {commissionRules.map(rule => (
              <div key={rule.id} className="bg-white rounded-[2rem] border border-black/5 p-10 flex flex-col md:flex-row justify-between items-center gap-8 group hover:shadow-xl transition-all">
                <div className="flex items-center gap-8 w-full">
                  <div className="w-16 h-16 bg-black text-apple-blue rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                    <TrendingUp size={32} />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-black">{rule.name}</h3>
                      <span className="px-3 py-1 bg-black text-white text-[9px] font-bold rounded-full uppercase tracking-widest">{rule.sourceType}</span>
                    </div>
                    <p className="text-[10px] font-medium text-black/40 leading-relaxed max-w-xl">{rule.description || 'Global yield rule applied to all qualifying transactions.'}</p>
                    <div className="flex gap-6 mt-4">
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-black/20 uppercase tracking-widest">Value</p>
                        <p className="text-lg font-bold text-black">{rule.commissionType === 'Percentage' ? `${rule.baseCommission}%` : `${tenant.currency} ${rule.baseCommission}`}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-black/20 uppercase tracking-widest">Scope</p>
                        <p className="text-lg font-bold text-black uppercase">{rule.serviceType}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 shrink-0">
                  <button onClick={() => handleDelete(rule.id)} className="w-12 h-12 rounded-2xl bg-black/[0.02] text-black/20 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center"><Trash2 size={20}/></button>
                  <button className="px-8 py-3 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:scale-105 transition-all">Edit Policy</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-[110] p-6 animate-fade">
          <div className="bg-white rounded-[2.5rem] p-12 max-w-2xl w-full shadow-2xl relative overflow-hidden border-t-[8px] border-black max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-12">
              <div className="space-y-1">
                <h3 className="text-3xl font-bold text-black">Commission Policy</h3>
                <p className="text-xs font-bold text-black/20 uppercase tracking-widest">Define supplier yield parameters</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-black/5 hover:bg-black/10 text-black/40 hover:text-black transition-all"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest ml-1">Policy Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-black/5 border-2 border-transparent focus:border-apple-blue rounded-xl px-6 py-4 text-sm font-bold outline-none transition-all" required />
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest ml-1">Source</label>
                  <select value={formData.sourceType} onChange={e => setFormData({ ...formData, sourceType: e.target.value as any })} className="w-full bg-black/5 border-2 border-transparent focus:border-apple-blue rounded-xl px-6 py-4 text-sm font-bold outline-none appearance-none">
                    <option value="Airline">Airline GDS</option>
                    <option value="HotelSupplier">Bedbank API</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest ml-1">Value</label>
                  <input type="number" value={formData.baseCommission} onChange={e => setFormData({ ...formData, baseCommission: e.target.value })} className="w-full bg-black/5 border-2 border-transparent focus:border-apple-blue rounded-xl px-6 py-4 text-sm font-bold outline-none transition-all" required />
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-black text-white rounded-2xl font-bold shadow-2xl hover:scale-[1.02] transition-all">Execute Policy Creation</button>
            </form>
          </div>
        </div>
      )}
    </ProfileLayout>
  );
}
