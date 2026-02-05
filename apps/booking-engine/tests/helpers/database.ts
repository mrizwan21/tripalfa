import { seedTestData, cleanupTestData } from '../../../../services/booking-service/src/__tests__/setup';

export async function globalSetup() {
  await seedTestData();
}

export async function globalTeardown() {
  await cleanupTestData();
}
