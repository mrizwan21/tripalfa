import { useState, type ReactNode } from 'react';
import { Search } from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { useTenantData } from '../hooks/useTenantData';
import { Layout } from '../components/Layout';
import { NodalPageHeader } from '../index';

export default function MyBookingsPage() {
  const { tenant } = useTenant();
  const [status, setStatus] = useState('All');
  const [filter, setFilter] = useState('');
  const { tenantBookings = [], isLoading } = useTenantData();

  const filteredBookings = tenantBookings.filter((b: any) => {
    const matchesSearch = b.referenceNo.toLowerCase().includes(filter.toLowerCase()) ||
      b.passengerName.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = status === 'All' || b.status === status;
    return matchesSearch && matchesStatus;
  });

  // Determine table body content
  let tableBody: ReactNode;
  if (isLoading) {
    tableBody = (
      <tr>
        <td colSpan={4} className="py-48 text-center text-[10px] font-bold text-black/20 uppercase tracking-widest">
          Loading ledger...
        </td>
      </tr>
    );
  } else if (filteredBookings.length === 0) {
    tableBody = (
      <tr>
        <td colSpan={4} className="py-48 text-center text-[10px] font-bold text-black/20 uppercase tracking-widest">
          No transactions found.
        </td>
      </tr>
    );
  } else {
    tableBody = filteredBookings.map((b: any) => (
      <tr key={b.id} className="hover:bg-black/[0.01] transition-all group">
        <td className="px-10 py-8 font-bold text-black">{b.referenceNo}</td>
        <td className="px-6 py-8 text-sm font-medium text-black/60">{b.passengerName}</td>
        <td className="px-6 py-8">
          <span className="px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border bg-black/5 text-black/40">{b.status}</span>
        </td>
        <td className="px-10 py-8 text-right font-bold text-black">{tenant.currency} {b.amount}</td>
      </tr>
    ));
  }

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto animate-fade px-4 lg:px-6 pt-8">
        <NodalPageHeader
          title="Transaction"
          highlightedTitle="Ledger"
          nodeName="BOOKING_REPOS"
          subtitle="Unified repository of all agency booking transactions."
          actions={
            <div className="flex gap-4">
              <button className="px-8 py-3 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl">Export CSV</button>
            </div>
          }
        />

        <div className="bg-white rounded-[2.5rem] border border-black/5 p-12 my-12 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 mb-12">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20" aria-hidden="true" />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search Ref / Passenger..."
                aria-label="Search references or passenger"
                className="w-full bg-black/5 border-2 border-transparent focus:border-apple-blue rounded-xl pl-16 pr-8 py-4 text-sm font-bold outline-none transition-all"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Filter by status"
              className="bg-black/5 rounded-xl px-8 py-4 text-sm font-bold outline-none cursor-pointer"
            >
              <option value="All">All States</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Paid">Paid</option>
              <option value="Issued">Issued</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black text-apple-blue text-[10px] font-bold uppercase tracking-widest">
                  <th className="px-10 py-6">Reference</th>
                  <th className="px-6 py-6">Passenger</th>
                  <th className="px-6 py-6">Status</th>
                  <th className="px-10 py-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {tableBody}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
