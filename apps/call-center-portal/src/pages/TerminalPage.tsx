import { Phone, Upload, Layers, Plus, Activity, Clock, CheckCircle2, Zap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '../context/CustomerContext';
import { cn } from '@tripalfa/shared-features';
import { SmartSearchBar } from '../components/SmartSearchBar';

const STATS = [
  { label: 'Calls Today', value: '24', icon: Phone, trend: '+3', positive: true },
  { label: 'Open Queues', value: '7', icon: Layers, trend: '-2', positive: true },
  { label: 'Avg Handle Time', value: '4m 12s', icon: Clock, trend: '+0.3m', positive: false },
  { label: 'Resolved Today', value: '18', icon: CheckCircle2, trend: '+6', positive: true },
];

const RECENT = [
  { action: 'Booking created', ref: 'BKG-001234', time: '2 min ago', type: 'booking' },
  { action: 'PNR imported', ref: 'ABC123', time: '15 min ago', type: 'pnr' },
  { action: 'Support ticket opened', ref: 'SUP-5678', time: '1 hr ago', type: 'support' },
  { action: 'Quote approved', ref: 'QT-0041', time: '2 hr ago', type: 'quote' },
];

export default function TerminalPage() {
  const navigate = useNavigate();
  const { channel, setChannel, posTag, setPosTag } = useCustomer();

  const quickActions = [
    { id: 'blank-booking', label: 'Blank Booking', icon: Plus, desc: 'Create a new booking from scratch', path: '/blank-booking' },
    { id: 'import-pnr', label: 'Import PNR', icon: Upload, desc: 'Retrieve from GDS or upload CSV', path: '/import-pnr' },
    { id: 'support', label: 'New Support Record', icon: Phone, desc: 'Log a customer inquiry', path: '/support/new' },
    { id: 'queues', label: 'View Queues', icon: Layers, desc: 'Monitor all booking queues', path: '/queues' },
  ];

  return (
    <div className="max-w-[1600px] mx-auto px-6 pb-20 pt-8 animate-fade space-y-10">
      {/* Page Header */}
      <div className="border-b border-black/5 pb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-light tracking-tight text-black leading-tight">
              Consultant <span className="font-bold">Terminal</span>
            </h1>
            <p className="text-sm text-black/40 mt-2 font-medium">
              Search customers, create bookings, and manage support requests in real-time.
            </p>
          </div>
          {/* Live Activity Indicator */}
          <div className="flex items-center gap-2 px-4 py-2 bg-black rounded-xl shadow-lg">
            <Activity size={14} className="text-apple-blue animate-pulse" />
            <span className="text-[11px] font-bold text-apple-blue tracking-widest uppercase">Live</span>
          </div>
        </div>

        {/* Channel / POS Switcher */}
        <div className="flex items-center gap-3 mt-6">
          <div className="flex bg-black/5 p-1 rounded-xl">
            {['B2C', 'B2B', 'CORP'].map((ch) => (
              <button
                key={ch}
                onClick={() => setChannel(ch)}
                className={cn(
                  'px-5 py-2.5 text-[11px] font-bold rounded-xl tracking-widest uppercase transition-all',
                  channel === ch ? 'bg-black text-apple-blue shadow-sm' : 'text-black/40 hover:text-black/60'
                )}
              >
                {ch}
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-black/10" />
          <div className="flex bg-black/5 p-1 rounded-xl">
            {['B2C-CC', 'B2B-CC', 'CORP-CC'].map((tag) => (
              <button
                key={tag}
                onClick={() => setPosTag(tag)}
                className={cn(
                  'px-4 py-2.5 text-[10px] font-bold rounded-xl tracking-widest uppercase transition-all',
                  posTag === tag ? 'bg-apple-blue/20 text-apple-blue border border-apple-blue/30' : 'text-black/30 hover:text-black/50'
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Smart Search */}
      <SmartSearchBar onSelect={(type, id) => console.log('Selected:', type, id)} />

      {/* Live Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {STATS.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
              <stat.icon size={80} />
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
                <stat.icon size={18} className="text-apple-blue" />
              </div>
              <span className={cn(
                'px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest',
                stat.positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
              )}>
                {stat.trend}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-black tabular-nums">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest mb-5">Quick Actions</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => navigate(action.path)}
              className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all text-left group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-apple-blue/0 to-apple-blue/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-11 h-11 bg-black rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform relative z-10">
                <action.icon size={20} className="text-apple-blue" />
              </div>
              <h3 className="text-sm font-bold text-black mb-1 relative z-10">{action.label}</h3>
              <p className="text-[10px] text-black/30 font-medium relative z-10">{action.desc}</p>
              <ArrowRight size={14} className="absolute bottom-5 right-5 text-black/10 group-hover:text-apple-blue group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden">
        <div className="flex items-center gap-4 px-10 py-8 border-b border-black/5">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
            <Zap size={18} className="text-apple-blue" />
          </div>
          <div>
            <h2 className="text-base font-bold text-black">Recent Activity</h2>
            <p className="text-[10px] text-black/30 font-medium uppercase tracking-widest">Last 24 hours</p>
          </div>
        </div>
        <div className="divide-y divide-black/5">
          {RECENT.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between px-10 py-5 hover:bg-black/[0.01] transition-colors">
              <div className="flex items-center gap-4">
                <span className="w-2 h-2 rounded-full bg-apple-blue/40" />
                <div>
                  <p className="text-sm font-semibold text-black">{item.action}</p>
                  <p className="text-[11px] text-black/30 font-mono mt-0.5">{item.ref}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-black/20 uppercase tracking-widest">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}