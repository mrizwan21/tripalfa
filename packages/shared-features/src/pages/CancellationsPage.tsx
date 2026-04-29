import { useState } from 'react';
import { 
  Inbox, Filter, Search, ArrowRight,
  MoreVertical, RefreshCcw, CheckCircle2, 
  XOctagon, Clock, CreditCard
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiManager } from '../services/apiManager';
import { useTenant } from '../context/TenantContext';
import { cn } from '../lib/utils';
import { Layout } from '../components/Layout';
import { NodalPageHeader } from '../index';

interface AmendmentRequest {
  id: string;
  bookingId: string;
  type: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'ProviderAcknowledge' | 'Refunded';
  requestedAt: string;
  requestedBy: string;
  description: string;
  estimatedPenalty?: number;
}

export default function CancellationsPage() {
  const { tenant } = useTenant();
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');

  const { data: amendments, isLoading } = useQuery({
    queryKey: ['amendments'],
    queryFn: () => apiManager.getAmendments()
  });

  const getStatusDisplay = (status: AmendmentRequest['status']) => {
    switch (status) {
      case 'Pending':
        return { color: 'text-black/40 bg-black/5 border-black/10', icon: Clock, label: 'Pending Processing' };
      case 'ProviderAcknowledge':
        return { color: 'text-apple-blue bg-apple-blue/5 border-apple-blue/10', icon: Clock, label: 'Provider Ack' };
      case 'Approved':
        return { color: 'text-apple-blue bg-apple-blue/10 border-apple-blue/20', icon: CheckCircle2, label: 'Ledger Approved' };
      case 'Rejected':
        return { color: 'text-black/60 bg-black/5 border-black/10', icon: XOctagon, label: 'Action Denied' };
      case 'Refunded':
        return { color: 'text-apple-blue bg-apple-blue/20 border-apple-blue/30', icon: CreditCard, label: 'Funds Reconciled' };
      default:
        return { color: 'text-black/30 bg-black/5 border-black/5', icon: Clock, label: status };
    }
  };

  const filteredAmendments = amendments?.filter((a: any) => {
    if (filter === 'All') return true;
    if (filter === 'Pending') return ['Pending', 'ProviderAcknowledge'].includes(a.status);
    return a.status === filter;
  });

  return (
    <Layout>
      <div className="max-w-[1550px] mx-auto pb-20 px-6 pt-8 animate-fade">
        <NodalPageHeader
          icon={RefreshCcw}
          title="Amendment"
          highlightedTitle="Ledger"
          nodeName="AMENDMENT_HUB"
          subtitle="Modification and cancellation activity lifecycle tracking."
          actions={
            <div className="flex bg-black/5 p-1 rounded-xl">
              {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                    filter === f ? "bg-white text-black shadow-sm" : "text-black/40"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          }
        />

        <div className="grid grid-cols-1 gap-6 my-12">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-48 gap-8">
              <RefreshCcw className="animate-spin text-apple-blue" size={48} />
              <div className="text-xs font-bold text-black/20 uppercase tracking-widest">Syncing ledger records...</div>
            </div>
          ) : filteredAmendments?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-48 gap-4 bg-white rounded-[2.5rem] border border-black/5">
              <Inbox size={48} className="text-black/5" />
              <p className="text-xs font-bold text-black/20 uppercase tracking-widest">No amendment vectors found.</p>
            </div>
          ) : (
            filteredAmendments?.map((amendment: any) => {
              const statusMeta = getStatusDisplay(amendment.status);
              const StatusIcon = statusMeta.icon;
              return (
                <div key={amendment.id} className="bg-white rounded-[2rem] border border-black/5 p-8 flex flex-col md:flex-row justify-between items-center gap-8 group hover:shadow-xl transition-all">
                  <div className="flex items-center gap-8 w-full">
                    <div className="w-12 h-12 bg-black text-apple-blue rounded-xl flex items-center justify-center shadow-lg"><RefreshCcw size={20}/></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-black">{amendment.id}</h3>
                        <span className="text-[10px] font-bold text-black/20 uppercase tracking-widest">Ref: {amendment.bookingId}</span>
                      </div>
                      <p className="text-xs font-medium text-black/40 mt-1">{amendment.description}</p>
                    </div>
                  </div>
                  <div className={cn("px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border shrink-0", statusMeta.color)}>
                    {statusMeta.label}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}