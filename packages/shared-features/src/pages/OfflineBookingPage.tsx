import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useQuery } from '@tanstack/react-query';
import { useApp } from '../context/AppContext';
import { 
 Plane, 
 Plus, 
 Calculator,
 Briefcase,
 Layers,
 Percent,
 ShieldCheck,
 Zap,
 Hotel,
 FileText,
 MoreHorizontal,
 Shield,
 ChevronDown,
 Trash2,
 RefreshCcw,
 TrendingUp,
 Globe
} from 'lucide-react';
import { cn, useTenant, apiManager, AirportSelect } from '../index';

const CURRENCIES = [
 { code: 'BHD', rate: 1, symbol: 'BD', name: 'Bahraini Dinar' },
 { code: 'USD', rate: 2.65, symbol: '$', name: 'US Dollar' },
 { code: 'EUR', rate: 2.45, symbol: '€', name: 'Euro' },
 { code: 'SAR', rate: 9.95, symbol: 'SR', name: 'Saudi Riyal' },
 { code: 'GBP', rate: 2.10, symbol: '£', name: 'British Pound' },
];

type TabType = 'itinerary' | 'customer-costing' | 'supplier-costing';

export default function OfflineBookingPage() {
 const navigate = useNavigate();
 const { tenant } = useTenant();
 const { addNotification, agent } = useApp();
 const [activeTab, setActiveTab] = useState<TabType>('itinerary');
 const [isSubmitted, setIsSubmitted] = useState(false);
 const [isSubmitting, setIsSubmitting] = useState(false);

 const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES.find(c => c.code === tenant.currency) || CURRENCIES[0]);
 
 const { data: inventoryBlocks } = useQuery({
 queryKey: ['inventory-blocks'],
 queryFn: () => apiManager.getInventoryBlocks()
 });

 const [selectedInventoryBlockId, setSelectedInventoryBlockId] = useState<string | null>(null);
 const [serviceType, setServiceType] = useState<'Flight' | 'Hotel' | 'Visa' | 'Other'>('Flight');
 
 const [formData, setFormData] = useState({
 from: 'BAH',
 to: 'DXB',
 departDate: new Date().toISOString().split('T')[0],
 returnDate: '',
 travelClass: 'Economy',
 airlinePreference: '',
 flightNo: '',
 contactPhone: '',
 contactEmail: agent.email || '',
 remark: ''
 });

 const [passengers, setPassengers] = useState([
 { id: 1, title: 'Mr', firstName: '', lastName: '', dob: '', passportNumber: '' }
 ]);

 const [costingMode, setCostingMode] = useState<'per-pax' | 'total'>('per-pax');
 const [, setIsSyncingRate] = useState(false);
 const paxCount = passengers.length;

 const [customerCosting, setCustomerCosting] = useState({
 baseFare: 0,
 taxesYQ: 0,
 otherTaxes: 0,
 serviceFee: 0,
 vat: 0,
 });

 const [supplierCosting, setSupplierCosting] = useState({
 supplierName: '',
 pnr: '',
 baseFare: 0,
 taxes: 0,
 otherFees: 0,
 });

 const calculatedCustomerTotal = useMemo(() => {
 const subtotal = customerCosting.baseFare + customerCosting.taxesYQ + customerCosting.otherTaxes + customerCosting.serviceFee + customerCosting.vat;
 const total = costingMode === 'per-pax' ? subtotal * paxCount : subtotal;
 return total / selectedCurrency.rate;
 }, [customerCosting, costingMode, paxCount, selectedCurrency.rate]);

 const calculatedSupplierTotal = useMemo(() => {
 const subtotal = supplierCosting.baseFare + supplierCosting.taxes + supplierCosting.otherFees;
 const total = costingMode === 'per-pax' ? subtotal * paxCount : subtotal;
 return total / selectedCurrency.rate;
 }, [supplierCosting, costingMode, paxCount, selectedCurrency.rate]);

 const totalMarkup = calculatedCustomerTotal - calculatedSupplierTotal;

 const handleCurrencyChange = async (currencyCode: string) => {
 const newCurrency = CURRENCIES.find(c => c.code === currencyCode);
 if (!newCurrency) return;
 setIsSyncingRate(true);
 await new Promise(resolve => setTimeout(resolve, 1500));
 setSelectedCurrency(newCurrency);
 setIsSyncingRate(false);
 addNotification({ title: 'Currency Updated', message: `Base currency switched to ${newCurrency.code}.`, type: 'success' });
 };

 const addPassenger = () => setPassengers([...passengers, { id: Date.now(), title: 'Mr', firstName: '', lastName: '', dob: '', passportNumber: '' }]);
 const removePassenger = (id: number) => { if (passengers.length > 1) setPassengers(passengers.filter(p => p.id !== id)); };

 const handleSubmit = async () => {
 if (!formData.from || !formData.to || !passengers[0].firstName) {
 addNotification({ title: 'Validation Failed', message: 'Required fields missing.', type: 'error' });
 return;
 }
 setIsSubmitting(true);
 try {
 const reference = `TA-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
 const bookingData = {
 referenceNo: reference,
 service: serviceType,
 type: 'Offline',
 amount: calculatedCustomerTotal,
 netFare: calculatedSupplierTotal,
 markup: totalMarkup,
 passengerName: `${passengers[0].firstName} ${passengers[0].lastName}`,
 currency: tenant.currency || 'BHD',
 status: 'Confirmed',
 travelDate: formData.departDate,
 route: `${formData.from} → ${formData.to}`,
 subUser: agent.agencyName,
 inventoryBlockId: selectedInventoryBlockId,
 remarks: `Supplier: ${supplierCosting.supplierName} | PNR: ${supplierCosting.pnr} | ${formData.remark}`,
 passengers
 };
 const result = await apiManager.post('/tenant/bookings', bookingData) as { id: string };
 addNotification({ title: 'Order Created', message: `Booking ${reference} successfully recorded.`, type: 'success' });
 setIsSubmitted(true);
 setTimeout(() => navigate(`/flight/itinerary/${result.id}`), 2500);
 } catch {
 addNotification({ title: 'System Error', message: 'Failed to record booking.', type: 'error' });
 } finally {
 setIsSubmitting(false);
 }
 };

 if (isSubmitted) {
 return (
 <Layout>
 <div className="max-w-xl mx-auto py-48 text-center space-y-8 animate-fade-in px-8">
 <div className="w-24 h-24 bg-pure-black rounded-xl mx-auto flex items-center justify-center text-white shadow-apple animate-bounce">
 <ShieldCheck size={48} />
 </div>
 <div className="space-y-4">
 <h2 className="text-[32px] font-display font-bold text-pure-black">Order Recorded</h2>
 <p className="text-[16px] font-text text-black/40">The manual booking is being synchronized with the global ledger. Redirecting you to the itinerary...</p>
 </div>
 <div className="pt-4">
 <div className="inline-flex items-center gap-2 px-4 py-2 bg-light-gray rounded-full border border-black/5">
 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
 <span className="text-[12px] font-text font-medium text-black/50 tracking-tight">Success System Sync</span>
 </div>
 </div>
 </div>
 </Layout>
 );
 }

 return (
 <Layout>
 <div className="animate-fade-in space-y-8 px-6 lg:px-12 pb-24 max-w-[1600px] mx-auto">
 
 {/* Header */}
 <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 border-b border-black/5 pb-10">
 <div className="space-y-4">
 <h1 className="text-4xl lg:text-[52px] font-display font-semibold text-pure-black leading-tight flex items-center gap-4">
 <div className="w-14 h-14 bg-light-gray text-pure-black rounded-xl flex items-center justify-center shadow-sm">
 <Briefcase size={28} />
 </div>
 Create Offline Order
 </h1>
 <div className="flex items-center gap-3">
 <span className="text-[14px] font-text text-black/50">Establish a manual booking record in the agency ecosystem.</span>
 <span className="text-[12px] font-text font-medium text-apple-blue flex items-center gap-2 px-3 py-1.5 bg-apple-blue/10 rounded-full border border-apple-blue/20">
 <Zap size={14} /> New Workflow
 </span>
 </div>
 </div>
 
 <div className="flex items-center gap-4">
 <button 
 onClick={handleSubmit}
 disabled={isSubmitting}
 className="px-10 py-3 bg-pure-black text-white rounded-xl text-[15px] font-text font-semibold hover:bg-black/90 transition-all shadow-lg flex items-center gap-3 disabled:opacity-30"
 >
 {isSubmitting ? <RefreshCcw size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
 Commit Booking
 </button>
 </div>
 </div>

 <div className="flex flex-col xl:flex-row gap-12 items-start">
 {/* Sidebar Tabs */}
 <aside className="w-full xl:w-80 shrink-0 sticky top-12 space-y-4">
 {([
 { id: 'itinerary', label: 'Itinerary Details', icon: Plane },
 { id: 'customer-costing', label: 'Customer Costing', icon: Calculator },
 { id: 'supplier-costing', label: 'Supplier Setup', icon: Layers }
 ] as const).map((tab) => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={cn(
 "w-full flex items-center gap-4 p-5 rounded-xl transition-all border",
 activeTab === tab.id ? "bg-pure-black text-white border-transparent shadow-apple" : "bg-white text-black/40 border-black/5 hover:border-black/10 hover:bg-light-gray"
 )}
 >
 <div className={cn(
 "w-10 h-10 rounded-[12px] flex items-center justify-center transition-colors",
 activeTab === tab.id ? "bg-white/10 text-apple-blue" : "bg-light-gray text-black/30"
 )}>
 <tab.icon size={20} />
 </div>
 <div className="text-left leading-tight">
 <div className="text-[14px] font-text font-bold">{tab.label}</div>
 <div className="text-[11px] font-text opacity-50">{activeTab === tab.id ? 'Currently Editing' : 'Pending Review'}</div>
 </div>
 </button>
 ))}
 
 <div className="mt-8 p-6 bg-light-gray rounded-xl border border-black/5 space-y-4">
 <div className="flex items-center gap-2 text-[12px] font-text font-bold text-black/30 tracking-tight">
 <TrendingUp size={14} /> Resulting Yield
 </div>
 <div className="space-y-1">
 <div className="text-[28px] font-display font-bold text-pure-black tabular-nums">
 {tenant.currency} {totalMarkup.toLocaleString(undefined, { minimumFractionDigits: 0 })}
 </div>
 <div className="text-[12px] font-text text-black/40">Total Estimated Markup</div>
 </div>
 </div>
 </aside>

 {/* Main Content */}
 <div className="flex-1 w-full space-y-8 min-w-0">
 {activeTab === 'itinerary' && (
 <div className="space-y-8">
 {/* Service Type */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {(['Flight', 'Hotel', 'Visa', 'Other'] as const).map(type => (
 <button
 key={type}
 onClick={() => setServiceType(type)}
 className={cn(
 "p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3",
 serviceType === type ? "bg-white border-apple-blue shadow-lg scale-105" : "bg-light-gray/50 border-transparent hover:border-black/5"
 )}
 >
 <div className={cn(
 "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
 serviceType === type ? "bg-apple-blue text-white" : "bg-white text-black/20"
 )}>
 {type === 'Flight' && <Plane size={24} />}
 {type === 'Hotel' && <Hotel size={24} />}
 {type === 'Visa' && <FileText size={24} />}
 {type === 'Other' && <MoreHorizontal size={24} />}
 </div>
 <span className={cn("text-[14px] font-text font-bold", serviceType === type ? "text-pure-black" : "text-black/30")}>{type}</span>
 </button>
 ))}
 </div>

 {/* Inventory Section */}
 <div className="bg-pure-black p-10 rounded-xl text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
 <div className="absolute top-0 right-0 p-24 opacity-5 rotate-12 pointer-events-none">
 <Layers size={200} />
 </div>
 <div className="space-y-4 relative z-10 w-full md:w-auto">
 <div className="flex items-center gap-3">
 <ShieldCheck size={20} className="text-apple-blue" />
 <h3 className="text-[18px] font-display font-semibold">Inventory Control</h3>
 </div>
 <div className="flex flex-wrap gap-4">
 <button 
 onClick={() => setSelectedInventoryBlockId(null)}
 className={cn(
 "px-6 py-2.5 rounded-full text-[13px] font-text font-medium border transition-all",
 !selectedInventoryBlockId ? "bg-white text-pure-black border-transparent" : "bg-white/10 text-white/50 border-white/5"
 )}
 >Live Market System</button>
 <div className="relative group">
 <select 
 value={selectedInventoryBlockId || ''}
 onChange={(e) => setSelectedInventoryBlockId(e.target.value || null)}
 className={cn(
 "pl-6 pr-10 py-2.5 rounded-full text-[13px] font-text font-medium border transition-all appearance-none outline-none",
 selectedInventoryBlockId ? "bg-apple-blue text-pure-black border-transparent" : "bg-white/10 text-white/50 border-white/5"
 )}
 >
 <option value="" className="text-pure-black">Pre-Paid Inventory Blocks</option>
 {inventoryBlocks?.filter(b => b.status === 'Active').map(block => (
 <option key={block.id} value={block.id} className="text-pure-black">{block.title}</option>
 ))}
 </select>
 <ChevronDown size={14} className={cn("absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none", selectedInventoryBlockId ? "text-pure-black" : "text-white/30")} />
 </div>
 </div>
 </div>
 </div>

 {/* Itinerary Form */}
 <div className="bg-white border border-black/5 rounded-xl p-8 lg:p-12 space-y-10 shadow-sm">
 <div className="flex items-center gap-3">
 <div className="w-1.5 h-6 bg-apple-blue rounded-full" />
 <h3 className="text-[20px] font-display font-bold text-pure-black">Route & Schedule</h3>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
 <div className="space-y-4">
 <label className="text-[13px] font-text font-semibold text-pure-black ml-1">Departure Point</label>
 <AirportSelect value={formData.from} onChange={(v: string) => setFormData({...formData, from: v})} label="" />
 </div>
 <div className="space-y-4">
 <label className="text-[13px] font-text font-semibold text-pure-black ml-1">Destination Branch</label>
 <AirportSelect value={formData.to} onChange={(v: string) => setFormData({...formData, to: v})} label="" />
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
 <div className="space-y-2">
 <label className="text-[13px] font-text font-semibold text-pure-black ml-1">Departure Date</label>
 <input 
 type="date"
 value={formData.departDate}
 onChange={(e) => setFormData({...formData, departDate: e.target.value})}
 className="w-full bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/5 border-transparent focus:border-apple-blue rounded-xl px-6 py-3 text-[14px] font-text outline-none transition-all"
 />
 </div>
 <div className="space-y-2">
 <label className="text-[13px] font-text font-semibold text-pure-black ml-1">Travel Class</label>
 <div className="relative group">
 <select 
 value={formData.travelClass}
 onChange={(e) => setFormData({...formData, travelClass: e.target.value})}
 className="w-full bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/5 border-transparent focus:border-apple-blue rounded-xl px-6 py-3 text-[14px] font-text outline-none appearance-none transition-all cursor-pointer"
 >
 <option>Economy</option>
 <option>Premium Economy</option>
 <option>Business</option>
 <option>First Class</option>
 </select>
 <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-black/20 pointer-events-none" />
 </div>
 </div>
 </div>
 </div>

 {/* Passengers */}
 <div className="bg-white border border-black/5 rounded-xl p-8 lg:p-12 space-y-10 shadow-sm">
 <div className="flex justify-between items-center">
 <div className="flex items-center gap-3">
 <div className="w-1.5 h-6 bg-pure-black rounded-full" />
 <h3 className="text-[20px] font-display font-bold text-pure-black">Passenger Profiles</h3>
 </div>
 <button onClick={addPassenger} className="text-[13px] font-text font-bold text-apple-blue flex items-center gap-2 hover:underline">
 <Plus size={16} /> Add Profile
 </button>
 </div>

 <div className="space-y-6">
 {passengers.map((p, idx) => (
 <div key={p.id} className="p-8 bg-light-gray/30 border border-black/5 rounded-xl group hover:bg-white transition-colors">
 <div className="flex justify-between items-start mb-6">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 bg-pure-black text-white rounded-[10px] flex items-center justify-center text-[12px] font-bold">{idx + 1}</div>
 <span className="text-[14px] font-text font-bold text-pure-black">Passenger Record</span>
 </div>
 {idx > 0 && (
 <button onClick={() => removePassenger(p.id)} className="text-red-400 hover:text-red-600 transition-colors">
 <Trash2 size={18} />
 </button>
 )}
 </div>
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <div className="space-y-1">
 <label className="text-[11px] font-text font-bold text-black/30 tracking-tight ml-1">Title</label>
 <select className="w-full bg-white border border-black/5 rounded-[12px] px-4 py-2.5 text-[14px] outline-none">
 <option>Mr</option><option>Mrs</option><option>Ms</option>
 </select>
 </div>
 <div className="md:col-span-1 space-y-1">
 <label className="text-[11px] font-text font-bold text-black/30 tracking-tight ml-1">First Name</label>
 <input 
 type="text"
 value={p.firstName}
 onChange={(e) => { const n=[...passengers]; n[idx].firstName=e.target.value; setPassengers(n); }}
 className="w-full bg-white border border-black/5 rounded-[12px] px-4 py-2.5 text-[14px] outline-none"
 placeholder="Lead Given"
 />
 </div>
 <div className="space-y-1">
 <label className="text-[11px] font-text font-bold text-black/30 tracking-tight ml-1">Last Name</label>
 <input 
 type="text"
 value={p.lastName}
 onChange={(e) => { const n=[...passengers]; n[idx].lastName=e.target.value; setPassengers(n); }}
 className="w-full bg-white border border-black/5 rounded-[12px] px-4 py-2.5 text-[14px] outline-none"
 placeholder="SURNAME"
 />
 </div>
 <div className="space-y-1">
 <label className="text-[11px] font-text font-bold text-black/30 tracking-tight ml-1">Passport No</label>
 <input 
 type="text"
 value={p.passportNumber}
 onChange={(e) => { const n=[...passengers]; n[idx].passportNumber=e.target.value; setPassengers(n); }}
 className="w-full bg-white border border-black/5 rounded-[12px] px-4 py-2.5 text-[14px] outline-none"
 placeholder="SHARD-ID"
 />
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 {activeTab === 'customer-costing' && (
 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
 <div className="flex justify-end gap-2 bg-light-gray p-1 rounded-full w-fit ml-auto border border-black/5">
 {(['per-pax', 'total'] as const).map(mode => (
 <button
 key={mode}
 onClick={() => setCostingMode(mode)}
 className={cn(
 "px-8 py-2 rounded-full text-[12px] font-text font-bold transition-all",
 costingMode === mode ? "bg-pure-black text-white shadow-sm" : "text-black/30"
 )}
 >
 {mode === 'per-pax' ? 'Per Unit' : 'Total Aggregate'}
 </button>
 ))}
 </div>

 <div className="bg-white border border-black/5 rounded-xl p-10 lg:p-14 space-y-12 shadow-sm">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
 <div>
 <h3 className="text-[24px] font-display font-bold text-pure-black">Financial Calibration</h3>
 <p className="text-[14px] font-text text-black/40">Set the customer-facing settlement values.</p>
 </div>
 <div className="bg-light-gray rounded-xl p-4 flex items-center gap-4 border border-black/5 min-w-[240px]">
 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-apple-blue shadow-sm">
 <Globe size={20} />
 </div>
 <div className="flex-1">
 <p className="text-[11px] font-text text-black/40 tracking-tight leading-none mb-1">Currency Sync</p>
 <select 
 value={selectedCurrency.code}
 onChange={(e) => handleCurrencyChange(e.target.value)}
 className="bg-transparent text-[14px] font-text font-bold text-pure-black outline-none w-full"
 >
 {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.symbol}</option>)}
 </select>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-14 gap-y-10">
 <div className="space-y-4">
 <label className="text-[14px] font-text font-bold text-pure-black ml-1">Base Component ({selectedCurrency.code})</label>
 <input 
 type="number"
 value={customerCosting.baseFare}
 onChange={(e) => setCustomerCosting({...customerCosting, baseFare: Number(e.target.value)})}
 className="w-full bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/5 border-transparent focus:border-apple-blue rounded-xl px-8 py-4 text-[24px] font-display font-bold text-pure-black outline-none transition-all tabular-nums"
 />
 </div>
 <div className="space-y-4">
 <label className="text-[14px] font-text font-bold text-apple-blue ml-1 flex items-center gap-2">
 <TrendingUp size={16} /> Agency Service Fee
 </label>
 <input 
 type="number"
 value={customerCosting.serviceFee}
 onChange={(e) => setCustomerCosting({...customerCosting, serviceFee: Number(e.target.value)})}
 className="w-full bg-apple-blue/10 focus:bg-white focus:ring-4 focus:ring-apple-blue/5 border-transparent focus:border-apple-blue rounded-xl px-8 py-4 text-[24px] font-display font-bold text-pure-black outline-none transition-all tabular-nums"
 />
 </div>
 <div className="grid grid-cols-2 gap-6">
 <div className="space-y-2">
 <label className="text-[12px] font-text font-bold text-black/30 tracking-tight ml-1">Taxes (YQ)</label>
 <input type="number" className="w-full bg-light-gray rounded-xl px-4 py-3 text-[16px] font-bold" value={customerCosting.taxesYQ} onChange={(e) => setCustomerCosting({...customerCosting, taxesYQ: Number(e.target.value)})} />
 </div>
 <div className="space-y-2">
 <label className="text-[12px] font-text font-bold text-black/30 tracking-tight ml-1">Other Sync</label>
 <input type="number" className="w-full bg-light-gray rounded-xl px-4 py-3 text-[16px] font-bold" value={customerCosting.otherTaxes} onChange={(e) => setCustomerCosting({...customerCosting, otherTaxes: Number(e.target.value)})} />
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-[12px] font-text font-bold text-black/30 tracking-tight ml-1">VAT Injection (%)</label>
 <div className="relative">
 <input type="number" className="w-full bg-light-gray rounded-xl px-4 py-3 text-[16px] font-bold" value={customerCosting.vat} onChange={(e) => setCustomerCosting({...customerCosting, vat: Number(e.target.value)})} />
 <Percent size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-black/20" />
 </div>
 </div>
 </div>

 <div className="bg-pure-black rounded-xl p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-apple border border-white/5 relative overflow-hidden">
 <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none -mr-4 -mt-4">
 <Calculator size={100} />
 </div>
 <div className="space-y-1 relative z-10 w-full md:w-auto">
 <p className="text-[12px] font-text font-bold text-apple-blue tracking-tight leading-none">Net Customer Settlement</p>
 <h4 className="text-[14px] font-text text-white/40">Consolidated value across all nodes</h4>
 </div>
 <div className="text-right relative z-10 w-full md:w-auto">
 <span className="text-[18px] font-display font-medium text-white/40 mr-4">{selectedCurrency.code}</span>
 <span className="text-[48px] font-display font-bold text-white tabular-nums leading-none">
 {calculatedCustomerTotal.toLocaleString(undefined, { minimumFractionDigits: 0 })}
 </span>
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'supplier-costing' && (
 <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8">
 <div className="bg-white border border-black/5 rounded-xl p-10 lg:p-14 space-y-12 shadow-sm">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
 <div>
 <h3 className="text-[24px] font-display font-bold text-pure-black">Supplier Sourcing</h3>
 <p className="text-[14px] font-text text-black/40">Register the purchasing cost for revenue tracking.</p>
 </div>
 <div className="flex items-center gap-2 px-4 py-2 bg-apple-blue/10 text-apple-blue text-[11px] font-text font-bold rounded-full border border-apple-blue/20 tracking-tight">
 <Shield size={14} /> Fiscal Security Active
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
 <div className="space-y-2">
 <label className="text-[13px] font-text font-semibold text-pure-black ml-1">Supplier Name</label>
 <input 
 type="text"
 value={supplierCosting.supplierName}
 onChange={(e) => setSupplierCosting({...supplierCosting, supplierName: e.target.value})}
 className="w-full bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/5 border-transparent focus:border-apple-blue rounded-xl px-6 py-3 text-[14px] font-text outline-none transition-all"
 placeholder="Market Provider"
 />
 </div>
 <div className="space-y-2">
 <label className="text-[13px] font-text font-semibold text-pure-black ml-1">Record PNR / Ref</label>
 <input 
 type="text"
 value={supplierCosting.pnr}
 onChange={(e) => setSupplierCosting({...supplierCosting, pnr: e.target.value})}
 className="w-full bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/5 border-transparent focus:border-apple-blue rounded-xl px-6 py-3 text-[14px] font-text outline-none transition-all"
 placeholder="Source Reference"
 />
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
 <div className="space-y-2">
 <label className="text-[11px] font-text font-bold text-black/30 tracking-tight ml-1">Net Base Cost</label>
 <input type="number" className="w-full bg-light-gray rounded-xl px-6 py-4 text-[20px] font-bold" value={supplierCosting.baseFare} onChange={(e) => setSupplierCosting({...supplierCosting, baseFare: Number(e.target.value)})} />
 </div>
 <div className="space-y-2">
 <label className="text-[11px] font-text font-bold text-black/30 tracking-tight ml-1">Source Taxes</label>
 <input type="number" className="w-full bg-light-gray rounded-xl px-6 py-4 text-[20px] font-bold" value={supplierCosting.taxes} onChange={(e) => setSupplierCosting({...supplierCosting, taxes: Number(e.target.value)})} />
 </div>
 <div className="space-y-2">
 <label className="text-[11px] font-text font-bold text-black/30 tracking-tight ml-1">Ancillary Fees</label>
 <input type="number" className="w-full bg-light-gray rounded-xl px-6 py-4 text-[20px] font-bold" value={supplierCosting.otherFees} onChange={(e) => setSupplierCosting({...supplierCosting, otherFees: Number(e.target.value)})} />
 </div>
 </div>

 <div className="bg-light-gray/50 rounded-xl p-10 flex flex-col md:flex-row items-center justify-between gap-6 border border-black/5">
 <div className="space-y-1">
 <p className="text-[12px] font-text font-bold text-black/30 tracking-tight leading-none">Purchase Valuation</p>
 <h4 className="text-[14px] font-text text-black/40">Accumulated cost in {selectedCurrency.code}</h4>
 </div>
 <div className="text-right">
 <span className="text-[18px] font-display font-medium text-black/20 mr-4">{selectedCurrency.code}</span>
 <span className="text-[40px] font-display font-bold text-pure-black tabular-nums leading-none">
 {calculatedSupplierTotal.toLocaleString(undefined, { minimumFractionDigits: 0 })}
 </span>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 </Layout>
 );
}
