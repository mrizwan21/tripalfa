/**
 * Notification Analytics & Metrics Tests
 * 
 * Tests cover:
 * - Delivery rate tracking (success%, failure%, retry%)
 * - Channel performance metrics (email open rates, SMS delivery, push click-through)
 * - Performance benchmarking (latency, throughput)
 * - Notification trend analysis
 * - Failure reason categorization
 * - ROI and engagement metrics
 * - Real-time dashboards and reporting
 * - Historical data retention and archival
 */


import axios from 'axios';

/**
 * Get test API URL from global setup or environment
 * Global setup (global-setup.ts) bootstraps test server and sets this URL
 */
function getTestApiUrl(): string {
  // First check global test URL (set by global-setup.ts)
  if (typeof globalThis !== 'undefined' && (globalThis as any).TEST_API_URL) {
    return (globalThis as any).TEST_API_URL;
  }
  // Fall back to environment variable
  if (process.env.BOOKING_SERVICE_API) {
    return process.env.BOOKING_SERVICE_API;
  }
  throw new Error(
    'TEST_API_URL not available. Test server may not have been bootstrapped by global-setup.ts'
  );
}

const API_BASE_URL = getTestApiUrl();

describe('Notification Analytics & Metrics', () => {
  let startDate: Date;
  let endDate: Date;

  beforeEach(() => {
    endDate = new Date();
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  });

  describe('Delivery Rate Metrics', () => {
    it('should calculate delivery success rate', async () => {
      const response = await axios.get(`${API_BASE_URL}/notifications/analytics/delivery-rate`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.successRate).toBeDefined();
      expect(response.data.successRate).toBeGreaterThanOrEqual(0);
      expect(response.data.successRate).toBeLessThanOrEqual(100);
      expect(response.data.totalNotifications).toBeGreaterThanOrEqual(0);
    });

    it('should calculate delivery failure rate', async () => {
      const response = await axios.get(`${API_BASE_URL}/notifications/analytics/failure-rate`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.failureRate).toBeDefined();
      expect(response.data.failureRate).toBeGreaterThanOrEqual(0);
      expect(response.data.failureRate).toBeLessThanOrEqual(100);
    });

    it('should track retry rate metrics', async () => {
      const response = await axios.get(`${API_BASE_URL}/notifications/analytics/retry-rate`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.retryRate).toBeDefined();
      expect(response.data.retriedNotifications).toBeGreaterThanOrEqual(0);
      expect(response.data.successAfterRetry).toBeDefined();
    });

    it('should break down delivery by status', async () => {
      const response = await axios.get(`${API_BASE_URL}/notifications/analytics/status-breakdown`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.pending).toBeGreaterThanOrEqual(0);
      expect(response.data.sent).toBeGreaterThanOrEqual(0);
      expect(response.data.failed).toBeGreaterThanOrEqual(0);
      expect(response.data.dlq).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Channel Performance Analytics', () => {
    it('should calculate email delivery metrics', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/analytics/channel/email`,
        {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.channel).toBe('email');
      expect(response.data.sent).toBeGreaterThanOrEqual(0);
      expect(response.data.delivered).toBeGreaterThanOrEqual(0);
      expect(response.data.failed).toBeGreaterThanOrEqual(0);
      expect(response.data.deliveryRate).toBeLessThanOrEqual(100);
    });

    it('should calculate SMS delivery metrics', async () => {
      const response = await axios.get(`${API_BASE_URL}/notifications/analytics/channel/sms`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.channel).toBe('sms');
      expect(response.data.sent).toBeGreaterThanOrEqual(0);
      expect(response.data.acknowledgments).toBeGreaterThanOrEqual(0);
    });

    it('should calculate push notification metrics', async () => {
      const response = await axios.get(`${API_BASE_URL}/notifications/analytics/channel/push`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.channel).toBe('push');
      expect(response.data.sent).toBeGreaterThanOrEqual(0);
      expect(response.data.clicked).toBeGreaterThanOrEqual(0);
      expect(response.data.dismissed).toBeGreaterThanOrEqual(0);
    });

    it('should compare performance across all channels', async () => {
      const response = await axios.get(`${API_BASE_URL}/notifications/analytics/channels`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.channels)).toBe(true);
      response.data.channels.forEach(channel => {
        expect(['email', 'sms', 'push', 'in_app']).toContain(channel.name);
        expect(channel.deliveryRate).toBeDefined();
        expect(channel.sent).toBeGreaterThanOrEqual(0);
      });
    });

    it('should rank channels by performance', async () => {
      const response = await axios.get(`${API_BASE_URL}/notifications/analytics/channel-ranking`, {
        params: {
          metric: 'delivery_rate',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.ranking)).toBe(true);

      // Verify top channel has higher score than second
      if (response.data.ranking.length > 1) {
        expect(response.data.ranking[0].score).toBeGreaterThanOrEqual(response.data.ranking[1].score);
      }
    });
  });

  describe('Engagement Metrics', () => {
    it('should track email open rates', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/analytics/email/open-rate`,
        {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.openRate).toBeDefined();
      expect(response.data.opened).toBeGreaterThanOrEqual(0);
      expect(response.data.unopened).toBeGreaterThanOrEqual(0);
    });

    it('should track email click rates', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/analytics/email/click-rate`,
        {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.clickRate).toBeDefined();
      expect(response.data.clicked).toBeGreaterThanOrEqual(0);
    });

    it('should track push notification click-through rate', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/analytics/push/ctr`,
        {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.clickThroughRate).toBeDefined();
      expect(response.data.clicked).toBeGreaterThanOrEqual(0);
      expect(response.data.sent).toBeGreaterThanOrEqual(response.data.clicked);
    });

    it('should track in-app notification dismissal rates', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/analytics/in-app/dismissal-rate`,
        {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.dismissalRate).toBeDefined();
      expect(response.data.dismissed).toBeGreaterThanOrEqual(0);
      expect(response.data.viewed).toBeGreaterThanOrEqual(response.data.dismissed);
    });
  });

  describe('Performance Benchmarking', () => {
    it('should calculate average notification latency', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/analytics/latency`,
        {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.averageLatency).toBeGreaterThanOrEqual(0);
      expect(response.data.p50Latency).toBeGreaterThanOrEqual(0);
      expect(response.data.p95Latency).toBeGreaterThanOrEqual(0);
      expect(response.data.p99Latency).toBeGreaterThanOrEqual(0);
      // P99 should be >= P95 >= P50
      expect(response.data.p99Latency).toBeGreaterThanOrEqual(response.data.p95Latency);
    });

    it('should calculate notification throughput', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/analytics/throughput`,
        {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            interval: 'hourly',
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.peakThroughput).toBeGreaterThanOrEqual(0);
      expect(response.data.averageThroughput).toBeGreaterThanOrEqual(0);
      expect(response.data.totalNotificationsSent).toBeGreaterThanOrEqual(0);
    });

    it('should identify performance bottlenecks', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/analytics/bottlenecks`,
        {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        }
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.bottlenecks)).toBe(true);
      response.data.bottlenecks.forEach(bottleneck => {
        expect(bottleneck.component).toBeDefined();
        expect(bottleneck.percentOfTime).toBeGreaterThan(0);
        expect(bottleneck.percentOfTime).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Failure Analysis', () => {
    it('should categorize failures by reason', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/analytics/failure-reasons`,
        {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        }
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.reasons)).toBe(true);
      response.data.reasons.forEach(reason => {
        expect(reason.reason).toBeDefined();
        expect(reason.count).toBeGreaterThan(0);
        expect(reason.percentage).toBeGreaterThan(0);
        expect(reason.percentage).toBeLessThanOrEqual(100);
      });
    });

    it('should identify top failure reasons', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/analytics/top-failures`,
        {
          params: {
            limit: 5,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        }
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.topFailures)).toBe(true);

      if (response.data.topFailures.length > 0) {
        expect(response.data.topFailures[0].reason).toBeDefined();
        expect(response.data.topFailures[0].count).toBeGreaterThan(0);
      }
    });

    it('should track failure trends over time', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/analytics/failure-trend`,
        {
          params: {
            interval: 'daily',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        }
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.timeline)).toBe(true);
      response.data.timeline.forEach(point => {
        expect(point.date).toBeDefined();
        expect(point.failureCount).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Notification Type Analytics', () => {
    it('should track metrics per notification type', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/analytics/by-type`,
        {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        }
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.types)).toBe(true);
      response.data.types.forEach(type => {
        expect(type.type).toBeDefined();
        expect(type.sent).toBeGreaterThanOrEqual(0);
        expect(type.delivered).toBeGreaterThanOrEqual(0);
        expect(type.failed).toBeGreaterThanOrEqual(0);
      });
    });

    it('should compare delivery rates across notification types', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/analytics/type-comparison`,
        {
          params: {
            metric: 'delivery_rate',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        }
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.comparison)).toBe(true);
      response.data.comparison.forEach(item => {
        expect(item.type).toBeDefined();
        expect(item.metric).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('User Segmentation Analytics', () => {
    it('should track notifications by user segment', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/analytics/by-segment`,
        {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            segmentBy: 'user_tier', // premium, standard, free
          },
        }
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.segments)).toBe(true);
      response.data.segments.forEach(segment => {
        expect(['premium', 'standard', 'free']).toContain(segment.tier);
        expect(segment.notificationCount).toBeGreaterThanOrEqual(0);
      });
    });

    it('should compare engagement by user segment', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/analytics/engagement-by-segment`,
        {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        }
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.segments)).toBe(true);
      response.data.segments.forEach(segment => {
        expect(segment.engagementRate).toBeDefined();
        expect(segment.engagementRate).toBeGreaterThanOrEqual(0);
        expect(segment.engagementRate).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Real-Time Dashboard Data', () => {
    it('should provide current notification queue status', async () => {
      const response = await axios.get(`${API_BASE_URL}/notifications/analytics/queue-status`);

      expect(response.status).toBe(200);
      expect(response.data.pending).toBeGreaterThanOrEqual(0);
      expect(response.data.processing).toBeGreaterThanOrEqual(0);
      expect(response.data.retrying).toBeGreaterThanOrEqual(0);
      expect(response.data.failed).toBeGreaterThanOrEqual(0);
    });

    it('should provide current provider health status', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/analytics/provider-health`
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.providers)).toBe(true);
      response.data.providers.forEach(provider => {
        expect(provider.name).toBeDefined();
        expect(['healthy', 'degraded', 'down']).toContain(provider.status);
        expect(provider.lastCheckTime).toBeDefined();
      });
    });

    it('should provide recent failures snapshot', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/analytics/recent-failures?limit=10`
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.recentFailures)).toBe(true);
      response.data.recentFailures.slice(0, 10).forEach(failure => {
        expect(failure.notificationId).toBeDefined();
        expect(failure.failureReason).toBeDefined();
        expect(failure.timestamp).toBeDefined();
      });
    });
  });

  describe('Report Generation', () => {
    it('should generate daily performance report', async () => {
      const response = await axios.post(`${API_BASE_URL}/notifications/analytics/report/daily`, {
        date: new Date().toISOString().split('T')[0],
      });

      expect(response.status).toBe(200);
      expect(response.data.reportId).toBeDefined();
      expect(response.data.metrics).toBeDefined();
      expect(response.data.metrics.totalNotifications).toBeGreaterThanOrEqual(0);
      expect(response.data.metrics.successRate).toBeDefined();
    });

    it('should generate weekly summary report', async () => {
      const response = await axios.post(`${API_BASE_URL}/notifications/analytics/report/weekly`, {
        weekOf: new Date().toISOString().split('T')[0],
      });

      expect(response.status).toBe(200);
      expect(response.data.reportId).toBeDefined();
      expect(response.data.weekStartDate).toBeDefined();
      expect(response.data.weekEndDate).toBeDefined();
    });

    it('should generate monthly SLA report', async () => {
      const response = await axios.post(`${API_BASE_URL}/notifications/analytics/report/sla`, {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      });

      expect(response.status).toBe(200);
      expect(response.data.slaMetrics).toBeDefined();
      expect(response.data.slaMetrics.uptimePercentage).toBeDefined();
      expect(response.data.slaMetrics.deliveryRateSLA).toBeDefined();
    });

    it('should export report as CSV', async () => {
      const response = await axios.get(`${API_BASE_URL}/notifications/analytics/export/csv`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        responseType: 'blob',
      });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/text\/csv|application\/csv/);
    });
  });

  describe('Historical Data & Retention', () => {
    it('should store analytics data for 12 months', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/analytics/retention-policy`
      );

      expect(response.status).toBe(200);
      expect(response.data.retentionMonths).toBeGreaterThanOrEqual(12);
    });

    it('should support historical queries', async () => {
      const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);

      const response = await axios.get(`${API_BASE_URL}/notifications/analytics/delivery-rate`, {
        params: {
          startDate: sixMonthsAgo.toISOString(),
          endDate: new Date().toISOString(),
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.successRate).toBeDefined();
    });

    it('should archive old analytics data to cold storage', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/notifications/analytics/archive`,
        {
          olderThanDays: 90,
          destinationStorage: 'cold',
        }
      );

      expect([200, 202]).toContain(response.status);
      expect(response.data.archivedRecords).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Anomaly Detection', () => {
    it('should detect unusual failure rate spike', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/analytics/anomalies`
      );

      expect(response.status).toBe(200);

      if (response.data.anomalies && response.data.anomalies.length > 0) {
        response.data.anomalies.forEach(anomaly => {
          expect(anomaly.type).toBeDefined();
          expect(anomaly.severity).toBeDefined();
          expect(['low', 'medium', 'high']).toContain(anomaly.severity);
        });
      }
    });

    it('should alert on delivery rate degradation', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/notifications/analytics/alert/rate-degradation`,
        {
          threshold: 85, // alert if below 85%
          lookbackHours: 1,
        }
      );

      if (response.status === 200) {
        expect(response.data.alertTriggered).toBeDefined();
      }
    });
  });
});
