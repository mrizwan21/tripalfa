import { prisma } from "@tripalfa/shared-database";

async function testPrisma(): Promise<void> {
    try {
        console.log("Testing Prisma connection...");
        const count = await prisma.duffelOrder.count();
        console.log("Prisma working! Order count:", count);
    } catch (error) {
        console.error("Prisma error:", (error as Error).message);
    }
}

testPrisma();
