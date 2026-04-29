import { useState, useEffect } from 'react';
import { 
  GitBranch, 
  MapPin, 
  Plus, 
  Search, 
  ChevronRight, 
  X,
  Loader2,
  Mail,
  Globe
} from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { cn } from '../lib/utils';
import { apiManager } from '../services/apiManager';
import { ProfileLayout } from './ProfilePage';

interface Branch {
  id: string;
  name: string;
  code: string;
  status: 'Active' | 'Inactive';
  city: string;
  email: string;
  phone: string;
  address: string;
}

export default function BranchManagementPage() {
  const { tenant } = useTenant();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    mobile: '',
    fax: '',
    address1: '',
    address2: '',
    address3: '',
    city: '',
    state: '',
    country: '',
    postCode: '',
    vatNo: '',
    registrationNo: '',
    officeId: '',
    branchType: 'Sales Office' as 'GSA' | 'Sales Office' | 'Airport Desk' | 'Support Hub',
    status: 'Active' as 'Active' | 'Inactive'
  });

  const loadBranches = async () => {
    setIsLoading(true);
    try {
      const data = await apiManager.getBranches();
      if (data) setBranches(data as unknown as Branch[]);
      else {
        setBranches([
          { id: '1', name: 'Riyadh Central Hub', code: 'RUH-01', status: 'Active', city: 'Riyadh', email: 'ruh@agency.com', phone: '+966 11 123 4567', address: 'Olaya St, Building 12' },
          { id: '2', name: 'Jeddah Coastal Branch', code: 'JED-02', status: 'Active', city: 'Jeddah', email: 'jed@agency.com', phone: '+966 12 987 6543', address: 'King Road, Tower 5' },
        ]);
      }
    } catch {
      setBranches([
        { id: '1', name: 'Riyadh Central Hub', code: 'RUH-01', status: 'Active', city: 'Riyadh', email: 'ruh@agency.com', phone: '+966 11 123 4567', address: 'Olaya St, Building 12' },
        { id: '2', name: 'Jeddah Coastal Branch', code: 'JED-02', status: 'Active', city: 'Jeddah', email: 'jed@agency.com', phone: '+966 12 987 6543', address: 'King Road, Tower 5' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleCreateBranch = async () => {
    if (!formData.name || !formData.city) {
      alert('Branch Name and City are required.');
      return;
    }
    setIsSubmitting(true);
    try {
      await apiManager.createBranch({
        ...formData,
        address: `${formData.address1} ${formData.address2} ${formData.address3}`.trim()
      });
      setShowModal(false);
      resetForm();
      loadBranches();
    } catch {
      console.error('Failed to create branch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', code: '', email: '', phone: '', mobile: '', fax: '',
      address1: '', address2: '', address3: '', city: '', state: '', country: '', postCode: '',
      vatNo: '', registrationNo: '', officeId: '',
      branchType: 'Sales Office',
      status: 'Active'
    });
    setShowModal(false);
  };

  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProfileLayout>
      <div className="animate-fade space-y-8 px-6 lg:px-12 pb-24 pt-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 border-b border-black/5 pb-10">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold text-black leading-tight flex items-center gap-4">
              <div className="w-14 h-14 bg-black/5 text-black rounded-2xl flex items-center justify-center shadow-sm">
                <GitBranch size={28} />
              </div>
              Branch Network
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-black/40">Manage global geographic hubs.</span>
              <span className="text-xs font-bold text-apple-blue bg-apple-blue/5 px-4 py-2 rounded-full uppercase tracking-widest">
                HQ: {tenant.name}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" />
              <input
                type="text"
                placeholder="Search branches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/[0.02] border-transparent focus:bg-white focus:border-black/10 rounded-xl text-xs font-bold outline-none transition-all"
              />
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="px-8 py-3 bg-black text-white rounded-xl text-sm font-bold shadow-xl hover:scale-105 transition-all flex items-center gap-2 shrink-0"
            >
              <Plus size={18} /> New Branch
            </button>
          </div>
        </div>

        {/* Global Overview Card */}
        <div className="bg-white border border-black/5 rounded-[2.5rem] p-10 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Globe size={160} />
          </div>
          
          <div className="flex items-center gap-6 relative z-10 w-full">
            <div className="w-16 h-16 rounded-2xl bg-black text-apple-blue flex items-center justify-center shadow-lg shrink-0">
              <MapPin size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black mb-1">Geographic Coverage</h2>
              <p className="text-xs font-bold text-black/20 uppercase tracking-widest max-w-sm">Regional point-of-sale reporting nodes.</p>
            </div>
          </div>

          <div className="flex gap-4 relative z-10 w-full md:w-auto">
            <div className="bg-black text-white rounded-2xl p-6 text-center min-w-[140px] shadow-xl">
              <div className="text-3xl font-bold">{branches.filter(b => b.status === 'Active').length}</div>
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Active</div>
            </div>
            <div className="bg-black/[0.02] rounded-2xl p-6 text-center min-w-[140px] border border-black/5">
              <div className="text-3xl font-bold text-black">{branches.length}</div>
              <div className="text-[10px] font-bold text-black/20 uppercase tracking-widest mt-1">Total</div>
            </div>
          </div>
        </div>

        {/* Branch Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {isLoading ? (
            <div className="col-span-full py-48 flex flex-col items-center gap-6">
              <Loader2 className="animate-spin text-apple-blue" size={48} />
              <span className="text-xs font-bold text-black/20 uppercase tracking-widest">Synchronizing network...</span>
            </div>
          ) : filteredBranches.map(branch => (
            <div key={branch.id} className="bg-white rounded-[2rem] border border-black/5 overflow-hidden shadow-sm group hover:border-black/10 transition-all hover:shadow-xl">
              <div className="px-8 py-6 border-b border-black/5 bg-black/[0.01] flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-black">{branch.name}</h3>
                  <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest mt-0.5">{branch.code}</p>
                </div>
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full",
                  branch.status === 'Active' ? "bg-green-500 shadow-xl shadow-green-500/20" : "bg-black/10"
                )} />
              </div>
              <div className="p-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-black/[0.02] flex items-center justify-center text-black/20 shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-black">{branch.city}</p>
                    <p className="text-[10px] font-medium text-black/40 mt-1">{branch.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-black/[0.02] flex items-center justify-center text-black/20 shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-black">{branch.email}</p>
                    <p className="text-[10px] font-medium text-black/40 mt-1">{branch.phone}</p>
                  </div>
                </div>
              </div>
              <div className="px-8 py-5 bg-black/[0.01] border-t border-black/5">
                <button className="w-full text-xs font-bold text-black hover:text-apple-blue transition-all flex items-center justify-between group/btn uppercase tracking-widest">
                  Manage Location <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal (Simplified) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-[110] p-6 animate-fade">
          <div className="bg-white rounded-[2.5rem] p-12 max-w-2xl w-full shadow-2xl relative overflow-hidden border-t-[8px] border-black">
            <div className="flex justify-between items-start mb-12">
              <div className="space-y-1">
                <h3 className="text-3xl font-bold text-black">New Branch</h3>
                <p className="text-xs font-bold text-black/20 uppercase tracking-widest">Establish geographic point of sale</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-black/5 hover:bg-black/10 text-black/40 hover:text-black transition-all"><X size={24} /></button>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest ml-1">Branch Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-black/5 border-2 border-transparent focus:border-apple-blue rounded-xl px-6 py-4 text-sm font-bold outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest ml-1">Internal Code</label>
                <input type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="w-full bg-black/5 border-2 border-transparent focus:border-apple-blue rounded-xl px-6 py-4 text-sm font-bold outline-none transition-all" />
              </div>
            </div>
            
            <div className="mt-12">
              <button
                onClick={handleCreateBranch}
                disabled={isSubmitting}
                className="w-full py-5 bg-black text-white rounded-2xl font-bold shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin"/> : <GitBranch size={20}/>}
                Provision Branch
              </button>
            </div>
          </div>
        </div>
      )}
    </ProfileLayout>
  );
}
