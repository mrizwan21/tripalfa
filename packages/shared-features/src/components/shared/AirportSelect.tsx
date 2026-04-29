import { MapPin } from 'lucide-react';
import { AIRPORTS } from '../../data/mockData';

interface AirportSelectProps {
 label: string;
 value: string;
 onChange: (value: string) => void;
 iconColor?: string;
}

export function AirportSelect({ label, value, onChange }: AirportSelectProps) {
 return (
 <div>
 <label className="field-label">{label}</label>
 <div className="field-wrapper">
 <MapPin size={15} className="field-icon"/>
 <select className="field-select"value={value} onChange={(e) => onChange(e.target.value)}>
 {AIRPORTS.map(a => (
 <option key={a.code} value={a.code}>
 {a.city} ({a.code}) – {a.name}
 </option>
 ))}
 </select>
 </div>
 </div>
 );
}
