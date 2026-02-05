import type { SuperAdminNotification as Notification } from '@tripalfa/shared-types';
import { saveToPostgres, pushToRedis, listFromPostgres, listFromRedis } from './dbStore';

// Keep a local in-memory cache as fallback
const notifications: Notification[] = [];

export async function addNotification(n: Notification) {
  // local cache
  notifications.push(n);
  // async persist
  try {
    await Promise.allSettled([saveToPostgres(n), pushToRedis(n)]);
  } catch (e) {
    // ignore; store remains in-memory
     
    console.error('persist error', e);
  }
  return n;
}

export async function listNotifications(): Promise<Notification[]> {
  // prefer Postgres if available
  try {
    const fromPg = await listFromPostgres();
    if (fromPg && fromPg.length) return fromPg;
  } catch (e) {
    // ignore
  }
  try {
    const fromRedis = await listFromRedis();
    if (fromRedis && fromRedis.length) return fromRedis;
  } catch (e) {
    // ignore
  }
  // fallback to memory
  return [...notifications].reverse();
}
