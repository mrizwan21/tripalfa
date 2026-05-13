import React from "react";
import { Link } from "react-router-dom";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
} from "lucide-react";

export default function TripLogerFooter(): React.JSX.Element {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: "Explore",
      links: [
        { label: "Flights", href: "/flights" },
        { label: "Hotels", href: "/hotels" },
        { label: "Deals", href: "/deals" },
        { label: "Destinations", href: "/destinations" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Careers", href: "/careers" },
        { label: "Press", href: "/press" },
        { label: "Blog", href: "/blog" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Help Center", href: "/help" },
        { label: "Contact Us", href: "/contact" },
        { label: "FAQs", href: "/faqs" },
        { label: "Live Chat", href: "/chat" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Cookie Policy", href: "/cookies" },
        { label: "Accessibility", href: "/accessibility" },
      ],
    },
  ];

  return (
    <footer className="bg-[#f7f7f7] border-t border-gray-200 pt-12 pb-8">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        {/* Main Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-4 lg:mb-0">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#003b95] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="text-lg font-bold text-[#003b95]">
                TripAlfa
              </span>
            </Link>
            <p className="text-sm text-[#5e5e5e] mb-6 leading-relaxed">
              Your trusted travel companion for flights, hotels, and unique
              experiences worldwide.
            </p>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-md bg-white border border-gray-200 flex items-center justify-center text-[#5e5e5e] hover:text-[#003b95] hover:border-[#003b95] transition-colors"
              >
                <Facebook size={16} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-md bg-white border border-gray-200 flex items-center justify-center text-[#5e5e5e] hover:text-[#003b95] hover:border-[#003b95] transition-colors"
              >
                <Instagram size={16} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-md bg-white border border-gray-200 flex items-center justify-center text-[#5e5e5e] hover:text-[#003b95] hover:border-[#003b95] transition-colors"
              >
                <Twitter size={16} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-md bg-white border border-gray-200 flex items-center justify-center text-[#5e5e5e] hover:text-[#003b95] hover:border-[#003b95] transition-colors"
              >
                <Linkedin size={16} />
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-semibold text-[#242424] mb-4">
                {group.title}
              </h4>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-[#5e5e5e] hover:text-[#003b95] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#9e9e9e]">
            © {currentYear} TripAlfa. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              to="/privacy"
              className="text-xs text-[#9e9e9e] hover:text-[#5e5e5e] transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-xs text-[#9e9e9e] hover:text-[#5e5e5e] transition-colors"
            >
              Terms
            </Link>
            <Link
              to="/cookies"
              className="text-xs text-[#9e9e9e] hover:text-[#5e5e5e] transition-colors"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}