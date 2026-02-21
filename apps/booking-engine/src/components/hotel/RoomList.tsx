import React, { useState } from 'react';

export function RoomList({ rooms, onChange }: { rooms: any[]; onChange: (sel: Record<string,number>)=>void }) {
  const [sel, setSel] = useState<Record<string,number>>({});
  function setRoom(id: string, qty: number) {
    const next = { ...sel, [id]: qty };
    setSel(next);
    onChange(next);
  }
  return (
    <div className="space-y-4">
      {rooms.map((r:any)=>(
        <div key={r.id} className="border p-3 rounded flex items-center justify-between">
          <div>
            <div className="font-medium">{r.name}</div>
            <div className="text-sm text-gray-600">{r.description}</div>
            <div className="text-sm mt-1 font-semibold">{r.price?.currency} {r.price?.amount}</div>
          </div>
          <div>
            <input id={`room-quantity-${r.id}`} name={`room-quantity-${r.id}`} type="number" min={0} defaultValue={0} onChange={e=>setRoom(r.id, Math.max(0, Number(e.target.value)))} className="w-20 border rounded p-1"/>
          </div>
        </div>
      ))}
    </div>
  );
}
