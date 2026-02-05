export async function fetchAdminNotifications(): Promise<any[]> {
  const res = await fetch('/api/admin/notifications');
  if (!res.ok) throw new Error('Failed to fetch admin notifications');
  return res.json();
}

export async function fetchUserPreferences(userId: string): Promise<{ channels?: string[] } | null> {
  const res = await fetch(`/api/user/${userId}/preferences`);
  if (!res.ok) return null;
  return res.json();
}

export async function saveUserPreferences(userId: string, prefs: { channels?: string[] }) {
  const res = await fetch(`/api/user/${userId}/preferences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs),
  });
  if (!res.ok) throw new Error('Failed to save preferences');
  return res.json();
}

export async function fetchUserNotifications(userId: string): Promise<any[]> {
  const res = await fetch(`/api/notifications?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchUnreadCount(userId: string): Promise<number> {
  const res = await fetch(`/api/notifications/unread?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) return 0;
  const j = await res.json();
  return j.count || 0;
}
