import { useState, useRef } from 'react';
import { useDropdown } from '../../hooks/useDropdown';
import { MapPin, Plane, Building2, Flag, Search, CornerDownRight, ChevronDown, Check } from 'lucide-react';
import { DropdownTrigger, DropdownPopup } from './DropdownBase';
import { cn } from '../../index';

type LocationType = 'City' | 'Airport' | 'Landmark' | 'Region';

export interface LocationItem {
 id: string;
 name: string;
 subtext: string;
 type: LocationType;
 code?: string;
 country?: string;
 parentId?: string;
}

interface LocationDropdownProps {
 label: string;
 placeholder?: string;
 value: string;
 onChange: (value: string, code?: string) => void;
 items: LocationItem[];
 mode: 'flight' | 'hotel';
 className?: string;
}

export function LocationDropdown({ 
 label, 
 placeholder, 
 value, 
 onChange, 
 items, 
 mode,
 className 
}: LocationDropdownProps) {
 const { isOpen, containerRef, open, close } = useDropdown();
 const [search, setSearch] = useState('');
 const inputRef = useRef<HTMLInputElement>(null);

 const filteredItems = items.filter(item => 
 item.name.toLowerCase().includes(search.toLowerCase()) || 
 item.subtext.toLowerCase().includes(search.toLowerCase()) ||
 (item.code && item.code.toLowerCase().includes(search.toLowerCase()))
 );

 const selectedItem = items.find(i => i.id === value || i.code === value);

 const renderIcon = (type: LocationType, isChild?: boolean) => {
 if (isChild) return <CornerDownRight className="w-4 h-4 text-near-black/40"/>;
 
 switch (type) {
 case 'Airport': return <Plane className="w-4 h-4"/>;
 case 'City': return <MapPin className="w-4 h-4"/>;
 case 'Landmark': return <Building2 className="w-4 h-4"/>;
 case 'Region': return <Flag className="w-4 h-4"/>;
 default: return <MapPin className="w-4 h-4"/>;
 }
 };

 const handleTriggerClick = () => {
 open();
 setTimeout(() => inputRef.current?.focus(), 0);
 };

 return (
 <div ref={containerRef} className={cn("relative w-full", className)}>
 <DropdownTrigger
 label={label}
 isOpen={isOpen}
 onClick={handleTriggerClick}
 icon={<Search className="w-4 h-4 text-near-black/40 group-hover:text-slate-600 transition-colors" />}
 displayText={
 isOpen ? (
 <input
 ref={inputRef}
 type="text"
 className="w-full bg-transparent outline-none text-sm font-semibold text-slate-900 placeholder:text-near-black/40"
 placeholder={placeholder || "Search location..."}
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 />
 ) : (
 <div className="text-sm font-semibold text-slate-900 truncate">
 {selectedItem ? (
 <div className="flex items-center gap-2">
 <span>{selectedItem.name}</span>
 {selectedItem.code && <span className="text-[10px] bg-light-gray px-1.5 py-0.5 rounded text-slate-500 font-bold">{selectedItem.code}</span>}
 </div>
 ) : (
 <span className="text-near-black/40 font-medium">Select location</span>
 )}
 </div>
 )
 }
 trailingIcon={!isOpen ? <Search className="w-4 h-4 text-near-black/40 group-hover:text-slate-600 transition-colors"/> : undefined}
 />

 <DropdownPopup isOpen={isOpen} className="left-0 right-0 p-0 overflow-hidden">
 <div className="max-h-[400px] overflow-y-auto py-2 custom-scrollbar">
 {filteredItems.length > 0 ? (
 filteredItems.map((item) => {
 const isSelected = item.id === value || item.code === value;
 const isChild = !!item.parentId;

 return (
 <div
 key={item.id}
 onClick={() => {
 onChange(item.id, item.code);
 close();
 setSearch('');
 }}
 className={cn(
 "flex items-center justify-between px-4 py-3 cursor-pointer transition-colors group",
 isSelected ? "bg-light-gray" : "hover:bg-light-gray"
 )}
 >
 <div className="flex items-center gap-4">
 <div className={cn(
 "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0",
 isSelected ? "bg-orange-100 text-orange-600" : "bg-light-gray text-slate-500 group-hover:bg-slate-200"
 )}>
 {renderIcon(item.type, isChild)}
 </div>
 <div className="flex flex-col">
 <div className="flex items-center gap-2">
 <span className={cn(
 "text-sm font-bold",
 isSelected ? "text-slate-900" : "text-slate-700"
 )}>
 {item.name}
 </span>
 {item.code && (
 <span className="text-[10px] font-semibold text-near-black/40">
 {item.code}
 </span>
 )}
 </div>
 <span className="text-[11px] text-near-black/40 font-medium">
 {item.subtext}
 </span>
 </div>
 </div>
 
 {mode === 'flight' ? (
 <div className={cn(
 "w-5 h-5 rounded border-2 transition-all flex items-center justify-center",
 isSelected ? "bg-orange-500 border-orange-500" : "border-slate-200"
 )}>
 {isSelected && <div className="w-2 h-2 rounded-full bg-white"/>}
 </div>
 ) : (
 isSelected && <div className="w-1.5 h-1.5 rounded-full bg-orange-500"/>
 )}
 </div>
 );
 })
 ) : (
 <div className="px-4 py-8 text-center">
 <div className="w-12 h-12 bg-light-gray rounded-full flex items-center justify-center mx-auto mb-3">
 <Search className="w-6 h-6 text-slate-300"/>
 </div>
 <p className="text-sm font-medium text-near-black/40">No results found for "{search}"</p>
 </div>
 )}
 </div>
 </DropdownPopup>
 </div>
 );
}
