import { Booking } from '../types/enhancedBooking';

interface GDSConfig {
  amadeus: {
    clientId: string;
    clientSecret: string;
    apiUrl: string;
  };
  sabre: {
    clientId: string;
    clientSecret: string;
    apiUrl: string;
  };
  travelport: {
    clientId: string;
    clientSecret: string;
    apiUrl: string;
  };
}

interface PNRData {
  type: 'flight' | 'hotel';
  customerId: string;
  supplierId: string;
  serviceDetails: any;
  passengers: any[];
  pricing: any;
  payment: any;
  specialRequests: string[];
}

export class GDSIntegrationService {
  private config: GDSConfig;

  constructor() {
    this.config = {
      amadeus: {
        clientId: process.env.AMADEUS_CLIENT_ID || '',
        clientSecret: process.env.AMADEUS_CLIENT_SECRET || '',
        apiUrl: process.env.AMADEUS_API_URL || 'https://test.api.amadeus.com'
      },
      sabre: {
        clientId: process.env.SABRE_CLIENT_ID || '',
        clientSecret: process.env.SABRE_CLIENT_SECRET || '',
        apiUrl: process.env.SABRE_API_URL || 'https://api.sabre.com'
      },
      travelport: {
        clientId: process.env.TRAVELPORT_CLIENT_ID || '',
        clientSecret: process.env.TRAVELPORT_CLIENT_SECRET || '',
        apiUrl: process.env.TRAVELPORT_API_URL || 'https://api.travelport.com'
      }
    };
  }

  // Retrieve PNR from GDS
  async retrievePNR(gdsType: 'amadeus' | 'sabre' | 'travelport', pnr: string): Promise<PNRData> {
    switch (gdsType) {
      case 'amadeus':
        return await this.retrieveFromAmadeus(pnr);
      case 'sabre':
        return await this.retrieveFromSabre(pnr);
      case 'travelport':
        return await this.retrieveFromTravelport(pnr);
      default:
        throw new Error(`Unsupported GDS type: ${gdsType}`);
    }
  }

  // Generate confirmation number from GDS
  async generateConfirmationNumber(type: string, supplierId: string): Promise<string> {
    // Implementation would generate confirmation number from GDS
    return `TK-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  // Search flights through GDS
  async searchFlights(gdsType: 'amadeus' | 'sabre' | 'travelport', searchParams: any): Promise<any[]> {
    switch (gdsType) {
      case 'amadeus':
        return await this.searchFlightsAmadeus(searchParams);
      case 'sabre':
        return await this.searchFlightsSabre(searchParams);
      case 'travelport':
        return await this.searchFlightsTravelport(searchParams);
      default:
        throw new Error(`Unsupported GDS type: ${gdsType}`);
    }
  }

  // Hold booking through GDS
  async holdBooking(gdsType: 'amadeus' | 'sabre' | 'travelport', bookingData: any): Promise<string> {
    switch (gdsType) {
      case 'amadeus':
        return await this.holdBookingAmadeus(bookingData);
      case 'sabre':
        return await this.holdBookingSabre(bookingData);
      case 'travelport':
        return await this.holdBookingTravelport(bookingData);
      default:
        throw new Error(`Unsupported GDS type: ${gdsType}`);
    }
  }

  // Confirm booking through GDS
  async confirmBooking(gdsType: 'amadeus' | 'sabre' | 'travelport', bookingData: any): Promise<string> {
    switch (gdsType) {
      case 'amadeus':
        return await this.confirmBookingAmadeus(bookingData);
      case 'sabre':
        return await this.confirmBookingSabre(bookingData);
      case 'travelport':
        return await this.confirmBookingTravelport(bookingData);
      default:
        throw new Error(`Unsupported GDS type: ${gdsType}`);
    }
  }

  // Cancel booking through GDS
  async cancelBooking(gdsType: 'amadeus' | 'sabre' | 'travelport', pnr: string, reason: string): Promise<boolean> {
    switch (gdsType) {
      case 'amadeus':
        return await this.cancelBookingAmadeus(pnr, reason);
      case 'sabre':
        return await this.cancelBookingSabre(pnr, reason);
      case 'travelport':
        return await this.cancelBookingTravelport(pnr, reason);
      default:
        throw new Error(`Unsupported GDS type: ${gdsType}`);
    }
  }

  // Amadeus API implementations
  private async retrieveFromAmadeus(pnr: string): Promise<PNRData> {
    const token = await this.getAmadeusToken();
    
    const response = await fetch(`${this.config.amadeus.apiUrl}/v1/travel/assistant/bookings/${pnr}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Amadeus API error: ${response.statusText}`);
    }

    const data = await response.json();
    return this.transformAmadeusData(data);
  }

  private async searchFlightsAmadeus(searchParams: any): Promise<any[]> {
    const token = await this.getAmadeusToken();
    
    const response = await fetch(`${this.config.amadeus.apiUrl}/v2/shopping/flight-offers`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchParams)
    });

    if (!response.ok) {
      throw new Error(`Amadeus API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  private async holdBookingAmadeus(bookingData: any): Promise<string> {
    const token = await this.getAmadeusToken();
    
    const response = await fetch(`${this.config.amadeus.apiUrl}/v1/booking/flight-orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...bookingData,
        type: 'hold'
      })
    });

    if (!response.ok) {
      throw new Error(`Amadeus API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.id;
  }

  private async confirmBookingAmadeus(bookingData: any): Promise<string> {
    const token = await this.getAmadeusToken();
    
    const response = await fetch(`${this.config.amadeus.apiUrl}/v1/booking/flight-orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...bookingData,
        type: 'confirm'
      })
    });

    if (!response.ok) {
      throw new Error(`Amadeus API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.id;
  }

  private async cancelBookingAmadeus(pnr: string, reason: string): Promise<boolean> {
    const token = await this.getAmadeusToken();
    
    const response = await fetch(`${this.config.amadeus.apiUrl}/v1/booking/flight-orders/${pnr}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });

    return response.ok;
  }

  private async getAmadeusToken(): Promise<string> {
    const response = await fetch(`${this.config.amadeus.apiUrl}/v1/security/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.amadeus.clientId,
        client_secret: this.config.amadeus.clientSecret
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get Amadeus token');
    }

    const data = await response.json();
    return data.access_token;
  }

  // Sabre API implementations
  private async retrieveFromSabre(pnr: string): Promise<PNRData> {
    const token = await this.getSabreToken();
    
    const response = await fetch(`${this.config.sabre.apiUrl}/v1/lists/reservations/reservations/${pnr}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Sabre API error: ${response.statusText}`);
    }

    const data = await response.json();
    return this.transformSabreData(data);
  }

  private async searchFlightsSabre(searchParams: any): Promise<any[]> {
    const token = await this.getSabreToken();
    
    const response = await fetch(`${this.config.sabre.apiUrl}/v4/shop/flights`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchParams)
    });

    if (!response.ok) {
      throw new Error(`Sabre API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.flightOffers || [];
  }

  private async holdBookingSabre(bookingData: any): Promise<string> {
    const token = await this.getSabreToken();
    
    const response = await fetch(`${this.config.sabre.apiUrl}/v1/booking/hold`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });

    if (!response.ok) {
      throw new Error(`Sabre API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.holdId;
  }

  private async confirmBookingSabre(bookingData: any): Promise<string> {
    const token = await this.getSabreToken();
    
    const response = await fetch(`${this.config.sabre.apiUrl}/v1/booking/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });

    if (!response.ok) {
      throw new Error(`Sabre API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.bookingId;
  }

  private async cancelBookingSabre(pnr: string, reason: string): Promise<boolean> {
    const token = await this.getSabreToken();
    
    const response = await fetch(`${this.config.sabre.apiUrl}/v1/booking/cancel/${pnr}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });

    return response.ok;
  }

  private async getSabreToken(): Promise<string> {
    const response = await fetch(`${this.config.sabre.apiUrl}/v2/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.sabre.clientId,
        client_secret: this.config.sabre.clientSecret
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get Sabre token');
    }

    const data = await response.json();
    return data.access_token;
  }

  // Travelport API implementations
  private async retrieveFromTravelport(pnr: string): Promise<PNRData> {
    const response = await fetch(`${this.config.travelport.apiUrl}/v1/reservations/${pnr}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(`${this.config.travelport.clientId}:${this.config.travelport.clientSecret}`)}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Travelport API error: ${response.statusText}`);
    }

    const data = await response.json();
    return this.transformTravelportData(data);
  }

  private async searchFlightsTravelport(searchParams: any): Promise<any[]> {
    const response = await fetch(`${this.config.travelport.apiUrl}/v1/shop/flights`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${this.config.travelport.clientId}:${this.config.travelport.clientSecret}`)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchParams)
    });

    if (!response.ok) {
      throw new Error(`Travelport API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.flightOffers || [];
  }

  private async holdBookingTravelport(bookingData: any): Promise<string> {
    const response = await fetch(`${this.config.travelport.apiUrl}/v1/booking/hold`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${this.config.travelport.clientId}:${this.config.travelport.clientSecret}`)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });

    if (!response.ok) {
      throw new Error(`Travelport API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.holdId;
  }

  private async confirmBookingTravelport(bookingData: any): Promise<string> {
    const response = await fetch(`${this.config.travelport.apiUrl}/v1/booking/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${this.config.travelport.clientId}:${this.config.travelport.clientSecret}`)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });

    if (!response.ok) {
      throw new Error(`Travelport API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.bookingId;
  }

  private async cancelBookingTravelport(pnr: string, reason: string): Promise<boolean> {
    const response = await fetch(`${this.config.travelport.apiUrl}/v1/booking/cancel/${pnr}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${this.config.travelport.clientId}:${this.config.travelport.clientSecret}`)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });

    return response.ok;
  }

  // Data transformation methods
  private transformAmadeusData(data: any): PNRData {
    return {
      type: 'flight',
      customerId: data.customerId || '',
      supplierId: 'amadeus',
      serviceDetails: {
        segments: data.segments || [],
        bookingClass: data.bookingClass || '',
        cabin: data.cabin || ''
      },
      passengers: data.passengers || [],
      pricing: {
        total: data.total || 0,
        currency: data.currency || 'USD',
        taxes: data.taxes || 0,
        fees: data.fees || 0
      },
      payment: {
        method: data.paymentMethod || 'credit_card',
        status: data.paymentStatus || 'pending'
      },
      specialRequests: data.specialRequests || []
    };
  }

  private transformSabreData(data: any): PNRData {
    return {
      type: 'flight',
      customerId: data.customerId || '',
      supplierId: 'sabre',
      serviceDetails: {
        segments: data.segments || [],
        bookingClass: data.bookingClass || '',
        cabin: data.cabin || ''
      },
      passengers: data.passengers || [],
      pricing: {
        total: data.total || 0,
        currency: data.currency || 'USD',
        taxes: data.taxes || 0,
        fees: data.fees || 0
      },
      payment: {
        method: data.paymentMethod || 'credit_card',
        status: data.paymentStatus || 'pending'
      },
      specialRequests: data.specialRequests || []
    };
  }

  private transformTravelportData(data: any): PNRData {
    return {
      type: 'flight',
      customerId: data.customerId || '',
      supplierId: 'travelport',
      serviceDetails: {
        segments: data.segments || [],
        bookingClass: data.bookingClass || '',
        cabin: data.cabin || ''
      },
      passengers: data.passengers || [],
      pricing: {
        total: data.total || 0,
        currency: data.currency || 'USD',
        taxes: data.taxes || 0,
        fees: data.fees || 0
      },
      payment: {
        method: data.paymentMethod || 'credit_card',
        status: data.paymentStatus || 'pending'
      },
      specialRequests: data.specialRequests || []
    };
  }
}