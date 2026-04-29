import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Coffee, Clock, Car, CheckSquare, UserPlus, Layers, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiManager, cn, BookingActions, TravellerSelectionModal } from '../../index';
import type { GuestStepData, TravellerProfile } from '../../types';

export function HotelGuestStep({ onNext, onBack }: { onNext: (data: GuestStepData) => void, onBack: () => void }) {
 const { agent } = useApp();

 const { data: inventoryBlocks } = useQuery({
 queryKey: ['inventory-blocks'],
 queryFn: () => apiManager.getInventoryBlocks()
 });

 const availableHotelBlocks = inventoryBlocks?.filter(b => b.type === 'Hotel' && b.status === 'Active' && b.availableQuantity > 0) || [];

 const [selectedInventoryBlock, setSelectedInventoryBlock] = useState<string | null>(null);
 const [activeGuestIndex, setActiveGuestIndex] = useState(0);
 const [isModalOpen, setIsModalOpen] = useState(false);

 const [ancillaries, setAncillaries] = useState({
 earlyCheckIn: false,
 breakfast: false,
 transfer: 'None' as 'None' | 'Private' | 'Group'
 });

 const [travellers, setTravellers] = useState([
 { title: 'Mr', firstName: '', lastName: '', email: agent?.email || '', phone: agent?.phone?.split(' ')[1] || '' }
 ]);

 const handleSelectFromCRM = (traveller: TravellerProfile) => {
 const newTravellers = [...travellers];
 newTravellers[activeGuestIndex] = {
 title: traveller.title,
 firstName: traveller.firstName,
 lastName: traveller.lastName,
 email: traveller.email || agent?.email || '',
 phone: traveller.phone || agent?.phone?.split(' ')[1] || ''
 };
 setTravellers(newTravellers);
 setIsModalOpen(false);
 };

 return (
 <>
 <div className="booking-header animate-fade mb-12 flex justify-between items-end">
 <div>
 <button onClick={onBack} className="text-pure-black text-xs font-semibold hover:underline mb-4 flex items-center gap-2">
 Back to Room Selection
 </button>
 <h1 className="text-2xl font-semibold text-pure-black mb-2 tracking-tight">Guest & Preference Configuration</h1>
 </div>
 </div>

 <div className="space-y-12 animate-slide-up">
 {/* Inventory Selection */}
 {availableHotelBlocks.length > 0 && (
 <div className="card overflow-hidden shadow-sm border-navy/5 bg-light-gray">
 <div className="card-header bg-white border-bottom py-6 px-8 flex justify-between items-center">
 <h2 className="text-xs font-semibold text-pure-black flex items-center gap-2">
 <Layers size={16} /> Advanced Purchase Blockings
 </h2>
 </div>
 <div className="p-8 grid grid-cols-2 gap-6">
 {availableHotelBlocks.map((block) => (
 <button
 key={block.id}
 onClick={() => setSelectedInventoryBlock(selectedInventoryBlock === block.id ? null : block.id)}
 className={cn(
"p-6 rounded-xl border-2 text-left transition-all",
 selectedInventoryBlock === block.id 
 ?"bg-black border-navy text-white shadow-sm"
 :"bg-white border-slate-200 text-pure-black hover:border-navy/30"
 )}
 >
 <div className="font-semibold text-sm mb-2">{block.reference}</div>
 <div className="text-xs">QTY: {block.availableQuantity}</div>
 </button>
 ))}
 </div>
 </div>
 )}

 {/* Ancillaries */}
 <section className="bg-white rounded-xl border border-navy/5 shadow-sm overflow-hidden relative">
 <div className="px-8 py-6 bg-light-gray border-b border-navy/5 flex items-center justify-between">
 <h2 className="text-xs font-semibold text-pure-black">Ancillary Adjustments</h2>
 </div>
 
 <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
 <button 
 onClick={() => setAncillaries({...ancillaries, earlyCheckIn: !ancillaries.earlyCheckIn})}
 className={cn(
"bg-white border rounded-xl p-6 text-left transition-all relative overflow-hidden group",
 ancillaries.earlyCheckIn ?"border-apple-blue bg-apple-blue/5 shadow":"border-black/5 hover:border-apple-blue/30"
 )}
 >
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-3">
 <Clock size={16} className={ancillaries.earlyCheckIn ?"text-apple-blue":"text-pure-black"} />
 <span className="text-[10px] font-semibold">Early Check-In</span>
 </div>
 {ancillaries.earlyCheckIn && <CheckSquare size={14} className="text-apple-blue"/>}
 </div>
 </button>

 <button 
 onClick={() => setAncillaries({...ancillaries, breakfast: !ancillaries.breakfast})}
 className={cn(
"bg-white border rounded-xl p-6 text-left transition-all relative overflow-hidden group",
 ancillaries.breakfast ?"border-apple-blue bg-apple-blue/5 shadow":"border-black/5 hover:border-apple-blue/30"
 )}
 >
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-3">
 <Coffee size={16} className={ancillaries.breakfast ?"text-apple-blue":"text-pure-black"} />
 <span className="text-[10px] font-semibold">Breakfast</span>
 </div>
 {ancillaries.breakfast && <CheckSquare size={14} className="text-apple-blue"/>}
 </div>
 </button>

 <div className="bg-light-gray rounded-xl p-6 flex flex-col justify-between border border-black/5">
 <div className="flex items-center gap-3 mb-4">
 <Car size={16} className="text-pure-black"/>
 <span className="text-[10px] font-semibold">Transfers</span>
 </div>
 <select 
 value={ancillaries.transfer}
 onChange={(e) => setAncillaries({...ancillaries, transfer: e.target.value as 'None' | 'Private' | 'Group'})}
 className="w-full bg-white rounded-xl px-4 py-3 text-xs font-bold border border-slate-200 outline-none"
 >
 <option value="None">None</option>
 <option value="Private">Private</option>
 <option value="Group">Shared</option>
 </select>
 </div>
 </div>
 </section>

 {/* Guests */}
 <section className="bg-white rounded-xl border border-navy/5 shadow-sm overflow-hidden">
 <div className="px-8 py-6 bg-light-gray border-b border-navy/5 flex items-center justify-between">
 <h2 className="text-xs font-semibold text-pure-black">Guest Details</h2>
 <button 
 onClick={() => { setActiveGuestIndex(0); setIsModalOpen(true); }}
 className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-xl text-[10px] font-semibold"
 >
 <UserPlus size={12} /> Sync CRM
 </button>
 </div>
 
 <div className="p-8 space-y-8">
 {travellers.map((t, idx) => (
 <div key={idx} className="space-y-6">
 <div className="grid grid-cols-6 gap-6">
 <div className="col-span-1">
 <label className="text-[9px] font-semibold text-pure-black/50 mb-2 block">Title</label>
 <select 
 className="w-full bg-light-gray border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none"
 value={t.title} 
 onChange={e => { const n = [...travellers]; n[idx].title = e.target.value; setTravellers(n); }}
 >
 <option>Mr</option><option>Mrs</option><option>Ms</option>
 </select>
 </div>
 <div className="col-span-2">
 <label className="text-[9px] font-semibold text-pure-black/50 mb-2 block">First Name</label>
 <input 
 type="text"
 className="w-full bg-light-gray border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none"
 value={t.firstName} 
 onChange={e => { const n = [...travellers]; n[idx].firstName = e.target.value; setTravellers(n); }} 
 />
 </div>
 <div className="col-span-3">
 <label className="text-[9px] font-semibold text-pure-black/50 mb-2 block">Last Name</label>
 <input 
 type="text"
 className="w-full bg-light-gray border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none"
 value={t.lastName} 
 onChange={e => { const n = [...travellers]; n[idx].lastName = e.target.value; setTravellers(n); }} 
 />
 </div>
 </div>
 </div>
 ))}
 </div>
 </section>

 <BookingActions 
 primaryLabel="PROCEED TO CONFIRMATION"
 secondaryLabel="CANCEL"
 onPrimary={() => onNext({ ancillaries, travellers, selectedInventoryBlock })}
 onSecondary={onBack}
 isIssuing={false}
 centerIcon={<MapPin size={24} />}
 transactionPrefix="HTL-G"
 issuanceStep={0}
 issuanceSteps={[]}
 stepLabels={[]}
 />
 </div>

 <TravellerSelectionModal 
 isOpen={isModalOpen}
 onClose={() => setIsModalOpen(false)}
 onSelect={handleSelectFromCRM}
 filterType="Adult"
 />
 </>
 );
}