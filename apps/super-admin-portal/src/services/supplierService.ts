import { requestJson, superAdminApiBaseUrl } from './httpClient';

const API_BASE_URL = superAdminApiBaseUrl;
const adminApiBase = `${API_BASE_URL}/api/admin`;

function withSupplierId(path: string, supplierId?: string): string {
  if (!supplierId) {
    return `${adminApiBase}${path}`;
  }
  const qs = new URLSearchParams({ supplierId });
  return `${adminApiBase}${path}?${qs.toString()}`;
}

export interface GDSCredential {
  id: string;
  supplierId: string;
  gdsType: 'AMADEUS' | 'SABRE' | 'GALILEO' | 'WORLDSPAN';
  pcc: string;
  pseudoCityCode?: string;
  userId?: string;
  apiKey?: string;
  apiSecret?: string;
  endpoint?: string;
  isActive: boolean;
  lastSyncAt?: string;
}

export interface AirlineBlackout {
  id: string;
  supplierId: string;
  airlineCode: string;
  airlineName: string;
  startDate: string;
  endDate: string;
  reason?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AutoTicketingConfig {
  id: string;
  supplierId: string;
  enabled: boolean;
  autoTicketOnConfirm: boolean;
  ticketTimeoutMinutes: number;
  retryAttempts: number;
  queueName?: string;
}

export interface SupplierChannelAccess {
  supplierId: string;
  channel: 'B2B' | 'B2C' | 'CALL_CENTER';
  isActive: boolean;
  markups: {
    flight?: number;
    hotel?: number;
    car?: number;
  };
}

export const fetchGDSCredentials = async (supplierId?: string): Promise<GDSCredential[]> => {
  return requestJson<GDSCredential[]>(withSupplierId('/gds-credentials', supplierId));
};

export const createGDSCredential = async (
  credentialData: Omit<GDSCredential, 'id'>
): Promise<GDSCredential> => {
  return requestJson<GDSCredential>(`${adminApiBase}/gds-credentials`, {
    method: 'POST',
    body: JSON.stringify(credentialData),
  });
};

export const updateGDSCredential = async (
  id: string,
  credentialData: Partial<GDSCredential>
): Promise<GDSCredential> => {
  return requestJson<GDSCredential>(`${adminApiBase}/gds-credentials/${id}`, {
    method: 'PUT',
    body: JSON.stringify(credentialData),
  });
};

export const deleteGDSCredential = async (id: string): Promise<void> => {
  await requestJson<{ success?: boolean }>(`${adminApiBase}/gds-credentials/${id}`, {
    method: 'DELETE',
  });
};

export const fetchAirlineBlackouts = async (supplierId?: string): Promise<AirlineBlackout[]> => {
  return requestJson<AirlineBlackout[]>(withSupplierId('/airline-blackouts', supplierId));
};

export const createAirlineBlackout = async (
  blackoutData: Omit<AirlineBlackout, 'id' | 'createdAt'>
): Promise<AirlineBlackout> => {
  return requestJson<AirlineBlackout>(`${adminApiBase}/airline-blackouts`, {
    method: 'POST',
    body: JSON.stringify(blackoutData),
  });
};

export const updateAirlineBlackout = async (
  id: string,
  blackoutData: Partial<AirlineBlackout>
): Promise<AirlineBlackout> => {
  return requestJson<AirlineBlackout>(`${adminApiBase}/airline-blackouts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(blackoutData),
  });
};

export const deleteAirlineBlackout = async (id: string): Promise<void> => {
  await requestJson<{ success?: boolean }>(`${adminApiBase}/airline-blackouts/${id}`, {
    method: 'DELETE',
  });
};

export const fetchAutoTicketingConfig = async (supplierId: string): Promise<AutoTicketingConfig> => {
  return requestJson<AutoTicketingConfig>(`${adminApiBase}/auto-ticketing/${supplierId}`);
};

export const updateAutoTicketingConfig = async (
  supplierId: string,
  configData: Partial<AutoTicketingConfig>
): Promise<AutoTicketingConfig> => {
  return requestJson<AutoTicketingConfig>(`${adminApiBase}/auto-ticketing/${supplierId}`, {
    method: 'PUT',
    body: JSON.stringify(configData),
  });
};

export const fetchChannelAccess = async (supplierId: string): Promise<SupplierChannelAccess[]> => {
  return requestJson<SupplierChannelAccess[]>(`${adminApiBase}/suppliers/${supplierId}/channels`);
};

export const updateChannelAccess = async (
  supplierId: string,
  channel: 'B2B' | 'B2C' | 'CALL_CENTER',
  accessData: Partial<SupplierChannelAccess>
): Promise<SupplierChannelAccess> => {
  return requestJson<SupplierChannelAccess>(`${adminApiBase}/suppliers/${supplierId}/channels/${channel}`, {
    method: 'PUT',
    body: JSON.stringify(accessData),
  });
};
