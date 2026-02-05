import React, { useEffect, useState } from 'react';
import { fetchUserPreferences, saveUserPreferences } from './notificationsApi';

export default function UserPreferences({ userId }: { userId: string }) {
  const [prefs, setPrefs] = useState<{ channels?: string[] }>({ channels: [] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUserPreferences(userId).then(p => p && setPrefs(p)).catch(() => {});
  }, [userId]);

  function toggleChannel(channel: string) {
    const current = new Set(prefs.channels || []);
    if (current.has(channel)) current.delete(channel);
    else current.add(channel);
    setPrefs({ channels: Array.from(current) });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveUserPreferences(userId, prefs);
      alert('Preferences saved');
    } catch (err) {
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const available = ['in_app', 'email', 'sms', 'push'];

  return (
    <div className="user-preferences">
      <h4>Notification Preferences</h4>
      {available.map(ch => (
        <label key={ch} style={{ display: 'block', margin: '6px 0' }}>
          <input type="checkbox" checked={(prefs.channels || []).includes(ch)} onChange={() => toggleChannel(ch)} /> {ch}
        </label>
      ))}
      <button onClick={handleSave} disabled={saving}>Save</button>
    </div>
  );
}
