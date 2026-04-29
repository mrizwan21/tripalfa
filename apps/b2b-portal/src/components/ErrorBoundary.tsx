import { Component } from 'react';
import { AlertTriangle, RotateCcw, ShieldCheck, Database } from 'lucide-react';

interface Props {
 children: React.ReactNode;
}

interface State {
 hasError: boolean;
 error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
 constructor(props: Props) {
 super(props);
 this.state = { hasError: false, error: null };
 }

 static getDerivedStateFromError(error: Error): State {
 return { hasError: true, error };
 }

 componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
 console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
 }

 handleReset = () => {
 this.setState({ hasError: false, error: null });
 };

 render() {
 if (this.state.hasError) {
 return (
 <div className="min-h-screen bg-light-gray flex items-center justify-center p-8">
 <div className="bg-white border border-navy/5 rounded-xl p-16 max-w-lg w-full text-center shadow-sm relative overflow-hidden">
 <div className="absolute top-0 right-0 p-24 opacity-5 rotate-12 pointer-events-none">
 <AlertTriangle size={200} />
 </div>

 <div className="relative z-10 space-y-8">
 <div className="w-20 h-20 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center mx-auto shadow-sm">
 <AlertTriangle size={40} className="text-rose-500"/>
 </div>

 <div>
 <h2 className="text-2xl font-semibold text-pure-black mb-3">
 Component <span className="text-rose-500">Failure</span>
 </h2>
 <p className="text-[11px] font-medium text-pure-black/40 leading-relaxed">
 An unexpected error occurred in this module. The error has been logged for diagnostics.
 </p>
 </div>

 {this.state.error && (
 <div className="bg-light-gray border border-navy/5 rounded-xl p-4 text-left">
 <p className="text-[10px] font-mono text-rose-600 break-words">
 {this.state.error.message}
 </p>
 </div>
 )}

 <div className="flex items-center justify-center gap-3">
 <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 rounded-xl border border-rose-100">
 <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"/>
 <span className="text-[9px] font-semibold text-rose-600">ERROR_CAPTURED</span>
 </div>
 <div className="flex items-center gap-2 px-3 py-1.5 bg-apple-blue/10 rounded-xl border border-apple-blue/20">
 <ShieldCheck size={10} className="text-apple-blue"/>
 <span className="text-[9px] font-semibold text-apple-blue">BOUNDARY_ACTIVE</span>
 </div>
 </div>

 <button
 onClick={this.handleReset}
 className="px-10 py-5 bg-pure-black text-apple-blue text-[11px] font-semibold tracking-tight rounded-xl shadow-sm hover:bg-black transition-all flex items-center gap-3 mx-auto"
 >
 <RotateCcw size={16} /> Retry Module
 </button>

 <div className="flex items-center justify-center gap-2 text-[9px] font-semibold text-pure-black/20">
 <Database size={10} />
 Error Boundary v1.0
 </div>
 </div>
 </div>
 </div>
 );
 }

 return this.props.children;
 }
}