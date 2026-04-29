import { useState } from 'react';
import { XCircle, RefreshCw, RotateCcw, Clock, DollarSign, FileText, Download, Activity, Zap, Layers, Fingerprint, ShieldCheck, Target, CloudLightning, ChevronRight, ArrowRight, Shield, Terminal, Box, Filter, Search, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { NodalPageHeader } from '../index';
import { apiManager } from '../services/apiManager';
import { Layout } from '../components/Layout';

type ActionTab = 'void' | 'reissue' | 'refund';
type RefundMethod = 'sync' | 'manual';
type ReissueMethod = 'sync' | 'manual';

interface VoidReissueRefundProps {
  bookingId: string;
  ticketId?: string;
  ticketNo?: string;
  onClose?: () => void;
}

export default function VoidReissueRefundPage({ bookingId, ticketId, ticketNo, onClose }: VoidReissueRefundProps) {
  const [activeTab, setActiveTab] = useState<ActionTab>('void');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [voidAndCancel, setVoidAndCancel] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [reissueMethod, setReissueMethod] = useState<ReissueMethod>('sync');
  const [newTicketNumber, setNewTicketNumber] = useState('');
  const [fareDifference, setFareDifference] = useState(0);
  const [refundMethod, setRefundMethod] = useState<RefundMethod>('manual');
  const [refundAmount, setRefundAmount] = useState(0);

  const handleVoid = async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      const result = await apiManager.voidTicket(ticketId, voidAndCancel, voidReason);
      if (result?.success) setSuccess(`MANIFEST_VOIDED_CREDIT_NODE_${result.creditNoteNo}`);
    } catch (err: any) {
      setError(err.message || 'Void Template Failure');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-[1700px] mx-auto pb-48 px-6 lg:px-12 animate-fade pt-8">
        <NodalPageHeader
          icon={Activity}
          title="Lifecycle"
          highlightedTitle="Mutations"
          nodeName="POST_SALES_ENG"
          subtitle={`Managing sovereign lifecycle mutation for manifest: ${bookingId}`}
          actions={
            <div className="flex bg-black/5 p-1 rounded-xl">
              {(['void', 'reissue', 'refund'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                    activeTab === tab ? "bg-white text-black shadow-sm" : "text-black/40"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          }
        />

        <div className="mt-12 space-y-12">
          {success && (
            <div className="p-10 bg-black rounded-2xl border border-apple-blue/20 shadow-2xl flex items-center gap-10 animate-slide-up">
              <div className="w-16 h-16 bg-apple-blue text-black rounded-xl flex items-center justify-center animate-bounce">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Mutation Successful</h3>
                <p className="text-[10px] font-bold text-apple-blue uppercase tracking-widest mt-1">{success}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_450px] gap-12 items-start">
            <div className="bg-white rounded-[2.5rem] border border-black/5 p-16 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-16 opacity-[0.02] group-hover:scale-110 transition-transform duration-1000 -rotate-12 pointer-events-none">
                <ShieldCheck size={300} />
              </div>
              
              <div className="relative z-10 space-y-16">
                <div className="flex items-center gap-8">
                  <div className="w-14 h-14 bg-black text-apple-blue rounded-xl flex items-center justify-center shadow-lg">
                    {activeTab === 'void' ? <XCircle size={24} /> : activeTab === 'reissue' ? <RefreshCw size={24} /> : <RotateCcw size={24} />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-black tracking-tight capitalize">{activeTab} Request</h3>
                    <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest mt-1">Execute sovereign mutation protocol</p>
                  </div>
                </div>

                {activeTab === 'void' && (
                  <div className="space-y-10">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest ml-1">Void Reason</label>
                      <textarea value={voidReason} onChange={e => setVoidReason(e.target.value)} className="w-full h-32 bg-black/5 border-2 border-transparent focus:border-apple-blue rounded-xl px-6 py-4 text-sm font-bold outline-none transition-all resize-none" placeholder="Enter justification..." />
                    </div>
                    <button onClick={handleVoid} className="w-full py-5 bg-black text-white rounded-2xl font-bold shadow-2xl hover:scale-[1.02] transition-all">Execute Void Command</button>
                  </div>
                )}
              </div>
            </div>

            <aside className="space-y-8">
              <div className="bg-black rounded-3xl p-10 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-white">
                  <Terminal size={80} />
                </div>
                <h4 className="text-sm font-bold uppercase tracking-widest mb-6 text-apple-blue">Exception Log</h4>
                <p className="text-xs text-white/40 leading-relaxed font-medium">Post-sales mutations are strictly logged and subject to hierarchical reconciliation.</p>
                <div className="pt-8 border-t border-white/10 mt-6">
                  <div className="flex justify-between items-center text-[10px] font-bold text-white/20 uppercase tracking-widest">
                    <span>Latency</span>
                    <span className="text-apple-blue">0.4ms</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Layout>
  );
}
