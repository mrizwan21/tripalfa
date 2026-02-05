import React, { useState } from 'react';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import {
    Search, HelpCircle, MessageCircle, Phone, Mail,
    ChevronRight, ChevronDown, Globe, Shield,
    Zap, Sparkles, ArrowRight, PlayCircle, BookOpen
} from 'lucide-react';

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="group border-b border-gray-100 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-6 flex items-center justify-between text-left transition-all group-hover:px-2"
            >
                <span className={`text-base font-bold transition-colors ${isOpen ? 'text-[#8B5CF6]' : 'text-slate-700'}`}>
                    {question}
                </span>
                <div className={`p-2 rounded-full transition-all duration-300 ${isOpen ? 'bg-[#8B5CF6] text-white rotate-180' : 'bg-gray-50 text-slate-400 rotate-0'}`}>
                    <ChevronDown size={18} />
                </div>
            </button>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                <p className="text-slate-500 text-sm leading-relaxed max-w-2xl px-2">
                    {answer}
                </p>
            </div>
        </div>
    );
};

export default function HelpCenter() {
    const [searchQuery, setSearchQuery] = useState('');

    const categories = [
        { icon: <Zap className="text-yellow-500" />, title: 'Getting Started', desc: 'New here? Learn the basics of booking and managing your trips.' },
        { icon: <Shield className="text-blue-500" />, title: 'Trust & Safety', desc: 'How we protect your data and ensure secure transactions.' },
        { icon: <Globe className="text-green-500" />, title: 'Travel Policies', desc: 'Understanding refunds, cancellations, and visa requirements.' },
        { icon: <Sparkles className="text-purple-500" />, title: 'TripLoger Elite', desc: 'Exclusive perks and loyalty program benefits for our members.' },
    ];

    const faqs = [
        { q: 'How do I cancel my booking and get a refund?', a: 'You can cancel most bookings through your dashboard under "My Bookings". Refund eligibility depends on the specific airline or hotel policy. Once cancelled, refunds are typically processed back to your wallet or original payment method within 5-7 business days.' },
        { q: 'Can I change my flight dates after booking?', a: 'Yes, date changes are possible for most tickets, though airline change fees and fare differences may apply. You can initiate an amendment request directly from the Booking Card in your management portal.' },
        { q: 'What is the "Wallet" and how do I use it?', a: 'The TripLoger Wallet is your personal travel fund. You can top it up using credit cards or bank transfers, and use it for instant, fee-free bookings and immediate refund processing.' },
        { q: 'How do I add extra baggage or select a specific seat?', a: 'During the booking flow, you can select seats and baggage in the Ancillary stage. For existing bookings, navigate to your Booking Card and use the "Special Services" tab to add request new amenities.' },
        { q: 'Do I need a visa for my destination?', a: 'Visa requirements vary by nationality and destination. We recommend checking with the embassy of your destination country. TripLoger provides visa assistance services for select routes which you can find in the "Documents" section of your profile.' },
    ];

    return (
        <TripLogerLayout>
            <div className="bg-[#F8FAFC] min-h-screen pt-20 overflow-hidden relative">

                {/* Futuristic Background Elements */}
                <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[#8B5CF6]/10 to-transparent pointer-events-none" />
                <div className="absolute top-[10%] left-[5%] w-96 h-96 bg-purple-200/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
                <div className="absolute top-[20%] right-[5%] w-80 h-80 bg-blue-200/20 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

                <div className="container mx-auto px-4 relative z-10 pb-20">

                    {/* Hero Section */}
                    <div className="text-center pt-20 pb-16 space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 font-bold text-xs uppercase tracking-widest shadow-sm">
                            <Sparkles size={14} /> Help Center & Support
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-[#1E1B4B] tracking-tight leading-tight">
                            How can we <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] to-pink-500">navigate</span> <br /> your journey today?
                        </h1>

                        {/* Futuristic Search Bar */}
                        <div className="max-w-3xl mx-auto pt-8 relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-[#8B5CF6] to-indigo-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative flex items-center bg-white rounded-2xl shadow-2xl p-2 border border-white/20">
                                <div className="pl-6 pr-4 text-slate-400">
                                    <Search size={22} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search for answers (e.g. 'refund', 'baggage', 'elite perks')..."
                                    className="flex-1 h-14 bg-transparent outline-none text-slate-700 font-medium text-lg placeholder-slate-300"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <button className="h-14 px-10 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-purple-200 flex items-center gap-2 active:scale-95">
                                    Search
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Access Categories */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-10">
                        {categories.map((cat, i) => (
                            <div key={i} className="group bg-white/60 backdrop-blur-md p-8 rounded-[2rem] border border-white shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer flex flex-col justify-between h-64">
                                <div className="space-y-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white shadow-inner flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                        {cat.icon}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-black text-[#1E1B4B]">{cat.title}</h3>
                                        <p className="text-xs text-slate-500 leading-relaxed font-medium">{cat.desc}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-[#8B5CF6] font-black text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">
                                    Browse Topics <ArrowRight size={14} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* FAQ and Contact Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-32 items-start">

                        {/* FAQ Side */}
                        <div className="lg:col-span-8 space-y-12">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black text-[#1E1B4B]">Frequently Asked Questions</h2>
                                <p className="text-slate-500 font-medium">Instant answers to the most common queries from our global travelers.</p>
                            </div>
                            <div className="bg-white/80 backdrop-blur-md p-10 rounded-[3rem] border border-white shadow-2xl">
                                <div className="divide-y divide-gray-100">
                                    {faqs.map((faq, i) => (
                                        <FAQItem key={i} question={faq.q} answer={faq.a} />
                                    ))}
                                </div>
                                <button className="mt-10 w-full py-4 bg-gray-50 border border-gray-100 rounded-2xl text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-white hover:shadow-md transition-all flex items-center justify-center gap-2">
                                    Show More Questions <ChevronDown size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Contact Side */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="bg-[#1E1B4B] p-10 rounded-[3rem] text-white space-y-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6]/20 rounded-full blur-[60px] translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-1000" />
                                <div className="space-y-2 relative z-10">
                                    <h3 className="text-2xl font-black">Still need help?</h3>
                                    <p className="text-blue-200/70 text-sm font-medium">Our elite support desk is available <br /> 24/7 for tailored assistance.</p>
                                </div>
                                <div className="space-y-4 relative z-10">
                                    <button className="w-full bg-white text-[#1E1B4B] p-4 rounded-2xl flex items-center gap-4 hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95 group/btn">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#8B5CF6] group-hover/btn:bg-[#8B5CF6] group-hover/btn:text-white transition-colors">
                                            <MessageCircle size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] font-black uppercase text-slate-400">Live Chat</p>
                                            <p className="text-sm font-black">Startup a Conversation</p>
                                        </div>
                                    </button>
                                    <button className="w-full bg-white/10 backdrop-blur-md border border-white/10 text-white p-4 rounded-2xl flex items-center gap-4 hover:bg-white/20 transition-all hover:scale-[1.02] active:scale-95">
                                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                                            <Phone size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] font-black uppercase text-blue-200/50">Call Center</p>
                                            <p className="text-sm font-black">+966 800 123 4567</p>
                                        </div>
                                    </button>
                                    <button className="w-full bg-white/10 backdrop-blur-md border border-white/10 text-white p-4 rounded-2xl flex items-center gap-4 hover:bg-white/20 transition-all hover:scale-[1.02] active:scale-95">
                                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                                            <Mail size={20} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] font-black uppercase text-blue-200/50">Email Support</p>
                                            <p className="text-sm font-black">support@triploger.com</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-[#FFD700] to-yellow-500 p-8 rounded-[3rem] shadow-xl space-y-6 group cursor-pointer overflow-hidden relative">
                                <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-center justify-between">
                                    <div className="p-3 bg-white/20 rounded-2xl text-black">
                                        <PlayCircle size={28} />
                                    </div>
                                    <div className="px-3 py-1 bg-black/10 rounded-full text-[8px] font-black uppercase tracking-widest text-black">New Update</div>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-lg font-black text-black">Video Tutorials</h4>
                                    <p className="text-xs font-bold text-black/60 italic leading-relaxed">Master the TripLoger ecosystem in under 60 seconds with our visual guides.</p>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl space-y-6">
                                <div className="p-3 bg-blue-50 w-fit rounded-2xl text-blue-600">
                                    <BookOpen size={24} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-lg font-black text-[#1E1B4B]">Developer API</h4>
                                    <p className="text-xs font-medium text-slate-500 leading-relaxed">Build your own custom tools using our high-performance travel engine.</p>
                                </div>
                                <button className="text-[#8B5CF6] font-black text-[10px] uppercase tracking-widest flex items-center gap-2 group hover:gap-4 transition-all">
                                    View Docs <ArrowRight size={14} />
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </TripLogerLayout>
    );
}
