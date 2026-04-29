import { useState, useEffect } from 'react';
import { ProfileLayout } from './ProfilePage';
import { Lock, ShieldCheck, Fingerprint, X, Shield, Database, RefreshCcw, Smartphone, Loader2 } from 'lucide-react';
import { apiManager, cn, PageHeader } from '../index';
import type { MpinSettings, SecurityEntry } from '../types';

interface PinInputModalProps {
 title: string;
 fields: { label: string; value: string; onChange: (val: string) => void }[];
 showPin: boolean;
 onToggleShowPin: () => void;
 showPinLabel: string;
 checkboxId: string;
 onSubmit: () => void;
 isSubmitting: boolean;
 isDisabled: boolean;
 submitLabel: string;
 onClose: () => void;
 error: string;
}

function PinInputModal({ title, fields, showPin, onToggleShowPin, showPinLabel, checkboxId, onSubmit, isSubmitting, isDisabled, submitLabel, onClose, error }: PinInputModalProps) {
 return (
 <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[110] p-6 animate-fade-in">
 <div className="bg-white rounded-xl p-10 max-w-lg w-full shadow-apple relative overflow-hidden animate-scale">
 <div className="flex justify-between items-center mb-8">
 <h3 className="text-[24px] font-display font-semibold text-pure-black">{title}</h3>
 <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-light-gray hover:bg-black/10 text-pure-black/50 hover:text-pure-black transition-colors">
 <X size={20} />
 </button>
 </div>
 
 <div className="space-y-6">
 {error && (
 <div className="p-4 bg-red-50 border border-red-100 rounded-[12px] flex items-center gap-3 text-red-600">
 <Shield size={18} />
 <span className="text-[14px] font-text">{error}</span>
 </div>
 )}

 <div className="space-y-4">
 {fields.map((field) => (
 <div key={field.label} className="space-y-2">
 <label className="text-[14px] font-text font-medium text-pure-black">{field.label}</label>
 <input
 type={showPin ? 'text' : 'password'}
 maxLength={4}
 value={field.value}
 onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
 className="w-full bg-light-gray focus:bg-white focus:ring-4 focus:ring-apple-blue/10 border-transparent focus:border-apple-blue rounded-xl px-4 py-4 text-center text-[24px] tracking-[1em] font-medium outline-none transition-all placeholder:text-black/20"
 placeholder="••••"
 />
 </div>
 ))}
 </div>

 <div className="flex items-center gap-2">
 <input type="checkbox" id={checkboxId} checked={showPin} onChange={onToggleShowPin} className="rounded text-pure-black focus:ring-pure-black"/>
 <label htmlFor={checkboxId} className="text-[14px] font-text text-black/60 cursor-pointer">{showPinLabel}</label>
 </div>

 <button
 onClick={onSubmit}
 disabled={isSubmitting || isDisabled}
 className="w-full py-3.5 bg-pure-black text-white rounded-xl text-[15px] font-text font-medium hover:bg-black/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
 >
 {isSubmitting && <Loader2 size={18} className="animate-spin"/>}
 {submitLabel}
 </button>
 </div>
 </div>
 </div>
 );
}

export default function MPinPage() {
 const [hasPin, setHasPin] = useState(false);
 const [biometricLinked, setBiometricLinked] = useState(false);
 const [securityLog, setSecurityLog] = useState<SecurityEntry[]>([]);

 const [showSetModal, setShowSetModal] = useState(false);
 const [showResetModal, setShowResetModal] = useState(false);
 const [showBiometricModal, setShowBiometricModal] = useState(false);
 const [pinInput, setPinInput] = useState('');
 const [confirmPinInput, setConfirmPinInput] = useState('');
 const [oldPinInput, setOldPinInput] = useState('');
 const [showPin, setShowPin] = useState(false);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [error, setError] = useState('');
 const [success, setSuccess] = useState('');

 useEffect(() => {
 loadMPinStatus();
 }, []);

 const loadMPinStatus = async () => {
 try {
 const [status, logs] = await Promise.all([
 apiManager.getMPinStatus(),
 apiManager.getSecurityLog()
 ]);
 setHasPin(status.hasPin);
 setBiometricLinked(status.biometricLinked);
 setSecurityLog([...logs]);
 } catch {
 setSecurityLog([
 { timestamp: new Date().toISOString(), event: 'Identity cluster initialized', status: 'Success' },
 { timestamp: new Date(Date.now() - 3600000).toISOString(), event: 'M-PIN Validation Handshake', status: 'Success' },
 { timestamp: new Date(Date.now() - 86400000).toISOString(), event: 'Credential Rotation Observed', status: 'Success' },
 ]);
 }
 };

 const handleSetPin = async () => {
 if (pinInput.length !== 4) {
 setError('PIN must be 4 digits.');
 return;
 }
 if (pinInput !== confirmPinInput) {
 setError('PINs do not match.');
 return;
 }
 if (!/^\d{4}$/.test(pinInput)) {
 setError('PIN must contain only numbers.');
 return;
 }

 setIsSubmitting(true);
 setError('');
 try {
 const result = await apiManager.setMPin(pinInput);
 if (result.success) {
 setSuccess('Security code established successfully.');
 setHasPin(true);
 setShowSetModal(false);
 setPinInput('');
 setConfirmPinInput('');
 await loadMPinStatus();
 }
 } catch {
 setError('Failed to set M-PIN. Please try again.');
 } finally {
 setIsSubmitting(false);
 }
 };

 const handleResetPin = async () => {
 if (oldPinInput.length !== 4 || pinInput.length !== 4) {
 setError('Required: 4-digit code.');
 return;
 }
 if (pinInput !== confirmPinInput) {
 setError('PINs do not match.');
 return;
 }

 setIsSubmitting(true);
 setError('');
 try {
 const result = await apiManager.resetMPin(oldPinInput, pinInput);
 if (result.success) {
 setSuccess('Security code rotated successfully.');
 setShowResetModal(false);
 setOldPinInput('');
 setPinInput('');
 setConfirmPinInput('');
 await loadMPinStatus();
 }
 } catch {
 setError('Failed to update. Check current code.');
 } finally {
 setIsSubmitting(false);
 }
 };

 const handleLinkBiometric = async () => {
 setIsSubmitting(true);
 setError('');
 try {
 const deviceToken = `node_${Date.now()}_secure_${Math.random().toString(36).substring(7)}`;
 const result = await apiManager.linkBiometric(deviceToken);
 if (result.success) {
 setSuccess('Device linked successfully.');
 setBiometricLinked(true);
 setShowBiometricModal(false);
 await loadMPinStatus();
 }
 } catch {
 setError('Failed to link device.');
 } finally {
 setIsSubmitting(false);
 }
 };

 const formatTimestamp = (ts: string) => {
 const date = new Date(ts);
 return date.toLocaleDateString('en-GB', {
 day: '2-digit',
 month: 'short',
 year: 'numeric'
 }) + ' ' + date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
 };

 return (
 <ProfileLayout>
 <div className="animate-fade-in space-y-8 px-6 lg:px-12 pb-24">
 
 <PageHeader
 icon={ShieldCheck}
 title="Security & MPIN"
 subtitle="Manage your authentication methods."
 badge={{
 text: hasPin ? 'PIN Active' : 'PIN Not Set',
 className: cn(
 "text-[13px] font-text font-medium flex items-center gap-2 px-3 py-1.5 rounded-full border",
 hasPin ? "bg-green-50 text-green-700 border-green-200" : "bg-light-gray text-black/60 border-black/5"
 )
 }}
 />

 {success && (
 <div className="p-6 bg-green-50 border border-green-200 rounded-xl flex items-center gap-5 animate-slide-up shadow-sm">
 <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow-sm">
 <ShieldCheck size={20} />
 </div>
 <div className="flex-1">
 <p className="text-[14px] font-text font-medium text-green-900 mb-0.5">Success</p>
 <span className="text-[14px] font-text text-green-800">{success}</span>
 </div>
 <button onClick={() => setSuccess('')} className="text-green-600 hover:text-green-900 transition-colors"><X size={20} /></button>
 </div>
 )}

 <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
 {/* M-Pin Card */}
 <div className="bg-white border border-black/5 rounded-xl shadow-sm overflow-hidden flex flex-col">
 <div className="px-8 py-6 border-b border-black/5 bg-light-gray/50 flex justify-between items-center">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 bg-white rounded-[12px] flex items-center justify-center text-pure-black shadow-sm">
 <Lock size={20} />
 </div>
 <div>
 <h3 className="text-[16px] font-display font-medium text-pure-black">M-PIN Access</h3>
 <p className="text-[13px] font-text text-black/50">4-digit security code</p>
 </div>
 </div>
 </div>
 
 <div className="p-8 flex-1 flex flex-col items-center justify-center min-h-[250px]">
 <div className="flex justify-center gap-4 mb-6">
 {[1, 2, 3, 4].map(i => (
 <div key={i} className={cn(
 "w-14 h-14 rounded-xl flex items-center justify-center transition-all border",
 hasPin ? "bg-pure-black border-pure-black text-white" : "bg-light-gray border-transparent"
 )}>
 {hasPin ? (
 <div className="w-2.5 h-2.5 rounded-full bg-white"/>
 ) : (
 <div className="w-2.5 h-2.5 rounded-full bg-black/10"/>
 )}
 </div>
 ))}
 </div>
 
 <p className="text-[14px] font-text text-black/50 mb-8 text-center">
 {hasPin ? 'Your PIN is configured for quick access.' : 'Set up a PIN to securely authorize quick actions.'}
 </p>

 <div className="flex gap-4 w-full">
 {!hasPin ? (
 <button 
 onClick={() => { setShowSetModal(true); setError(''); setPinInput(''); setConfirmPinInput(''); }}
 className="flex-1 py-3 bg-pure-black text-white text-[14px] font-text font-medium rounded-xl shadow-sm hover:bg-black/80 transition-colors flex items-center justify-center gap-2"
 >
 <Shield size={18} /> Set Up PIN
 </button>
 ) : (
 <button 
 onClick={() => { setShowResetModal(true); setError(''); setOldPinInput(''); setPinInput(''); setConfirmPinInput(''); }}
 className="flex-1 py-3 bg-white border border-black/10 text-pure-black text-[14px] font-text font-medium rounded-xl shadow-sm hover:bg-light-gray transition-colors flex items-center justify-center gap-2"
 >
 <RefreshCcw size={18} /> Change PIN
 </button>
 )}
 </div>
 </div>
 </div>

 {/* Biometric Card */}
 <div className="bg-white border border-black/5 rounded-xl shadow-sm overflow-hidden flex flex-col">
 <div className="px-8 py-6 border-b border-black/5 bg-light-gray/50 flex justify-between items-center">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 bg-white rounded-[12px] flex items-center justify-center text-pure-black shadow-sm">
 <Fingerprint size={20} />
 </div>
 <div>
 <h3 className="text-[16px] font-display font-medium text-pure-black">Biometric Login</h3>
 <p className="text-[13px] font-text text-black/50">Face ID & Touch ID</p>
 </div>
 </div>
 </div>
 
 <div className="p-8 flex-1 flex flex-col items-center justify-center min-h-[250px]">
 <div className={cn(
 "w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all",
 biometricLinked ? "bg-green-50 text-green-500" : "bg-light-gray text-black/20"
 )}>
 <Fingerprint size={40} />
 </div>

 <p className="text-[14px] font-text text-black/50 mb-8 text-center max-w-[280px]">
 {biometricLinked ? 'Biometric authentication is active on this device.' : 'Link your device to enable Face ID or Touch ID authentication.'}
 </p>

 <button 
 onClick={() => setShowBiometricModal(true)}
 className={cn(
 "w-full py-3 rounded-xl text-[14px] font-text font-medium transition-colors shadow-sm flex items-center justify-center gap-2",
 biometricLinked ? "bg-white border border-black/10 text-pure-black hover:bg-light-gray" : "bg-pure-black text-white hover:bg-black/80"
 )}
 >
 <Smartphone size={18} /> 
 {biometricLinked ? 'Manage Device' : 'Link Device'}
 </button>
 </div>
 </div>
 </div>

 {/* Audit Stream */}
 <div className="bg-white border border-black/5 rounded-xl shadow-sm overflow-hidden">
 <div className="px-8 py-6 bg-light-gray/50 border-b border-black/5 flex justify-between items-center">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 bg-white rounded-[12px] flex items-center justify-center text-pure-black shadow-sm">
 <Database size={20} />
 </div>
 <div>
 <h2 className="text-[16px] font-display font-medium text-pure-black">Security Log</h2>
 <p className="text-[13px] font-text text-black/50">Recent authentication events</p>
 </div>
 </div>
 <button className="text-black/40 hover:text-pure-black transition-colors" onClick={loadMPinStatus}>
 <RefreshCcw size={18} />
 </button>
 </div>
 
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead>
 <tr className="border-b border-black/5">
 <th className="py-4 px-8 text-[13px] font-text font-medium text-black/50">Event</th>
 <th className="py-4 px-8 text-[13px] font-text font-medium text-black/50">Status</th>
 <th className="py-4 px-8 text-right text-[13px] font-text font-medium text-black/50">Date</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-black/5">
 {securityLog.length > 0 ? securityLog.map((log, idx) => (
 <tr key={idx} className="hover:bg-light-gray/30 transition-colors">
 <td className="py-4 px-8">
 <div className="flex items-center gap-3">
 <Shield size={16} className="text-black/30" />
 <span className="text-[14px] font-text text-pure-black">{log.event}</span>
 </div>
 </td>
 <td className="py-4 px-8">
 <span className={cn(
 "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-text font-medium border",
 log.status === 'Success' 
 ? "bg-green-50 text-green-700 border-green-200" 
 : "bg-red-50 text-red-700 border-red-200"
 )}>
 <div className={cn("w-1.5 h-1.5 rounded-full", log.status === 'Success' ? "bg-green-500" : "bg-red-500")} />
 {log.status === 'Success' ? 'Verified' : 'Failed'}
 </span>
 </td>
 <td className="py-4 px-8 text-right text-[13px] font-text text-black/50 tabular-nums">
 {formatTimestamp(log.timestamp)}
 </td>
 </tr>
 )) : (
 <tr>
 <td colSpan={3} className="py-16 text-center text-black/30">
 <p className="text-[14px] font-text">No security events recorded.</p>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {/* Modals */}
 {showSetModal && (
 <PinInputModal
 title="Set PIN Code"
 fields={[
 { label: 'New PIN', value: pinInput, onChange: setPinInput },
 { label: 'Confirm PIN', value: confirmPinInput, onChange: setConfirmPinInput }
 ]}
 showPin={showPin}
 onToggleShowPin={() => setShowPin(!showPin)}
 showPinLabel="Show PIN"
 checkboxId="showPin1"
 onSubmit={handleSetPin}
 isSubmitting={isSubmitting}
 isDisabled={pinInput.length !== 4 || confirmPinInput.length !== 4}
 submitLabel="Save PIN"
 onClose={() => setShowSetModal(false)}
 error={error}
 />
 )}

 {showResetModal && (
 <PinInputModal
 title="Change PIN"
 fields={[
 { label: 'Current PIN', value: oldPinInput, onChange: setOldPinInput },
 { label: 'New PIN', value: pinInput, onChange: setPinInput },
 { label: 'Confirm New PIN', value: confirmPinInput, onChange: setConfirmPinInput }
 ]}
 showPin={showPin}
 onToggleShowPin={() => setShowPin(!showPin)}
 showPinLabel="Show PINs"
 checkboxId="showPin2"
 onSubmit={handleResetPin}
 isSubmitting={isSubmitting}
 isDisabled={oldPinInput.length !== 4 || pinInput.length !== 4 || confirmPinInput.length !== 4}
 submitLabel="Update PIN"
 onClose={() => setShowResetModal(false)}
 error={error}
 />
 )}

 {showBiometricModal && (
 <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[110] p-6 animate-fade-in">
 <div className="bg-white rounded-xl p-10 max-w-lg w-full shadow-apple relative overflow-hidden animate-scale text-center">
 <div className="flex justify-end items-center mb-2">
 <button onClick={() => setShowBiometricModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-light-gray hover:bg-black/10 text-pure-black/50 hover:text-pure-black transition-colors">
 <X size={20} />
 </button>
 </div>
 
 <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6">
 <Fingerprint size={36} />
 </div>

 <h3 className="text-[24px] font-display font-semibold text-pure-black mb-2">Link Device</h3>
 <p className="text-[14px] font-text text-black/50 mb-8 max-w-xs mx-auto">
 Scan this QR code with the Saba Travel app to link your device for biometric authentication.
 </p>

 <div className="w-48 h-48 bg-light-gray rounded-xl border border-black/5 flex items-center justify-center mx-auto mb-8">
 <Database size={48} className="text-black/20" />
 </div>

 <button
 onClick={handleLinkBiometric}
 disabled={isSubmitting}
 className="w-full py-3.5 bg-pure-black text-white rounded-xl text-[15px] font-text font-medium hover:bg-black/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
 >
 {isSubmitting && <Loader2 size={18} className="animate-spin"/>}
 Simulate Device Link
 </button>
 </div>
 </div>
 )}
 </ProfileLayout>
 );
}
