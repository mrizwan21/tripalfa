import { prisma } from "@tripalfa/shared-database";

// Export the Prisma client under the name expected by repository files.
export const opsDb = prisma;
export { prisma };
export default prisma;
