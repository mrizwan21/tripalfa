import { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Filter, Search, ArrowRight, Building2, MoreVertical, CheckSquare, Square, Zap, Info, RefreshCcw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiManager } from '../services/apiManager';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';
import { Layout } from '../components/Layout';
import { NodalPageHeader } from '../index';

export default function AuthorisationWorkspace() {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<'All' | 'Stale' | 'Critical'>('All');

  const { data: queue = [], isLoading } = useQuery({
    queryKey: ['provisional-queue'],
    queryFn: () => apiManager.getProvisionalQueue()
  });

  const authorizeMutation = useMutation({
    mutationFn: (ids: string[]) => apiManager.bulkAuthorizeBookings(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provisional-queue'] });
      setSelectedIds([]);
    }
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <Layout>
      <div className="max-w-[1550px] mx-auto pb-20 px-6 pt-8 animate-fade">
        <NodalPageHeader
          icon={ShieldCheck}
          title="Authorization"
          highlightedTitle="Hub"
          nodeName="GOV_DESK_v2"
          subtitle="Governing provisional transactions and hierarchical approval gates."
          actions={
            <div className="flex gap-4">
              {selectedIds.length > 0 && (
                <button onClick={() => authorizeMutation.mutate(selectedIds)} className="px-8 py-3 bg-black text-apple-blue rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-3">
                  <CheckCircle2 size={18} /> Authorize {selectedIds.length} Nodes
                </button>
              )}
            </div>
          }
        />

        <div className="bg-white rounded-[2.5rem] border border-black/5 p-12 my-12 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8">
            <div className="flex bg-black/5 p-1 rounded-xl">
              {(['All', 'Stale', 'Critical'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={cn("px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all", filter === f ? "bg-white text-black shadow-sm" : "text-black/40")}>{f}</button>
              ))}
            </div>
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20" />
              <input type="text" placeholder="Search Reference..." className="w-full bg-black/5 border-2 border-transparent focus:border-apple-blue rounded-xl pl-16 pr-8 py-4 text-sm font-bold outline-none transition-all" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black text-apple-blue text-[10px] font-bold uppercase tracking-widest">
                  <th className="px-10 py-6 w-16">
                    <button onClick={() => setSelectedIds(selectedIds.length === queue.length ? [] : queue.map((b: any) => b.id))} className="text-apple-blue/40 hover:text-white transition-all">
                      {selectedIds.length === queue.length ? <CheckSquare size={20}/> : <Square size={20}/>}
                    </button>
                  </th>
                  <th className="px-6 py-6">Transaction</th>
                  <th className="px-6 py-6">Aging</th>
                  <th className="px-6 py-6">Amount</th>
                  <th className="px-10 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-48 text-center text-[10px] font-bold text-black/20 uppercase tracking-widest">Syncing queue...</td></tr>
                ) : queue.length === 0 ? (
                  <tr><td colSpan={5} className="py-48 text-center text-[10px] font-bold text-black/20 uppercase tracking-widest">Workspace clear.</td></tr>
                ) : (
                  queue.map((booking: any) => (
                    <tr key={booking.id} className="hover:bg-black/[0.01] transition-all group">
                      <td className="px-10 py-8">
                        <button onClick={() => toggleSelect(booking.id)} className={cn("transition-all", selectedIds.includes(booking.id) ? "text-black" : "text-black/10")}>
                          {selectedIds.includes(booking.id) ? <CheckSquare size={20}/> : <Square size={20}/>}
                        </button>
                      </td>
                      <td className="px-6 py-8">
                        <div className="font-bold text-black">{booking.referenceNo}</div>
                        <div className="text-[10px] font-bold text-black/20 uppercase tracking-widest">{booking.service}</div>
                      </td>
                      <td className="px-6 py-8">
                        <span className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-black/5 text-black/40 border border-black/5">Active</span>
                      </td>
                      <td className="px-6 py-8 font-bold text-black">{booking.currency} {booking.amount}</td>
                      <td className="px-10 py-8 text-right flex justify-end gap-3">
                        <button onClick={() => authorizeMutation.mutate([booking.id])} className="p-3 bg-black text-apple-blue rounded-xl hover:scale-110 transition-all shadow-lg"><CheckCircle2 size={18}/></button>
                        <button className="p-3 bg-black/5 text-black/20 rounded-xl hover:text-red-500 transition-all"><XCircle size={18}/></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
