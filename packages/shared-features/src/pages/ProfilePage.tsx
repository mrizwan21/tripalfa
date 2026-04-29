import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { User, Users, Lock, TrendingUp, Briefcase, ShieldAlert, ChevronRight, MapPin, Phone, Mail, Building2, Fingerprint, ShieldCheck, Database, Zap, Shield, CreditCard, Globe, FileText, Percent, Eye, EyeOff, History, Settings, Bell, Key } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { UserRole } from '../types';
import { cn } from '../index';

const SIDEBAR_ITEMS = [
  { label: 'Dashboard', path: '/profile', icon: <Building2 size={18} /> },
  { label: 'User Management', path: '/profile/sub-users', icon: <Users size={18} />, allowedRoles: ['Admin'] as UserRole[] },
  { label: 'Branches', path: '/profile/branches', icon: <MapPin size={18} />, allowedRoles: ['Admin'] as UserRole[] },
  { label: 'Security & MPIN', path: '/profile/mpin', icon: <Lock size={18} /> },
  { label: 'Login History', path: '/profile/login-history', icon: <History size={18} /> },
  { label: 'Markups', path: '/profile/markup', icon: <TrendingUp size={18} />, allowedRoles: ['Admin', 'Ticketing Lead'] as UserRole[] },
  { label: 'Commissions', path: '/profile/commissions', icon: <Percent size={18} />, allowedRoles: ['Admin', 'Accountant'] as UserRole[] },
  { label: 'Travellers', path: '/profile/traveller', icon: <Briefcase size={18} /> },
  { label: 'Inventory Access', path: '/profile/provider-disable', icon: <ShieldAlert size={18} />, allowedRoles: ['Admin'] as UserRole[] },
  { label: 'Account Manager', path: '/profile/sales-rep', icon: <User size={18} /> },
];

export function ProfileLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { hasPermission, currentUserRole } = useApp();

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row gap-8 mt-12 pb-32 animate-fade-in max-w-[1440px] mx-auto px-6 lg:px-8">
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-72 shrink-0">
          <div className="bg-white rounded-xl p-6 shadow-sm sticky top-28 border border-black/5">
            <div className="px-2 mb-8">
              <h2 className="text-[18px] font-display font-semibold text-pure-black mb-1">Settings</h2>
              <div className="inline-flex px-3 py-1 bg-light-gray text-black/60 text-[12px] font-text font-medium rounded-full">
                Role: {currentUserRole}
              </div>
            </div>

            <nav className="space-y-1">
              {SIDEBAR_ITEMS.filter(item => !item.allowedRoles || hasPermission(item.allowedRoles)).map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link 
                    key={item.label} 
                    to={item.path} 
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-xl transition-colors group/nav",
                      isActive 
                        ? "bg-pure-black text-white"
                        : "text-black/60 hover:text-pure-black hover:bg-light-gray"
                    )}
                  >
                    <div className="flex items-center gap-4 text-[14px] font-text font-medium">
                      <span className={cn(
                        "transition-colors",
                        isActive ? "text-white" : "text-black/40 group-hover/nav:text-pure-black"
                      )}>
                        {item.icon}
                      </span>
                      {item.label}
                    </div>
                    <ChevronRight size={16} className={cn(
                      "transition-transform",
                      isActive ? "text-white" : "opacity-0 -translate-x-2 group-hover/nav:opacity-100 group-hover/nav:translate-x-0 text-black/20"
                    )} />
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 p-5 rounded-xl bg-light-gray border border-black/5 flex items-start gap-4">
              <ShieldCheck size={20} className="text-green-500 shrink-0 mt-0.5"/>
              <div>
                <p className="text-[13px] font-text font-medium text-pure-black mb-0.5">Secure Session</p>
                <p className="text-[12px] font-text text-black/50 leading-relaxed">Your data is encrypted end-to-end.</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </Layout>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!currentPassword) newErrors.currentPassword = 'Current password is required';
    if (!newPassword) newErrors.newPassword = 'New password is required';
    else if (newPassword.length < 8) newErrors.newPassword = 'Password must be at least 8 characters';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your new password';
    else if (newPassword !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        <div className="px-8 py-6 border-b border-black/5 bg-light-gray/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock size={18} className="text-apple-blue" />
            <h3 className="text-[15px] font-display font-semibold text-pure-black">Change Password</h3>
          </div>
          <button onClick={onClose} className="text-black/40 hover:text-pure-black transition-colors p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={32} className="text-green-500" />
            </div>
            <h4 className="text-[16px] font-display font-medium text-pure-black mb-2">Password Updated</h4>
            <p className="text-[13px] font-text text-black/50">Your password has been changed successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div>
              <label className="block text-[12px] font-text font-medium text-black/60 mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-light-gray/50 text-[14px] font-text outline-none transition-all",
                    errors.currentPassword ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" : "border-black/10 focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/10"
                  )}
                  placeholder="Enter current password"
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60">
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.currentPassword && <p className="text-[11px] text-red-500 mt-1">{errors.currentPassword}</p>}
            </div>

            <div>
              <label className="block text-[12px] font-text font-medium text-black/60 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-light-gray/50 text-[14px] font-text outline-none transition-all",
                    errors.newPassword ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" : "border-black/10 focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/10"
                  )}
                  placeholder="Enter new password"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60">
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.newPassword && <p className="text-[11px] text-red-500 mt-1">{errors.newPassword}</p>}
            </div>

            <div>
              <label className="block text-[12px] font-text font-medium text-black/60 mb-2">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-light-gray/50 text-[14px] font-text outline-none transition-all",
                    errors.confirmPassword ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" : "border-black/10 focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/10"
                  )}
                  placeholder="Confirm new password"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60">
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-[11px] text-red-500 mt-1">{errors.confirmPassword}</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 px-5 py-3 bg-light-gray text-pure-black rounded-xl text-[13px] font-text font-medium hover:bg-black/10 transition-colors">
                Cancel
              </button>
              <button type="submit" className="flex-1 px-5 py-3 bg-pure-black text-white rounded-xl text-[13px] font-text font-medium hover:bg-black/80 transition-colors shadow-sm">
                Update Password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { agent } = useApp();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Settings & Configuration state
  const [creditLimitReminder, setCreditLimitReminder] = useState(false);
  const [creditLimitThreshold, setCreditLimitThreshold] = useState('80');
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);

  const handleSaveSettings = () => {
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  return (
    <ProfileLayout>
      <div className="animate-fade-in space-y-8">
      
      {/* Banner */}
      <section className="bg-white rounded-xl p-10 relative overflow-hidden shadow-sm border border-black/5">
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
      <Building2 size={160} />
      </div>
      
      <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10">
      <div className="flex items-center gap-8">
      <div className="w-24 h-24 bg-light-gray rounded-full flex items-center justify-center shadow-sm relative shrink-0">
      <Building2 size={36} className="text-pure-black" />
      <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-sm" />
      </div>
      <div className="space-y-3">
      <h1 className="text-[32px] font-display font-semibold text-pure-black leading-none">
      {agent.agencyName}
      </h1>
      <div className="flex flex-wrap items-center gap-3">
      <div className="px-4 py-1.5 bg-light-gray rounded-full text-[13px] font-text font-medium text-black/70 flex items-center gap-2">
      <Fingerprint size={14} className="text-black/40"/> ID: {agent.agentCode}
      </div>
      <div className="px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-[13px] font-text font-medium flex items-center gap-2 border border-green-200">
      <Shield size={14} /> Verified Partner
      </div>
      </div>
      </div>
      </div>
      
      <div className="xl:pl-10 xl:border-l border-black/5 space-y-2">
      <p className="text-[13px] font-text text-black/50">Base Location</p>
      <p className="text-[20px] font-display font-medium text-pure-black flex items-center gap-2">
      Manama <span className="text-black/30 text-[16px]">/ BAH</span>
      </p>
      <div className="flex items-center gap-2 text-[13px] font-text text-black/40 mt-2">
      <MapPin size={14} /> Head Office
      </div>
      </div>
      </div>
      </section>

      {/* Documentation & Financial Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Registration Branch */}
      <div className="bg-white border border-black/5 rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="px-8 py-5 border-b border-black/5 bg-light-gray/30 flex items-center gap-3">
      <ShieldCheck size={18} className="text-apple-blue" />
      <h3 className="text-[15px] font-display font-semibold text-pure-black">Licensing & Registration</h3>
      </div>
      <div className="p-8 grid grid-cols-2 gap-6 flex-1">
      {[
      { label: 'VAT / Tax ID', value: agent.vatNo || 'VAT-9988-771', icon: FileText },
      { label: 'IATA Number', value: agent.iataNo || 'BA-12345678', icon: Globe },
      { label: 'Reg. Number', value: agent.registrationNo || 'CR-BAH-2024', icon: Database },
      { label: 'ABTA / ATOL', value: agent.abtaNo || 'N/A', icon: Shield },
      ].map((field, i) => (
      <div key={i} className="space-y-1">
      <p className="text-[11px] font-text tracking-tight text-black/40 font-bold">{field.label}</p>
      <p className="text-[14px] font-text font-medium text-pure-black">{field.value}</p>
      </div>
      ))}
      </div>
      </div>

      {/* Bank Assets Branch */}
      <div className="bg-white border border-black/5 rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="px-8 py-5 border-b border-black/5 bg-light-gray/30 flex items-center gap-3">
      <CreditCard size={18} className="text-apple-blue" />
      <h3 className="text-[15px] font-display font-semibold text-pure-black">Settlement Protocol</h3>
      </div>
      <div className="p-8 space-y-6 flex-1">
      <div className="flex justify-between items-center bg-light-gray p-4 rounded-xl border border-black/5">
      <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
      <TrendingUp size={18} className="text-green-500" />
      </div>
      <div>
      <p className="text-[12px] font-text text-black/50">Current Credit Limit</p>
      <p className="text-[18px] font-display font-bold text-pure-black">BHD 50,000.00</p>
      </div>
      </div>
      <div className="text-right">
      <p className="text-[11px] font-text text-black/40">Pay Period</p>
      <p className="text-[13px] font-text font-bold text-pure-black">Monthly</p>
      </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
      <div className="space-y-1">
      <p className="text-[11px] font-text text-black/40">TDS Applicable</p>
      <p className="text-[14px] font-text font-medium text-pure-black">2.0%</p>
      </div>
      <div className="space-y-1">
      <p className="text-[11px] font-text text-black/40">Daily Ticket Limit</p>
      <p className="text-[14px] font-text font-medium text-pure-black">BHD 10,000</p>
      </div>
      </div>
      </div>
      </div>
      </div>

      {/* Bank & Details Card */}
      <div className="bg-white border border-black/5 rounded-xl shadow-sm overflow-hidden">
      <div className="px-8 py-6 border-b border-black/5 bg-light-gray/50 flex flex-wrap gap-4 justify-between items-center">
      <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-white rounded-[12px] flex items-center justify-center text-pure-black shadow-sm">
      <Database size={20} />
      </div>
      <div>
      <h2 className="text-[16px] font-display font-medium text-pure-black">Corporate Infrastructure</h2>
      <p className="text-[13px] font-text text-black/50">Core communication and banking anchors.</p>
      </div>
      </div>
      <div className="flex gap-3">
      <button className="px-5 py-2.5 bg-pure-gray hover:bg-light-gray rounded-xl text-[13px] font-text font-medium transition-colors border border-black/5">
      Download Profile PDF
      </button>
      <button className="px-5 py-2.5 bg-pure-black text-white rounded-xl text-[13px] font-text font-medium shadow-sm hover:bg-black/80 transition-colors flex items-center gap-2">
      <Zap size={16} /> Sync Changes
      </button>
      </div>
      </div>
      
      <div className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
      {[
      { label: 'Agency Legal Name', value: agent.agencyName, icon: Building2 },
      { label: 'Primary Nexus Email', value: agent.email, icon: Mail },
      { label: 'Network Mobile', value: agent.phone || 'N/A', icon: Phone },
      { label: 'Nexus Address', value: 'Block 303, Road 321, Manama, Bahrain', icon: MapPin },
      { label: 'Bank Name', value: 'National Bank of Bahrain (NBB)', icon: CreditCard },
      { label: 'Account Identifier', value: 'BHD 9900 1122 3344', icon: Database },
      { label: 'Swift / BIC', value: 'NBBABHBM', icon: Globe },
      { label: 'Date of Operations', value: '15 Jan 2018', icon: Lock },
      ].map((field, i) => (
      <div key={i} className="flex items-start gap-4 p-5 bg-light-gray/40 rounded-xl border border-transparent hover:border-black/5 transition-all">
      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black/40 shadow-sm shrink-0 border border-black/5">
      <field.icon size={18} />
      </div>
      <div>
      <p className="text-[12px] font-text text-black/50 mb-1">{field.label}</p>
      <p className="text-[15px] font-text font-medium text-pure-black">{field.value}</p>
      </div>
      </div>
      ))}
      </div>

      {/* Status Advisory */}
      <div className="bg-light-gray rounded-xl p-6 border border-black/5">
      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
      <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-green-500 shadow-sm shrink-0">
      <ShieldCheck size={28} />
      </div>
      <div>
      <h4 className="text-[15px] font-text font-medium text-pure-black mb-1 w-full flex justify-between items-center">
      Account Status <span className="px-3 py-1 bg-green-500 text-white rounded-full text-[11px]">Active</span>
      </h4>
      <p className="text-[13px] font-text text-black/60 leading-relaxed max-w-2xl">
      Your agency is fully verified with Elite Tier Status. All global provider APIs are active and configured with standard access rights.
      </p>
      </div>
      </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mt-8 pt-8 border-t border-black/5">
      <button className="px-6 py-3 bg-pure-black text-white text-[14px] font-text font-medium rounded-xl shadow-sm hover:bg-black/80 transition-colors">
      Save Changes
      </button>
      <button 
        onClick={() => setShowPasswordModal(true)}
        className="px-6 py-3 bg-white border border-black/10 text-pure-black text-[14px] font-text font-medium rounded-xl hover:bg-light-gray transition-colors"
      >
      Change Password
      </button>
      </div>
      </div>
      </div>

      {/* Settings & Configuration Section */}
      <div className="bg-white border border-black/5 rounded-xl shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-black/5 bg-light-gray/50 flex items-center gap-4">
          <div className="w-10 h-10 bg-white rounded-[12px] flex items-center justify-center text-pure-black shadow-sm border border-black/5">
            <Settings size={20} />
          </div>
          <div>
            <h2 className="text-[16px] font-display font-medium text-pure-black">Settings & Configuration</h2>
            <p className="text-[13px] font-text text-black/50">Manage credit alerts and API integrations.</p>
          </div>
        </div>
        
        <div className="p-8 space-y-8">
          {/* Credit Limit Reminder */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-apple-blue" />
              <h3 className="text-[14px] font-display font-medium text-pure-black">Credit Limit Reminder</h3>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCreditLimitReminder(!creditLimitReminder)}
                className={cn(
                  "relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-apple-blue/20",
                  creditLimitReminder ? "bg-apple-blue" : "bg-black/20"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
                    creditLimitReminder ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
              <span className="text-[13px] font-text text-black/70">
                {creditLimitReminder ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            
            {creditLimitReminder && (
              <div className="ml-0 md:ml-16">
                <label className="block text-[12px] font-text font-medium text-black/60 mb-2">Threshold Percentage</label>
                <div className="flex items-center gap-3 max-w-xs">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={creditLimitThreshold}
                    onChange={(e) => setCreditLimitThreshold(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-black/10 bg-light-gray/50 text-[14px] font-text outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/10 transition-all"
                  />
                  <span className="text-[14px] font-text font-medium text-black/50">%</span>
                </div>
                <p className="text-[11px] font-text text-black/40 mt-2">You will be notified when credit usage reaches this threshold.</p>
              </div>
            )}
          </div>
          
          <div className="border-t border-black/5" />
          
          {/* Google API Key */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Key size={18} className="text-apple-blue" />
              <h3 className="text-[14px] font-display font-medium text-pure-black">Google API Key</h3>
            </div>
            <div className="max-w-md">
              <label className="block text-[12px] font-text font-medium text-black/60 mb-2">API Key</label>
              <input
                type="text"
                value={googleApiKey}
                onChange={(e) => setGoogleApiKey(e.target.value)}
                placeholder="Enter your Google Maps API key"
                className="w-full px-4 py-3 rounded-xl border border-black/10 bg-light-gray/50 text-[14px] font-text outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/10 transition-all"
              />
              <p className="text-[11px] font-text text-black/40 mt-2">Used for map integrations and location services.</p>
            </div>
          </div>

          {/* Manage Wallet */}
          <div className="border-t border-black/5 pt-6 space-y-4">
            <div className="flex items-center gap-3">
              <CreditCard size={18} className="text-apple-blue" />
              <h3 className="text-[14px] font-display font-medium text-pure-black">Manage Wallet</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-light-gray/40 rounded-xl border border-black/5">
                <p className="text-[10px] font-bold text-pure-black/40 tracking-tight mb-1">Main Balance</p>
                <p className="text-xl font-display font-bold text-pure-black">BHD {agent.balance?.toLocaleString() || '0.000'}</p>
              </div>
              <div className="p-5 bg-light-gray/40 rounded-xl border border-black/5">
                <p className="text-[10px] font-bold text-pure-black/40 tracking-tight mb-1">Credit Available</p>
                <p className="text-xl font-display font-bold text-apple-blue">BHD {((agent.creditLimit || 0) - (agent.balance || 0)).toLocaleString()}</p>
              </div>
            </div>
            <Link to="/wallet" className="inline-flex items-center gap-2 text-[12px] font-text font-medium text-apple-blue hover:underline">
              Go to Wallet Management <ChevronRight size={14} />
            </Link>
          </div>

          {/* Save Settings */}
          <div className="pt-4">
            <button
              onClick={handleSaveSettings}
              className={cn(
                "px-6 py-3 text-[14px] font-text font-medium rounded-xl shadow-sm transition-colors",
                settingsSaved 
                  ? "bg-green-500 text-white" 
                  : "bg-pure-black text-white hover:bg-black/80"
              )}
            >
              {settingsSaved ? 'Settings Saved!' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* Governance Document Repository */}
      <section className="bg-white border border-black/5 rounded-xl shadow-sm overflow-hidden">
      <div className="px-8 py-6 border-b border-black/5 flex justify-between items-center bg-light-gray/30">
      <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-white border border-black/5 rounded-[12px] flex items-center justify-center text-apple-blue shadow-sm">
      <ShieldCheck size={20} />
      </div>
      <div>
      <h2 className="text-[16px] font-display font-medium text-pure-black">Governance Artifacts</h2>
      <p className="text-[13px] font-text text-black/50">Mandatory registration and licensing documents for {agent.agencyName}.</p>
      </div>
      </div>
      <button className="px-5 py-2.5 bg-pure-black text-white rounded-xl text-[13px] font-text font-medium hover:bg-black/80 transition-all shadow-sm">
      Upload New Artifact
      </button>
      </div>
      <div className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[
      { name: 'Commercial Registration (CR)', date: '12 Jan 2024', size: '2.4 MB', type: 'PDF' },
      { name: 'VAT Registration Certificate', date: '05 Feb 2024', size: '1.1 MB', type: 'PDF' },
      { name: 'IATA Licensing Agreement', date: '18 Nov 2023', size: '4.8 MB', type: 'PDF' },
      ].map((doc, i) => (
      <div key={i} className="group p-5 bg-light-gray/30 border border-transparent hover:border-black/5 rounded-xl transition-all cursor-pointer">
      <div className="flex items-center gap-4 mb-4">
      <div className="w-10 h-12 bg-white rounded-lg flex items-center justify-center text-red-500 shadow-sm border border-black/5">
      <FileText size={20} />
      </div>
      <div className="flex-1 min-w-0">
      <p className="text-[14px] font-text font-semibold text-pure-black truncate">{doc.name}</p>
      <p className="text-[12px] font-text text-black/40">{doc.type} &bull; {doc.size}</p>
      </div>
      </div>
      <div className="flex items-center justify-between text-[12px] font-text">
      <span className="text-black/40">Uploaded {doc.date}</span>
      <span className="text-apple-blue font-bold opacity-0 group-hover:opacity-100 transition-opacity">View System</span>
      </div>
      </div>
      ))}
      </div>
      </div>
      </section>
      </div>
      
      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </ProfileLayout>
  );
}
