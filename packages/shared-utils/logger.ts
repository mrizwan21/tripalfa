// Centralized logger utility for TripAlfa
// @ts-ignore
import pino, { Logger, LoggerOptions } from "pino";

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";
export type { Logger };

export interface LoggerConfig {
  level?: LogLevel;
  transport?: boolean;
  pretty?: boolean;
  serviceName?: string;
}

export function createLogger(config: LoggerConfig = {}): Logger {
  const {
    // @ts-ignore
    level = process.env.LOG_LEVEL || "info",
    serviceName = "tripalfa",
  } = config;

  const loggerOptions: LoggerOptions = {
    level,
    base: {
      service: serviceName,
      // @ts-ignore
      environment: process.env.NODE_ENV || "development",
    },
  };

  // @ts-ignore
  if (process.env.NODE_ENV !== "production" && config.pretty !== false) {
    return pino({
      ...loggerOptions,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          singleLine: false,
          translateTime: "SYS:standard",
        },
      },
    });
  }

  return pino(loggerOptions);
}

export function createChildLogger(
  logger: Logger,
  context: Record<string, any>,
): Logger {
  return logger.child(context);
}

// Prisma logger for shared use
export class PrismaLogger {
  static log(
    level: "info" | "warn" | "error",
    message: string,
    data?: unknown,
  ): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }
  static info(message: string, data?: unknown): void {
    this.log("info", message, data);
  }
  static warn(message: string, data?: unknown): void {
    this.log("warn", message, data);
  }
  static error(message: string, data?: unknown): void {
    this.log("error", message, data);
  }
}
