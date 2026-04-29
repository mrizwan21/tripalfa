import { useState, useEffect } from 'react';
import { RotateCcw, RefreshCw, XCircle, CheckCircle, Clock, Eye, Filter, Activity, Zap, Layers, Fingerprint, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { NodalPageHeader } from '../index';
import { Layout } from '../components/Layout';
import { apiManager } from '../services/apiManager';

type RequestType = 'refund' | 'reschedule' | 'cancel' | 'combined';

export default function ServiceRequestQueuePage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState<RequestType>('refund');

  useEffect(() => { loadRequests(); }, [activeType]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      let data: any[] = [];
      if (activeType === 'combined') {
        data = await apiManager.getCancelAndRescheduleRequests({});
      } else {
        data = await apiManager.getServiceRequests(activeType.toUpperCase());
      }
      setRequests(data || []);
    } catch (error) {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId: string, action: 'approve' | 'process' | 'close' | 'reject') => {
    try {
      const remarks = action === 'reject' ? prompt('REJECTION_JUSTIFICATION:') || undefined : undefined;
      if (action === 'reject' && !remarks) return;
      const result = await apiManager.processServiceRequest(requestId, action, remarks);
      if ((result as any)?.success) loadRequests();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout>
      <div className="max-w-[1700px] mx-auto pb-48 px-6 lg:px-12 animate-fade pt-8">
        <NodalPageHeader
          icon={RotateCcw}
          title="Service"
          highlightedTitle="Queue"
          nodeName="SR_FLOW_v1"
          subtitle="Processing post-sales mutation requests and lifecycle exceptions."
          actions={
            <div className="flex bg-black p-1 rounded-xl shadow-2xl">
              {(['refund', 'reschedule', 'cancel', 'combined'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveType(tab)}
                  className={cn(
                    "px-8 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                    activeType === tab ? "bg-white text-black shadow-sm" : "text-white/40"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          }
        />

        <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden mt-12">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black text-apple-blue text-[10px] font-bold uppercase tracking-widest">
                <th className="px-12 py-8">Reference</th>
                <th className="px-10 py-8">Type</th>
                <th className="px-10 py-8">Status</th>
                <th className="px-12 py-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading ? (
                <tr><td colSpan={4} className="py-48 text-center text-[10px] font-bold text-black/20 uppercase tracking-widest">Processing nodes...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={4} className="py-48 text-center text-[10px] font-bold text-black/20 uppercase tracking-widest">No requests in queue.</td></tr>
              ) : (
                requests.map(request => (
                  <tr key={request.id} className="hover:bg-black/[0.01] transition-all group">
                    <td className="px-12 py-8 font-bold text-black">{request.booking?.referenceNo || 'N/A'}</td>
                    <td className="px-10 py-8">
                      <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">{request.type || activeType}</span>
                    </td>
                    <td className="px-10 py-8">
                      <span className="px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border bg-black/5 text-black/40">
                        {request.status}
                      </span>
                    </td>
                    <td className="px-12 py-8 text-right flex justify-end gap-3">
                      <button onClick={() => handleAction(request.id, 'approve')} className="px-6 py-2 bg-black text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all">Approve</button>
                      <button onClick={() => handleAction(request.id, 'reject')} className="px-6 py-2 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-100 transition-all">Reject</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
