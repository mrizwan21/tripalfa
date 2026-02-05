const request = require('supertest');
const app = require('../../../app');
const utils = require('../utils');

describe('Booking API E2E', () => {
  let token;
  beforeAll(async () => {
    token = utils.createAdminToken();
  });

  it('POST /api/bookings/flight/hold - happy path', async () => {
    const res = await request(app)
      .post('/api/bookings/flight/hold')
      .set('Authorization', `Bearer ${token}`)
      .send(utils.buildBookingRequest('flight'));
    utils.expectSuccess(res);
  });

  it('POST /api/bookings/flight/confirm - happy path', async () => {
    const res = await request(app)
      .post('/api/bookings/flight/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send(utils.buildBookingRequest('flight'));
    utils.expectSuccess(res);
  });

  it('POST /api/bookings/hotel/hold - happy path', async () => {
    const res = await request(app)
      .post('/api/bookings/hotel/hold')
      .set('Authorization', `Bearer ${token}`)
      .send(utils.buildBookingRequest('hotel'));
    utils.expectSuccess(res);
  });

  it('POST /api/bookings/hotel/confirm - happy path', async () => {
    const res = await request(app)
      .post('/api/bookings/hotel/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send(utils.buildBookingRequest('hotel'));
    utils.expectSuccess(res);
  });

  it('GET /api/bookings - happy path', async () => {
    const res = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${token}`);
    utils.expectSuccess(res);
  });

  it('GET /api/bookings/:id - happy path', async () => {
    const booking = await utils.createTestBooking();
    const res = await request(app)
      .get(`/api/bookings/${booking.id}`)
      .set('Authorization', `Bearer ${token}`);
    utils.expectSuccess(res);
  });
});
