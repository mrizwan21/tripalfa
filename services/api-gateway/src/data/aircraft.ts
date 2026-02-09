/**
 * Static Aircraft Data
 * Used for aircraft name lookups in flight details
 */

export interface Aircraft {
    iata_code: string;
    name: string;
    is_active: boolean;
}

export const AIRCRAFT: Aircraft[] = [
    { iata_code: '320', name: 'Airbus A320', is_active: true },
    { iata_code: '321', name: 'Airbus A321', is_active: true },
    { iata_code: '319', name: 'Airbus A319', is_active: true },
    { iata_code: '318', name: 'Airbus A318', is_active: true },
    { iata_code: '332', name: 'Airbus A330-200', is_active: true },
    { iata_code: '333', name: 'Airbus A330-300', is_active: true },
    { iata_code: '339', name: 'Airbus A330-900neo', is_active: true },
    { iata_code: '350', name: 'Airbus A350', is_active: true },
    { iata_code: '359', name: 'Airbus A350-900', is_active: true },
    { iata_code: '35K', name: 'Airbus A350-1000', is_active: true },
    { iata_code: '388', name: 'Airbus A380-800', is_active: true },
    { iata_code: '738', name: 'Boeing 737-800', is_active: true },
    { iata_code: '73H', name: 'Boeing 737-800 (Winglets)', is_active: true },
    { iata_code: '739', name: 'Boeing 737-900', is_active: true },
    { iata_code: '7M8', name: 'Boeing 737 MAX 8', is_active: true },
    { iata_code: '7M9', name: 'Boeing 737 MAX 9', is_active: true },
    { iata_code: '744', name: 'Boeing 747-400', is_active: true },
    { iata_code: '74H', name: 'Boeing 747-8', is_active: true },
    { iata_code: '763', name: 'Boeing 767-300', is_active: true },
    { iata_code: '764', name: 'Boeing 767-400', is_active: true },
    { iata_code: '772', name: 'Boeing 777-200', is_active: true },
    { iata_code: '773', name: 'Boeing 777-300', is_active: true },
    { iata_code: '77W', name: 'Boeing 777-300ER', is_active: true },
    { iata_code: '787', name: 'Boeing 787 Dreamliner', is_active: true },
    { iata_code: '788', name: 'Boeing 787-8', is_active: true },
    { iata_code: '789', name: 'Boeing 787-9', is_active: true },
    { iata_code: '78X', name: 'Boeing 787-10', is_active: true },
    { iata_code: 'E90', name: 'Embraer 190', is_active: true },
    { iata_code: 'E95', name: 'Embraer 195', is_active: true },
    { iata_code: 'E75', name: 'Embraer 175', is_active: true },
    { iata_code: 'E70', name: 'Embraer 170', is_active: true },
    { iata_code: 'CR9', name: 'Bombardier CRJ-900', is_active: true },
    { iata_code: 'CRK', name: 'Bombardier CRJ-1000', is_active: true },
    { iata_code: 'DH4', name: 'Bombardier Dash 8-400', is_active: true },
    { iata_code: 'AT7', name: 'ATR 72', is_active: true },
    { iata_code: 'AT5', name: 'ATR 42', is_active: true }
];

export function searchAircraft(query?: string): Aircraft[] {
    if (!query || query.trim() === '') {
        return AIRCRAFT;
    }
    const term = query.toLowerCase().trim();
    return AIRCRAFT.filter(a =>
        a.iata_code.toLowerCase().includes(term) ||
        a.name.toLowerCase().includes(term)
    );
}

export function getAircraftByCode(code: string): Aircraft | undefined {
    return AIRCRAFT.find(a => a.iata_code === code);
}
