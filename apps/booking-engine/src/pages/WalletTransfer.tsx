import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { fetchWallets, api } from '../lib/api';
import { WalletAccount } from '../lib/srs-types';
import { formatCurrency } from '../lib/utils';
import { ArrowLeftRight, Wallet, ArrowRight, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function WalletTransfer() {
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState<WalletAccount[]>([]);
    const [loading, setLoading] = useState(true);

    const [fromCurrency, setFromCurrency] = useState('');
    const [toCurrency, setToCurrency] = useState('');
    const [amount, setAmount] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState('');

    // Mock exchange rates
    const rates: Record<string, number> = { USD: 1, EUR: 0.85, GBP: 0.75, AED: 3.67 };

    useEffect(() => {
        fetchWallets()
            .then(res => {
                setAccounts(res || []);
                if (res && res.length >= 2) {
                    setFromCurrency(res[0].currency);
                    setToCurrency(res[1].currency);
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const getExchangeRate = () => {
        if (!fromCurrency || !toCurrency) return 0;
        const base = rates[fromCurrency] || 1;
        const target = rates[toCurrency] || 1;
        // from -> USD -> target
        // amount / base * target
        return (1 / base) * target;
    };

    const estimatedReceive = amount ? (Number(amount) * getExchangeRate()) : 0;
    const sourceAccount = accounts.find(a => a.currency === fromCurrency);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!amount || Number(amount) <= 0) return;

        setSubmitting(true);
        setStatus('idle');

        try {
            await api.post('/wallet/transfer', {
                from: fromCurrency,
                to: toCurrency,
                amount: Number(amount)
            });

            setStatus('success');
            setMsg(`Successfully transferred ${formatCurrency(Number(amount), fromCurrency)} to ${toCurrency}`);
            setTimeout(() => navigate('/wallet'), 3000);
        } catch (err: any) {
            setStatus('error');
            setMsg(err.message || 'Transfer failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return null; // or spinner

    return (
        <TripLogerLayout>
            <div className="min-h-screen bg-[#F8F9FA] relative overflow-hidden font-sans">
                {/* Background Gradients */}
                <div className="absolute top-0 right-0 w-full h-[600px] bg-gradient-to-bl from-blue-100/20 via-purple-100/30 to-transparent pointer-events-none" />

                <div className="container mx-auto px-4 py-12 relative z-10 flex flex-col items-center justify-center min-h-[80vh]">

                    <div className="mb-8 text-center">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-xl shadow-blue-50 flex items-center justify-center mx-auto mb-6 transform rotate-3 border border-gray-100">
                            <ArrowLeftRight className="text-blue-600" size={32} />
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">Internal Transfer</h1>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Move funds between your accounts</p>
                    </div>

                    <div className="w-full max-w-xl bg-white/80 backdrop-blur-xl border border-white/50 rounded-[2.5rem] shadow-2xl p-8 md:p-10 relative overflow-hidden">

                        <form onSubmit={submit} className="space-y-8 relative z-10">

                            {/* Account Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                                {/* Arrow Indicator */}
                                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full border border-gray-100 shadow-sm items-center justify-center z-10 text-gray-300">
                                    <ArrowRight size={14} />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">From</label>
                                    <select
                                        id="transfer-from-currency"
                                        name="transfer-from-currency"
                                        value={fromCurrency}
                                        onChange={e => setFromCurrency(e.target.value)}
                                        className="w-full h-16 pl-4 pr-8 bg-gray-50 border-2 border-transparent hover:bg-white focus:bg-white focus:border-blue-500/20 rounded-2xl text-xs font-bold text-gray-900 outline-none appearance-none cursor-pointer transition-all"
                                    >
                                        {accounts.map(a => (
                                            <option key={a.currency} value={a.currency}>
                                                {a.currency} • {formatCurrency(a.currentBalance, a.currency)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">To</label>
                                    <select
                                        id="transfer-to-currency"
                                        name="transfer-to-currency"
                                        value={toCurrency}
                                        onChange={e => setToCurrency(e.target.value)}
                                        className="w-full h-16 pl-4 pr-8 bg-blue-50/50 border-2 border-transparent hover:bg-blue-50 focus:bg-white focus:border-blue-500/20 rounded-2xl text-xs font-bold text-gray-900 outline-none appearance-none cursor-pointer transition-all"
                                    >
                                        {accounts.filter(a => a.currency !== fromCurrency).map(a => (
                                            <option key={a.currency} value={a.currency}>
                                                {a.currency} • {formatCurrency(a.currentBalance, a.currency)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div className="space-y-3">
                                <div className="flex justify-between px-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount to Transfer</label>
                                    <span className="text-[10px] font-bold text-gray-400">Max: {formatCurrency(sourceAccount?.currentBalance || 0, fromCurrency)}</span>
                                </div>
                                <div className="relative">
                                    <input
                                        id="transfer-amount"
                                        name="transfer-amount"
                                        type="number"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        max={sourceAccount?.currentBalance}
                                        className="w-full h-20 pl-6 pr-6 bg-white border-2 border-gray-100 focus:border-blue-500 rounded-2xl text-3xl font-black text-gray-900 placeholder:text-gray-200 outline-none transition-all shadow-inner"
                                        required
                                    />
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-gray-300 pointer-events-none">
                                        {fromCurrency}
                                    </div>
                                </div>
                            </div>

                            {/* Exchange Rate Info */}
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-gray-400">Exchange Rate</span>
                                    <div className="flex items-center gap-1 font-black text-gray-900">
                                        <TrendingUp size={14} className="text-blue-500" />
                                        1 {fromCurrency} ≈ {getExchangeRate().toFixed(4)} {toCurrency}
                                    </div>
                                </div>
                                <div className="h-px bg-gray-200" />
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-gray-400 text-xs">You will receive</span>
                                    <span className="font-black text-xl text-blue-600">
                                        {formatCurrency(estimatedReceive, toCurrency)}
                                    </span>
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
                                disabled={submitting || !amount || Number(amount) > (sourceAccount?.currentBalance || 0)}
                                className="w-full h-16 bg-[#111827] hover:bg-black text-white rounded-[1.5rem] text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-gray-200 hover:shadow-2xl transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {submitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Confirm Transfer <ArrowRight size={16} />
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </TripLogerLayout>
    );
}
