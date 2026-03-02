import { FullConfig } from "@playwright/test";
import { spawn, execSync } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let backendProcess: any;

async function globalSetup(config: FullConfig) {
  console.log("🚀 Running global setup...");

  try {
    // Kill any existing process on port 3001
    console.log("🧹 Cleaning up any existing backend service on port 3001...");
    try {
      execSync("lsof -ti:3001 | xargs kill -9 2>/dev/null || true", {
        stdio: "inherit",
      });
    } catch (error) {
      // Ignore errors if no process is running on the port
    }

    // Start backend services for API integration tests
    console.log("🔧 Starting backend services...");

    const servicePath = path.resolve(
      __dirname,
      "../../../../services/booking-service",
    );
    if (!fs.existsSync(servicePath)) {
      throw new Error(`Booking service not found at ${servicePath}`);
    }

    backendProcess = spawn("npm", ["run", "dev"], {
      cwd: servicePath,
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "test",
        PORT: "3001",
        DATABASE_URL:
          process.env.DATABASE_URL ||
          "postgresql://postgres:password@localhost:5432/tripalfa_test",
      },
    });

    backendProcess.on("error", (err: Error) => {
      console.error("Failed to start backend:", err);
      throw err;
    });

    // Wait for backend to be ready
    await waitForServer("http://localhost:3001", 60000);
    await setupTestDatabase();

    console.log("✅ Global setup complete - backend services running");
  } catch (error) {
    console.error("❌ Global setup failed:", error);
    await globalTeardown();
    throw error;
  }
}

async function waitForServer(url: string, timeout: number): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(`${url}/health`);
      if (response.ok) {
        return;
      }
    } catch (error) {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Server at ${url} did not start within ${timeout}ms`);
}

async function setupTestDatabase(): Promise<void> {
  // Run database migrations and seed test data
  try {
    // Run migrations
    execSync("npm run db:migrate", {
      cwd: path.resolve(__dirname, "../../../../"),
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_URL:
          process.env.DATABASE_URL ||
          "postgresql://postgres:password@localhost:5432/tripalfa_test",
      },
    });

    // Seed test data
    execSync("npm run db:seed:test", {
      cwd: path.resolve(__dirname, "../../../../"),
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_URL:
          process.env.DATABASE_URL ||
          "postgresql://postgres:password@localhost:5432/tripalfa_test",
      },
    });
  } catch (error) {
    console.warn(
      "⚠️ Database setup failed, continuing with tests (may need manual setup):",
      (error as Error).message,
    );
  }
}

async function globalTeardown() {
  console.log("🧹 Running global teardown...");

  if (backendProcess) {
    console.log("🛑 Stopping backend services...");
    try {
      backendProcess.kill("SIGTERM");
      // Wait a bit for graceful shutdown
      await new Promise((resolve) => setTimeout(resolve, 2000));
      if (!backendProcess.killed) {
        backendProcess.kill("SIGKILL");
      }
    } catch (error) {
      console.warn(
        "⚠️ Error stopping backend process:",
        (error as Error).message,
      );
    }
  }

  console.log("✅ Global teardown complete");
}

export default globalSetup;
export { globalTeardown };
