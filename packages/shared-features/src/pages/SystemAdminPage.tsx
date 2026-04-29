import { useState } from 'react';
import { Server, ShieldAlert, Palette, Key, Database, RefreshCcw, ToggleRight, ToggleLeft, AlertTriangle, ChevronRight, Search, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';
import { Layout } from '../components/Layout';
import { NodalPageHeader } from '../index';

interface AppTheme {
  primaryColor: string;
}

export default function SystemAdminPage() {
  const { updateBranding, addNotification } = useApp();
  const [globalLockdown, setGlobalLockdown] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<'Default' | 'DeepBlue' | 'Emerald' | 'Obsidian'>('Default');

  const themes: Record<string, AppTheme> = {
    Default: { primaryColor: '#2b2b2b' },
    DeepBlue: { primaryColor: '#172554' },
    Emerald: { primaryColor: '#064e3b' },
    Obsidian: { primaryColor: '#09090b' },
  };

  const handleApplyTheme = () => {
    updateBranding(themes[selectedTheme]);
    addNotification({
      title: 'Aesthetic Sync Forced',
      message: `${selectedTheme} profile dispatched to cluster.`,
      type: 'info'
    });
  };

  return (
    <Layout>
      <div className="max-w-[1550px] mx-auto pb-20 px-6 pt-8 animate-fade">
        <NodalPageHeader
          icon={Server}
          title="Cluster"
          highlightedTitle="Admin"
          nodeName="MASTER_CONTROL"
          subtitle="Governing global regional clusters and aesthetic injection templates."
          actions={
            <div className="flex bg-black p-4 rounded-xl shadow-2xl border border-white/10 items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">34 Nodes Online</span>
              </div>
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 my-12">
          <div className="bg-white rounded-[2.5rem] border border-black/5 p-12 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:scale-110 transition-transform duration-1000">
              <ShieldAlert size={200} />
            </div>
            <h3 className="text-xl font-bold text-black mb-8">Sovereign Overrides</h3>
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-black">Global GDS Lockdown</h4>
                  <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest mt-1">Sever all provider links immediately</p>
                </div>
                <button onClick={() => setGlobalLockdown(!globalLockdown)} className={cn("transition-all", globalLockdown ? "text-red-500" : "text-black/10")}>
                  {globalLockdown ? <ToggleRight size={48} /> : <ToggleLeft size={48} />}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-black/5 p-12 shadow-sm overflow-hidden">
            <h3 className="text-xl font-bold text-black mb-8">Aesthetic Injection</h3>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {Object.keys(themes).map(theme => (
                <button
                  key={theme}
                  onClick={() => setSelectedTheme(theme as any)}
                  className={cn(
                    "p-6 rounded-2xl border-2 transition-all text-left",
                    selectedTheme === theme ? "border-black bg-black text-white" : "border-black/5 hover:border-black/20"
                  )}
                >
                  <div className="w-8 h-8 rounded-lg mb-4" style={{ backgroundColor: themes[theme].primaryColor }} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">{theme}</p>
                </button>
              ))}
            </div>
            <button onClick={handleApplyTheme} className="w-full py-5 bg-black text-white rounded-2xl font-bold shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
              <RefreshCcw size={20} />
              Dispatch CSS Template
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
