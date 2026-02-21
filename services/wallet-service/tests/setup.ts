// tests/setup.ts
// Test setup in TypeScript so Jest can load it regardless of ESM/TS handling
import { pool } from "../src/config/db.js";

// Increase test timeout
jest.setTimeout(30000);

// Clean up database after all tests
afterAll(async () => {
  await pool.end();
});
