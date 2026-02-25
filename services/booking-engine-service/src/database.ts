// Re-export from shared-database package
export { prisma } from '@tripalfa/shared-database';
import { Prisma } from '@prisma/client';

// Use Prisma's Decimal type directly
export const Decimal = Prisma.Decimal;
export { default } from '@tripalfa/shared-database';