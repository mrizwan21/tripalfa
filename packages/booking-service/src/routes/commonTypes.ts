// Common type definitions for booking routes

export interface BookingStep {
  completed: boolean;
  timestamp?: Date;
  data?: any;
}

export interface BookingSteps {
  hold: BookingStep;
  payment: BookingStep;
  // Additional steps can be added as needed (e.g., confirmation, ticketing)
  [key: string]: BookingStep;
}

export interface BookingDocuments {
  itinerary?: string;
  invoice?: string;
  voucher?: string; // Hotel voucher
  ticket?: string; // Flight e‑ticket
  receipt?: string;
  refundNote?: string;
  // Allow future document types without breaking the type.
  [key: string]: string | undefined;
}

export interface BaseWorkflowState {
  workflowId: string;
  bookingId: string;
  bookingReference: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  steps: BookingSteps;
  documents?: BookingDocuments;
  customer?: {
    id: string;
    email: string;
    phone: string;
    name: string;
  };
  booking?: any;
}

// Shared document color palette for HTML generation
export const DOCUMENT_COLORS = {
  textPrimary: 'rgb(51, 51, 51)',
  textMuted: 'rgb(107, 114, 128)',
  brandPrimary: 'rgb(30, 27, 75)',
  success: 'rgb(5, 150, 105)',
  danger: 'rgb(220, 38, 38)',
  border: 'rgb(229, 231, 235)',
  borderSoft: 'rgb(243, 244, 246)',
  surfaceMuted: 'rgb(249, 250, 251)',
} as const;

export function getMissingFields(body: Record<string, unknown>, required: string[]): string[] {
  return required.filter((field) => body[field] == null);
}

