const request = require('supertest');
const app = require('../../../app');
const utils = require('../utils');

describe('Payment API E2E', () => {
  let token;
  beforeAll(async () => {
    token = utils.createAdminToken();
  });

  it('POST /api/payments/card - happy path', async () => {
    const res = await request(app)
      .post('/api/payments/card')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 100, card: '4242424242424242' });
    utils.expectSuccess(res);
  });

  it('POST /api/payments/wallet - happy path', async () => {
    const res = await request(app)
      .post('/api/payments/wallet')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 100 });
    utils.expectSuccess(res);
  });
});
