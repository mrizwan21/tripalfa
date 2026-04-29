import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function SmartSearchBar({ onSelect }: { onSelect?: (type: string, id: string) => void }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // Auto-detect type
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query);
    const isPNR = /^[A-Z0-9]{6}$/.test(query);
    
    if (isEmail) {
      console.log('Search by Customer Email:', query);
    } else if (isPNR) {
      console.log('Search by PNR:', query);
    } else {
      console.log('Search by Booking Ref / Name:', query);
    }
    
    // Navigate to a search results page (or open booking)
    navigate(`/open-booking?q=${encodeURIComponent(query)}`);
  };

  return (
    <form onSubmit={handleSearch} className="relative hidden sm:block w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-near-black" />
      <input 
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Lookup Booking Ref, PNR or Ticket Number…" 
        className="w-full bg-near-black/5 border-none rounded-full py-2 pl-10 pr-4 text-sm text-near-black focus:outline-none focus:ring-2 focus:ring-apple-blue" 
      />
    </form>
  );
}
