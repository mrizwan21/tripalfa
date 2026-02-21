import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { APP_NAME } from '../../lib/constants';

export function Footer() {
  return (
    <footer className="bg-white text-slate-600 border-t border-slate-200">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 mb-3">{APP_NAME}</h3>
            <p className="text-sm leading-relaxed mb-4">
              Your trusted partner for creating unforgettable travel experiences. 
              Discover the world with us.
            </p>
            <div className="flex gap-3">
              <a href="#" className="hover:text-blue-600 transition-colors"><Facebook className="h-4 w-4" /></a>
              <a href="#" className="hover:text-blue-600 transition-colors"><Twitter className="h-4 w-4" /></a>
              <a href="#" className="hover:text-blue-600 transition-colors"><Instagram className="h-4 w-4" /></a>
              <a href="#" className="hover:text-blue-600 transition-colors"><Youtube className="h-4 w-4" /></a>
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900 mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-blue-600 transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-blue-600 transition-colors">Contact Us</Link></li>
              <li><Link to="/faq" className="hover:text-blue-600 transition-colors">FAQs</Link></li>
              <li><Link to="/blog" className="hover:text-blue-600 transition-colors">Travel Blog</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900 mb-3">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/terms" className="hover:text-blue-600 transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/cookie" className="hover:text-blue-600 transition-colors">Cookie Policy</Link></li>
              <li><Link to="/sitemap" className="hover:text-blue-600 transition-colors">Sitemap</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900 mb-3">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>123 Travel Street, Business Bay, Dubai, UAE</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>+971 4 123 4567</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>support@travelkingdom.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
