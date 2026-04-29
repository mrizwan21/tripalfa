import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { useQuery } from '@tanstack/react-query';
import { apiManager, cn, NodalTable, TableBodyState, NodalPageHeader } from '../index';
import { 
  Building2, Plus, Search, Filter, Shield, 
  ExternalLink, MoreVertical, Globe, Zap, Clock,
  CheckCircle2, AlertCircle, XCircle
} from 'lucide-react';
import type { SupplierSearchResult } from '../types';

export default function SupplierManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers', searchQuery, filterType],
    queryFn: () => searchQuery || filterType !== 'All' 
      ? apiManager.searchSuppliers(searchQuery, filterType !== 'All' ? filterType : undefined)
      : apiManager.getSuppliers(),
  });

  const headers = [
    <span key="name">SUPPLIER NODE</span>,
    <span key="type">TYPE</span>,
    <span key="code">CODE</span>,
    <span key="contact">CONTACT HUB</span>,
    <span key="status">STATUS</span>,
    <span key="actions" className="text-right">ACTIONS</span>
  ];

  return (
    <Layout>
      <div className="max-w-[1550px] mx-auto pb-20 px-6">
        <NodalPageHeader
          title="Supplier"
          subtitle="Global node registry for GDS, Bedbanks, and Nodal Aggregators"
          icon={Building2}
          nodeName="Supplier Hub"
          actions={
            <button className="flex items-center gap-2 px-6 py-3 bg-black text-apple-blue rounded-xl text-xs font-bold tracking-tight shadow-apple hover:scale-[1.02] active:scale-[0.98] transition-all">
              <Plus size={14} /> Connect New Supplier
            </button>
          }
        />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white p-6 rounded-2xl border border-navy/5 shadow-sm">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pure-black/20" size={16} />
            <input
              type="text"
              placeholder="Search nodal code or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-light-gray border-none rounded-xl text-xs font-semibold text-pure-black focus:ring-2 focus:ring-apple-blue/20 transition-all outline-none"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
            {['All', 'GDS', 'Bedbank', 'Aggregator', 'Direct'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={cn(
                  "px-4 py-2.5 rounded-lg text-[10px] font-bold tracking-tight whitespace-nowrap transition-all",
                  filterType === t 
                    ? "bg-black text-white shadow-sm" 
                    : "bg-light-gray text-pure-black/40 hover:bg-slate-200"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-navy/5 shadow-apple overflow-hidden">
          <NodalTable 
            headers={headers}
          >
            <TableBodyState 
              loading={isLoading}
              isEmpty={!suppliers || suppliers.length === 0}
              colSpan={headers.length}
              emptyMessage="Adjust your filters or connect a new nodal partner"
            >
              {suppliers?.map((supplier: SupplierSearchResult) => (
              <tr key={supplier.id} className="group hover:bg-light-gray/50 transition-all">
                <td className="py-5 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-black/5 rounded-xl flex items-center justify-center text-pure-black/40 group-hover:bg-apple-blue/10 group-hover:text-apple-blue transition-colors">
                      <Shield size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-pure-black tracking-tight">{supplier.name}</p>
                      <p className="text-[10px] text-pure-black/30 font-semibold">{supplier.type} Node</p>
                    </div>
                  </div>
                </td>
                <td className="py-5 px-6">
                  <span className="px-2.5 py-1 bg-light-gray rounded-lg text-[9px] font-bold text-pure-black/60 tracking-tight">
                    {supplier.type}
                  </span>
                </td>
                <td className="py-5 px-6">
                  <span className="text-[10px] font-mono font-bold text-pure-black/40 bg-black/5 px-2 py-1 rounded">
                    {supplier.code}
                  </span>
                </td>
                <td className="py-5 px-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-pure-black/60 flex items-center gap-1.5">
                      <Clock size={10} /> {supplier.contactEmail}
                    </p>
                    <p className="text-[10px] font-semibold text-pure-black/40 flex items-center gap-1.5">
                      <Zap size={10} /> {supplier.contactPhone}
                    </p>
                  </div>
                </td>
                <td className="py-5 px-6">
                  <div className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold tracking-tight",
                    supplier.status === 'Active' 
                      ? "bg-apple-blue/10 text-apple-blue" 
                      : supplier.status === 'Pending'
                      ? "bg-amber-50 text-amber-600"
                      : "bg-red-50 text-red-600"
                  )}>
                    {supplier.status === 'Active' ? <CheckCircle2 size={10} /> : supplier.status === 'Pending' ? <Clock size={10} /> : <XCircle size={10} />}
                    {supplier.status.toUpperCase()}
                  </div>
                </td>
                <td className="py-5 px-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-2 hover:bg-black/5 rounded-lg text-pure-black/20 hover:text-pure-black transition-all">
                      <ExternalLink size={16} />
                    </button>
                    <button className="p-2 hover:bg-black/5 rounded-lg text-pure-black/20 hover:text-pure-black transition-all">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            </TableBodyState>
          </NodalTable>
        </div>
      </div>
    </Layout>
  );
}
