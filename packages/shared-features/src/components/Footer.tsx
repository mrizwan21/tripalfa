import { Plane } from 'lucide-react';

const FOOTER_LINKS = [
 'Home', 'Flights', 'Hotels', 'My Bookings', 'Accounts',
 'Terms & Conditions', 'Privacy Policy', 'Support', 'Help & FAQ',
];

export default function Footer() {
 return (
 <footer className="mt-auto border-t border-border bg-white">
 <div className="max-w-screen-2xl mx-auto px-6 py-6">
 <div className="flex flex-col md:flex-row items-center justify-between gap-4">
 {/* Brand */}
 <div className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-lg bg-pure-black flex items-center justify-center">
 <Plane size={13} className="text-apple-blue"/>
 </div>
 <span className="text-sm font-semibold text-pure-black tracking-tight">B2B Travel Portal</span>
 </div>

 {/* Links */}
 <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
 {FOOTER_LINKS.map((link) => (
 <a
 key={link}
 href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
 className="text-xs text-muted-foreground hover:text-pure-black transition-colors font-medium"
 >
 {link}
 </a>
 ))}
 </div>

 {/* Copyright */}
 <div className="text-xs text-muted-foreground text-center md:text-right">
 <div>© 2026 bhagents.akbartravels.com</div>
 <div className="text-xs opacity-60 mt-0.5">Powered by <strong className="text-pure-black">Benzy Infotech</strong></div>
 </div>
 </div>
 </div>
 </footer>
 );
}
