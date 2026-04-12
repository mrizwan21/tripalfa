import { prisma } from '@tripalfa/shared-database';

export function getPrismaClient() {
  return prisma;
}

async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

export async function healthCheck(): Promise<boolean> {
  try {
    const client = getPrismaClient();
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch (error: unknown) {
    console.error('Database health check failed:', error);
    return false;
  }
}
