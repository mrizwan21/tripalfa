/**
 * Standardized logging wrapper
 * Replaces console.* statements throughout the codebase
 */

import { logger } from './monitoring';

type LogMeta = Record<string, any>;

export const log = {
  info: (message: string, meta?: LogMeta): void => {
    logger.info(message, meta);
  },
  
  error: (message: string, error?: Error, meta?: LogMeta): void => {
    logger.error(message, { 
      ...meta, 
      error: error?.message, 
      stack: error?.stack 
    });
  },
  
  warn: (message: string, meta?: LogMeta): void => {
    logger.warn(message, meta);
  },
  
  debug: (message: string, meta?: LogMeta): void => {
    logger.debug(message, meta);
  },
  
  // Specialized loggers for common scenarios
  database: {
    connect: (url: string): void => {
      logger.info('Connecting to database', { 
        url: url.substring(0, 30) + '...' 
      });
    },
    
    error: (operation: string, error: Error): void => {
      logger.error(`Database ${operation} failed`, { 
        error: error.message 
      });
    },
    
    query: (query: string, duration: number): void => {
      logger.debug('Database query executed', { 
        query: query.substring(0, 100),
        duration 
      });
    }
  }
};