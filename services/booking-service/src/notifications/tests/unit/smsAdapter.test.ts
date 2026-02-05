import { SMSChannel } from '../../channels/sms.js';

describe('SMSChannel', () => {
  test('uses provider.sendSMS when provided', async () => {
    const provider = { sendSMS: jest.fn().mockResolvedValue(true) };
    const ch = new SMSChannel(provider as any);
    const ok = await ch.send({ userId: '+123', message: 'hi' } as any);
    expect(ok).toBe(true);
    expect(provider.sendSMS).toHaveBeenCalledWith('+123', 'hi');
  });

  test('falls back to mock send when no provider', async () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    const ch = new SMSChannel();
    const ok = await ch.send({ userId: 'u', message: 'm' } as any);
    expect(ok).toBe(true);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
