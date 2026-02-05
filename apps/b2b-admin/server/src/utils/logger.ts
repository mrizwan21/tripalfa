// Simple logger implementation without external dependencies
export interface Logger {
  info: (message: string, meta?: any) => void;
  error: (message: string, meta?: any) => void;
  warn: (message: string, meta?: any) => void;
  debug: (message: string, meta?: any) => void;
}

const logLevel = 'info'; // Simplified for now
const logLevels = ['error', 'warn', 'info', 'debug'];

function shouldLog(level: string): boolean {
  const currentLevelIndex = logLevels.indexOf(logLevel);
  const messageLevelIndex = logLevels.indexOf(level);
  return messageLevelIndex <= currentLevelIndex;
}

function formatMessage(level: string, message: string, meta?: any): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
}

export const logger: Logger = {
  info: (message: string, meta?: any) => {
    if (shouldLog('info')) {
      console.log(formatMessage('info', message, meta));
    }
  },
  error: (message: string, meta?: any) => {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message, meta));
    }
  },
  warn: (message: string, meta?: any) => {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, meta));
    }
  },
  debug: (message: string, meta?: any) => {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', message, meta));
    }
  }
};
