import { BaseWorkflowState, BookingSteps } from './commonTypes';

/**
 * Specific workflow state for flight bookings.
 * Extends the generic BaseWorkflowState with a concrete status union
 * and the shared BookingSteps definition.
 */
export type FlightWorkflowState = BaseWorkflowState & {
  status: 'hold' | 'paid' | 'ticketed' | 'cancelled' | 'refunded';
  steps: BookingSteps;
};
