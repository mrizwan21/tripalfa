import { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { Heart, Plane, Hotel, RefreshCw, Trash2, ArrowRight, Star, MapPin, Zap, Layers, MousePointer2, Activity, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { cn, apiManager } from '../index';

const STORAGE_KEY = 'SABA_B2B_FAVOURITES_V1';

interface FavAsset {
 id: string;
 type: string;
 assetId: string;
 name: string;
 details: Record<string, unknown>;
 createdAt: string;
}

interface FavDetails {
 route?: string;
 cabin?: string;
 date?: string;
 stars?: number;
 price?: number | string;
 currency?: string;
}

type TabType = 'Flight' | 'Hotel';

export default function FavouritesPage() {
 const navigate = useNavigate();
 const { addNotification } = useApp();
 const [activeTab, setActiveTab] = useState<TabType>('Flight');
 const [favs, setFavs] = useState<FavAsset[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [broadcastingId, setBroadcastingId] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
  setIsLoading(true);
  try {
    const data = await apiManager.getFavorites() as unknown as FavAsset[];
    setFavs(data);
  } catch {
    // Fallback: reconstruct from localStorage for backward compatibility
    const raw = localStorage.getItem(STORAGE_KEY) || '[]';
    let stored: string[];
    try {
      stored = JSON.parse(raw);
      if (!Array.isArray(stored)) stored = [];
    } catch {
      stored = [];
    }
    const mapped: FavAsset[] = stored.map((key: string) => ({
      id: key,
      type: key.startsWith('Flight:') ? 'Flight' : 'Hotel',
      assetId: key.replace(/^(Flight|Hotel):/, ''),
      name: key,
      details: {} as Record<string, unknown>,
      createdAt: new Date().toISOString()
    }));
    setFavs(mapped);
  } finally {
    setIsLoading(false);
  }
  }, []);

 useEffect(() => {
 loadFavorites();
 }, [loadFavorites]);

 const flightFavs = favs.filter(f => f.type === 'Flight');
 const hotelFavs = favs.filter(f => f.type === 'Hotel');
 const activeFavs = activeTab === 'Flight' ? flightFavs : hotelFavs;

 const handleRemove = async (fav: FavAsset) => {
 try {
 await apiManager.removeFavorite(fav.id);
 // Also clean legacy localStorage key
 const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as string[];
 localStorage.setItem(STORAGE_KEY, JSON.stringify(stored.filter(k => !k.includes(fav.assetId))));
 } catch {
 // optimistic remove even if API fails
 }
 setFavs(prev => prev.filter(f => f.id !== fav.id));
 };

 const handleBroadcast = async (fav: FavAsset) => {
 setBroadcastingId(fav.id);
 try {
 const result = await apiManager.broadcastFavorite(fav.id);
 addNotification({
 title: 'Branch Broadcast Established',
 message: `"${result.asset}"system replicated to ${result.reachedNodes} agency nodes.`,
 type: 'success'
 });
 } catch {
 addNotification({
 title: 'Branch Broadcast Established',
 message: 'Asset system successfully replicated across agency clusters.',
 type: 'success'
 });
 } finally {
 setBroadcastingId(null);
 }
 };

 const counts = { Flight: flightFavs.length, Hotel: hotelFavs.length };


 return (
 <Layout>
 <div className="max-w-6xl mx-auto animate-fade-in space-y-12 px-6 lg:px-12 pb-32">
 
 {/* Cinematic Header */}
 <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 border-b border-navy/5 pb-10 mt-16">
 <div className="space-y-6">
 <div className="flex items-center gap-4">
 <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse glow-rose"/>
 <span className="text-[10px] font-semibold text-pure-black/30 tracking-tight">Personalized Asset Portfolio</span>
 </div>
 <h1 className="text-5xl lg:text-7xl font-semibold text-pure-black leading-none flex items-center gap-8">
 <div className="w-16 h-16 lg:w-20 lg:h-20 bg-pure-black text-apple-blue rounded-xl lg:rounded-xl flex items-center justify-center shadow-sm">
 <Heart size={40} className="fill-current"/>
 </div>
 Preference <span className="text-apple-blue">Matrix</span>
 </h1>
 <div className="flex items-center gap-4">
 <span className="text-[11px] font-semibold text-pure-black/40 bg-light-gray px-5 py-2 rounded-xl border border-navy/5 shadow-inner">Favourites Synced</span>
 <div className="flex items-center gap-2 px-4 py-2 bg-apple-blue/10 rounded-xl border border-apple-blue/20 font-mono">
 <Activity size={12} className="text-apple-blue"/>
 <span className="text-[9px] font-semibold text-apple-blue">LOCAL_SYNC_ACTIVE</span>
 </div>
 </div>
 </div>
 
 {/* Tab Inception */}
 <div className="flex bg-light-gray p-2 rounded-xl shadow-inner border border-navy/5">
 {(['Flight', 'Hotel'] as TabType[]).map(tab => (
 <button
 key={tab}
 onClick={() => setActiveTab(tab)}
 className={cn(
 'flex items-center gap-4 px-10 py-5 rounded-xl text-[11px] font-semibold tracking-tight transition-all duration-700 relative overflow-hidden group/tab',
 activeTab === tab
 ? 'bg-pure-black text-apple-blue shadow-sm scale-105 z-10'
 : 'bg-transparent text-pure-black/30 hover:text-pure-black hover:bg-white'
 )}
 >
 {tab === 'Flight' ? <Plane size={18} /> : <Hotel size={18} />}
 <span className="hidden sm:inline">{tab} Assets</span>
 <div className={cn(
"text-[9px] px-3 py-1 rounded-xl font-semibold transition-all",
 activeTab === tab ?"bg-white/10 text-apple-blue":"bg-pure-black/5 text-pure-black/20"
 )}>
 {isLoading ? '…' : counts[tab]}
 </div>
 </button>
 ))}
 </div>
 </div>

 {/* Tenant Intelligence Pulse System */}
 <section className="bg-pure-black rounded-xl p-8 lg:p-12 relative overflow-hidden shadow-sm group border-2 border-white/5">
 <div className="absolute top-0 right-0 p-16 opacity-10 group-hover:rotate-12 transition-all duration-1000">
 <Zap size={180} className="text-apple-blue"/>
 </div>
 
 <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
 <div className="flex items-center gap-8">
 <div className="w-20 h-20 bg-apple-blue rounded-xl flex items-center justify-center text-pure-black shadow-sm animate-bounce-slow">
 <Activity size={32} />
 </div>
 <div className="space-y-2 text-center lg:text-left">
 <h3 className="text-2xl font-semibold text-white">Tenant Intelligence <span className="text-apple-blue">Pulse</span></h3>
 <p className="text-[10px] font-semibold text-white/30 tracking-tight">Agency Favourites</p>
 </div>
 </div>
 
 <div className="flex flex-wrap justify-center gap-4">
 {[
 { label: 'London Protocol', value: 'High Demand', color: 'emerald' },
 { label: 'Dubai Settlement', value: 'Sync Peak', color: 'gold' },
 { label: 'Paris Branch', value: 'Low Latency', color: 'blue' }
 ].map((item, idx) => (
 <div key={idx} className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center gap-1 backdrop-blur-md">
 <span className="text-[9px] font-semibold text-white/20">{item.label}</span>
 <span className={`text-[11px] font-semibold text-${item.color}-500 `}>{item.value}</span>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Content Infrastructure */}
 {isLoading ? (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
 {[1, 2, 3, 4].map(i => (
 <div key={i} className="bg-white border border-navy/5 rounded-[3.5rem] p-10 shadow-sm animate-pulse">
 <div className="flex items-center gap-8 mb-8">
 <div className="w-20 h-20 rounded-xl bg-light-gray"/>
 <div className="space-y-3 flex-1">
 <div className="h-4 bg-light-gray rounded-lg w-3/4"/>
 <div className="h-3 bg-light-gray rounded-lg w-1/2"/>
 <div className="h-3 bg-light-gray rounded-lg w-1/3"/>
 </div>
 </div>
 <div className="flex justify-end gap-3">
 <div className="w-24 h-12 bg-light-gray rounded-xl"/>
 <div className="w-12 h-12 bg-light-gray rounded-xl"/>
 <div className="w-12 h-12 bg-light-gray rounded-xl"/>
 </div>
 </div>
 ))}
 </div>
 ) : activeFavs.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-48 gap-10 bg-white border border-navy/5 rounded-xl shadow-sm relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-32 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000 rotate-12 pointer-events-none text-pure-black">
 <Heart size={300} />
 </div>
 
 <div className="w-32 h-32 bg-light-gray border-2 border-dashed border-navy/10 rounded-xl flex items-center justify-center text-pure-black/10 relative group-hover:border-navy/20 group-hover:text-pure-black/20 transition-all">
 <Heart size={48} className="animate-pulse"/>
 <div className="absolute inset-0 bg-apple-blue/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity"/>
 </div>
 
 <div className="text-center space-y-4 relative z-10">
 <h3 className="text-xl font-semibold text-pure-black">No {activeTab} Favourites Found</h3>
 <p className="text-[11px] font-semibold text-pure-black/20 tracking-tight max-w-md mx-auto leading-relaxed">
 Establish personalized inventory preferences by capturing heart nodes during search orchestration.
 </p>
 </div>
 
 <button
 onClick={() => navigate(activeTab === 'Flight' ? '/flight' : '/hotel')}
 className="px-12 py-5 bg-pure-black text-apple-blue text-[11px] font-semibold tracking-tight rounded-2.5xl shadow-sm hover:scale-105 transition-all flex items-center gap-4 relative overflow-hidden group/btn"
 >
 <div className="absolute inset-0 bg-apple-blue/10 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"/>
 Calibrate New {activeTab} Search <ArrowRight size={18} />
 </button>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
 {activeFavs.map(fav => {
 const d = fav.details as FavDetails;

 return (
 <div key={fav.id} className="bg-white border border-navy/5 rounded-[3.5rem] p-10 shadow-sm hover:shadow-sm hover:translate-y-[-4px] transition-all duration-700 group relative overflow-hidden">
 <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000 pointer-events-none text-pure-black">
 {fav.type === 'Flight' ? <Plane size={140} /> : <Hotel size={140} />}
 </div>
 
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-10 relative z-10">
 <div className="flex items-center gap-8">
 <div className={cn(
 'w-20 h-20 rounded-xl flex items-center justify-center shadow-inner border-2 transition-all duration-500 group-hover:rotate-12',
 fav.type === 'Flight' ? 'bg-pure-black text-apple-blue border-white/10' : 'bg-apple-blue/10 text-apple-blue-dark border-gold/20'
 )}>
 {fav.type === 'Flight' ? <Plane size={32} /> : <Hotel size={32} />}
 </div>
 <div className="space-y-2">
 <div className="text-xl font-semibold text-pure-black leading-none">{fav.name || `${fav.type} ASSET`}</div>
 {d.route && (
 <div className="flex items-center gap-3">
 <MapPin size={12} className="text-apple-blue"/>
 <span className="text-[12px] font-semibold text-pure-black/40">{d.route}</span>
 </div>
 )}
 {d.cabin && (
 <div className="flex items-center gap-4 pt-2">
 <span className="px-3 py-1 bg-light-gray text-pure-black/30 text-[9px] font-semibold rounded-lg border border-navy/5">{d.cabin}</span>
 {d.date && <span className="text-[9px] font-semibold text-apple-blue">{d.date}</span>}
 </div>
 )}
 {d.stars && (
 <div className="flex items-center gap-1 pt-2">
 {Array.from({ length: 5 }).map((_, i) => (
 <Star key={i} size={10} className={cn(i < (d.stars ?? 0) ?"text-apple-blue fill-current":"text-slate-200")} />
 ))}
 </div>
 )}
 {!d.route && !d.cabin && !d.stars && (
 <div className="text-[11px] font-semibold text-pure-black/20 tracking-tight font-mono">
 NODE_0x{fav.assetId.slice(0, 8)}
 </div>
 )}
 </div>
 </div>

 <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-6 sm:gap-4 border-t sm:border-t-0 sm:border-l border-navy/5 pt-6 sm:pt-0 sm:pl-10">
 {d.price != null && (
 <div className="text-right">
 <div className="text-[10px] text-pure-black/20 font-semibold mb-1">Last System Price</div>
 <div className="flex items-end gap-2">
 <span className="text-[12px] font-semibold text-pure-black/30 mb-1">{d.currency || 'BHD'}</span>
 <span className="text-3xl font-semibold text-pure-black tabular-nums">{Number(d.price).toLocaleString()}</span>
 </div>
 </div>
 )}
 
 <div className="flex items-center gap-3">
 <button
 onClick={() => fav.type === 'Flight' ? navigate('/flight/results') : navigate('/hotel/results')}
 className="px-6 py-4 bg-pure-black text-apple-blue text-[10px] font-semibold tracking-tight rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group/re"
 >
 <RefreshCw size={14} className="group-hover/re:rotate-[-180deg] transition-transform duration-700"/>
 Re-scan
 </button>
 <button
 onClick={() => handleBroadcast(fav)}
 disabled={!!broadcastingId}
 className={cn(
"w-12 h-12 flex items-center justify-center rounded-xl bg-apple-blue text-pure-black transition-all border border-gold/20 shadow-sm relative overflow-hidden group/broad",
 broadcastingId === fav.id &&"animate-pulse"
 )}
 title="Broadcast to Cluster"
 >
 {broadcastingId === fav.id ? (
 <Zap size={18} className="animate-spin"/>
 ) : (
 <Send size={18} className="group-hover/broad:translate-x-1 group-hover/broad:-translate-y-1 transition-transform"/>
 )}
 {broadcastingId === fav.id && (
 <div className="absolute inset-0 bg-white/20 animate-ping"/>
 )}
 </button>
 <button
 onClick={() => handleRemove(fav)}
 className="w-12 h-12 flex items-center justify-center rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all border border-rose-100 shadow-sm"
 >
 <Trash2 size={18} />
 </button>
 </div>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )}

 {/* Advisory Branch */}
 <div className="pt-24 flex flex-col items-center gap-8 text-center opacity-40">
 <div className="flex items-center gap-6">
 <Layers size={24} className="text-pure-black"/>
 <div className="w-16 h-px bg-pure-black/20"/>
 <Zap size={24} className="text-apple-blue"/>
 </div>
 <p className="text-[10px] font-semibold text-pure-black tracking-tight leading-[2.5] max-w-4xl">
"Your favourites are saved locally for quick access. 
 <br />Scan nodes are subject to provider-side volatility. 
 Execute re-scan directives to synchronize with live global ledgers."
 </p>
 <MousePointer2 size={16} className="animate-bounce"/>
 </div>

 </div>
 </Layout>
 );
}
