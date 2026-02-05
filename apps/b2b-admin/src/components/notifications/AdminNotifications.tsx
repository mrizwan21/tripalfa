import React, { useEffect, useState } from 'react';
import { fetchAdminNotifications } from './notificationsApi';

export default function AdminNotifications() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchAdminNotifications()
      .then(list => {
        if (mounted) setItems(list);
      })
      .catch(() => {})
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false };
  }, []);

  if (loading) return <div>Loading notifications...</div>;

  return (
    <div className="admin-notifications">
      <h3>Recent Notifications</h3>
      <ul>
        {items.map(n => (
          <li key={n.id}>
            <strong>{n.title}</strong> — <span>{n.message}</span>
            <div style={{ fontSize: 12, color: '#666' }}>{n.createdAt}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
