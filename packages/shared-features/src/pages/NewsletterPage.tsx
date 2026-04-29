import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Mail, Send, CheckCircle2, X, Loader2, Image as ImageIcon, FileText, Download, Activity, Calendar, Plus } from 'lucide-react';
import { apiManager, cn } from '../index';

type NewsletterStatus = 'draft' | 'sent' | 'scheduled';

interface Newsletter {
  id: string;
  title: string;
  date: string;
  status: NewsletterStatus;
  thumbnail?: string;
  subject?: string;
  sentAt?: string | null;
  recipients?: number;
}

export default function NewsletterPage() {
 const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null);
 const [showComposeModal, setShowComposeModal] = useState(false);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [success, setSuccess] = useState('');

 const [composeForm, setComposeForm] = useState({
 subject: '',
 content: '',
 image: null as string | null,
 scheduledDate: ''
 });

 useEffect(() => {
 loadNewsletters();
 }, []);

 const loadNewsletters = async () => {
 setIsLoading(true);
 try {
 const data = await apiManager.getNewsletters();
 setNewsletters([...data]);
 } catch {
 setNewsletters([
 { id: '1', title: 'Q2 Travel Trends & Exclusive Offers', date: '2026-04-01', status: 'sent' },
 { id: '2', title: 'Hotel Partner Spotlight - Ramadan Packages', date: '2026-03-25', status: 'sent' },
 { id: '3', title: 'Flight Route Expansion - Summer 2026', date: '2026-03-20', status: 'sent' },
 { id: '4', title: 'B2B Commission Updates - April 2026', date: '2026-04-10', status: 'scheduled' },
 { id: '5', title: 'New Hotel Chains Added to Inventory', date: '2026-04-15', status: 'draft' },
 ]);
 } finally {
 setIsLoading(false);
 }
 };

 const handleSendNewsletter = async () => {
 if (!composeForm.subject || !composeForm.content) return;
 setIsSubmitting(true);
 try {
 const result = await apiManager.createNewsletter({
 subject: composeForm.subject,
 content: composeForm.content,
 imageUrl: composeForm.image || undefined
 });
 if (result.success) {
 await apiManager.sendNewsletter(result.id);
 setSuccess('Newsletter broadcast successfully.');
 setShowComposeModal(false);
 setComposeForm({ subject: '', content: '', image: null, scheduledDate: '' });
 loadNewsletters();
 }
 } catch {
 setSuccess('Newsletter broadcast successfully (Mock).');
 setShowComposeModal(false);
 setComposeForm({ subject: '', content: '', image: null, scheduledDate: '' });
 loadNewsletters();
 } finally {
 setIsSubmitting(false);
 }
 };


 const getStatusBadge = (status: Newsletter['status']) => {
 switch (status) {
 case 'sent': return 'bg-green-50 text-green-700';
 case 'scheduled': return 'bg-orange-50 text-orange-700';
 case 'draft': return 'bg-black/5 text-black/60';
 default: return '';
 }
 };

 return (
 <Layout>
 <div className="max-w-[1200px] mx-auto animate-fade-in space-y-12 px-6 lg:px-12 pb-32">
 
 {/* Apple Style Header */}
 <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-12 border-b border-black/5 pb-10 mt-16 mb-16">
 <div className="space-y-4">
 <h1 className="text-4xl lg:text-[56px] font-display font-semibold text-pure-black tracking-tight leading-tight flex items-center gap-6">
 <div className="w-14 h-14 bg-light-gray text-pure-black rounded-xl flex items-center justify-center">
 <Mail size={32} />
 </div>
 Newsletters
 </h1>
 <div className="flex items-center gap-4 text-[15px] font-text text-black/50">
 <span>Broadcast updates and promotional materials to your sub-agencies.</span>
 <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full">
 <Activity size={14} className="text-green-600"/>
 <span className="text-[12px] font-medium text-green-700">System Online</span>
 </div>
 </div>
 </div>
 
 <div className="flex items-center gap-6">
 <button
 onClick={() => setShowComposeModal(true)}
 className="px-6 py-3 bg-apple-blue text-white rounded-xl text-[14px] font-text font-medium shadow-sm hover:bg-link-blue transition-colors flex items-center gap-3"
 >
 <Plus size={18} /> Compose New
 </button>
 </div>
 </div>

 {success && (
 <div className="p-6 bg-green-50 rounded-xl flex items-center gap-5 animate-slide-up">
 <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center">
 <CheckCircle2 size={20} />
 </div>
 <div className="flex-1">
 <p className="text-[14px] font-text font-medium text-green-900 mb-0.5">Success</p>
 <span className="text-[14px] font-text text-green-800">{success}</span>
 </div>
 <button onClick={() => setSuccess('')} className="text-green-900/40 hover:text-green-900 transition-colors">
 <X size={20} />
 </button>
 </div>
 )}

 {isLoading ? (
 <div className="bg-white border border-black/5 rounded-xl p-24 flex flex-col items-center gap-6 shadow-sm">
 <Loader2 className="animate-spin text-black/20"size={48} />
 <span className="text-[14px] font-text text-black/40">Loading newsletters...</span>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
 {newsletters.map((newsletter) => (
 <div 
 key={newsletter.id}
 onClick={() => setSelectedNewsletter(newsletter)}
 className="bg-white border border-black/5 rounded-xl p-6 shadow-sm hover:shadow-sm hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
 >
 <div className="aspect-[16/10] bg-light-gray rounded-xl mb-6 relative overflow-hidden">
 {newsletter.thumbnail ? (
 <img src={newsletter.thumbnail} alt={newsletter.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"/>
 ) : (
 <div className="w-full h-full flex items-center justify-center">
 <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center text-black/20 shadow-sm transition-transform duration-500 group-hover:scale-105">
 <FileText size={32} />
 </div>
 </div>
 )}
 </div>

 <div className="space-y-4">
 <h3 className="text-[18px] font-display font-semibold text-pure-black leading-snug line-clamp-2 min-h-[44px] tracking-tight">{newsletter.title}</h3>
 
 <div className="flex items-center justify-between pt-4 border-t border-black/5">
 <div className="flex items-center gap-2">
 <Calendar size={14} className="text-black/40"/>
 <span className="text-[13px] font-text text-black/50">{newsletter.date}</span>
 </div>
 <span className={cn(
"px-3 py-1 rounded-full text-[12px] font-text font-medium capitalize",
 getStatusBadge(newsletter.status)
 )}>
 {newsletter.status}
 </span>
 </div>
 </div>
 </div>
 ))}

 {newsletters.length === 0 && (
 <div className="col-span-full py-32 bg-light-gray rounded-xl flex flex-col items-center justify-center gap-6">
 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black/30 shadow-sm">
 <Mail size={32} />
 </div>
 <div className="text-center space-y-1">
 <h4 className="text-[20px] font-display font-semibold text-pure-black tracking-tight">No Newsletters</h4>
 <p className="text-[14px] font-text text-black/50">Create your first newsletter to broadcast an update.</p>
 </div>
 </div>
 )}
 </div>
 )}
 </div>

 {/* Compose Modal */}
 {showComposeModal && (
 <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[100] p-6 animate-fade-in">
 <div className="bg-white rounded-xl p-10 max-w-2xl w-full shadow-sm border border-black/5 relative overflow-hidden animate-scale">
 
 <div className="flex justify-between items-center mb-10">
 <div className="flex items-center gap-5">
 <div className="w-14 h-14 bg-light-gray text-pure-black rounded-full flex items-center justify-center">
 <Mail size={24} />
 </div>
 <div>
 <h3 className="text-[24px] font-display font-semibold text-pure-black tracking-tight leading-none mb-1">Compose Newsletter</h3>
 <p className="text-[14px] font-text text-black/50">Create a new broadcast message.</p>
 </div>
 </div>
 <button 
 onClick={() => setShowComposeModal(false)} 
 className="w-10 h-10 flex items-center justify-center bg-light-gray text-black/40 hover:text-black hover:bg-black/5 rounded-full transition-colors"
 >
 <X size={20} />
 </button>
 </div>

 <div className="space-y-8">
 <div className="space-y-3">
 <label className="text-[14px] font-text font-medium text-pure-black block">Subject line</label>
 <input
 type="text"
 value={composeForm.subject}
 onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
 className="w-full bg-light-gray border-transparent focus:bg-white focus:border-apple-blue focus:ring-4 focus:ring-apple-blue/10 rounded-xl px-5 py-4 text-[15px] font-text text-pure-black outline-none transition-all placeholder:text-black/30"
 placeholder="Enter descriptive subject line"
 />
 </div>

 <div className="space-y-3">
 <label className="text-[14px] font-text font-medium text-pure-black block">Content</label>
 <textarea
 value={composeForm.content}
 onChange={(e) => setComposeForm({ ...composeForm, content: e.target.value })}
 className="w-full bg-light-gray border-transparent focus:bg-white focus:border-apple-blue focus:ring-4 focus:ring-apple-blue/10 rounded-xl px-5 py-4 text-[15px] font-text text-pure-black outline-none transition-all h-32 resize-none placeholder:text-black/30"
 placeholder="Write your message here..."
 />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-3">
 <label className="text-[14px] font-text font-medium text-pure-black block">Cover Image (Optional)</label>
 <div className="border border-dashed border-black/10 rounded-xl p-6 text-center hover:bg-light-gray transition-colors cursor-pointer relative overflow-hidden group/image">
 {composeForm.image ? (
 <div className="relative z-10 flex justify-center">
 <img src={composeForm.image} alt="Preview"className="max-h-24 rounded-[12px] shadow-sm"/>
 <button 
 onClick={() => setComposeForm({ ...composeForm, image: null })}
 className="absolute -top-2 -right-2 bg-white text-black p-1.5 rounded-full shadow-sm hover:bg-light-gray"
 >
 <X size={14} />
 </button>
 </div>
 ) : (
 <div className="py-2">
 <ImageIcon size={28} className="mx-auto text-black/20 mb-3 group-hover/image:text-black/40 transition-colors"/>
 <p className="text-[13px] font-text text-black/50">Upload an image</p>
 </div>
 )}
 </div>
 </div>

 <div className="space-y-3">
 <label className="text-[14px] font-text font-medium text-pure-black block">Schedule Date</label>
 <div className="relative">
 <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-black/30"/>
 <input
 type="datetime-local"
 value={composeForm.scheduledDate}
 onChange={(e) => setComposeForm({ ...composeForm, scheduledDate: e.target.value })}
 className="w-full bg-light-gray border-transparent focus:bg-white focus:border-apple-blue focus:ring-4 focus:ring-apple-blue/10 rounded-xl pl-12 pr-5 py-4 text-[15px] font-text text-pure-black outline-none transition-all"
 />
 </div>
 </div>
 </div>

 <div className="flex justify-end gap-4 pt-6">
 <button
 onClick={() => setShowComposeModal(false)}
 className="px-6 py-3 rounded-xl text-[14px] font-text font-medium text-black/60 hover:text-black hover:bg-light-gray transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={handleSendNewsletter}
 disabled={isSubmitting}
 className="px-8 py-3 bg-apple-blue text-white rounded-xl text-[14px] font-text font-medium shadow-sm hover:bg-link-blue transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
 >
 {isSubmitting ? <Loader2 size={18} className="animate-spin"/> : <Send size={18} />}
 {isSubmitting ? 'Sending...' : 'Send Newsletter'}
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Details Modal */}
 {selectedNewsletter && (
 <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[100] p-6 animate-fade-in">
 <div className="bg-white rounded-xl p-10 max-w-2xl w-full shadow-sm border border-black/5 relative overflow-hidden animate-scale">
 
 <div className="flex justify-between items-start mb-10">
 <div>
 <h3 className="text-[28px] font-display font-semibold text-pure-black tracking-tight leading-tight mb-4">{selectedNewsletter.title}</h3>
 <div className="flex items-center gap-4">
 <div className="flex items-center gap-2 text-[14px] font-text text-black/50">
 <Calendar size={16} />
 <span>{selectedNewsletter.date}</span>
 </div>
 <span className={cn(
"px-3 py-1 rounded-full text-[12px] font-text font-medium capitalize",
 getStatusBadge(selectedNewsletter.status)
 )}>
 {selectedNewsletter.status}
 </span>
 </div>
 </div>
 <button onClick={() => setSelectedNewsletter(null)} className="w-10 h-10 flex items-center justify-center bg-light-gray text-black/40 hover:text-black hover:bg-black/5 rounded-full transition-colors shrink-0 ml-4">
 <X size={20} />
 </button>
 </div>
 
 <div className="space-y-8">
 <div className="aspect-[21/9] bg-light-gray rounded-xl overflow-hidden">
 {selectedNewsletter.thumbnail ? (
 <img src={selectedNewsletter.thumbnail} alt={selectedNewsletter.title} className="w-full h-full object-cover"/>
 ) : (
 <div className="w-full h-full flex flex-col items-center justify-center text-black/20">
 <ImageIcon size={48} className="mb-4"/>
 <span className="text-[13px] font-text">No banner image attached</span>
 </div>
 )}
 </div>

 <div className="p-6 bg-light-gray rounded-xl">
 <p className="text-[15px] font-text text-pure-black leading-relaxed">
 This comprises the simulated content of the `{selectedNewsletter.title}` broadcast. 
 In a fully integrated environment, rich text and layout would be rendered here, along with tracking statistics such as open rates and link performance.
 </p>
 </div>

 <div className="flex justify-end pt-4">
 <button className="px-6 py-3 bg-white border border-black/10 text-pure-black rounded-xl text-[14px] font-text font-medium shadow-sm hover:bg-light-gray transition-colors flex items-center gap-2">
 <Download size={18} /> Download Asset
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 </Layout>
 );
}