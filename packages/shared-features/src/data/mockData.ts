import type { Agent, SubUser, TravellerProfile, MarkupRule } from '../types';
import type { LocationItem } from '../components/shared/LocationDropdown';

export const mockAgent: Agent = {
 id: 'ag-001',
 agencyName: 'SABA TRAVEL AND HOLIDAYS CO WLL',
 name: 'RIZWAN MOHAMED',
 agentCode: '000301',
 email: 'sabatravels22@gmail.com',
 phone: '+973 38880505',
 balance: 833.930,
 currency: 'BHD',
 salesRep: 'ADEEL ASHRAF',
 salesRepPhone: '97333522227',
 lastLogin: '06 Apr 2026 | 4:24 PM',
 country: 'BH',
 agentName: 'SABA TRAVEL AND HOLIDAYS CO WLL',
 role: 'Admin',
 theme: {
 primaryColor: '#002147', // Deep Navy
 }
};

export const mockSubUsers: (SubUser & { tenantId: string })[] = [
 { id: 'su-01', tenantId: 'saba', name: 'Abid Malik', username: 'Abid02', email: 'abid@saba.com', phone: '+973 3600001', isActive: true, disabledAirlines: [], role: 'Sales Executive' },
 { id: 'su-02', tenantId: 'saba', name: 'Arunika', username: 'Arunika06', email: 'arunika@saba.com', phone: '+973 3600002', isActive: true, disabledAirlines: [], role: 'Booking Agent' },
 { id: 'su-13', tenantId: 'elite', name: 'James Wilson', username: 'JamesE', email: 'james@elite.com', phone: '+44 7700 9001', isActive: true, disabledAirlines: [], role: 'Admin' },
 { id: 'su-14', tenantId: 'global', name: 'Mohammed Ali', username: 'MaliG', email: 'mali@global.sa', phone: '+966 550001', isActive: true, disabledAirlines: [], role: 'Ticketing Lead' },
];

export const mockTravellers: TravellerProfile[] = [
 { 
 id: 'tr-01', 
 tenantId: 'saba', 
 title: 'Mr', 
 firstName: 'Rizwan', 
 lastName: 'Mohamed', 
 dob: '1980-05-15', 
 nationality: 'Bahraini', 
 passportNumber: 'BH1234567', 
 passportExpiry: '2028-05-14', 
 issuingCountry: 'Bahrain', 
 type: 'Adult',
 email: 'rizwan@saba.com',
 phone: '+973 3888001',
 profileType: 'Individual'
 },
 { 
 id: 'tr-02', 
 tenantId: 'saba', 
 title: 'Mrs', 
 firstName: 'Fatima', 
 lastName: 'Zahra', 
 dob: '1985-08-20', 
 nationality: 'Bahraini', 
 passportNumber: 'BH7654321', 
 passportExpiry: '2030-10-10', 
 issuingCountry: 'Bahrain', 
 type: 'Adult',
 email: 'fatima@gmail.com',
 profileType: 'Individual'
 },
 { 
 id: 'tr-04', 
 tenantId: 'elite', 
 title: 'Ms', 
 firstName: 'Sarah', 
 lastName: 'Connor', 
 dob: '1990-01-01', 
 nationality: 'British', 
 passportNumber: 'UK998877', 
 passportExpiry: '2030-01-01', 
 issuingCountry: 'UK', 
 type: 'Adult',
 profileType: 'Individual'
 },
];

export const mockMarkupRules: MarkupRule[] = [
  { id: 'mr-01', tenantId: 'saba', name: 'Emirates Premium Markup', type: 'Flight', isActive: true, airlineCode: 'EK', value: 5, valueType: 'PERCENTAGE', priority: 1 },
  { id: 'mr-02', tenantId: 'saba', name: 'London Destination Fee', type: 'Flight', isActive: true, destinationCode: 'LHR', value: 10, valueType: 'FIXED', priority: 1 },
  { id: 'mr-03', tenantId: 'saba', name: '5-Star Luxury Boost', type: 'Hotel', isActive: true, hotelStars: 5, value: 8, valueType: 'PERCENTAGE', priority: 1 },
  { id: 'mr-04', tenantId: 'elite', name: 'Elite Global Markup', type: 'Flight', isActive: true, value: 12, valueType: 'PERCENTAGE', priority: 1 },
];

export const LOCATIONS: LocationItem[] = [
 { id: 'loc-01', name: 'Dubai, United Arab Emirates', subtext: 'City', type: 'City', code: 'DXB' },
 { id: 'loc-02', name: 'Burj Khalifa', subtext: 'Landmark', type: 'Landmark', parentId: 'loc-01' },
 { id: 'loc-03', name: 'Dubai Mall', subtext: 'Landmark', type: 'Landmark', parentId: 'loc-01' },
 { id: 'loc-04', name: 'Dubai, United Arab Emirates', subtext: 'Dubai Intl', type: 'Airport', code: 'DXB', parentId: 'loc-01' },
 { id: 'loc-05', name: 'Al Maktoum Intl', subtext: 'Dubai, United Arab Emirates', type: 'Airport', code: 'DWC', parentId: 'loc-01' },
 { id: 'loc-06', name: 'London, United Kingdom', subtext: 'City', type: 'City', code: 'LON' },
 { id: 'loc-07', name: 'Heathrow Airport', subtext: 'London', type: 'Airport', code: 'LHR', parentId: 'loc-06' },
 { id: 'loc-09', name: 'Bahrain', subtext: 'Bahrain', type: 'City', code: 'BAH' },
 { id: 'loc-10', name: 'Bahrain International Airport', subtext: 'Manama', type: 'Airport', code: 'BAH', parentId: 'loc-09' },
];


export const AIRPORTS: { code: string; name: string; city: string }[] = LOCATIONS.filter(l => l.type === 'Airport').map(l => ({
 code: l.code || '',
 name: l.name,
 city: l.name.includes('Airport') ? l.parentId ? (LOCATIONS.find(loc => loc.id === l.parentId)?.name || l.name.split(' ')[0]) : l.name.split(' ')[0] : l.name
}));

