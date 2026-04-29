import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { apiManager } from '../index';
import { 
  ShieldCheck, 
  Activity, 
  AlertTriangle, 
  Globe, 
  User, 
  Key, 
  RefreshCw, 
  ArrowRight, 
  Database 
} from 'lucide-react';

export default function LoginPage() {
 const [agentCode, setAgentCode] = useState('');
 const [username, setUsername] = useState('');
 const [password, setPassword] = useState('');
 const [error, setError] = useState('');
 const [isLoading, setIsLoading] = useState(false);
 const { setIsLoggedIn } = useApp();
 const navigate = useNavigate();

 const handleLogin = async (e: React.FormEvent) => {
 e.preventDefault();
 setIsLoading(true);
 setError('');

 if (agentCode.toLowerCase() === 'agency' && username.toLowerCase() === 'admin' && password === 'password') {
 apiManager.setTenantContext('demo-tenant', 'demo-token', 'demo-user');
 setIsLoggedIn(true);
 navigate('/');
 setIsLoading(false);
 return;
 }

 try {
 const response = await apiManager.login(agentCode, username, password) as {
 success: boolean; tenantId: string; token: string; userId: string;
 };

 if (response && response.success) {
 apiManager.setTenantContext(response.tenantId, response.token, response.userId);
 setIsLoggedIn(true);
 navigate('/');
 } else {
 setError('Verification failed. Please check your credentials.');
 }
 } catch {
 setError('Handshake Error: Failed to establish authentication.');
 } finally {
 setIsLoading(false);
 }
 };

 return (
 <div className="min-h-screen flex selection:bg-apple-blue selection:text-white bg-white font-sans overflow-hidden">
 
 {/* Visual Left Panel */}
 <div className="hidden lg:flex lg:w-[45%] bg-pure-black relative overflow-hidden">
 <div className="absolute inset-0 z-10 pointer-events-none">
 <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-apple-blue/10 rounded-full blur-[140px] animate-pulse"/>
 <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-white/5 rounded-full blur-[150px]"/>
 </div>
 
 <div className="relative z-20 flex flex-col justify-between p-20 w-full">
 <div className="flex items-center gap-4 group cursor-default">
 <div className="w-12 h-12 bg-white text-pure-black rounded-xl flex items-center justify-center shadow-lg transition-transform duration-700 group-hover:rotate-6">
 <ShieldCheck size={28} />
 </div>
 <div>
 <span className="text-[28px] font-display font-semibold text-white tracking-tight">Saba <span className="text-apple-blue">B2B</span></span>
 </div>
 </div>
 
 <div className="max-w-xl space-y-8">
 <div className="space-y-2">
 <span className="text-[12px] font-text font-semibold text-apple-blue tracking-tight">Enterprise Portal</span>
 <h1 className="text-[56px] xl:text-[72px] font-display font-bold text-white leading-[1.05]">
 Seamlessly <span className="text-apple-blue">Connected</span>.
 </h1>
 </div>
 <p className="text-[18px] font-text text-white/40 leading-relaxed max-w-md">
 Access the largest repository of global flight and hospitality inventory in one unified workspace.
 </p>
 
 <div className="flex items-center gap-10 pt-4">
 <div className="space-y-1">
 <div className="text-[11px] font-text font-bold text-white/30 tracking-tight">Airlines</div>
 <div className="text-[24px] font-display font-bold text-white tabular-nums">500+</div>
 </div>
 <div className="w-px h-10 bg-white/10"/>
 <div className="space-y-1">
 <div className="text-[11px] font-text font-bold text-white/30 tracking-tight">Hotels</div>
 <div className="text-[24px] font-display font-bold text-white tabular-nums">2M+</div>
 </div>
 </div>
 </div>

 <div className="flex items-center gap-4 border-t border-white/5 pt-10">
 <div className="w-10 h-10 bg-white/5 rounded-[12px] flex items-center justify-center text-apple-blue shadow-inner border border-white/5">
 <Activity size={20} />
 </div>
 <div className="text-[12px] font-text text-white/30">
 Global Systems Nominal • <span className="text-apple-blue/60 font-medium">Verified</span>
 </div>
 </div>
 </div>
 </div>

 {/* Auth Panel */}
 <div className="flex-1 flex items-center justify-center p-8 lg:p-24 bg-white">
 <div className="w-full max-w-md space-y-12">
 <div className="space-y-3 text-center lg:text-left">
 <h2 className="text-[32px] font-display font-bold text-pure-black">Sign In</h2>
 <p className="text-[15px] font-text text-black/40">Enter your credentials to access your dashboard.</p>
 </div>

 {error && (
 <div className="p-4 rounded-[12px] bg-red-50 border border-red-100 text-red-700 flex items-center gap-3 animate-slide-up text-[14px] font-text">
 <AlertTriangle size={18} />
 <span>{error}</span>
 </div>
 )}

 <form onSubmit={handleLogin} className="space-y-6">
 <div className="space-y-2">
 <label className="text-[13px] font-text font-semibold text-pure-black ml-1">Agency Code</label>
 <div className="relative">
 <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20"/>
 <input
 type="text"
 className="w-full bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/5 border-transparent focus:border-apple-blue rounded-xl pl-11 pr-4 py-3 text-[14px] font-text outline-none transition-all"
 placeholder="AGENCY"
 required
 value={agentCode}
 onChange={(e) => setAgentCode(e.target.value)}
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-[13px] font-text font-semibold text-pure-black ml-1">Username</label>
 <div className="relative">
 <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20"/>
 <input
 type="text"
 className="w-full bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/5 border-transparent focus:border-apple-blue rounded-xl pl-11 pr-4 py-3 text-[14px] font-text outline-none transition-all"
 placeholder="admin"
 required
 value={username}
 onChange={(e) => setUsername(e.target.value.toLowerCase())}
 />
 </div>
 </div>

 <div className="space-y-2">
 <div className="flex justify-between items-center ml-1">
 <label className="text-[13px] font-text font-semibold text-pure-black">Password</label>
 <button type="button" className="text-[12px] font-text font-medium text-apple-blue hover:underline">Forgot?</button>
 </div>
 <div className="relative">
 <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20"/>
 <input
 type="password"
 className="w-full bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/5 border-transparent focus:border-apple-blue rounded-xl pl-11 pr-4 py-3 text-[14px] font-text outline-none transition-all"
 placeholder="••••••••"
 required
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 />
 </div>
 </div>

 <button
 type="submit"
 disabled={isLoading}
 className="w-full h-14 bg-pure-black text-white rounded-xl text-[15px] font-text font-semibold hover:bg-black/90 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-30"
 >
 {isLoading ? (
 <><RefreshCw className="animate-spin" size={20} /> Signing In...</>
 ) : (
 <>Sign In <ArrowRight size={20} /></>
 )}
 </button>
 </form>

 {/* Demo Hint */}
 <div className="p-6 bg-light-gray border border-black/5 rounded-xl space-y-4">
 <div className="flex items-center gap-2 text-[12px] font-text font-bold text-black/30 tracking-tight">
 <Database size={14} /> Demo Access
 </div>
 <div className="grid grid-cols-3 gap-2">
 {[
 { l: 'Code', v: 'agency' },
 { l: 'User', v: 'admin' },
 { l: 'Pass', v: 'password' }
 ].map(item => (
 <div key={item.l} className="bg-white p-2.5 rounded-[12px] border border-black/5">
 <div className="text-[10px] font-text text-black/40 mb-0.5">{item.l}</div>
 <div className="text-[12px] font-text font-bold text-pure-black truncate">{item.v}</div>
 </div>
 ))}
 </div>
 </div>
 
 <p className="text-[12px] font-text text-black/20 text-center tracking-tight">
 &copy; 2026 Saba Travel & Holidays. All rights reserved.
 </p>
 </div>
 </div>
 </div>
 );
}
