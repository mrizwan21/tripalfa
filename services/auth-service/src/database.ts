import { getCoreDb } from '@tripalfa/shared-database';

const coreDb = getCoreDb();
// Alias for backward compatibility
export const prisma = coreDb;
