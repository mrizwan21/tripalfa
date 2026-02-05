// tests/setup.cjs
// Test setup in CommonJS so Jest can load it regardless of ESM/TS handling
const { pool } = require('../src/config/db.js');

// Increase test timeout
jest.setTimeout(30000);

// Clean up database after all tests
afterAll(async () => {
  await pool.end();
});
