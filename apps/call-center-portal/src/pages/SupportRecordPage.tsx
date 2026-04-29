import React, { useState } from 'react';
import { AlertCircle, Loader2, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '../context/CustomerContext';

export default function SupportRecordPage() {
  const [form, setForm] = useState<{
    subject: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    customerEmail: string;
    customerName: string;
    relatedTo: string;
  }>({
    subject: '',
    description: '',
    priority: 'MEDIUM',
    customerEmail: '',
    customerName: '',
    relatedTo: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { addNotification } = useCustomer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      // Note: Simulated submission - replace with actual API call when available
      addNotification({
        title: 'Support Ticket Created',
        message: 'The support record has been successfully logged.',
        type: 'success'
      });
      navigate('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create ticket.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-1 text-gray-900">New Support Record</h2>
      <p className="text-gray-500 text-sm mb-6">Log a new inquiry for a customer on behalf of the Mid-Office team.</p>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-900">Customer Name</label>
            <input className={inputCls} placeholder="e.g. John Smith" value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-900">Customer Email</label>
            <input className={inputCls} type="email" placeholder="john@example.com" value={form.customerEmail} onChange={e => setForm(p => ({ ...p, customerEmail: e.target.value }))} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-900">Subject <span className="text-red-500">*</span></label>
          <input className={inputCls} placeholder="e.g. Refund request for booking XCH-9910" required value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-900">Description</label>
          <textarea className={`${inputCls} min-h-[100px] resize-y`} placeholder="Describe the issue in detail..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-900">Priority</label>
            <select className={inputCls} value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' }))}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-900">Related Booking Ref</label>
            <input className={inputCls} placeholder="e.g. XCH-9910 (optional)" value={form.relatedTo} onChange={e => setForm(p => ({ ...p, relatedTo: e.target.value }))} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="submit" disabled={submitting} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            {submitting ? "Creating…" : "Create Record"}
          </button>
        </div>
      </form>
    </div>
  );
}