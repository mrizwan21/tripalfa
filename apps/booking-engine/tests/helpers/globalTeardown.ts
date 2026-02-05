import { cleanupTestData } from '../../../../services/booking-service/src/__tests__/setup';

export default async function globalTeardown() {
  await cleanupTestData();
}
