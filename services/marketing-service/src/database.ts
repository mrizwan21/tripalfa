import { getCoreDb, getLocalDb, getFinanceDb } from '@tripalfa/shared-database';

export const coreDb = getCoreDb();
export const localDb = getLocalDb();
export const financeDb = getFinanceDb();
// Aliases for backward compatibility
export const prisma = coreDb;
export { getFinanceDb };

export default { coreDb, localDb, financeDb, prisma, getFinanceDb };
