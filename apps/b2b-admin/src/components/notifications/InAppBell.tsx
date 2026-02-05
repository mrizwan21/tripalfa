import React, { useEffect, useState } from 'react';
import { fetchUserNotifications, fetchUnreadCount } from './notificationsApi';

export default function InAppBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    fetchUnreadCount(userId).then(c => mounted && setCount(c)).catch(() => {});
    const t = setInterval(() => fetchUnreadCount(userId).then(c => mounted && setCount(c)).catch(() => {}), 15000);
    return () => { mounted = false; clearInterval(t); };
  }, [userId]);

  async function toggle() {
    setOpen(!open);
    if (!open) {
      const list = await fetchUserNotifications(userId);
      setItems(list.slice(0, 20));
      setCount(0);
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={toggle} aria-label="Notifications">
        🔔 <span style={{ color: 'red', fontWeight: 'bold' }}>{count > 0 ? count : ''}</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, width: 320, maxHeight: 400, overflow: 'auto', background: '#fff', border: '1px solid #ddd', padding: 8 }}>
          <h5>Notifications</h5>
          <ul>
            {items.map(n => (
              <li key={n.id}><strong>{n.title}</strong><div style={{ fontSize:12 }}>{n.message}</div></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
