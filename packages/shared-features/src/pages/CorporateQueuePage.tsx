import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Clock, RefreshCw, DollarSign, Eye, Activity, Zap, ShieldCheck, Filter, Layers, Fingerprint } from 'lucide-react';
import { apiManager } from '../services/apiManager';
import { cn } from '../lib/utils';
import { NodalPageHeader } from '../index';
import { Layout } from '../components/Layout';

interface CorporateBooking {
  id: string;
  referenceNo: string;
  passengerName: string;
  bookingDate: string;
  approvalStatus: string;
  approvedCount: number;
  approvalCount: number;
  currency: string;
  amount: number;
}

export default function CorporateQueuePage() {
  const [bookings, setBookings] = useState<CorporateBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'approved' | 'pending'>('all');

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiManager.getCorporateQueue();
      setBookings((data || []) as unknown as CorporateBooking[]);
    } catch (error) {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  return (
    <Layout>
      <div className="max-w-[1700px] mx-auto pb-48 px-6 lg:px-12 animate-fade pt-8">
        <NodalPageHeader
          icon={Layers}
          title="Approval"
          highlightedTitle="Queue"
          nodeName="CORP_QUE_v4"
          subtitle="Manage corporate booking records awaiting multi-signature approval."
          actions={
            <button onClick={loadQueue} className="px-10 py-4 bg-black text-apple-blue rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-4">
              <RefreshCw size={18} className={cn(loading && 'animate-spin')} />
              Force Master Sync
            </button>
          }
        />

        <div className="flex bg-black/5 p-1 rounded-xl w-fit my-12">
          {(['all', 'approved', 'pending'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                activeTab === tab ? "bg-white text-black shadow-sm" : "text-black/40"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black text-apple-blue text-[10px] font-bold uppercase tracking-widest">
                <th className="px-12 py-8">Record</th>
                <th className="px-10 py-8">Passenger</th>
                <th className="px-10 py-8">Status</th>
                <th className="px-10 py-8">Sigs</th>
                <th className="px-10 py-8">Amount</th>
                <th className="px-12 py-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-48 text-center">
                    <RefreshCw className="animate-spin mx-auto text-apple-blue mb-4" size={48} />
                    <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest">Synchronizing nodes...</p>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-48 text-center text-[10px] font-bold text-black/20 uppercase tracking-widest">Queue empty.</td>
                </tr>
              ) : (
                bookings.map(booking => (
                  <tr key={booking.id} className="hover:bg-black/[0.01] transition-all group">
                    <td className="px-12 py-8 font-bold text-black">{booking.referenceNo}</td>
                    <td className="px-10 py-8 text-sm font-medium text-black/60">{booking.passengerName}</td>
                    <td className="px-10 py-8">
                      <span className={cn(
                        "px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border",
                        booking.approvalStatus === 'Fully Approved' ? "bg-green-50 text-green-700 border-green-200" : "bg-orange-50 text-orange-700 border-orange-200"
                      )}>
                        {booking.approvalStatus}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-sm font-bold text-black/40">{booking.approvedCount}/{booking.approvalCount}</td>
                    <td className="px-10 py-8 font-bold text-black">{booking.currency} {booking.amount}</td>
                    <td className="px-12 py-8 text-right">
                      <button className="px-6 py-2 bg-black text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all">Details</button>
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