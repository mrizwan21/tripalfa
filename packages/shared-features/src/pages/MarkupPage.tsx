import { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import { useApp } from '../context/AppContext';
import { Edit2, Trash2, Globe, X, Shield, Loader2, Plane, Building2, Plus, Settings, AlertTriangle, Activity, TrendingUp, DollarSign } from 'lucide-react';
import { cn } from '../lib/utils';
import { NodalPageHeader } from '../index';
import { ProfileLayout } from './ProfilePage';
import { apiManager } from '../services/apiManager';

interface MarkupRule {
  id: string;
  serviceType: 'flight' | 'hotel';
  name: string;
  ruleType: 'PERCENTAGE' | 'FIXED';
  value: number;
  isActive: boolean;
  conditions?: {
    destination?: string;
    airline?: string;
  };
  createdAt: string;
}

export default function MarkupPage() {
  const { tenant } = useTenant();
  const [markupRules, setMarkupRules] = useState<MarkupRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    serviceType: 'flight' as 'flight' | 'hotel',
    name: '',
    ruleType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    value: '',
    isActive: true
  });

  useEffect(() => {
    loadMarkupRules();
  }, []);

  const loadMarkupRules = async () => {
    setIsLoading(true);
    try {
      const rules = await apiManager.getMarkupRules();
      setMarkupRules(rules as unknown as MarkupRule[]);
    } catch {
      setMarkupRules([
        { id: '1', serviceType: 'flight', name: 'Standard Flight Markup', ruleType: 'PERCENTAGE', value: 3.5, isActive: true, createdAt: new Date().toISOString() },
        { id: '2', serviceType: 'hotel', name: 'Base Hotel Margin', ruleType: 'FIXED', value: 5, isActive: true, createdAt: new Date().toISOString() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProfileLayout>
      <div className="max-w-[1550px] mx-auto pb-20 px-6 pt-8 animate-fade">
        <NodalPageHeader
          icon={TrendingUp}
          title="Yield"
          highlightedTitle="Logic"
          nodeName="PRICING_ENG"
          subtitle="Configure algorithmic markup rules and global margin policies."
          actions={
            <button onClick={() => setShowCreateModal(true)} className="px-8 py-3 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-xl">
              Create New Rule
            </button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 my-12">
          {isLoading ? (
            <div className="col-span-2 flex flex-col items-center justify-center py-48 gap-8">
              <TrendingUp className="animate-spin text-apple-blue" size={48} />
              <div className="text-xs font-bold text-black/20 uppercase tracking-widest">Loading yield configurations...</div>
            </div>
          ) : (
            markupRules.map(rule => (
              <div key={rule.id} className="bg-white rounded-[2.5rem] border border-black/5 p-12 shadow-sm hover:shadow-xl transition-all group">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-black text-apple-blue rounded-xl flex items-center justify-center shadow-lg">
                      {rule.serviceType === 'flight' ? <Plane size={24} /> : <Building2 size={24} />}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-black">{rule.name}</h3>
                      <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest">{rule.serviceType} / {rule.ruleType}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-3 bg-black/5 text-black/20 rounded-xl hover:text-black transition-all"><Edit2 size={16}/></button>
                    <button className="p-3 bg-black/5 text-black/20 rounded-xl hover:text-red-500 transition-all"><Trash2 size={16}/></button>
                  </div>
                </div>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-black">{rule.value}{rule.ruleType === 'PERCENTAGE' ? '%' : ''}</span>
                  {rule.ruleType === 'FIXED' && <span className="text-xs font-bold text-black/20 uppercase tracking-widest">{tenant.currency}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </ProfileLayout>
  );
}
