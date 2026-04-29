import { useDropdown } from '../../hooks/useDropdown';
import { Hotel, ChevronDown } from 'lucide-react';
import { cn } from '../../index';
import { NumberStepper } from './NumberStepper';
import { DropdownTrigger, DropdownPopup, DropdownDoneButton } from './DropdownBase';

interface GuestDropdownProps {
 rooms: number;
 adults: number;
 children: number;
 childAges: number[];
 onChange: (data: { rooms: number; adults: number; children: number; childAges: number[] }) => void;
 className?: string;
}

export function GuestDropdown({ 
 rooms, 
 adults, 
 children, 
 childAges,
 onChange,
 className 
}: GuestDropdownProps) {
 const { isOpen, containerRef, toggle, close } = useDropdown();

 const updateCount = (key: 'rooms' | 'adults' | 'children', delta: number) => {
 const newData = { rooms, adults, children, childAges: [...childAges] };
 const min = key === 'children' ? 0 : 1;
 const max = key === 'rooms' ? 8 : (key === 'adults' ? 12 : 6);
 
 newData[key] = Math.max(min, Math.min(max, newData[key] + delta));
 
 if (key === 'children') {
 if (delta > 0) {
 newData.childAges.push(0);
 } else {
 newData.childAges.pop();
 }
 }
 
 onChange(newData);
 };

 const updateChildAge = (index: number, age: number) => {
 const newAges = [...childAges];
 newAges[index] = age;
 onChange({ rooms, adults, children, childAges: newAges });
 };

 return (
 <div ref={containerRef} className={cn("relative w-full", className)}>
 <DropdownTrigger
 label="Rooms & Guests"
 isOpen={isOpen}
 onClick={toggle}
 icon={<Hotel className="w-4 h-4 text-near-black/40 group-hover:text-slate-600 transition-colors" />}
 displayText={
 <div className="text-sm font-semibold text-slate-900 truncate">
 {rooms} {rooms === 1 ? 'Room' : 'Rooms'}, {adults + children} {adults + children === 1 ? 'Guest' : 'Guests'}
 </div>
 }
 trailingIcon={<ChevronDown className={cn("w-4 h-4 text-near-black/40 transition-transform duration-200", isOpen && "rotate-180")} />}
 />

 <DropdownPopup isOpen={isOpen} className="w-full min-w-[280px] md:w-[320px] max-w-[95vw]">
 <div className="max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
 <div className="space-y-6 pb-2">
 <NumberStepper
 label="Rooms"
 value={rooms}
 min={1}
 max={8}
 onDecrement={() => updateCount('rooms', -1)}
 onIncrement={() => updateCount('rooms', 1)}
 />

 <NumberStepper
 label="Adults"
 value={adults}
 min={1}
 max={12}
 onDecrement={() => updateCount('adults', -1)}
 onIncrement={() => updateCount('adults', 1)}
 />

 <NumberStepper
 label="Children"
 value={children}
 min={0}
 max={6}
 onDecrement={() => updateCount('children', -1)}
 onIncrement={() => updateCount('children', 1)}
 />

 {children > 0 && (
 <div className="pt-6 border-t border-black/5 space-y-4">
 {childAges.map((age, index) => (
 <div key={index} className="flex items-center justify-between">
 <span className="text-xs font-bold text-slate-600">Age of child {index + 1}</span>
 <select
 value={age}
 onChange={(e) => updateChildAge(index, parseInt(e.target.value))}
 className="bg-white border-2 border-black/5 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-orange-500 transition-all"
 >
 {Array.from({ length: 18 }, (_, i) => i).map(a => (
 <option key={a} value={a}>{a}</option>
 ))}
 </select>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 
 <DropdownDoneButton onClick={close} />
 </DropdownPopup>
 </div>
 );
}
