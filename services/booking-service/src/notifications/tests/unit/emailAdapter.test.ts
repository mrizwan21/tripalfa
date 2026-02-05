import { EmailChannel } from '../../channels/email.js';

describe('EmailChannel', () => {
  test('uses transporter.sendMail when provided', async () => {
    const transporter = { sendMail: jest.fn().mockResolvedValue(true) };
    const ch = new EmailChannel(transporter as any);
    const ok = await ch.send({ userId: 'user@example.com', title: 't', message: 'm' } as any);
    expect(ok).toBe(true);
    expect(transporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'user@example.com' }));
  });

  test('falls back to mock send when no transporter', async () => {
    const consoleSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    const ch = new EmailChannel();
    const ok = await ch.send({ userId: 'x', title: 't', message: 'm' } as any);
    expect(ok).toBe(true);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
