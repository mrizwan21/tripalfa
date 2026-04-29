import { useState, useEffect } from 'react';
import { User, Phone, Mail, MessageSquare, Award, Clock, X, Loader2, ShieldCheck, Zap, Database } from 'lucide-react';
import { apiManager } from '../services/apiManager';
import { ProfileLayout } from './ProfilePage';
import { cn } from '../lib/utils';

interface SalesRep {
  name: string;
  title: string;
  phone: string;
  email: string;
  region: string;
  supportHours: string;
}

export default function SalesRepPage() {
  const [rep, setRep] = useState<SalesRep | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [callbackForm, setCallbackForm] = useState({
    phone: '',
    preferredTime: 'asap',
    reason: ''
  });

  const [issueForm, setIssueForm] = useState({
    subject: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  });

  useEffect(() => {
    loadSalesRep();
  }, []);

  const loadSalesRep = async () => {
    setIsLoading(true);
    try {
      const data = await apiManager.getAssignedRep();
      setRep(data as unknown as SalesRep);
    } catch {
      setRep({
        name: 'Rajeeb Kumar',
        title: 'Senior Branch Manager',
        phone: '+973 3387 8050',
        email: 'rajeeb@sabatours.com',
        region: 'Middle East Region',
        supportHours: '08:00 — 18:00 (AST)'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestCallback = async () => {
    if (!callbackForm.phone || !callbackForm.reason) return;
    setIsSubmitting(true);
    try {
      await apiManager.requestCallback();
      setSuccess('Callback handshake initialized.');
      setShowCallbackModal(false);
    } catch {
      setError('Handshake Error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProfileLayout>
      <div className="max-w-[1550px] mx-auto pb-20 px-6 pt-8 animate-fade">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 border-b border-black/5 pb-10">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold text-black leading-tight flex items-center gap-4">
              <div className="w-14 h-14 bg-black text-apple-blue rounded-2xl flex items-center justify-center shadow-lg">
                <ShieldCheck size={28} />
              </div>
              Priority Support
            </h1>
            <p className="text-sm font-medium text-black/40">Your dedicated account manager and system liaison.</p>
          </div>
          <button className="px-8 py-3 bg-apple-blue text-white rounded-xl text-sm font-bold shadow-xl hover:scale-105 transition-all flex items-center gap-2">
            <MessageSquare size={18} /> Initialize Live Chat
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-48 gap-6">
            <Loader2 className="animate-spin text-apple-blue" size={48} />
            <span className="text-xs font-bold text-black/20 uppercase tracking-widest">Accessing support node...</span>
          </div>
        ) : rep && (
          <div className="bg-white border border-black/5 rounded-[2.5rem] shadow-sm overflow-hidden mt-12">
            <div className="p-12 flex flex-col md:flex-row gap-12 items-center">
              <div className="relative">
                <div className="w-48 h-48 rounded-full bg-black/[0.02] flex items-center justify-center border border-black/5 relative overflow-hidden group">
                  <span className="text-5xl font-bold text-black opacity-40">{rep.name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div className="absolute bottom-4 right-4 w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-xl animate-pulse" />
              </div>
              
              <div className="flex-1 space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-black">{rep.name}</h2>
                  <div className="flex gap-4 mt-2">
                    <span className="px-4 py-1.5 bg-black text-white text-[10px] font-bold rounded-full uppercase tracking-widest">{rep.title}</span>
                    <span className="text-xs font-bold text-black/20 uppercase tracking-widest flex items-center gap-2">
                      <Database size={14} /> {rep.region}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-6 bg-black/[0.02] rounded-2xl border border-black/5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-black/20 shadow-sm"><Phone size={20}/></div>
                    <div>
                      <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest">Phone</p>
                      <p className="text-sm font-bold text-black">{rep.phone}</p>
                    </div>
                  </div>
                  <div className="p-6 bg-black/[0.02] rounded-2xl border border-black/5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-black/20 shadow-sm"><Mail size={20}/></div>
                    <div>
                      <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest">Email</p>
                      <p className="text-sm font-bold text-black">{rep.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-12 py-6 bg-black/[0.01] border-t border-black/5 flex justify-between items-center">
              <div className="flex items-center gap-2 text-xs font-bold text-black/20 uppercase tracking-widest">
                <Clock size={16} /> Hours: {rep.supportHours}
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowCallbackModal(true)} className="px-6 py-2.5 bg-white border border-black/10 text-black text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-black/5 transition-all">Request Callback</button>
                <button onClick={() => setShowIssueModal(true)} className="px-6 py-2.5 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-lg">Report Protocol Failure</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showCallbackModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-[110] p-6 animate-fade">
          <div className="bg-white rounded-[2.5rem] p-12 max-w-lg w-full shadow-2xl border-t-[8px] border-black">
            <h3 className="text-3xl font-bold text-black mb-2">Sync Request</h3>
            <p className="text-xs font-bold text-black/20 uppercase tracking-widest mb-8">Request immediate callback link</p>
            <div className="space-y-6">
              <input type="tel" value={callbackForm.phone} onChange={e => setCallbackForm({...callbackForm, phone: e.target.value})} placeholder="Phone Identifier" className="w-full bg-black/5 border-2 border-transparent focus:border-apple-blue rounded-xl px-6 py-4 text-sm font-bold outline-none transition-all" />
              <button onClick={handleRequestCallback} className="w-full py-5 bg-black text-white rounded-2xl font-bold shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
                Establish Link
              </button>
            </div>
          </div>
        </div>
      )}
    </ProfileLayout>
  );
}
