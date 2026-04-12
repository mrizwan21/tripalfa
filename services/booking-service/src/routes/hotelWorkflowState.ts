import { BaseWorkflowState, BookingSteps } from './commonTypes';

/**
 * Specific workflow state for hotel bookings.
 * Extends the generic BaseWorkflowState with a concrete status union
 * and the shared BookingSteps definition.
 */
export type HotelWorkflowState = BaseWorkflowState & {
  status: 'hold' | 'paid' | 'confirmed' | 'cancelled' | 'refunded';
  steps: BookingSteps;
};
