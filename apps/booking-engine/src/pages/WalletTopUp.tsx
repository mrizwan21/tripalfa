import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { postTopUp } from '../lib/api';
import { CreditCard, Wallet, ArrowRight, CheckCircle2, AlertCircle, ChevronDown, DollarSign } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function WalletTopUp() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) return;

    setLoading(true);
    setStatus('idle');

    try {
      const res = await postTopUp({
        accountFrom: 'STRIPE-USD',
        accountTo: `WAL-${currency}`,
        amount: Number(amount),
        currency,
        paymentType: 'card'
      });

      setStatus('success');
      setMsg(`Successfully added ${currency} ${amount} to your wallet. Invoice: ${res.invoiceNo}`);
      setTimeout(() => navigate('/wallet'), 3000);
    } catch (err) {
      setStatus('error');
      setMsg('Transaction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <TripLogerLayout>
      <div className="min-h-screen bg-[#F8F9FA] relative overflow-hidden font-sans">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-br from-[#152467]/20 via-purple-100/30 to-transparent pointer-events-none" />
        <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 py-12 relative z-10 flex flex-col items-center justify-center min-h-[80vh]">

          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-xl shadow-purple-100 flex items-center justify-center mx-auto mb-6 transform -rotate-3 border border-gray-100">
              <Wallet className="text-[#152467]" size={32} />
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">Top Up Wallet</h1>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Securely add funds to your account</p>
          </div>

          <div className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-white/50 rounded-[2.5rem] shadow-2xl p-10 relative overflow-hidden">
            {/* Decorative shine */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/40 to-transparent rounded-bl-[100px] pointer-events-none" />

            <form onSubmit={submit} className="space-y-8 relative z-10">

              {/* Amount Input */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Amount to Add</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <DollarSign className="text-gray-400 group-focus-within:text-[#152467] transition-colors" size={20} />
                  </div>
                  <input
                    id="topup-amount"
                    name="topup-amount"
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-16 pl-14 pr-6 bg-gray-50/50 border-2 border-transparent hover:bg-white focus:bg-white focus:border-[#152467]/30 rounded-2xl text-2xl font-black text-gray-900 placeholder:text-gray-300 outline-none transition-all shadow-inner"
                    required
                  />
                </div>
              </div>

              {/* Currency & Payment Method */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Currency</label>
                  <div className="relative">
                    <select
                      id="topup-currency"
                      name="topup-currency"
                      value={currency}
                      onChange={e => setCurrency(e.target.value)}
                      className="w-full h-14 pl-5 pr-10 bg-white border border-gray-100 hover:border-gray-200 rounded-2xl text-xs font-bold text-gray-900 outline-none appearance-none cursor-pointer shadow-sm"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (EUR)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="AED">AED (د.إ)</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Payment Method</label>
                  <div className="h-14 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-gray-500 opacity-70 cursor-not-allowed">
                    <CreditCard size={14} />
                    <span>Card x8832</span>
                  </div>
                </div>
              </div>

              {/* Status Messages */}
              {status !== 'idle' && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-2 ${status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                  {status === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {msg}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || !amount}
                className="w-full h-16 bg-[#111827] hover:bg-black text-white rounded-[1.5rem] text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-gray-200 hover:shadow-2xl transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Top Up Now <ArrowRight size={16} />
                  </>
                )}
              </Button>

              <p className="text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-6">
                Funds will be available immediately
              </p>
            </form>
          </div>
        </div>
      </div>
    </TripLogerLayout>
  );
}
