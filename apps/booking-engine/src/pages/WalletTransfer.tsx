import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { fetchWallets, api } from '../lib/api';
import { WalletAccount } from '../lib/srs-types';
import { formatCurrency } from '@tripalfa/ui-components';
import { ArrowLeftRight, Wallet, ArrowRight, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';

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
            <div className="p-6 max-w-2xl mx-auto">
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-purple-50">
                            <ArrowLeftRight className="w-5 h-5 text-purple-600" />
                        </div>
                        <h1 className="text-xl font-semibold text-slate-900">Internal Transfer</h1>
                    </div>
                    <p className="text-sm text-slate-500">Move funds between your accounts</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <form onSubmit={submit} className="space-y-5">
                        {/* Account Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">From</label>
                                <select
                                    id="transfer-from-currency"
                                    name="transfer-from-currency"
                                    value={fromCurrency}
                                    onChange={e => setFromCurrency(e.target.value)}
                                    className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm"
                                >
                                    {accounts.map(a => (
                                        <option key={a.currency} value={a.currency}>
                                            {a.currency} • {formatCurrency(a.currentBalance, a.currency)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">To</label>
                                <select
                                    id="transfer-to-currency"
                                    name="transfer-to-currency"
                                    value={toCurrency}
                                    onChange={e => setToCurrency(e.target.value)}
                                    className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm"
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
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Amount to Transfer</label>
                            <div className="relative">
                                <input
                                    id="transfer-amount"
                                    name="transfer-amount"
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    max={sourceAccount?.currentBalance}
                                    className="w-full h-12 pl-4 pr-12 border border-slate-200 rounded-lg text-lg font-medium"
                                    required
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                                    {fromCurrency}
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Max: {formatCurrency(sourceAccount?.currentBalance || 0, fromCurrency)}</p>
                        </div>

                        {/* Exchange Rate Info */}
                        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Exchange Rate</span>
                                <span className="font-medium text-slate-900">1 {fromCurrency} ≈ {getExchangeRate().toFixed(4)} {toCurrency}</span>
                            </div>
                            <div className="h-px bg-slate-200" />
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-500">You will receive</span>
                                <span className="font-semibold text-lg text-purple-600">
                                    {formatCurrency(estimatedReceive, toCurrency)}
                                </span>
                            </div>
                        </div>

                        {/* Status Messages */}
                        {status !== 'idle' && (
                            <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {status === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                {msg}
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={submitting || !amount || Number(amount) > (sourceAccount?.currentBalance || 0)}
                            className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                            {submitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                'Confirm Transfer'
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </TripLogerLayout>
    );
}
