/**
 * Simple notification route/backend tests
 * Uses the Redis cache helper methods to validate list/push behavior
 */

// Prefer the built JS in dist when running tests with plain Node
import redisCache from '../../dist/services/redis-cache.js';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

async function runTests() {
  console.log('\n🧪 Notifications Tests\n');

  const userKey = 'test-user';
  const userListKey = `user_notifications:${userKey}`;

  // Cleanup
  try { await redisCache.setRaw(userListKey, '[]'); } catch { /* ignore */ }

  // Simulate pushing a notification
  const notification = { id: 't1', userId: userKey, message: 'Hello test', createdAt: new Date().toISOString(), status: 'pending' };
  await redisCache.lpush(userListKey, JSON.stringify(notification));
  await redisCache.expire(userListKey, 60);

  const items = await redisCache.lrange(userListKey, 0, -1);
  assert(items.length >= 1, 'Expected at least one notification in list');

  const parsed = JSON.parse(items[0]);
  assert(parsed.id === 't1', 'Notification id mismatch');

  // Test unread count logic: count pending
  const count = (await Promise.all(items.map(async (r) => JSON.parse(r)))).filter((n: any) => n.status === 'pending').length;
  assert(count >= 1, 'Expected unread count >= 1');

  console.log('✅ Notification list/push/unread checks passed');
}

// Support running this file directly under Node CommonJS by comparing __filename
if (process.argv[1] && __filename === process.argv[1]) {
  runTests().catch(err => { console.error('❌ Test failed:', err.message); process.exit(1); });
}

export { runTests };
