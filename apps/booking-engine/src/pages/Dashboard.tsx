import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatCurrency } from '../lib/utils';
import { listBookings, listDocuments, fetchWallets } from '../lib/api';
import { BarChart, Calendar, CreditCard, FileText } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import { useNavigate } from 'react-router-dom';

/**
 * Lightweight dashboard: summary cards + simple SVG charts using mock-api data.
 * This is intended as a first iteration — we can replace charts with a charting
 * library (e.g. Chart.js, Recharts) if you want richer visuals.
 */

export default function Dashboard(): React.JSX.Element {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({ total: 0, flights: 0, hotels: 0, cars: 0 });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const bResp: any = await listBookings();
        const items: any[] = Array.isArray(bResp.items) ? bResp.items : bResp;
        const flights = items.filter(i => i.product === 'flight').length;
        const hotels = items.filter(i => i.product === 'hotel').length;
        const cars = items.filter(i => i.product === 'car').length;
        setSummary({ total: items.length, flights, hotels, cars });
        setRecentBookings(items.slice(0, 5));
      } catch {
        setSummary({ total: 0, flights: 0, hotels: 0, cars: 0 });
      }

      try {
        const w = await fetchWallets();
        setWallets(w || []);
      } catch {
        setWallets([]);
      }

      try {
        const docs = await listDocuments();
        setDocuments(docs || []);
      } catch {
        setDocuments([]);
      }
    })();
  }, []);

  const chartData = [
    { label: 'Flights', value: summary.flights, color: '#2563eb' },
    { label: 'Hotels', value: summary.hotels, color: '#6366f1' },
    { label: 'Cars', value: summary.cars, color: '#06b6d4' },
  ];
  const maxVal = Math.max(1, ...chartData.map(c => c.value));

  return (
    <div className="p-6 container">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your travel activity, wallet and documents."
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/bookings')}><Calendar className="mr-2 h-4 w-4" />Manage bookings</Button>
            <Button onClick={() => navigate('/wallet')}><CreditCard className="mr-2 h-4 w-4" />Wallet</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Total bookings</div>
              <div className="text-2xl font-semibold mt-1">{summary.total}</div>
              <div className="text-sm text-slate-500 mt-1">Flights: {summary.flights} • Hotels: {summary.hotels} • Cars: {summary.cars}</div>
            </div>
            <div className="p-3 rounded bg-blue-50">
              <BarChart className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-slate-500">Wallet snapshot</div>
          <div className="mt-2 space-y-2">
            {wallets.length === 0 ? <div className="text-sm text-gray-500">No wallets available</div> : wallets.map(w => (
              <div key={w.currency} className="flex items-center justify-between">
                <div className="text-sm">{w.currency}</div>
                <div className="font-medium">{formatCurrency(w.currentBalance || 0)}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/wallet')}>View wallet</Button>
            <Button variant="ghost" size="sm">Top-ups</Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-slate-500">Documents</div>
          <div className="mt-2">
            <div className="text-2xl font-semibold">{documents.length}</div>
            <div className="text-sm text-slate-500 mt-1">Passport, visa, residency, cards</div>
          </div>
          <div className="mt-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/profile#documents')}>Manage documents</Button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 lg:col-span-2">
          <div className="section-header mb-3">
            <div>
              <div className="section-title">Bookings by product</div>
              <div className="text-xs text-slate-500">Last 12 months (mock)</div>
            </div>
            <div className="text-sm text-slate-500">Snapshot</div>
          </div>

          <div className="mt-3">
            <div className="w-full h-36">
              <svg viewBox="0 0 300 100" className="w-full h-full">
                {chartData.map((c, idx) => {
                  const barW = 60;
                  const gap = 20;
                  const x = idx * (barW + gap) + 20;
                  const barH = Math.round((c.value / maxVal) * 70);
                  const y = 90 - barH;
                  return (
                    <g key={c.label}>
                      <rect x={x} y={y} width={barW} height={barH} rx="6" fill={c.color} opacity={0.95} />
                      <text x={x + barW / 2} y={95} fontSize="10" fill="#374151" textAnchor="middle">{c.label}</text>
                      <text x={x + barW / 2} y={y - 6} fontSize="11" fill="#111827" textAnchor="middle" fontWeight={600}>{c.value}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="section-header">
            <div>
              <div className="section-title">Recent bookings</div>
              <div className="text-xs text-slate-500">Latest activity</div>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {recentBookings.length === 0 ? <div className="text-sm text-gray-500">No recent bookings</div> : recentBookings.map(b => (
              <div
                key={b.bookingId || b.id}
                onClick={() => navigate(`/booking-card/${b.id || b.bookingId}`)}
                className="flex items-center justify-between p-2 rounded hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div>
                  <div className="font-medium">{b.product?.toUpperCase() || 'Booking'}</div>
                  <div className="text-xs text-slate-500">ID: {b.bookingId || b.id}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(b.total?.amount || b.total || 0)}</div>
                  <div className="text-xs text-slate-500">{b.status || b.paymentStatus || ''}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}