import React from "react";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Send,
  Mail,
} from "lucide-react";
import { Button } from '../ui/button';

export default function TripLogerFooter(): React.JSX.Element {
  return (
    <footer className="bg-white border-t border-slate-100 pt-24 pb-12">
      <div className="container mx-auto px-6">
        {/* Newsletter Section */}
        <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 relative overflow-hidden mb-24 transition-all hover:shadow-2xl hover:shadow-slate-900/20 group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-30 group-hover:opacity-40 transition-opacity"></div>

          <div className="flex-1 relative z-10 text-center lg:text-left gap-4">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 rounded-2xl mb-8 backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform gap-2">
              <Mail className="text-white" size={28} />
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
              Unlock <span className="text-primary">Secret</span> <br />
              Travel Deals!
            </h2>
            <p className="text-slate-400 text-lg font-medium max-w-md mx-auto lg:mx-0">
              Join 50,000+ travelers getting the best hotel & flight rates
              weekly.
            </p>
          </div>

          <div className="flex-1 w-full max-w-lg bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-3 flex flex-col md:flex-row items-center gap-3">
            <input
              id="newsletter-email"
              name="newsletter-email"
              type="email"
              placeholder="Your best email address"
              className="flex-1 bg-transparent border-none outline-none text-white px-6 py-4 placeholder-slate-500 font-bold text-sm h-14 gap-4"
            />
            <Button
              variant="default"
              size="default"
              className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white font-black py-4 px-10 rounded-3xl transition-all h-14 shadow-lg shadow-primary/25 active:scale-95 whitespace-nowrap"
            >
              Subscribe Now
            </Button>
          </div>
        </div>

        {/* Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20 border-b border-slate-100 pb-20">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center text-2xl font-black tracking-tighter mb-8 gap-2">
              <span className="text-slate-900">trip</span>
              <span className="text-amber-500">lo</span>
              <span className="text-emerald-600">ger</span>
            </div>
            <p className="text-xs font-bold text-slate-500 mb-8 leading-relaxed">
              Premium travel management platform for modern explorers.
            </p>
            <div className="flex gap-4">
              {[Instagram, Facebook, Twitter, Linkedin].map((Icon, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-white hover:shadow-md cursor-pointer transition-all border border-transparent hover:border-slate-100 gap-2"
                >
                  <Icon size={18} />
                </div>
              ))}
            </div>
          </div>

          {[
            {
              title: "Destinations",
              links: ["Dubai", "London", "Paris", "New York"],
            },
            {
              title: "Top Regions",
              links: ["Makkah", "Madina", "Riyadh", "Jeddah"],
            },
            {
              title: "Services",
              links: [
                "Cheap Flights",
                "Luxury Hotels",
                "Car Rentals",
                "Package Tours",
              ],
            },
            {
              title: "Company",
              links: ["About Us", "Contact", "FAQs", "Partner Program"],
            },
          ].map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-black text-slate-900 mb-6 uppercase tracking-widest">
                {group.title}
              </h4>
              <ul className="space-y-4">
                {group.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-xs font-bold text-slate-500 hover:text-primary transition-colors flex items-center group gap-2"
                    >
                      <span className="w-0 group-hover:w-2 h-px bg-primary mr-0 group-hover:mr-2 transition-all"></span>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            © 2024 Triploger Global. All rights reserved.
          </p>
          <div className="flex gap-8">
            <a
              href="#"
              className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-[10px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
