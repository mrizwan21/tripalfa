import React, { useEffect, useState } from 'react';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import {
  Search,
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  ChevronRight,
  ChevronDown,
  Globe,
  Shield,
  Zap,
  Sparkles,
  ArrowRight,
  PlayCircle,
  BookOpen,
} from 'lucide-react';
import { DEFAULT_CONTENT_CONFIG, loadTenantContentConfig } from '@/lib/tenantContentConfig';
import { Button } from '../components/ui/button';

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left transition-all duration-200 hover:bg-gray-50 px-4 rounded-lg"
      >
        <span
          className={`text-sm font-bold transition-colors ${isOpen ? 'text-[#003b95]' : 'text-[#1d1d1f]'}`}
        >
          {question}
        </span>
        <div
          className={`p-1.5 rounded-full transition-all duration-300 flex-shrink-0 ml-4 ${isOpen ? 'bg-[#003b95] text-white rotate-180' : 'bg-gray-100 text-gray-500 rotate-0'}`}
        >
          <ChevronDown size={16} />
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <p className="text-sm text-gray-600 leading-relaxed px-4 pb-2">{answer}</p>
      </div>
    </div>
  );
};

function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState(DEFAULT_CONTENT_CONFIG.helpCenter.categories);
  const [faqs, setFaqs] = useState(DEFAULT_CONTENT_CONFIG.helpCenter.faqs);
  const [contact, setContact] = useState(DEFAULT_CONTENT_CONFIG.helpCenter.contact);
  const categoryIcons: React.ReactNode[] = [
    <HelpCircle key="help" size={24} className="text-[hsl(var(--primary))]" />,
    <BookOpen key="book" size={24} className="text-[hsl(var(--primary))]" />,
    <Shield key="shield" size={24} className="text-[hsl(var(--primary))]" />,
    <Globe key="globe" size={24} className="text-[hsl(var(--primary))]" />,
  ];

  useEffect(() => {
    const loadContent = async () => {
      const config = await loadTenantContentConfig();
      setCategories(config.helpCenter.categories);
      setFaqs(config.helpCenter.faqs);
      setContact(config.helpCenter.contact);
    };

    void loadContent();
  }, []);

  return (
    <TripLogerLayout>
      <div className="bg-[hsl(var(--background))] min-h-screen pt-20 overflow-hidden relative">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-[#003b95]/10 to-[#002a6e]/5 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10 pb-20">
          {/* Hero Section */}
          <div className="text-center pt-16 pb-12 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-full text-[#003b95] font-bold text-xs uppercase tracking-wider shadow-sm">
              <Sparkles size={14} /> Help Center & Support
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-[#003b95] tracking-tight leading-tight">
              How can we help you today?
            </h1>
            <p className="text-sm text-gray-600 max-w-xl mx-auto">
              Find answers to common questions or get in touch with our support team.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto pt-6">
              <div className="relative flex items-center bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="pl-4 text-gray-400">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  placeholder="Search for answers..."
                  className="flex-1 h-12 bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400 px-3"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <button className="h-10 px-6 mr-1 bg-[#003b95] text-white rounded-lg font-semibold text-sm shadow-md hover:bg-[#002a6e] transition-all duration-200">
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Quick Access Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
            {categories.map((cat, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-6 cursor-pointer flex flex-col justify-between h-56 group"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#003b95] to-[#002a6e] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white">{categoryIcons[i % categoryIcons.length]}</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-[#1d1d1f] group-hover:text-[#003b95] transition-colors">{cat.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[#003b95] font-semibold text-xs uppercase tracking-wider group-hover:gap-3 transition-all">
                  Browse Topics <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>

          {/* FAQ and Contact Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-20 items-start">
            {/* FAQ Side */}
            <div className="lg:col-span-8 space-y-8">
              <div className="space-y-2">
                <p className="text-sm font-bold text-[#003b95] uppercase tracking-wider">FAQ</p>
                <h2 className="text-2xl font-black text-[#1d1d1f]">
                  Frequently Asked Questions
                </h2>
                <p className="text-sm text-gray-600">
                  Find quick answers to the most common questions from our travelers.
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {faqs.map((faq, i) => (
                    <FAQItem key={i} question={faq.q} answer={faq.a} />
                  ))}
                </div>
                <button className="w-full py-4 border-t border-gray-100 text-gray-600 font-semibold text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  Show More Questions <ChevronDown size={14} />
                </button>
              </div>
            </div>

            {/* Contact Side */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-gradient-to-br from-[#003b95] to-[#002a6e] p-8 rounded-xl text-white space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-8 -translate-y-8" />
                <div className="space-y-2 relative z-10">
                  <h3 className="text-xl font-bold">
                    Still need help?
                  </h3>
                  <p className="text-white/70 text-sm">
                    Our support team is available 24/7 for your assistance.
                  </p>
                </div>
                <div className="space-y-3 relative z-10">
                  <button className="w-full bg-white text-[#003b95] p-3 rounded-lg flex items-center gap-4 hover:shadow-md transition-all hover:scale-[1.01]">
                    <div className="w-10 h-10 rounded-lg bg-[#003b95]/10 flex items-center justify-center">
                      <MessageCircle size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold uppercase text-gray-500">
                        Live Chat
                      </p>
                      <p className="text-sm font-bold">{contact.chatLabel}</p>
                    </div>
                  </button>
                  <button className="w-full bg-white/10 border border-white/20 text-white p-3 rounded-lg flex items-center gap-4 hover:bg-white/20 transition-all hover:scale-[1.01] backdrop-blur-sm">
                    <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                      <Phone size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold uppercase text-white/50">
                        Call Center
                      </p>
                      <p className="text-sm font-bold">{contact.phone}</p>
                    </div>
                  </button>
                  <button className="w-full bg-white/10 border border-white/20 text-white p-3 rounded-lg flex items-center gap-4 hover:bg-white/20 transition-all hover:scale-[1.01] backdrop-blur-sm">
                    <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                      <Mail size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold uppercase text-white/50">
                        Email Support
                      </p>
                      <p className="text-sm font-bold">{contact.email}</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4 group cursor-pointer hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#003b95] to-[#002a6e] flex items-center justify-center">
                    <PlayCircle size={24} className="text-white" />
                  </div>
                  <div className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold uppercase tracking-wider text-gray-600">
                    New Update
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-[#1d1d1f]">Video Tutorials</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Master the platform with our step-by-step visual guides.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#003b95] to-[#002a6e] flex items-center justify-center">
                  <BookOpen size={24} className="text-white" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-[#1d1d1f]">Developer API</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Build custom tools using our high-performance travel engine.
                  </p>
                </div>
                <button className="text-[#003b95] font-bold text-xs uppercase tracking-wider flex items-center gap-2 group/btn hover:gap-3 transition-all">
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

export default HelpCenter;
