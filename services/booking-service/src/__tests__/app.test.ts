import { get } from '../__tests__/integration/utils';

describe('App basic endpoints', () => {
  it('GET /health returns healthy status', async () => {
    const res = await get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        status: 'healthy',
        service: 'booking-service',
        timestamp: expect.any(String),
        environment: expect.any(String),
      })
    );
  });

  it('GET /unknown returns 404', async () => {
    const res = await get('/__unknown__');
    expect(res.status).toBe(404);
    expect(res.body).toEqual(
      expect.objectContaining({
        error: 'Not Found',
        message: expect.stringContaining('/__unknown__'),
        timestamp: expect.any(String),
      })
    );
  });
});