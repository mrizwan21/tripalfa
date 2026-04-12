import { getCoreDb, getLocalDb, getFinanceDb } from '@tripalfa/shared-database';

const coreDb = getCoreDb();
const localDb = getLocalDb();
const financeDb = getFinanceDb();
// Aliases for backward compatibility
const prisma = coreDb;
{ getFinanceDb }

export default { coreDb, localDb, financeDb, prisma, getFinanceDb };
