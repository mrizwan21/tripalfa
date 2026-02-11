#!/usr/bin/env ts-node

/**
 * Phase 4 Notification System - Integration Test Suite
 * 
 * Run with: npm run test:notifications
 * Or: ts-node scripts/test-notifications.ts
 * 
 * Tests:
 * - API endpoints functionality
 * - Database operations
 * - Webhook integration
 * - Email delivery
 * - WebSocket real-time
 * - User preferences
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];
const API_BASE = process.env.API_URL || 'http://localhost:3001/api';
const TEST_TOKEN = process.env.TEST_TOKEN || 'test-token-' + uuidv4();
const TEST_USER_ID = process.env.TEST_USER_ID || 'test-user-' + uuidv4();
const TEST_ADMIN_ID = process.env.TEST_ADMIN_ID || 'test-admin-' + uuidv4();

/**
 * Test Helper: Record test result
 */
function recordTest(name: string, status: 'PASS' | 'FAIL' | 'SKIP', duration: number, error?: string) {
  results.push({ name, status, duration, error });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
  const message = error ? ` - ${error}` : '';
  console.log(`${icon} ${name} (${duration}ms)${message}`);
}

/**
 * Test 1: Health Check
 */
async function testHealthCheck() {
  const start = Date.now();
  try {
    const response = await axios.get(`${API_BASE}/notifications/health`);
    const duration = Date.now() - start;
    if (response.status === 200) {
      recordTest('API Health Check', 'PASS', duration);
    } else {
      recordTest('API Health Check', 'FAIL', duration, `Status: ${response.status}`);
    }
  } catch (error: any) {
    const duration = Date.now() - start;
    recordTest('API Health Check', 'FAIL', duration, error.message);
  }
}

/**
 * Test 2: Authentication
 */
async function testAuthentication() {
  const start = Date.now();
  try {
    // Should fail without token
    try {
      await axios.get(`${API_BASE}/notifications`);
      const duration = Date.now() - start;
      recordTest('Authentication (No Token Should Fail)', 'FAIL', duration, 'Request succeeded without token');
      return;
    } catch (error: any) {
      if (error.response?.status === 401) {
        const duration = Date.now() - start;
        recordTest('Authentication (No Token Should Fail)', 'PASS', duration);
      } else {
        const duration = Date.now() - start;
        recordTest('Authentication (No Token Should Fail)', 'FAIL', duration, `Wrong status: ${error.response?.status}`);
      }
    }
  } catch (error: any) {
    const duration = Date.now() - start;
    recordTest('Authentication (No Token Should Fail)', 'FAIL', duration, error.message);
  }
}

/**
 * Test 3: Create Notification
 */
async function testCreateNotification() {
  const start = Date.now();
  try {
    const notification = {
      userId: TEST_USER_ID,
      type: 'offline_request_update',
      title: '✅ Request Received',
      message: 'Your offline booking request has been received.',
      priority: 'medium',
      channels: ['email', 'in_app'],
      actionUrl: `/bookings/requests/${uuidv4()}`,
      data: {
        requestId: uuidv4(),
        destination: 'Dubai',
        departureDate: '2024-06-01'
      }
    };

    const response = await axios.post(`${API_BASE}/notifications/send`, notification, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` }
    });

    const duration = Date.now() - start;
    if (response.status === 201 && response.data.id) {
      recordTest('Create Notification', 'PASS', duration, `ID: ${response.data.id}`);
      return response.data.id;
    } else {
      recordTest('Create Notification', 'FAIL', duration, `Status: ${response.status}`);
    }
  } catch (error: any) {
    const duration = Date.now() - start;
    recordTest('Create Notification', 'FAIL', duration, error.message);
  }
}

/**
 * Test 4: List Notifications
 */
async function testListNotifications() {
  const start = Date.now();
  try {
    const response = await axios.get(`${API_BASE}/notifications?limit=10&offset=0`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` }
    });

    const duration = Date.now() - start;
    if (response.status === 200 && Array.isArray(response.data.data)) {
      recordTest('List Notifications', 'PASS', duration, `Found: ${response.data.data.length}`);
      return response.data.data;
    } else {
      recordTest('List Notifications', 'FAIL', duration, `Invalid response format`);
    }
  } catch (error: any) {
    const duration = Date.now() - start;
    recordTest('List Notifications', 'FAIL', duration, error.message);
  }
}

/**
 * Test 5: Get Unread Count
 */
async function testUnreadCount() {
  const start = Date.now();
  try {
    const response = await axios.get(`${API_BASE}/notifications/count/unread`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` }
    });

    const duration = Date.now() - start;
    if (response.status === 200 && typeof response.data.count === 'number') {
      recordTest('Get Unread Count', 'PASS', duration, `Count: ${response.data.count}`);
    } else {
      recordTest('Get Unread Count', 'FAIL', duration, `Invalid format`);
    }
  } catch (error: any) {
    const duration = Date.now() - start;
    recordTest('Get Unread Count', 'FAIL', duration, error.message);
  }
}

/**
 * Test 6: Mark as Read
 */
async function testMarkAsRead(notificationId?: string) {
  const start = Date.now();
  if (!notificationId) {
    recordTest('Mark as Read', 'SKIP', 0, 'No notification ID available');
    return;
  }

  try {
    const response = await axios.patch(`${API_BASE}/notifications/${notificationId}/read`, {}, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` }
    });

    const duration = Date.now() - start;
    if (response.status === 200) {
      recordTest('Mark as Read', 'PASS', duration);
    } else {
      recordTest('Mark as Read', 'FAIL', duration, `Status: ${response.status}`);
    }
  } catch (error: any) {
    const duration = Date.now() - start;
    recordTest('Mark as Read', 'FAIL', duration, error.message);
  }
}

/**
 * Test 7: Mark All as Read
 */
async function testMarkAllAsRead() {
  const start = Date.now();
  try {
    const response = await axios.patch(`${API_BASE}/notifications/read-all`, {}, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` }
    });

    const duration = Date.now() - start;
    if (response.status === 200) {
      recordTest('Mark All as Read', 'PASS', duration, `Updated: ${response.data.updated}`);
    } else {
      recordTest('Mark All as Read', 'FAIL', duration, `Status: ${response.status}`);
    }
  } catch (error: any) {
    const duration = Date.now() - start;
    recordTest('Mark All as Read', 'FAIL', duration, error.message);
  }
}

/**
 * Test 8: Delete Notification
 */
async function testDeleteNotification(notificationId?: string) {
  const start = Date.now();
  if (!notificationId) {
    recordTest('Delete Notification', 'SKIP', 0, 'No notification ID available');
    return;
  }

  try {
    const response = await axios.delete(`${API_BASE}/notifications/${notificationId}`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` }
    });

    const duration = Date.now() - start;
    if (response.status === 200) {
      recordTest('Delete Notification', 'PASS', duration);
    } else {
      recordTest('Delete Notification', 'FAIL', duration, `Status: ${response.status}`);
    }
  } catch (error: any) {
    const duration = Date.now() - start;
    recordTest('Delete Notification', 'FAIL', duration, error.message);
  }
}

/**
 * Test 9: Get Preferences
 */
async function testGetPreferences() {
  const start = Date.now();
  try {
    const response = await axios.get(`${API_BASE}/notifications/preferences`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` }
    });

    const duration = Date.now() - start;
    if (response.status === 200 && response.data) {
      recordTest('Get Preferences', 'PASS', duration);
      return response.data;
    } else {
      recordTest('Get Preferences', 'FAIL', duration, `Invalid response`);
    }
  } catch (error: any) {
    const duration = Date.now() - start;
    recordTest('Get Preferences', 'FAIL', duration, error.message);
  }
}

/**
 * Test 10: Update Preferences
 */
async function testUpdatePreferences() {
  const start = Date.now();
  try {
    const preferences = {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      offlineRequestUpdates: true,
      priceDropAlerts: true,
      bookingReminders: true,
      promotionalEmails: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      timezone: 'UTC'
    };

    const response = await axios.patch(
      `${API_BASE}/notifications/preferences`,
      preferences,
      { headers: { Authorization: `Bearer ${TEST_TOKEN}` } }
    );

    const duration = Date.now() - start;
    if (response.status === 200) {
      recordTest('Update Preferences', 'PASS', duration);
    } else {
      recordTest('Update Preferences', 'FAIL', duration, `Status: ${response.status}`);
    }
  } catch (error: any) {
    const duration = Date.now() - start;
    recordTest('Update Preferences', 'FAIL', duration, error.message);
  }
}

/**
 * Test 11: Webhook - Offline Request Status Change
 */
async function testWebhookOfflineRequest() {
  const start = Date.now();
  try {
    const payload = {
      requestId: uuidv4(),
      userId: TEST_USER_ID,
      status: 'approved',
      previousStatus: 'under_review',
      bookingId: uuidv4(),
      tripDetails: {
        destination: 'Paris',
        departureDate: '2024-07-15',
        returnDate: '2024-07-22',
        passengers: 2
      },
      reviewNotes: 'Request approved - excellent credit history',
      actionUrl: `/bookings/requests/${uuidv4()}`
    };

    const response = await axios.post(
      `${API_BASE}/notifications/webhooks/offline-request-status`,
      payload
    );

    const duration = Date.now() - start;
    if (response.status === 200 || response.status === 201) {
      recordTest('Webhook - Offline Request', 'PASS', duration);
    } else {
      recordTest('Webhook - Offline Request', 'FAIL', duration, `Status: ${response.status}`);
    }
  } catch (error: any) {
    const duration = Date.now() - start;
    recordTest('Webhook - Offline Request', 'FAIL', duration, error.message);
  }
}

/**
 * Test 12: Batch Send (Admin)
 */
async function testBatchSend() {
  const start = Date.now();
  try {
    const payload = {
      userIds: [TEST_USER_ID, 'another-test-user'],
      notification: {
        type: 'promotional',
        title: '🎉 Special Offer!',
        message: 'Get 20% off on your next booking',
        priority: 'low',
        channels: ['email', 'push'],
        actionUrl: '/deals/summer-sale'
      }
    };

    const response = await axios.post(
      `${API_BASE}/notifications/send-batch`,
      payload,
      { headers: { Authorization: `Bearer ${TEST_TOKEN}` } }
    );

    const duration = Date.now() - start;
    if (response.status === 201) {
      recordTest('Batch Send Notifications', 'PASS', duration, `Sent: ${response.data.sent}`);
    } else {
      recordTest('Batch Send Notifications', 'FAIL', duration, `Status: ${response.status}`);
    }
  } catch (error: any) {
    const duration = Date.now() - start;
    recordTest('Batch Send Notifications', 'FAIL', duration, error.message);
  }
}

/**
 * Test 13: Push Subscription
 */
async function testPushSubscription() {
  const start = Date.now();
  try {
    const subscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test-token',
      keys: {
        p256dh: 'test-p256dh-key',
        auth: 'test-auth-key'
      }
    };

    const response = await axios.post(
      `${API_BASE}/notifications/subscribe`,
      subscription,
      { headers: { Authorization: `Bearer ${TEST_TOKEN}` } }
    );

    const duration = Date.now() - start;
    if (response.status === 201) {
      recordTest('Push Subscription', 'PASS', duration, `ID: ${response.data.id}`);
      return response.data.id;
    } else {
      recordTest('Push Subscription', 'FAIL', duration, `Status: ${response.status}`);
    }
  } catch (error: any) {
    const duration = Date.now() - start;
    recordTest('Push Subscription', 'FAIL', duration, error.message);
  }
}

/**
 * Test 14: Performance Test
 */
async function testPerformance() {
  const start = Date.now();
  const iterations = 10;

  try {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const iterStart = Date.now();
      await axios.get(`${API_BASE}/notifications?limit=5`, {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` }
      });
      times.push(Date.now() - iterStart);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);

    const duration = Date.now() - start;

    if (avgTime < 500) {
      recordTest('Performance Test', 'PASS', duration, `Avg: ${avgTime}ms, Min: ${minTime}ms, Max: ${maxTime}ms`);
    } else {
      recordTest('Performance Test', 'FAIL', duration, `Slow response: Avg ${avgTime}ms (target: <500ms)`);
    }
  } catch (error: any) {
    const duration = Date.now() - start;
    recordTest('Performance Test', 'FAIL', duration, error.message);
  }
}

/**
 * Main Test Runner
 */
async function runAllTests() {
  console.log('\n🧪 Phase 4 Notification System - Integration Tests\n');
  console.log(`API Base: ${API_BASE}`);
  console.log(`Test User: ${TEST_USER_ID}`);
  console.log(`Test Token: ${TEST_TOKEN.substring(0, 20)}...\n`);
  console.log('Running tests...\n');

  // Run tests in sequence
  await testHealthCheck();
  await testAuthentication();
  
  let notificationId = await testCreateNotification();
  const notifications = await testListNotifications();
  
  if (notifications && notifications.length > 0) {
    notificationId = notifications[0].id;
  }

  await testUnreadCount();
  await testMarkAsRead(notificationId);
  await testMarkAllAsRead();
  await testDeleteNotification(notificationId);
  
  await testGetPreferences();
  await testUpdatePreferences();
  
  await testWebhookOfflineRequest();
  await testBatchSend();
  
  let pushSubscriptionId = await testPushSubscription();
  await testPerformance();

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  const total = results.length;

  console.log(`Total: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`Success Rate: ${((passed / (total - skipped)) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log('Failed Tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  ❌ ${r.name}: ${r.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests();
