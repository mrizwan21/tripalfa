import { useLocation } from 'react-router-dom';
import TopNav from './TopNav';
import Footer from './Footer';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { toasts = [], removeToast } = useApp();

  const getIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 size={16} className="text-apple-blue"/>;
      case 'warning': return <AlertTriangle size={16} className="text-amber-500"/>;
      case 'error': return <XCircle size={16} className="text-red-500"/>;
      default: return <Info size={16} className="text-blue-500"/>;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col font-sans selection:bg-apple-blue selection:text-white relative overflow-hidden">
      <div className="relative z-10 flex flex-col min-h-screen">
        <TopNav />
        <main id="main-content" key={location.pathname} className="flex-1 w-full max-w-[1440px] mx-auto px-6 py-8 animate-fade">
          {children}
        </main>
        <Footer />
      </div>

      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4 pointer-events-none">
        {toasts.map((toast: any) => (
          <div key={toast.id} className="pointer-events-auto flex items-center gap-4 px-6 py-4 rounded-xl bg-black/80 backdrop-blur-xl shadow-2xl shrink-0 min-w-[320px] max-w-md animate-fade">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              {getIcon(toast.type)}
            </div>
            <div className="flex-1 space-y-0.5">
              <h4 className="text-[13px] font-bold text-white">{toast.title}</h4>
              <p className="text-[12px] font-medium text-white/70 leading-tight">{toast.message}</p>
            </div>
            <button onClick={() => removeToast(toast.id)} className="w-6 h-6 rounded-md hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
