import React from 'react';
import { Link } from 'react-router-dom';
import { Home, MapPin } from 'lucide-react';

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/50 px-4">
      <div className="text-center space-y-6 max-w-lg">        {/* Icon */}
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#003b95] to-[#002a6e] flex items-center justify-center shadow-lg">
          <MapPin size={40} className="text-white" />
        </div>

        {/* 404 Text */}
        <div className="space-y-2">
          <h1 className="text-8xl font-black text-[#003b95] tracking-tighter leading-none">
            404
          </h1>
          <p className="text-2xl font-bold text-[#1d1d1f]">Page Not Found</p>
        </div>

        {/* Message */}
        <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
          Sorry, we couldn't find the page you're looking for. It might have been moved, removed, or never existed.
        </p>

        {/* Divider */}
        <div className="w-16 h-1 bg-gradient-to-r from-[#003b95] to-[#002a6e] rounded-full mx-auto" />

        {/* Action */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-[#003b95] text-white rounded-lg px-8 py-3 font-semibold text-sm shadow-md hover:bg-[#002a6e] transition-all duration-200 hover:scale-[1.02]"
        >
          <Home size={18} />
          Back to Home
        </Link>

        {/* Helpful links */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            to="/search"
            className="text-xs font-medium text-gray-500 hover:text-[#003b95] transition-colors underline underline-offset-4"
          >
            Search Flights
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            to="/hotels"
            className="text-xs font-medium text-gray-500 hover:text-[#003b95] transition-colors underline underline-offset-4"
          >
            Find Hotels
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            to="/support"
            className="text-xs font-medium text-gray-500 hover:text-[#003b95] transition-colors underline underline-offset-4"
          >
            Get Support
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
