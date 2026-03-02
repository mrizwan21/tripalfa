# Test Data Management Guide

## Database Seeding

- Test data is seeded before tests using helpers in `tests/helpers/database.ts`
- Each test run uses unique data (emails, booking refs)
- Data is cleaned up after each test

## Test User Accounts

- See `tests/fixtures/users.json` for test users
- Example: `testuser1@example.com` / `Test@123`

## Payment Cards

- Stripe test mode is used
- See `tests/fixtures/payments.json` for card numbers
- Use `4242 4242 4242 4242` for successful payments
- Use `4000 0000 0000 0002` for declined payments

## External Service Sandboxes

- Stripe, Duffel, LiteAPI are configured in `tests/helpers/external-services.ts`
- Use test/sandbox credentials only

## Fixture Files

- All fixtures are in `tests/fixtures/`
- Use these for consistent test data

## Cleaning Up

- Data is cleaned up automatically after each test run
- Manual cleanup: use helpers in `tests/helpers/database.ts`
