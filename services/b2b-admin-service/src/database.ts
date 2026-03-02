// Re-export from shared-database package
export { prisma } from "@tripalfa/shared-database";
export default (await import("@tripalfa/shared-database")).default;
