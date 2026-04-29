import { useState, useMemo } from 'react';
import { Search, User, Globe, Calendar, Mail, CheckCircle2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { TravellerProfile } from '../../types';
import { filterTravellers } from '../../utils/travellerUtils';

interface TravellerSelectionModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSelect: (traveller: TravellerProfile) => void;
  readonly filterType?: 'Adult' | 'Child' | 'Infant';
}

export default function TravellerSelectionModal({ isOpen, onClose, onSelect, filterType }: TravellerSelectionModalProps) {
  const { travellers } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredTravellers = useMemo(() => {
    return filterTravellers(travellers, searchTerm, filterType);
  }, [travellers, searchTerm, filterType]);

  const selectedTraveller = travellers.find(t => t.id === selectedId);

  if (!isOpen) return null;

  const handleTravellerClick = (travellerId: string) => {
    setSelectedId(travellerId);
  };

  const handleTravellerKeyPress = (event: React.KeyboardEvent, travellerId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelectedId(travellerId);
    }
  };

  return (
    <div className="modal-overlay active bg-black/80 backdrop-blur-md" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-content card max-w-700 w-full p-0 overflow-hidden animate-scale shadow-2xl scale-100 flex flex-row h-500">
        {/* Left Side: List */}
        <div className="w-300 border-right bg-light-navy/5 flex flex-col h-full">
          <div className="p-20 border-bottom bg-white">
            <h3 className="text-xs font-semibold text-pure-black mb-16 flex items-center justify-between">
              Select Traveller
              <button
                onClick={onClose}
                className="text-muted hover:text-red"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </h3>
            <div className="input-with-icon-refined relative">
              <Search size={14} className="absolute left-12 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search CRM..."
                className="form-control-xs font-bold pl-32 text-xxs w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-8">
            {filteredTravellers.map((t) => (
              <button
                key={t.id}
                className={`p-12 rounded-lg cursor-pointer transition-all mb-4 border w-full text-left ${
                  selectedId === t.id
                    ? 'bg-black text-white border-navy shadow-md'
                    : 'bg-white border-transparent hover:border-apple-blue-light/40'
                }`}
                onClick={() => handleTravellerClick(t.id)}
                onKeyDown={(e) => handleTravellerKeyPress(e, t.id)}
                aria-pressed={selectedId === t.id}
              >
                <div className="text-xxs font-semibold tracking-tight truncate">
                  {t.title} {t.firstName} {t.lastName}
                </div>
                <div
                  className={`text-xxxxs font-bold mt-2 ${
                    selectedId === t.id ? 'text-white/70' : 'text-muted'
                  }`}
                >
                  Pass: {t.passportNumber}
                </div>
              </button>
            ))}
            {filteredTravellers.length === 0 && (
              <div className="p-24 text-center">
                <p className="text-xxxxs font-semibold text-muted">No matching records</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Profile Detail */}
        <div className="flex-1 bg-white p-32 flex flex-col h-full overflow-y-auto">
          {selectedTraveller ? (
            <div className="animate-fade">
              <div className="flex items-center gap-16 mb-24">
                <div className="w-56 h-56 bg-black/10 text-pure-black rounded-full flex items-center justify-center font-semibold text-lg shadow-inner">
                  {selectedTraveller.firstName[0]}{selectedTraveller.lastName[0]}
                </div>
                <div>
                  <h2 className="text-md font-semibold text-pure-black tracking-tight">
                    {selectedTraveller.title} {selectedTraveller.firstName} {selectedTraveller.lastName}
                  </h2>
                  <span className="badge badge-navy text-xxxxs font-semibold">
                    {selectedTraveller.type} Profile
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-20 mb-32">
                <div>
                  <div className="text-xxxxs font-semibold text-muted mb-4 block">Nationality</div>
                  <div className="text-xs font-semibold text-pure-black flex items-center gap-6">
                    <Globe size={12} className="text-apple-blue-dark" /> {selectedTraveller.nationality}
                  </div>
                </div>
                <div>
                  <div className="text-xxxxs font-semibold text-muted mb-4 block">Date of Birth</div>
                  <div className="text-xs font-semibold text-pure-black flex items-center gap-6">
                    <Calendar size={12} className="text-apple-blue-dark" /> {selectedTraveller.dob}
                  </div>
                </div>
                <div>
                  <div className="text-xxxxs font-semibold text-muted mb-4 block">Passport Number</div>
                  <div className="text-xs font-semibold text-pure-black">{selectedTraveller.passportNumber}</div>
                </div>
                <div>
                  <div className="text-xxxxs font-semibold text-muted mb-4 block">Passport Expiry</div>
                  <div className="text-xs font-semibold text-pure-black">{selectedTraveller.passportExpiry}</div>
                </div>
              </div>

              <div className="p-20 bg-light-navy/5 rounded-xl border border-dashed border-apple-blue-light/40 mb-32">
                <h4 className="text-xxxxs font-semibold text-pure-black mb-12 flex items-center gap-8">
                  <Mail size={12} /> Verification Check
                </h4>
                <p className="text-xxxxs text-muted font-bold leading-relaxed">
                  System has verified this passenger's eligibility for instant ticket issuance. Fares match previously saved data profiles.
                </p>
              </div>

              <button
                className="btn btn-navy btn-full py-16 font-semibold text-xs shadow-xl flex items-center justify-center gap-12"
                onClick={() => onSelect(selectedTraveller)}
              >
                <CheckCircle2 size={18} /> CONFIRM AND AUTO-FILL
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
              <User size={64} className="mb-16" />
              <p className="text-xxs font-semibold">
                Select a traveller from the left
                <br />
                to preview their full CRM profile
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}