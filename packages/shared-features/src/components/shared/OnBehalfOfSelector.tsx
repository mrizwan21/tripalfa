import { useState } from 'react';
import { Users, Building2, Briefcase, ChevronDown, CreditCard, Clock, Plane } from 'lucide-react';
import { cn } from '../../index';

type BookingContext = 'direct' | 'subagent' | 'corporate';

interface SubAgentInfo {
 id: string;
 companyName: string;
 accountNo: string;
 availableCreditLimit: number;
 walletBalance: number;
 currency: string;
 lastSearch?: string;
 latestBookings?: { ref: string; route: string; date: string }[];
}

interface CorporateTraveller {
 id: string;
 name: string;
 employeeId: string;
 designation: string;
 department: string;
 costCenter: string;
 isVIP: boolean;
 isCIP: boolean;
 travelCoordinator?: string;
 policy?: string;
 formOfPayment?: string;
 creditLimit?: number;
 currency?: string;
 lastBookings?: { ref: string; route: string }[];
}

interface OnBehalfOfSelectorProps {
 value: BookingContext;
 onChange: (ctx: BookingContext) => void;
 selectedSubAgent?: SubAgentInfo;
 selectedTraveller?: CorporateTraveller;
 onSubAgentChange?: (sa: SubAgentInfo | undefined) => void;
 onTravellerChange?: (t: CorporateTraveller | undefined) => void;
}

const MOCK_SUBAGENTS: SubAgentInfo[] = [
 { id: 'sa-001', companyName: 'Gulf Travels LLC', accountNo: 'SA-10021', availableCreditLimit: 15000, walletBalance: 3200, currency: 'BHD', latestBookings: [{ ref: 'TA-100121', route: 'BAH→DXB', date: '10 Apr' }, { ref: 'TA-100110', route: 'DXB→LHR', date: '08 Apr' }] },
 { id: 'sa-002', companyName: 'Arabian Wings', accountNo: 'SA-10045', availableCreditLimit: 8500, walletBalance: 1100, currency: 'BHD', latestBookings: [{ ref: 'TA-100088', route: 'KWI→IST', date: '07 Apr' }] },
 { id: 'sa-003', companyName: 'Desert Sky Tours', accountNo: 'SA-10067', availableCreditLimit: 22000, walletBalance: 5400, currency: 'BHD', latestBookings: [] },
];

const MOCK_TRAVELLERS: CorporateTraveller[] = [
 { id: 'ct-001', name: 'Ahmed Al-Rashidi', employeeId: 'EMP-4421', designation: 'Senior Manager', department: 'Operations', costCenter: 'CC-OPS-001', isVIP: true, isCIP: false, policy: 'Business Class Policy', formOfPayment: 'Corporate Card', creditLimit: 10000, currency: 'BHD', lastBookings: [{ ref: 'TA-099821', route: 'RUH→LHR' }] },
 { id: 'ct-002', name: 'Fatima Al-Hassan', employeeId: 'EMP-3310', designation: 'Director', department: 'Finance', costCenter: 'CC-FIN-002', isVIP: false, isCIP: true, policy: 'Economy Policy', formOfPayment: 'Credit Account', creditLimit: 5000, currency: 'BHD', lastBookings: [] },
];

const POLICIES = ['Economy Policy', 'Business Class Policy', 'Flexi Policy', 'Budget Policy'];

export function OnBehalfOfSelector({
 value,
 onChange,
 selectedSubAgent,
 selectedTraveller,
 onSubAgentChange,
 onTravellerChange,
}: OnBehalfOfSelectorProps) {
 const [saSearch, setSaSearch] = useState('');
 const [tSearch, setTSearch] = useState('');
 const [saDropOpen, setSaDropOpen] = useState(false);
 const [tDropOpen, setTDropOpen] = useState(false);

 const filteredSA = MOCK_SUBAGENTS.filter(sa =>
 sa.companyName.toLowerCase().includes(saSearch.toLowerCase()) ||
 sa.accountNo.toLowerCase().includes(saSearch.toLowerCase())
 );

 const filteredT = MOCK_TRAVELLERS.filter(t =>
 t.name.toLowerCase().includes(tSearch.toLowerCase()) ||
 t.employeeId.toLowerCase().includes(tSearch.toLowerCase())
 );

 const tabs = [
 { id: 'direct' as BookingContext, label: 'Direct Customer', icon: Users, tag: 'DC' },
 { id: 'subagent' as BookingContext, label: 'Sub-Agent', icon: Building2, tag: 'SA' },
 { id: 'corporate' as BookingContext, label: 'Corporate', icon: Briefcase, tag: 'CA' },
 ];

 return (
 <div className="space-y-3">
 {/* Tab selector */}
 <div className="flex items-center gap-1 bg-light-gray p-1 rounded-xl">
 {tabs.map(tab => (
 <button
 key={tab.id}
 type="button"
 onClick={() => onChange(tab.id)}
 className={cn(
 'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[10px] font-semibold tracking-tight transition-all',
 value === tab.id
 ? 'bg-white text-pure-black shadow-sm'
 : 'text-near-black/40 hover:text-slate-600'
 )}
 >
 <tab.icon size={12} />
 <span className="hidden sm:inline">{tab.label}</span>
 <span className={cn(
 'text-[8px] px-1.5 py-0.5 rounded font-semibold',
 value === tab.id ? 'bg-apple-blue/20 text-apple-blue-dark' : 'bg-slate-200 text-near-black/40'
 )}>
 {tab.tag}
 </span>
 </button>
 ))}
 </div>

 {/* Sub-agent panel */}
 {value === 'subagent' && (
 <div className="bg-light-gray border border-slate-200 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
 <div className="text-[10px] font-semibold text-slate-500">Select Sub-Agent</div>
 <div className="relative">
 <input
 type="text"
 placeholder="Search by name or account no…"
 value={saSearch}
 onFocus={() => setSaDropOpen(true)}
 onChange={e => { setSaSearch(e.target.value); setSaDropOpen(true); }}
 className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20 bg-white"
 />
 <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-near-black/40"/>
 {saDropOpen && (
 <div className="absolute z-50 top-full mt-1 w-full bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
 {filteredSA.map(sa => (
 <button
 key={sa.id}
 type="button"
 className="w-full text-left px-4 py-3 hover:bg-light-gray border-b border-black/5 last:border-0 transition-colors"
 onClick={() => { onSubAgentChange?.(sa); setSaSearch(sa.companyName); setSaDropOpen(false); }}
 >
 <div className="flex justify-between items-start">
 <div>
 <div className="text-xs font-semibold text-pure-black">{sa.companyName}</div>
 <div className="text-[10px] text-near-black/40 font-bold">{sa.accountNo}</div>
 </div>
 <div className="text-right">
 <div className="text-[10px] font-semibold text-apple-blue">{sa.currency} {sa.availableCreditLimit.toLocaleString()}</div>
 <div className="text-[9px] text-near-black/40">Credit Available</div>
 </div>
 </div>
 </button>
 ))}
 </div>
 )}
 </div>

 {selectedSubAgent && (
 <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 animate-in fade-in">
 <div className="grid grid-cols-2 gap-3">
 <div className="bg-apple-blue/10 border border-apple-blue/20 rounded-lg p-3">
 <div className="text-[9px] font-semibold text-apple-blue mb-1 flex items-center gap-1"><CreditCard size={9} /> Credit Limit</div>
 <div className="text-sm font-semibold text-pure-black">{selectedSubAgent.currency} {selectedSubAgent.availableCreditLimit.toLocaleString()}</div>
 </div>
 <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
 <div className="text-[9px] font-semibold text-blue-600 mb-1 flex items-center gap-1"><CreditCard size={9} /> Wallet</div>
 <div className="text-sm font-semibold text-pure-black">{selectedSubAgent.currency} {selectedSubAgent.walletBalance.toLocaleString()}</div>
 </div>
 </div>
 {selectedSubAgent.latestBookings && selectedSubAgent.latestBookings.length > 0 && (
 <div>
 <div className="text-[9px] font-semibold text-near-black/40 mb-2 flex items-center gap-1"><Clock size={9} /> Latest Bookings</div>
 <div className="space-y-1">
 {selectedSubAgent.latestBookings.map(b => (
 <div key={b.ref} className="flex justify-between text-[10px]">
 <span className="font-semibold text-pure-black">{b.ref}</span>
 <span className="text-near-black/40">{b.route} · {b.date}</span>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 )}

 {/* Corporate panel */}
 {value === 'corporate' && (
 <div className="bg-light-gray border border-slate-200 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
 <div className="text-[10px] font-semibold text-slate-500">Select Corporate Traveller</div>
 <div className="relative">
 <input
 type="text"
 placeholder="Search by name or employee ID…"
 value={tSearch}
 onFocus={() => setTDropOpen(true)}
 onChange={e => { setTSearch(e.target.value); setTDropOpen(true); }}
 className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20 bg-white"
 />
 <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-near-black/40"/>
 {tDropOpen && (
 <div className="absolute z-50 top-full mt-1 w-full bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
 {filteredT.map(t => (
 <button
 key={t.id}
 type="button"
 className="w-full text-left px-4 py-3 hover:bg-light-gray border-b border-black/5 last:border-0"
 onClick={() => { onTravellerChange?.(t); setTSearch(t.name); setTDropOpen(false); }}
 >
 <div className="flex justify-between items-start">
 <div>
 <div className="flex items-center gap-2">
 <span className="text-xs font-semibold text-pure-black">{t.name}</span>
 {t.isVIP && <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">VIP</span>}
 {t.isCIP && <span className="text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">CIP</span>}
 </div>
 <div className="text-[10px] text-near-black/40 font-bold">{t.employeeId} · {t.designation}</div>
 </div>
 <div className="text-right">
 <div className="text-[9px] text-slate-500 font-bold">{t.department}</div>
 </div>
 </div>
 </button>
 ))}
 </div>
 )}
 </div>

 {selectedTraveller && (
 <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 animate-in fade-in">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center text-pure-black font-semibold text-sm">
 {selectedTraveller.name.split(' ').map(n => n[0]).join('').slice(0,2)}
 </div>
 <div>
 <div className="flex items-center gap-2">
 <span className="text-sm font-semibold text-pure-black">{selectedTraveller.name}</span>
 {selectedTraveller.isVIP && <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">VIP</span>}
 {selectedTraveller.isCIP && <span className="text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">CIP</span>}
 </div>
 <div className="text-[10px] text-near-black/40">{selectedTraveller.employeeId} · {selectedTraveller.designation}</div>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-2 text-[10px]">
 <div><span className="text-near-black/40">Dept:</span> <span className="font-bold text-slate-700">{selectedTraveller.department}</span></div>
 <div><span className="text-near-black/40">Cost Centre:</span> <span className="font-bold text-slate-700">{selectedTraveller.costCenter}</span></div>
 <div><span className="text-near-black/40">Policy:</span> <span className="font-bold text-slate-700">{selectedTraveller.policy}</span></div>
 <div><span className="text-near-black/40">FOP:</span> <span className="font-bold text-slate-700">{selectedTraveller.formOfPayment}</span></div>
 </div>
 {selectedTraveller.creditLimit && (
 <div className="bg-apple-blue/10 border border-apple-blue/20 rounded-lg p-2 flex justify-between">
 <span className="text-[9px] font-semibold text-apple-blue">Available Credit</span>
 <span className="text-[10px] font-semibold text-pure-black">{selectedTraveller.currency} {selectedTraveller.creditLimit.toLocaleString()}</span>
 </div>
 )}
 {selectedTraveller.lastBookings && selectedTraveller.lastBookings.length > 0 && (
 <div>
 <div className="text-[9px] text-near-black/40 font-semibold mb-1 flex items-center gap-1"><Plane size={9} /> Last Bookings</div>
 {selectedTraveller.lastBookings.map(b => (
 <div key={b.ref} className="text-[10px] flex justify-between">
 <span className="font-semibold text-pure-black">{b.ref}</span>
 <span className="text-near-black/40">{b.route}</span>
 </div>
 ))}
 </div>
 )}
 {/* Policy dropdown */}
 <div>
 <label className="text-[9px] font-semibold text-near-black/40 block mb-1">Travel Policy</label>
 <select className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-navy/20">
 {POLICIES.map(p => (
 <option key={p} value={p} selected={p === selectedTraveller.policy}>{p}</option>
 ))}
 </select>
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 );
}
