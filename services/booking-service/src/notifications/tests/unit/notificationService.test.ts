import { NotificationServiceCore } from '../../core/notificationService.js';

describe('NotificationServiceCore', () => {
  test('sends via registered channels and persists to cache', async () => {
    const mockCache: any = { set: jest.fn().mockResolvedValue(true) };
    const metrics: any = { increment: jest.fn() };
    const logger: any = { info: jest.fn(), error: jest.fn() };

    const svc = new NotificationServiceCore(mockCache, metrics, logger);

    const mockChannel = { name: 'in_app', send: jest.fn().mockResolvedValue(true) };
    svc.addChannel(mockChannel as any);

    const notification = {
      id: 'ntf-1',
      userId: 'user-1',
      type: 'test',
      title: 'hi',
      message: 'hello',
      channels: ['in_app']
    } as any;

    const result = await svc.send(notification);

    expect(mockChannel.send).toHaveBeenCalledWith(expect.objectContaining({ id: 'ntf-1' }));
    expect(mockCache.set).toHaveBeenCalled();
    expect(result.status).toBe('sent');
  });

  test('handles channel failure and marks notification failed', async () => {
    const mockCache: any = { set: jest.fn().mockResolvedValue(true) };
    const metrics: any = { increment: jest.fn() };
    const logger: any = { info: jest.fn(), error: jest.fn() };

    const svc = new NotificationServiceCore(mockCache, metrics, logger);
    const badChannel = { name: 'email', send: jest.fn().mockRejectedValue(new Error('boom')) };
    svc.addChannel(badChannel as any);

    const notification = { id: 'ntf-2', userId: 'u2', type: 'test', title: 't', message: 'm', channels: ['email'] } as any;
    const result = await svc.send(notification);

    expect(badChannel.send).toHaveBeenCalled();
    expect(result.status).toBe('failed');
  });
});
