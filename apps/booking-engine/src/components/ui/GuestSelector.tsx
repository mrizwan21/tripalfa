import React, { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Minus, Plus, ChevronDown } from 'lucide-react';
import { Label } from './label';
import { Button } from './button';

export function GuestSelector() {
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [childAges, setChildAges] = useState<number[]>([]);
  const [open, setOpen] = useState(false);

  const updateChildren = (delta: number) => {
    const newCount = Math.max(0, children + delta);
    setChildren(newCount);
    if (delta > 0) {
      setChildAges(prev => [...prev, 0]); // Default age 0
    } else {
      setChildAges(prev => prev.slice(0, -1));
    }
  };

  const updateAge = (index: number, age: number) => {
    const newAges = [...childAges];
    newAges[index] = age;
    setChildAges(newAges);
  };

  const displayText = `${adults} Adults · ${children} Children · ${rooms} Room`;

  return (
    <div className="overflow-visible [&_*]:overflow-visible">
      {/* Hidden selects for E2E testing */}
      <select
        data-testid="hotel-adults"
        className="hidden"
        value={adults}
        onChange={e => setAdults(parseInt(e.target.value))}
      >
        {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
          <option key={num} value={num}>
            {num}
          </option>
        ))}
      </select>
      <select
        data-testid="hotel-rooms"
        className="hidden"
        value={rooms}
        onChange={e => setRooms(parseInt(e.target.value))}
      >
        {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
          <option key={num} value={num}>
            {num}
          </option>
        ))}
      </select>
      <Popover.Root open={open} onOpenChange={setOpen}>
        {/* @ts-ignore - Radix UI / React 19 type mismatch */}
        <Popover.Trigger asChild>
          <div className="w-full h-full relative group cursor-pointer">
            <Button
              variant="outline"
              className="w-full h-full flex items-center justify-between gap-2 bg-card px-4 rounded-xl border-2 border-border hover:border-border/80 focus:border-[hsl(var(--primary))] text-left transition-all"
            >
              <span className="flex-1 text-gray-800 font-bold text-sm truncate gap-4">
                {displayText}
              </span>
              <ChevronDown size={16} className="text-gray-400 shrink-0" />
            </Button>
          </div>
        </Popover.Trigger>
        <Popover.Content
          className="w-80 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50 animate-in fade-in-0 zoom-in-95 overflow-y-auto max-h-[80vh]"
          sideOffset={8}
          align="center"
        >
          {/* Adults */}
          <div className="flex justify-between items-center mb-6 gap-4">
            <div>
              <div className="font-bold text-gray-900">Adult</div>
              <div className="text-xs text-gray-500">Age 18+</div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAdults(Math.max(1, adults - 1))}
                className="w-10 h-10 border rounded flex items-center justify-center text-gray-600 hover:border-blue-600 hover:text-blue-600 gap-2"
              >
                <Minus size={16} />
              </Button>
              <span className="w-4 text-center font-bold">{adults}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAdults(adults + 1)}
                className="w-10 h-10 border rounded flex items-center justify-center text-blue-600 border-blue-600 bg-blue-50 hover:bg-blue-100 gap-2"
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>

          {/* Children */}
          <div className="flex justify-between items-center mb-6 gap-4">
            <div>
              <div className="font-bold text-gray-900">Children</div>
              <div className="text-xs text-gray-500">Age 0-17</div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateChildren(-1)}
                disabled={children === 0}
                className="w-10 h-10 border rounded flex items-center justify-center text-gray-600 hover:border-blue-600 hover:text-blue-600 disabled:opacity-50 gap-2"
              >
                <Minus size={16} />
              </Button>
              <span className="w-4 text-center font-bold">{children}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateChildren(1)}
                className="w-10 h-10 border rounded flex items-center justify-center text-blue-600 border-blue-600 bg-blue-50 hover:bg-blue-100 gap-2"
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>

          {/* Child Ages Dynamic Inputs */}
          {children > 0 && (
            <div className="mb-6 space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
              {childAges.map((age, i) => (
                <div key={i} className="animate-in slide-in-from-top-2">
                  <Label className="block text-xs font-bold text-gray-700 mb-1">
                    {i + 1}
                    {i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} child's age
                  </Label>
                  <select
                    value={age}
                    onChange={e => updateAge(i, parseInt(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white outline-none focus:border-blue-500"
                  >
                    <option value="" disabled>
                      Select age at time of flying
                    </option>
                    {Array.from({ length: 18 }, (_, n) => (
                      <option key={n} value={n}>
                        {n} years old
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              <p className="text-[10px] text-gray-500 mt-2">
                To find you a place to stay that fits your entire group...
              </p>
            </div>
          )}

          {/* Rooms */}
          <div className="flex justify-between items-center mb-6 gap-4">
            <div className="font-bold text-gray-900">Rooms</div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRooms(Math.max(1, rooms - 1))}
                className="w-10 h-10 border rounded flex items-center justify-center text-gray-600 hover:border-blue-600 hover:text-blue-600 gap-2"
              >
                <Minus size={16} />
              </Button>
              <span className="w-4 text-center font-bold">{rooms}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRooms(rooms + 1)}
                className="w-10 h-10 border rounded flex items-center justify-center text-blue-600 border-blue-600 bg-blue-50 hover:bg-blue-100 gap-2"
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>

          <div className="pt-2 border-t">
            <Button className="w-full" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </Popover.Content>
      </Popover.Root>
    </div>
  );
}
