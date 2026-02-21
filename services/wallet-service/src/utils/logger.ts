// src/utils/logger.ts
// Structured logging utility

enum LogLevel {
  Error = 0,
  Warn = 1,
  Info = 2,
  Debug = 3,
}

const LOG_LEVELS: Record<string, LogLevel> = {
  error: LogLevel.Error,
  warn: LogLevel.Warn,
  info: LogLevel.Info,
  debug: LogLevel.Debug,
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL || 'info'];

interface LogEntry {
  level: string;
  timestamp: string;
  message: string;
  data?: unknown;
  error?: string;
  stack?: string;
}

export const logger = {
  error: (message: string, error?: Error): void => {
    if (currentLevel >= LogLevel.Error) {
      const entry: LogEntry = {
        level: 'error',
        timestamp: new Date().toISOString(),
        message,
        error: error?.message || String(error),
        stack: error?.stack,
      };
      console.error(JSON.stringify(entry));
    }
  },

  warn: (message: string, data?: unknown): void => {
    if (currentLevel >= LogLevel.Warn) {
      const entry: LogEntry = {
        level: 'warn',
        timestamp: new Date().toISOString(),
        message,
        data,
      };
      console.warn(JSON.stringify(entry));
    }
  },

  info: (message: string, data?: unknown): void => {
    if (currentLevel >= LogLevel.Info) {
      const entry: LogEntry = {
        level: 'info',
        timestamp: new Date().toISOString(),
        message,
        data,
      };
      console.log(JSON.stringify(entry));
    }
  },

  debug: (message: string, data?: unknown): void => {
    if (currentLevel >= LogLevel.Debug) {
      const entry: LogEntry = {
        level: 'debug',
        timestamp: new Date().toISOString(),
        message,
        data,
      };
      console.log(JSON.stringify(entry));
    }
  },
};

export default logger;
