const request = require('supertest');
const app = require('../../../app');
const utils = require('../utils');

describe('Wallet API E2E', () => {
  let token;
  beforeAll(async () => {
    token = utils.createAdminToken();
  });

  it('GET /api/wallets - happy path', async () => {
    const res = await request(app)
      .get('/api/wallets')
      .set('Authorization', `Bearer ${token}`);
    utils.expectSuccess(res);
  });

  it('POST /api/wallets/topup - happy path', async () => {
    const res = await request(app)
      .post('/api/wallets/topup')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 100, currency: 'USD' });
    utils.expectSuccess(res);
  });
});
