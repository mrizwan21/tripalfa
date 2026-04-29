import { useState, useEffect } from 'react';
import { ShieldAlert, Plane, Building2, Loader2, Database, RefreshCcw, X } from 'lucide-react';
import { apiManager } from '../services/apiManager';
import { ProfileLayout } from './ProfilePage';
import { NodalPageHeader, cn } from '../index';

interface Provider {
  id: string;
  name: string;
  code: string;
  status: boolean;
}

export default function ProviderDisablePage() {
  const [providers, setProviders] = useState<{ aviation: Provider[]; hospitality: Provider[] }>({ aviation: [], hospitality: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setIsLoading(true);
    try {
      const data = await apiManager.getProviders();
      setProviders({ aviation: [...data.aviation] as Provider[], hospitality: [...data.hospitality] as Provider[] });
    } catch {
      setProviders({
        aviation: [
          { id: 'ek', name: 'Emirates (EK)', code: 'EK', status: true },
          { id: 'qr', name: 'Qatar Airways (QR)', code: 'QR', status: true },
          { id: 'gf', name: 'Gulf Air (GF)', code: 'GF', status: true },
          { id: 'ai', name: 'Air India (AI)', code: 'AI', status: false },
          { id: 'ba', name: 'British Airways (BA)', code: 'BA', status: true },
        ],
        hospitality: [
          { id: 'expedia', name: 'Expedia Partner', code: 'EX', status: true },
          { id: 'hotelbeds', name: 'Hotelbeds', code: 'HB', status: true },
          { id: 'tbo', name: 'TBO Holidays', code: 'TB', status: false },
          { id: 'booking', name: 'Booking.com', code: 'BK', status: true },
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleProvider = async (providerId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setIsSubmitting(providerId);

    try {
      await apiManager.toggleProvider(providerId, newStatus);
      setProviders(prev => ({
        aviation: prev.aviation.map(p => p.id === providerId ? { ...p, status: newStatus } : p),
        hospitality: prev.hospitality.map(p => p.id === providerId ? { ...p, status: newStatus } : p)
      }));
      setSuccess(`${newStatus ? 'Enabled' : 'Disabled'} successfully.`);
    } catch {
      setError('Failed to update provider status.');
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleFactoryReset = async () => {
    setIsSubmitting('reset');
    try {
      await apiManager.resetProvidersToDefault();
      await loadProviders();
      setSuccess('All providers reset to default.');
      setShowResetConfirm(false);
    } catch {
      setError('Failed to reset providers.');
    } finally {
      setIsSubmitting(null);
    }
  };

  const getActiveCount = (providerList: Provider[]) => providerList.filter(p => p.status).length;
  const getTotalCount = (providerList: Provider[]) => providerList.length;

  const ProviderCard = ({ provider }: { provider: Provider }) => (
    <div className="flex justify-between items-center p-6 bg-black/[0.02] hover:bg-white rounded-2xl border border-transparent hover:border-black/5 transition-all group">
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-2 h-2 rounded-full",
          provider.status ? "bg-green-500 shadow-xl shadow-green-500/20" : "bg-black/10"
        )} />
        <div>
          <span className="text-sm font-bold text-black">{provider.name}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-bold text-black/20 uppercase tracking-widest">{provider.code}</span>
          </div>
        </div>
      </div>
      <button
        onClick={() => handleToggleProvider(provider.id, provider.status)}
        disabled={isSubmitting === provider.id}
        className={cn(
          "w-12 h-7 rounded-full relative transition-all duration-500",
          provider.status ? 'bg-black' : 'bg-black/10',
          isSubmitting === provider.id && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className={cn(
          "absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-500 shadow-sm",
          provider.status ? 'right-1' : 'left-1'
        )}>
          {isSubmitting === provider.id && <Loader2 size={12} className="animate-spin text-black mx-auto mt-1"/>}
        </div>
      </button>
    </div>
  );

  return (
    <ProfileLayout>
      <div className="animate-fade space-y-8 px-6 lg:px-12 pb-24 pt-8">
        <NodalPageHeader
          title="Inventory"
          highlightedTitle="Control"
          nodeName="GATEWAY_CTRL"
          subtitle="Enable or disable global search provider associations."
          actions={
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-8 py-4 bg-white border border-black/10 text-black text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-black/5 transition-all flex items-center gap-3"
            >
              <RefreshCcw size={18} /> Reset to Default
            </button>
          }
        />

        {(success || error) && (
          <div className={cn(
            "p-6 rounded-2xl border flex justify-between items-center animate-slide-up",
            success ? "bg-green-50 border-green-100 text-green-700" : "bg-red-50 border-red-100 text-red-700"
          )}>
            <div className="flex items-center gap-4">
              <ShieldAlert size={20} />
              <span className="text-sm font-bold">{success || error}</span>
            </div>
            <button onClick={() => { setSuccess(''); setError(''); }} className="opacity-40 hover:opacity-100"><X size={20}/></button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-48 gap-8">
            <RefreshCcw className="animate-spin text-apple-blue" size={48} />
            <div className="text-xs font-bold text-black/20 uppercase tracking-widest">Calibrating gateways...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Aviation */}
            <div className="bg-white border border-black/5 rounded-[2.5rem] p-10 shadow-sm">
              <div className="flex justify-between items-center mb-8 pb-8 border-b border-black/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black text-apple-blue rounded-2xl flex items-center justify-center shadow-lg">
                    <Plane size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black">Aviation Providers</h3>
                    <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest">GDS & NDC Connections</p>
                  </div>
                </div>
                <div className="text-xs font-bold text-black/40">
                  {getActiveCount(providers.aviation)} / {getTotalCount(providers.aviation)} ACTIVE
                </div>
              </div>
              <div className="space-y-3">
                {providers.aviation.map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
            </div>

            {/* Hospitality */}
            <div className="bg-white border border-black/5 rounded-[2.5rem] p-10 shadow-sm">
              <div className="flex justify-between items-center mb-8 pb-8 border-b border-black/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black text-apple-blue rounded-2xl flex items-center justify-center shadow-lg">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black">Hospitality Hub</h3>
                    <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest">B2B Bedbanks & APIs</p>
                  </div>
                </div>
                <div className="text-xs font-bold text-black/40">
                  {getActiveCount(providers.hospitality)} / {getTotalCount(providers.hospitality)} ACTIVE
                </div>
              </div>
              <div className="space-y-3">
                {providers.hospitality.map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="bg-black rounded-3xl p-10 text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 text-white pointer-events-none">
            <ShieldAlert size={120} />
          </div>
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-apple-blue shrink-0">
            <ShieldAlert size={32} />
          </div>
          <div className="space-y-2 relative z-10">
            <h4 className="text-lg font-bold text-white">Inventory Protection Mode</h4>
            <p className="text-xs text-white/40 leading-relaxed max-w-2xl font-medium">
              Disabling a provider will immediately purge its results from all search clusters. 
              Ongoing bookings and active itineraries remain protected for 30 days.
            </p>
          </div>
        </div>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[110] p-6 animate-fade">
          <div className="bg-white rounded-[2rem] p-10 max-w-md w-full shadow-2xl text-center border-t-[8px] border-red-500">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <ShieldAlert size={40} />
            </div>
            <h3 className="text-2xl font-bold text-black mb-2">Reset Gateways?</h3>
            <p className="text-xs font-bold text-black/30 uppercase tracking-widest mb-8 leading-relaxed">
              This will restore all provider associations to factory defaults.
            </p>
            <div className="flex gap-4">
              <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-4 bg-black/5 text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black/10 transition-all">Cancel</button>
              <button onClick={handleFactoryReset} disabled={isSubmitting === 'reset'} className="flex-1 py-4 bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-2">
                {isSubmitting === 'reset' && <Loader2 size={16} className="animate-spin"/>}
                Execute Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </ProfileLayout>
  );
}
