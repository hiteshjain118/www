import winston from 'winston';
import path from 'path';
import { config } from '../config';

// Create logs directory if it doesn't exist
const logsDir = path.dirname(config.logFile);
import { mkdirSync, existsSync } from 'fs';

if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// Custom timestamp format for PST/PDT timezone
const pstTimestamp = winston.format((info) => {
  const now = new Date();
  
  // Convert to Pacific Time using toLocaleString
  const pacificTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
  
  // Format as YYYY-MM-DD HH:mm:ss.xxx
  const year = pacificTime.getFullYear();
  const month = String(pacificTime.getMonth() + 1).padStart(2, '0');
  const day = String(pacificTime.getDate()).padStart(2, '0');
  const hours = String(pacificTime.getHours()).padStart(2, '0');
  const minutes = String(pacificTime.getMinutes()).padStart(2, '0');
  const seconds = String(pacificTime.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0'); // Use original milliseconds
  
  info.timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  return info;
});

// Define log format
const logFormat = winston.format.combine(
  pstTimestamp(),
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
        pstTimestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          return `[${timestamp}] [${service}] [${level.toUpperCase()}] ${message} ${metaStr}`;
        })
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
    format: winston.format.combine(
      pstTimestamp(),
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `[${timestamp}] [${service}] [${level.toUpperCase()}] ${message} ${metaStr}`;
      })
    )
  }));
}

// Export a simple log function for convenience
export const log = {
  info: (message: string, meta?: any) => logger.info(message, meta),
  error: (message: string, meta?: any) => logger.error(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta)
}; 