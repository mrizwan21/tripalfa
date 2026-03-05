import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

beforeAll(async () => {
  // Run database migrations
  try {
    execSync("pnpm prisma migrate dev --name test-setup", {
      stdio: "inherit",
      cwd: process.cwd(),
    });
  } catch (error) {
    console.error("Failed to run migrations:", error);
  }
});

beforeEach(async () => {
  // Clean up database before each test
  const models = Reflect.ownKeys(prisma).filter(
    (key) => key !== "_" && typeof key !== "symbol",
  );

  const transactions = models.map((modelKey) => {
    const model = prisma[modelKey as keyof PrismaClient];
    if (typeof model === "object" && model !== null && "deleteMany" in model) {
      return (model as any).deleteMany();
    }
    return Promise.resolve();
  });

  await Promise.all(transactions);
});

afterEach(async () => {
  // Clean up database after each test
  const models = Reflect.ownKeys(prisma).filter(
    (key) => key !== "_" && typeof key !== "symbol",
  );

  const transactions = models.map((modelKey) => {
    const model = prisma[modelKey as keyof PrismaClient];
    if (typeof model === "object" && model !== null && "deleteMany" in model) {
      return (model as any).deleteMany();
    }
    return Promise.resolve();
  });

  await Promise.all(transactions);
});

afterAll(async () => {
  await prisma.$disconnect();
});