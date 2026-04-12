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
import { Button } from '@/components/ui/button';

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="group border-b border-border last:border-0">
      <Button
        variant="outline"
        size="default"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left transition-all group-hover:px-2 gap-2"
      >
        <span
          className={`text-base font-bold transition-colors ${isOpen ? 'text-[hsl(var(--primary))]' : 'text-foreground'}`}
        >
          {question}
        </span>
        <div
          className={`p-2 rounded-full transition-all duration-300 ${isOpen ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rotate-180' : 'bg-muted text-muted-foreground rotate-0'}`}
        >
          <ChevronDown size={18} />
        </div>
      </Button>
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl px-2">{answer}</p>
      </div>
    </div>
  );
};

function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState(DEFAULT_CONTENT_CONFIG.helpCenter.categories);
  const [faqs, setFaqs] = useState(DEFAULT_CONTENT_CONFIG.helpCenter.faqs);
  const [contact, setContact] = useState(DEFAULT_CONTENT_CONFIG.helpCenter.contact);
  const categoryIcons = [
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
        {/* Futuristic Background Elements */}
        <div className="absolute top-0 left-0 w-full h-[600px] bg-[hsl(var(--primary)/0.1)] pointer-events-none" />
        <div className="absolute top-[10%] left-[5%] w-96 h-96 bg-purple-200/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute top-[20%] right-[5%] w-80 h-80 bg-blue-200/20 rounded-full blur-[100px] pointer-events-none animate-pulse [animation-delay:1s]" />

        <div className="container mx-auto px-4 relative z-10 pb-20">
          {/* Hero Section */}
          <div className="text-center pt-20 pb-16 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 font-bold text-xs uppercase tracking-widest shadow-sm">
              <Sparkles size={14} /> Help Center & Support
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-[hsl(var(--primary))] tracking-tight leading-tight">
              How can we <span className="text-[#0071e3]">navigate</span> <br /> your journey today?
            </h1>

            {/* Futuristic Search Bar */}
            <div className="max-w-3xl mx-auto pt-8 relative group">
              <div className="absolute -inset-1 bg-[hsl(var(--primary))] rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative flex items-center bg-card rounded-xl shadow-2xl p-2 border border-border/20 gap-2">
                <div className="pl-6 pr-4 text-muted-foreground">
                  <Search size={22} />
                </div>
                <input
                  type="text"
                  placeholder="Search for answers (e.g. 'refund', 'baggage', 'elite perks')..."
                  className="flex-1 h-14 bg-transparent outline-none text-foreground font-medium text-lg placeholder:text-muted-foreground gap-4"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-14 px-10 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)] text-[hsl(var(--primary-foreground))] rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-purple-200 flex items-center gap-2 active:scale-95"
                >
                  Search
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Access Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-10">
            {categories.map((cat, i) => (
              <div
                key={i}
                className="group bg-card/60 backdrop-blur-md p-8 rounded-xl border border-border shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer flex flex-col justify-between h-64"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-xl bg-card shadow-inner flex items-center justify-center group-hover:scale-110 transition-transform duration-500 gap-2">
                    {categoryIcons[i % categoryIcons.length]}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-[hsl(var(--primary))]">{cat.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                      {cat.desc}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[hsl(var(--primary))] font-black text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">
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
                <h2 className="text-3xl font-black text-[hsl(var(--primary))]">
                  Frequently Asked Questions
                </h2>
                <p className="text-muted-foreground font-medium">
                  Instant answers to the most common queries from our global travelers.
                </p>
              </div>
              <div className="bg-card/80 backdrop-blur-md p-10 rounded-xl border border-border shadow-2xl">
                <div className="divide-y divide-border">
                  {faqs.map((faq, i) => (
                    <FAQItem key={i} question={faq.q} answer={faq.a} />
                  ))}
                </div>
                <Button
                  variant="default"
                  size="default"
                  className="mt-10 w-full py-4 bg-muted border border-border rounded-xl text-muted-foreground font-black text-[10px] uppercase tracking-widest hover:bg-card hover:shadow-md transition-all flex items-center justify-center gap-2"
                >
                  Show More Questions <ChevronDown size={14} />
                </Button>
              </div>
            </div>

            {/* Contact Side */}
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-[hsl(var(--primary))] p-10 rounded-xl text-[hsl(var(--primary-foreground))] space-y-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--primary)/0.2)] rounded-full blur-[60px] translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-1000" />
                <div className="space-y-2 relative z-10">
                  <h3 className="text-2xl font-black text-xl font-semibold tracking-tight">
                    Still need help?
                  </h3>
                  <p className="text-blue-200/70 text-sm font-medium">
                    Our elite support desk is available <br /> 24/7 for tailored assistance.
                  </p>
                </div>
                <div className="space-y-4 relative z-10">
                  <Button
                    variant="default"
                    size="default"
                    className="w-full bg-card text-[hsl(var(--primary))] p-4 rounded-xl flex items-center gap-4 hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95 group/btn"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[hsl(var(--primary))] group-hover/btn:bg-[hsl(var(--primary))] group-hover/btn:text-[hsl(var(--primary-foreground))] transition-colors gap-2">
                      <MessageCircle size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase text-muted-foreground">
                        Live Chat
                      </p>
                      <p className="text-sm font-black">{contact.chatLabel}</p>
                    </div>
                  </Button>
                  <Button
                    variant="default"
                    size="default"
                    className="w-full bg-card/10 backdrop-blur-md border border-border/10 text-primary-foreground p-4 rounded-xl flex items-center gap-4 hover:bg-card/20 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <div className="w-10 h-10 rounded-xl bg-card/20 flex items-center justify-center text-primary-foreground gap-2">
                      <Phone size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase text-blue-200/50">
                        Call Center
                      </p>
                      <p className="text-sm font-black">{contact.phone}</p>
                    </div>
                  </Button>
                  <Button
                    variant="default"
                    size="default"
                    className="w-full bg-card/10 backdrop-blur-md border border-border/10 text-primary-foreground p-4 rounded-xl flex items-center gap-4 hover:bg-card/20 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <div className="w-10 h-10 rounded-xl bg-card/20 flex items-center justify-center text-primary-foreground gap-2">
                      <Mail size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase text-blue-200/50">
                        Email Support
                      </p>
                      <p className="text-sm font-black">{contact.email}</p>
                    </div>
                  </Button>
                </div>
              </div>

              <div className="bg-[hsl(var(--secondary))] p-8 rounded-xl shadow-xl space-y-6 group cursor-pointer overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-full bg-card/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between gap-2">
                  <div className="p-3 bg-card/20 rounded-xl text-secondary-foreground">
                    <PlayCircle size={28} />
                  </div>
                  <div className="px-3 py-1 bg-secondary-foreground/10 rounded-full text-[8px] font-black uppercase tracking-widest text-secondary-foreground">
                    New Update
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-black text-secondary-foreground">Video Tutorials</h4>
                  <p className="text-xs font-bold text-secondary-foreground/60 italic leading-relaxed">
                    Master the TripLoger ecosystem in under 60 seconds with our visual guides.
                  </p>
                </div>
              </div>

              <div className="bg-card p-8 rounded-xl border border-border shadow-xl space-y-6">
                <div className="p-3 bg-blue-50 w-fit rounded-xl text-blue-600">
                  <BookOpen size={24} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-black text-[hsl(var(--primary))]">Developer API</h4>
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                    Build your own custom tools using our high-performance travel engine.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="default"
                  className="text-[hsl(var(--primary))] font-black text-[10px] uppercase tracking-widest flex items-center gap-2 group hover:gap-4 transition-all px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-muted"
                >
                  View Docs <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TripLogerLayout>
  );
}

export default HelpCenter;
