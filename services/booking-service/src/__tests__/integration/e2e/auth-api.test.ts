const request = require('supertest');
const app = require('../../../app');
const utils = require('../utils');

describe('Auth API E2E', () => {
  it('POST /api/auth/login - happy path', async () => {
    const user = await utils.makeCustomer();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'Test@123' });
    utils.expectSuccess(res);
  });

  it('POST /api/auth/register - happy path', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: `test-${Date.now()}@example.com`, password: 'Test@123' });
    utils.expectSuccess(res);
  });
});
