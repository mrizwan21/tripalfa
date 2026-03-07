import cron from "node-cron";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function runScript(scriptPath: string) {
    console.log(`[Scheduler] Starting script: ${scriptPath}`);
    const absolutePath = resolve(__dirname, scriptPath);

    // Use ts-node to run the script
    const child = spawn("npx", ["ts-node", "--transpile-only", absolutePath], {
        stdio: "inherit",
        shell: true
    });

    child.on("close", (code) => {
        if (code === 0) {
            console.log(`[Scheduler] Script ${scriptPath} completed successfully.`);
        } else {
            console.error(`[Scheduler] Script ${scriptPath} failed with code ${code}.`);
        }
    });

    child.on("error", (err) => {
        console.error(`[Scheduler] Error starting script ${scriptPath}:`, err.message);
    });
}

// 1. Schedule Exchange Rates Sync - Hourly at :00
cron.schedule("0 * * * *", () => {
    console.log("[Scheduler] Triggering hourly exchange rates sync...");
    runScript("./scripts/sync-exchange-rates.ts");
});

// 2. Schedule Timezone Sync - Every day at 1:00 AM (or every hour at :30 to catch new cities)
cron.schedule("30 * * * *", () => {
    console.log("[Scheduler] Triggering hourly timezone sync for new cities...");
    runScript("./scripts/sync-timezone-data.ts");
});

// Initial run on startup
console.log("[Scheduler] Performing initial sync on startup...");
runScript("./scripts/sync-exchange-rates.ts");
runScript("./scripts/sync-timezone-data.ts");

console.log("[Scheduler] Static data background sync service started.");
console.log("[Scheduler] - Exchange Rates: Every hour at :00");
console.log("[Scheduler] - Timezones: Every hour at :30");
