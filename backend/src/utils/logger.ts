import winston from 'winston';
import path from 'path';
import { config } from '../config';

// Create logs directory if it doesn't exist
const logsDir = path.dirname(config.logFile);
import { mkdirSync, existsSync } from 'fs';

if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
export const logger = winston.createLogger({
  level: config.logLevel,
  format: logFormat,
  defaultMeta: { service: 'coralbricks-auth-service' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error'
    }),
    // Write all logs to combined.log
    new winston.transports.File({
      filename: config.logFile
    })
  ]
});

// If we're not in production, log to console as well
if (config.nodeEnv === 'development') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Export a simple log function for convenience
export const log = {
  info: (message: string, meta?: any) => logger.info(message, meta),
  error: (message: string, meta?: any) => logger.error(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta)
}; 