/**
 * Schedule Change Detection Testing
 * 
 * Tests cover:
 * - Duffel webhook: order.airline_initiated_change_detected
 * - Schedule change mapping to notifications
 * - Urgency detection based on time to departure
 * - Multi-channel alert delivery
 * - Schedule change impact analysis
 * - Passenger notification with options
 * - Cascading impact on connected flights
 * - Schedule change history tracking
 */

import { describe, it, expect, beforeEach } from 'vitest';
import axios from 'axios';

const API_BASE_URL = process.env.BOOKING_SERVICE_API || 'http://localhost:3001/api';

describe('Schedule Change Detection & Notifications', () => {
  let bookingId: string;
  let userId: string;

  beforeEach(() => {
    bookingId = `booking-${Date.now()}`;
    userId = `user-${Date.now()}`;
  });

  describe('Duffel Webhook: order.airline_initiated_change_detected', () => {
    it('should receive and process airline departure time change', async () => {
      const webhookPayload = {
        type: 'order.airline_initiated_change_detected',
        data: {
          order_id: bookingId,
          change_type: 'departure_time_change',
          original_local_departure_time: '14:30',
          new_local_departure_time: '16:45',
          departure_airport_code: 'CDG',
          arrival_airport_code: 'LHR',
          airline_code: 'AF',
          flight_number: 'AF123',
          departure_date: '2024-03-15',
          passengers: ['John Doe'],
          reason: 'Aircraft change',
        },
      };

      const response = await axios.post(`${API_BASE_URL}/webhooks/duffel`, webhookPayload, {
        headers: {
          'x-webhook-signature': 'mock-signature', // In real scenario: HMAC-SHA256
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.processed).toBe(true);
      expect(response.data.notificationsSent).toBeGreaterThan(0);
    });

    it('should receive and process gate change', async () => {
      const webhookPayload = {
        type: 'order.airline_initiated_change_detected',
        data: {
          order_id: bookingId,
          change_type: 'gate_change',
          new_gate: 'B15',
          boarding_closes_in_minutes: 45,
          departure_date: '2024-03-15',
          flight: 'AF123',
        },
      };

      const response = await axios.post(`${API_BASE_URL}/webhooks/duffel`, webhookPayload, {
        headers: { 'x-webhook-signature': 'mock-signature' },
      });

      expect(response.status).toBe(200);
    });

    it('should receive and process aircraft change', async () => {
      const webhookPayload = {
        type: 'order.airline_initiated_change_detected',
        data: {
          order_id: bookingId,
          change_type: 'aircraft_change',
          original_aircraft_type: 'Boeing 777',
          new_aircraft_type: 'Airbus A380',
          impact: 'seating_upgrade',
          departure_date: '2024-03-15',
          flight: 'AF123',
        },
      };

      const response = await axios.post(`${API_BASE_URL}/webhooks/duffel`, webhookPayload, {
        headers: { 'x-webhook-signature': 'mock-signature' },
      });

      expect(response.status).toBe(200);
    });

    it('should receive and process cancellation notice', async () => {
      const webhookPayload = {
        type: 'order.airline_initiated_change_detected',
        data: {
          order_id: bookingId,
          change_type: 'flight_cancellation_notice',
          alternative_flights_offered: 3,
          reason: 'Schedule optimization',
          departure_date: '2024-03-15',
          flight: 'AF123',
        },
      };

      const response = await axios.post(`${API_BASE_URL}/webhooks/duffel`, webhookPayload, {
        headers: { 'x-webhook-signature': 'mock-signature' },
      });

      expect(response.status).toBe(200);
      expect(response.data.priorityLevel).toBe('critical');
    });
  });

  describe('Schedule Change Notification Triggering', () => {
    it('should send urgent notification for departure within 24 hours', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const webhookPayload = {
        type: 'order.airline_initiated_change_detected',
        data: {
          order_id: bookingId,
          change_type: 'departure_time_change',
          original_local_departure_time: '14:30',
          new_local_departure_time: '16:45',
          departure_date: tomorrow.toISOString().split('T')[0],
          flight: 'AF123',
          passengers: ['John Doe'],
        },
      };

      const response = await axios.post(`${API_BASE_URL}/webhooks/duffel`, webhookPayload, {
        headers: { 'x-webhook-signature': 'mock-signature' },
      });

      expect(response.status).toBe(200);
      expect(response.data.urgencyLevel).toBe('urgent');
      expect(response.data.channelsUsed).toContain('email');
      expect(response.data.channelsUsed).toContain('sms');
      expect(response.data.channelsUsed).toContain('push');
    });

    it('should send standard notification for departure beyond 48 hours', async () => {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const webhookPayload = {
        type: 'order.airline_initiated_change_detected',
        data: {
          order_id: bookingId,
          change_type: 'departure_time_change',
          original_local_departure_time: '14:30',
          new_local_departure_time: '16:45',
          departure_date: threeDaysFromNow.toISOString().split('T')[0],
          flight: 'AF123',
        },
      };

      const response = await axios.post(`${API_BASE_URL}/webhooks/duffel`, webhookPayload, {
        headers: { 'x-webhook-signature': 'mock-signature' },
      });

      expect(response.status).toBe(200);
      expect(response.data.urgencyLevel).toBe('standard');
      expect(response.data.channelsUsed).toContain('email');
    });
  });

  describe('Schedule Change Impact Analysis', () => {
    it('should detect critical time change (> 2 hours)', async () => {
      const webhookPayload = {
        type: 'order.airline_initiated_change_detected',
        data: {
          order_id: bookingId,
          change_type: 'departure_time_change',
          original_local_departure_time: '14:30',
          new_local_departure_time: '18:45', // 4 hours 15 minutes later
          departure_date: '2024-03-15',
          flight: 'AF123',
          impact: 'critical_time_change',
        },
      };

      const response = await axios.post(`${API_BASE_URL}/webhooks/duffel`, webhookPayload, {
        headers: { 'x-webhook-signature': 'mock-signature' },
      });

      expect(response.status).toBe(200);
      expect(response.data.impactLevel).toBe('high');
      expect(response.data.requiresUserAction).toBe(true);
    });

    it('should detect minor time change (< 30 minutes)', async () => {
      const webhookPayload = {
        type: 'order.airline_initiated_change_detected',
        data: {
          order_id: bookingId,
          change_type: 'departure_time_change',
          original_local_departure_time: '14:30',
          new_local_departure_time: '14:45', // 15 minutes later
          departure_date: '2024-03-15',
          flight: 'AF123',
        },
      };

      const response = await axios.post(`${API_BASE_URL}/webhooks/duffel`, webhookPayload, {
        headers: { 'x-webhook-signature': 'mock-signature' },
      });

      expect(response.status).toBe(200);
      expect(response.data.impactLevel).toBe('low');
    });

    it('should detect connection impact for multi-leg booking', async () => {
      const webhookPayload = {
        type: 'order.airline_initiated_change_detected',
        data: {
          order_id: bookingId,
          change_type: 'departure_time_change',
          original_local_departure_time: '18:00',
          new_local_departure_time: '20:15', // 2+ hours delay
          arrival_airport: 'CDG',
          next_flight_departure: '22:00', // Only 1h 45m connection
          next_flight_id: `flight-${Date.now()}`,
          connection_at_risk: true,
        },
      };

      const response = await axios.post(`${API_BASE_URL}/webhooks/duffel`, webhookPayload, {
        headers: { 'x-webhook-signature': 'mock-signature' },
      });

      expect(response.status).toBe(200);
      expect(response.data.connectionAtRisk).toBe(true);
      expect(response.data.suggestedActions).toContain('check_next_flight');
    });
  });

  describe('Multi-Channel Urgent Notification', () => {
    it('should send critical alert via all channels simultaneously', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const webhookPayload = {
        type: 'order.airline_initiated_change_detected',
        data: {
          order_id: bookingId,
          change_type: 'flight_cancellation_notice',
          departure_date: tomorrow.toISOString().split('T')[0],
          severity: 'critical',
          passengers: ['John Doe', 'Jane Doe'],
        },
      };

      const response = await axios.post(`${API_BASE_URL}/webhooks/duffel`, webhookPayload, {
        headers: { 'x-webhook-signature': 'mock-signature' },
      });

      expect(response.status).toBe(200);
      expect(response.data.notificationsSent).toBeGreaterThanOrEqual(3); // At least 3 channels
      expect(response.data.channelsUsed).toContain('email');
      expect(response.data.channelsUsed).toContain('sms');
      expect(response.data.channelsUsed).toContain('push');
      expect(response.data.channelsUsed).toContain('in_app');
    });

    it('should retry failed channel delivery for critical alerts', async () => {
      const webhookPayload = {
        type: 'order.airline_initiated_change_detected',
        data: {
          order_id: bookingId,
          change_type: 'flight_cancellation_notice',
          severity: 'critical',
          passengers: ['John Doe'],
          retryFailedChannels: true,
          maxRetries: 3,
        },
      };

      const response = await axios.post(`${API_BASE_URL}/webhooks/duffel`, webhookPayload, {
        headers: { 'x-webhook-signature': 'mock-signature' },
      });

      expect(response.status).toBe(200);
      expect(response.data.retryPolicy).toBe('exponential_backoff');
    });
  });

  describe('Schedule Change Notification Content', () => {
    it('should include detailed time change information', async () => {
      const webhookPayload = {
        type: 'order.airline_initiated_change_detected',
        data: {
          order_id: bookingId,
          change_type: 'departure_time_change',
          original_local_departure_time: '14:30',
          new_local_departure_time: '16:45',
          departure_airport_code: 'CDG',
          airline_code: 'AF',
          flight_number: 'AF123',
          departure_date: '2024-03-15',
          reason: 'Aircraft change',
        },
      };

      const response = await axios.post(`${API_BASE_URL}/webhooks/duffel`, webhookPayload, {
        headers: { 'x-webhook-signature': 'mock-signature' },
      });

      expect(response.status).toBe(200);
      expect(response.data.notificationContent).toContain('14:30');
      expect(response.data.notificationContent).toContain('16:45');
      expect(response.data.notificationContent).toContain('AF123');
    });

    it('should provide rebooking options for cancelled flight', async () => {
      const webhookPayload = {
        type: 'order.airline_initiated_change_detected',
        data: {
          order_id: bookingId,
          change_type: 'flight_cancellation_notice',
          original_flight: 'AF123',
          alternative_flights_offered: [
            {
              flight_number: 'AF124',
              departure_time: '17:00',
              arrival_time: '20:30',
            },
            {
              flight_number: 'AF125',
              departure_time: '18:00',
              arrival_time: '21:30',
            },
          ],
        },
      };

      const response = await axios.post(`${API_BASE_URL}/webhooks/duffel`, webhookPayload, {
        headers: { 'x-webhook-signature': 'mock-signature' },
      });

      expect(response.status).toBe(200);
      expect(response.data.alternativeOptions).toHaveLength(2);
    });
  });

  describe('User Actions & Responses', () => {
    it('should allow user to acknowledge schedule change', async () => {
      // First create notification via webhook
      const webhookPayload = {
        type: 'order.airline_initiated_change_detected',
        data: {
          order_id: bookingId,
          change_type: 'departure_time_change',
          departure_date: '2024-03-15',
        },
      };

      const webhookResponse = await axios.post(`${API_BASE_URL}/webhooks/duffel`, webhookPayload, {
        headers: { 'x-webhook-signature': 'mock-signature' },
      });

      const notificationId = webhookResponse.data.notificationId;

      // User acknowledges
      const ackResponse = await axios.post(
        `${API_BASE_URL}/notifications/${notificationId}/acknowledge`,
        { userId, action: 'acknowledged' }
      );

      expect(ackResponse.status).toBe(200);
      expect(ackResponse.data.acknowledged).toBe(true);
    });

    it('should track user selection of alternative flight', async () => {
      const webhookPayload = {
        type: 'order.airline_initiated_change_detected',
        data: {
          order_id: bookingId,
          change_type: 'flight_cancellation_notice',
          original_flight: 'AF123',
          alternative_options: ['AF124', 'AF125'],
        },
      };

      await axios.post(`${API_BASE_URL}/webhooks/duffel`, webhookPayload, {
        headers: { 'x-webhook-signature': 'mock-signature' },
      });

      // User selects alternative
      const selectResponse = await axios.post(
        `${API_BASE_URL}/bookings/${bookingId}/select-alternative`,
        {
          selectedFlight: 'AF124',
          reason: 'Earlier departure preferred',
        }
      );

      expect(selectResponse.status).toBe(200);
      expect(selectResponse.data.selectedFlight).toBe('AF124');
    });
  });

  describe('Cascading Impact on Connected Flights', () => {
    it('should detect impact on onward connection', async () => {
      const webhookPayload = {
        type: 'order.airline_initiated_change_detected',
        data: {
          order_id: bookingId,
          change_type: 'departure_time_change',
          original_departure: '18:00',
          new_departure: '20:15',
          arrival_airport: 'CDG',
          next_flight_departure: '22:00',
          connection_time_remaining: 105, // minutes
          is_risky_connection: true,
        },
      };

      const response = await axios.post(`${API_BASE_URL}/webhooks/duffel`, webhookPayload, {
        headers: { 'x-webhook-signature': 'mock-signature' },
      });

      expect(response.status).toBe(200);
      expect(response.data.cascadingImpact).toBeDefined();
      expect(response.data.affectedLegs).toContain('onward');
    });

    it('should notify of cascading cancellation on next leg', async () => {
      const webhookPayload = {
        type: 'order.airline_initiated_change_detected',
        data: {
          order_id: bookingId,
          change_type: 'cascading_cancellation',
          originalFlight: 'AF123',
          cancelledNextLeg: 'BA456',
          totalAffectedPassengers: 242,
        },
      };

      const response = await axios.post(`${API_BASE_URL}/webhooks/duffel`, webhookPayload, {
        headers: { 'x-webhook-signature': 'mock-signature' },
      });

      expect(response.status).toBe(200);
      expect(response.data.cascadeLevel).toBe('multiple_legs');
    });
  });

  describe('Schedule Change History Tracking', () => {
    it('should record all schedule changes for a booking', async () => {
      // First change
      await axios.post(`${API_BASE_URL}/webhooks/duffel`, {
        type: 'order.airline_initiated_change_detected',
        data: {
          order_id: bookingId,
          change_type: 'departure_time_change',
          original_departure: '14:30',
          new_departure: '15:00',
          timestamp: new Date().toISOString(),
        },
      });

      // Second change
      await axios.post(`${API_BASE_URL}/webhooks/duffel`, {
        type: 'order.airline_initiated_change_detected',
        data: {
          order_id: bookingId,
          change_type: 'departure_time_change',
          original_departure: '15:00',
          new_departure: '16:45',
          timestamp: new Date().toISOString(),
        },
      });

      // Retrieve history
      const historyResponse = await axios.get(
        `${API_BASE_URL}/bookings/${bookingId}/schedule-changes`
      );

      expect(historyResponse.status).toBe(200);
      expect(historyResponse.data.changes.length).toBe(2);
      expect(historyResponse.data.changes[0].changeType).toBe('departure_time_change');
    });

    it('should show timeline of all changes', async () => {
      const bookingRef = `booking-${Date.now()}`;

      // Multiple changes
      for (let i = 0; i < 3; i++) {
        await axios.post(`${API_BASE_URL}/webhooks/duffel`, {
          type: 'order.airline_initiated_change_detected',
          data: {
            order_id: bookingRef,
            change_type: 'departure_time_change',
            version: i + 1,
            timestamp: new Date(Date.now() + i * 1000).toISOString(),
          },
        });
      }

      const response = await axios.get(
        `${API_BASE_URL}/bookings/${bookingRef}/schedule-changes`
      );

      expect(response.status).toBe(200);
      expect(response.data.timeline.length).toBe(3);
      expect(response.data.timeline[0].version).toBe(1);
      expect(response.data.timeline[2].version).toBe(3);
    });
  });

  describe('Webhook Signature Verification', () => {
    it('should reject webhook with invalid signature', async () => {
      const webhookPayload = {
        type: 'order.airline_initiated_change_detected',
        data: {
          order_id: bookingId,
          change_type: 'departure_time_change',
        },
      };

      const response = await axios.post(
        `${API_BASE_URL}/webhooks/duffel`,
        webhookPayload,
        {
          headers: {
            'x-webhook-signature': 'invalid-signature',
          },
          validateStatus: () => true,
        }
      );

      expect(response.status).toBe(401);
      expect(response.data.error).toContain('signature');
    });

    it('should handle missing signature header', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/webhooks/duffel`,
        {
          type: 'order.airline_initiated_change_detected',
          data: { order_id: bookingId },
        },
        { validateStatus: () => true }
      );

      expect(response.status).toBe(401);
    });
  });

  describe('Idempotency & Duplicate Prevention', () => {
    it('should prevent duplicate processing of same webhook', async () => {
      const idempotencyKey = `webhook-${Date.now()}`;
      const webhookPayload = {
        type: 'order.airline_initiated_change_detected',
        data: {
          order_id: bookingId,
          change_type: 'departure_time_change',
        },
      };

      // First call
      const response1 = await axios.post(`${API_BASE_URL}/webhooks/duffel`, webhookPayload, {
        headers: {
          'x-webhook-signature': 'mock-signature',
          'idempotency-key': idempotencyKey,
        },
      });

      // Second call with same key
      const response2 = await axios.post(`${API_BASE_URL}/webhooks/duffel`, webhookPayload, {
        headers: {
          'x-webhook-signature': 'mock-signature',
          'idempotency-key': idempotencyKey,
        },
      });

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response2.data.isDuplicate).toBe(true);
      expect(response1.data.notificationId).toBe(response2.data.notificationId);
    });
  });
});
