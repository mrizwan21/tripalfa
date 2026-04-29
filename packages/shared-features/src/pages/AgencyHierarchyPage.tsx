import { useState, useEffect, useCallback } from 'react';
import { 
  Network, 
  GitBranch, 
  ShieldCheck, 
  Plus,
  Search,
  Database,
  Building,
  Globe,
  FileText,
  X,
  Loader2,
  Shield,
  RefreshCcw,
  ArrowUpRight,
  CheckCircle2,
  Zap,
  Layers
} from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { cn } from '../lib/utils';
import { apiManager } from '../services/apiManager';
import { ProfileLayout } from './ProfilePage';

interface AgencyNode {
  id: string;
  name: string;
  agentCode: string;
  type: 'MASTER' | 'Sub Agent';
  totalBookings: number;
  revenue: number;
  status: 'Active' | 'Restricted';
  perfData?: number[];
  children?: AgencyNode[];
}

export default function AgencyHierarchyPage() {
  const { tenant } = useTenant();
  const [hierarchy, setHierarchy] = useState<AgencyNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'financial' | 'licensing' | 'access' | 'governance' | 'documents'>('profile');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    dateOfOperations: '',
    email: '',
    branchName: '',
    salesGroup: '',
    language: 'English',
    currency: tenant.currency,
    address1: '', address2: '', address3: '',
    country: '', state: '', city: '', postCode: '',
    telephone: '', mobile: '', fax: '',
    contactName: '', designation: '', contactMobile: '', contactEmail: '',
    websiteUrl: '', referredBy: '', remarks: '',
    salesContactName: '', salesEmail: '', salesPhone: '', salesMobile: '',
    registrationNo: '',
    bankName: '', bankAddress: '', bankSwiftCode: '', bankAccountNo: '',
    paymentType: 'CREDIT',
    creditLimit: 0,
    creditLimitAlert: 0,
    tempCreditLimit: 0,
    tempCreditLimitStart: '',
    tempCreditLimitEnd: '',
    tdsApplicable: 0,
    tdsExemption: 0,
    dailyTicketValue: 0,
    payPeriod: 'Monthly',
    annualTurnover: 0,
    reserveVolumeMonthly: 0,
    noOfEmployees: 0,
    noOfBranches: 0,
    iataNo: '',
    officeId: '',
    vatNo: '',
    abtaNo: '',
    atolNo: '',
    accessFlights: true, accessHotels: true, accessCars: false,
    accessInsurance: false, accessPackages: false, accessSightseeing: false,
    accessTransfers: false, accessDynamicSearch: true,
    enableB2B2C: false,
    canManageBranches: true, canManageUsers: true, canManageRoles: true,
    canManageMarkups: true, canManageCreditCards: false,
    canImportPNR: true, canAllowAutoTicket: true,
    canAccessIITFare: false, canManageSupplierCreds: false,
    showLogoOnDashboard: true, allowAirCanx: true,
    allowedAirlines: ['GF', 'EK', 'EY', 'QR', 'SV', 'G9', 'F3', 'J9'],
  });

  const fallbackHierarchy: AgencyNode = {
    id: tenant.id,
    name: tenant.name,
    agentCode: 'MASTER',
    type: 'MASTER',
    totalBookings: 1240,
    revenue: 450000,
    status: 'Active',
    children: [
      { id: 'sub-1', name: 'Elite Travels Riyadh', agentCode: 'elite-ruh', type: 'Sub Agent', totalBookings: 450, revenue: 125000, status: 'Active', perfData: [40, 35, 55, 45, 70, 65, 85] },
      { id: 'sub-2', name: 'Global Horizons Dubai', agentCode: 'gh-dxb', type: 'Sub Agent', totalBookings: 320, revenue: 98000, status: 'Active', perfData: [30, 40, 35, 60, 55, 65, 75] },
      { id: 'sub-3', name: 'Legacy Oasis Bahrain', agentCode: 'legacy-bah', type: 'Sub Agent', totalBookings: 180, revenue: 52000, status: 'Restricted', perfData: [10, 15, 12, 20, 18, 22, 25] }
    ]
  };

  const loadHierarchy = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiData = await apiManager.getAgencyHierarchy();
      if (apiData) {
        const mapped: AgencyNode = {
          id: apiData.id,
          name: apiData.name,
          agentCode: apiData.agentCode,
          type: apiData.type as 'MASTER' | 'Sub Agent',
          totalBookings: apiData.cachedBookings ?? 0,
          revenue: apiData.cachedRevenue ?? 0,
          status: apiData.isActive ? 'Active' : 'Restricted',
          perfData: apiData.perfSparkline ?? [100, 120, 110, 150, 140, 180, 200],
          children: (apiData.subAgencies ?? []).map((sub: any) => ({
            id: sub.id,
            name: sub.name,
            agentCode: sub.agentCode,
            type: 'Sub Agent' as const,
            totalBookings: sub.cachedBookings ?? 0,
            revenue: sub.cachedRevenue ?? 0,
            status: sub.isActive ? 'Active' : 'Restricted',
            perfData: sub.perfSparkline ?? [20, 30, 25, 45, 40, 50, 60]
          }))
        };
        setHierarchy(mapped);
      } else {
        setHierarchy(fallbackHierarchy);
      }
    } catch {
      setHierarchy(fallbackHierarchy);
    } finally {
      setIsLoading(false);
    }
  }, [tenant]);

  useEffect(() => {
    loadHierarchy();
  }, [loadHierarchy]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await apiManager.syncHierarchy();
      await loadHierarchy();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleProvision = async () => {
    setIsSubmitting(true);
    try {
      await apiManager.provisionAgency({
        agentCode: formData.name.toLowerCase().replace(/\s+/g, '-'),
        name: formData.name,
        parentId: tenant.id,
        creditLimit: formData.creditLimit,
        city: formData.city,
        country: formData.country
      });
      setShowProvisionModal(false);
      await loadHierarchy();
    } catch (error) {
      console.error('Provision failed:', error);
      alert('Failed to provision agency. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return `${tenant.currency} ${val.toLocaleString()}`;
  };

  const AgencyCard = ({ branch, isMaster = false }: { branch: AgencyNode, isMaster?: boolean }) => (
    <div className={cn(
      "bg-white rounded-3xl overflow-hidden border transition-all duration-500 group",
      isMaster ? "border-black/10 shadow-2xl" : "border-black/5 shadow-sm hover:border-black/10"
    )}>
      <div className={cn(
        "px-8 py-6 flex justify-between items-center border-b border-black/5",
        isMaster ? "bg-black/[0.02]" : "bg-white"
      )}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl border border-black/5 flex items-center justify-center text-black shadow-sm">
            {isMaster ? <Database size={24} /> : <GitBranch size={22} />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-black">{branch.name}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-black/30 tabular-nums">{branch.agentCode}</span>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest",
                branch.status === 'Active' ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
              )}>
                {branch.status}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-black">{formatCurrency(branch.revenue)}</div>
          <div className="text-[10px] font-bold text-black/20 uppercase tracking-widest">{branch.totalBookings} Bookings</div>
        </div>
      </div>
      
      {!isMaster && (
        <div className="px-8 py-4 bg-black/[0.01] flex justify-between items-center text-xs">
          <div className="flex gap-6">
            <button className="font-bold text-black/40 hover:text-black transition-colors uppercase tracking-widest">Manage</button>
            <button className="font-bold text-black/40 hover:text-black transition-colors uppercase tracking-widest">Statement</button>
          </div>
          <ArrowUpRight size={16} className="text-black/20 group-hover:text-apple-blue group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
        </div>
      )}
    </div>
  );

  return (
    <ProfileLayout>
      <div className="animate-fade space-y-8 px-6 lg:px-12 pb-24 pt-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 border-b border-black/5 pb-10">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold text-black leading-tight flex items-center gap-4">
              <div className="w-14 h-14 bg-black/5 text-black rounded-2xl flex items-center justify-center shadow-sm">
                <Network size={28} />
              </div>
              Agency Network
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-black/40">Oversee global agency distribution.</span>
              {isSyncing ? (
                <span className="text-xs font-bold text-black/20 flex items-center gap-2 uppercase tracking-widest">
                  <Loader2 size={14} className="animate-spin" /> Syncing...
                </span>
              ) : (
                <button onClick={handleSync} className="text-xs font-bold text-apple-blue hover:underline flex items-center gap-1 uppercase tracking-widest">
                  <RefreshCcw size={12} /> Refresh
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <button 
              onClick={() => setShowProvisionModal(true)}
              className="px-8 py-3 bg-black text-white rounded-xl text-sm font-bold shadow-xl hover:scale-105 transition-all flex items-center gap-2"
            >
              <Plus size={18} /> Provision Agency
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-3xl border border-black/5 shadow-sm">
            <Loader2 className="animate-spin text-black/20" size={32} />
            <span className="text-sm font-bold text-black/40 uppercase tracking-widest">Fetching details...</span>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <ShieldCheck size={20} className="text-apple-blue" />
                <h2 className="text-xl font-bold text-black">Master Entity</h2>
              </div>
              {hierarchy && <AgencyCard branch={hierarchy} isMaster={true} />}
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <GitBranch size={20} className="text-black/40" />
                  <h2 className="text-xl font-bold text-black">Sub-Tenants</h2>
                </div>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search nodes..."
                    className="bg-black/[0.02] border-transparent focus:bg-white focus:border-black/10 rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none transition-all w-64"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {hierarchy?.children?.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(child => (
                  <AgencyCard key={child.id} branch={child} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Provision Modal (Simplified) */}
      {showProvisionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-[110] p-6 animate-fade">
          <div className="bg-white rounded-[2rem] max-w-2xl w-full shadow-2xl relative overflow-hidden p-12 border-t-[8px] border-black">
            <div className="flex justify-between items-start mb-12">
              <div className="space-y-1">
                <h3 className="text-3xl font-bold text-black">Provision Agency</h3>
                <p className="text-xs font-bold text-black/20 uppercase tracking-widest">New sub-tenant registration</p>
              </div>
              <button onClick={() => setShowProvisionModal(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-black/5 hover:bg-black/10 text-black/40 hover:text-black transition-all"><X size={24} /></button>
            </div>

            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest ml-1">Agency Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-black/5 border-2 border-transparent focus:border-apple-blue rounded-xl px-6 py-4 text-sm font-bold outline-none transition-all" placeholder="Legal Agency Name" />
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest ml-1">Credit Limit</label>
                  <input type="number" value={formData.creditLimit} onChange={(e) => setFormData({...formData, creditLimit: parseInt(e.target.value)})} className="w-full bg-black/5 border-2 border-transparent focus:border-apple-blue rounded-xl px-6 py-4 text-sm font-bold outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest ml-1">Currency</label>
                  <div className="w-full bg-black/5 rounded-xl px-6 py-4 text-sm font-bold text-black/40">{tenant.currency}</div>
                </div>
              </div>
              <button onClick={handleProvision} disabled={isSubmitting} className="w-full bg-black text-white py-5 rounded-2xl font-bold shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
                Execute Provisioning
              </button>
            </div>
          </div>
        </div>
      )}
    </ProfileLayout>
  );
}
