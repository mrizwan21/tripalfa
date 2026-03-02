type Level = "info" | "warn" | "error" | "debug" | "success";

const COLORS: Record<Level, string> = {
  info: "\x1b[36m", // Cyan
  warn: "\x1b[33m", // Yellow
  error: "\x1b[31m", // Red
  debug: "\x1b[90m", // Grey
  success: "\x1b[32m", // Green
};
const RESET = "\x1b[0m";

function fmt(level: Level, scope: string, msg: string): string {
  const ts = new Date().toISOString();
  const col = COLORS[level];
  const tag = level.toUpperCase().padEnd(7);
  return `${col}[${ts}] ${tag} [${scope}] ${msg}${RESET}`;
}

export function createLogger(scope: string) {
  return {
    info: (msg: string) => console.log(fmt("info", scope, msg)),
    warn: (msg: string) => console.warn(fmt("warn", scope, msg)),
    error: (msg: string) => console.error(fmt("error", scope, msg)),
    debug: (msg: string) =>
      process.env.DEBUG && console.debug(fmt("debug", scope, msg)),
    success: (msg: string) => console.log(fmt("success", scope, msg)),
  };
}

export type Logger = ReturnType<typeof createLogger>;
