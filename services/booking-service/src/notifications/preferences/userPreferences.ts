export class UserPreferencesStore {
  constructor(private cacheClient?: any) {}

  async get(userId: string): Promise<{ channels?: string[] } | null> {
    try {
      const raw = await this.cacheClient?.get?.(`prefs:${userId}`);
      if (!raw) return null;
      return JSON.parse(raw) as { channels?: string[] };
    } catch (err) {
      console.error('[UserPreferencesStore] get error', err);
      return null;
    }
  }

  async set(userId: string, prefs: { channels?: string[] }): Promise<void> {
    try {
      await this.cacheClient?.set?.(`prefs:${userId}`, JSON.stringify(prefs));
    } catch (err) {
      console.error('[UserPreferencesStore] set error', err);
    }
  }
}
