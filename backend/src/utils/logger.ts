import winston from 'winston';
import path from 'path';
import { config } from '../config';

// Create logs directory if it doesn't exist
const logsDir = path.dirname(config.logFile);
import { mkdirSync, existsSync } from 'fs';

if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// Custom format to include line numbers and file names
const lineNumberFormat = winston.format((info) => {
  // Get the call stack to find the calling file and line
  const stack = new Error().stack;
  if (stack) {
    const lines = stack.split('\n');
    // Skip the first few lines (Error constructor, this function, winston internals)
    for (let i = 3; i < lines.length; i++) {
      const line = lines[i];
      // Look for lines that contain our source files (not node_modules)
      if (line.includes('src/') && !line.includes('node_modules')) {
        // Extract file path and line number
        // Handle both TypeScript (ts-node-dev) and compiled JavaScript formats
        const match = line.match(/at\s+(?:.*\s+\()?(.+):(\d+):(\d+)/);
        if (match) {
          const [, filePath, lineNumber, columnNumber] = match;
          // Extract just the file name and line number
          const fileName = filePath.split('/').pop() || filePath;
          info.file = `${fileName}:${lineNumber}`;
          break;
        }
      }
    }
  }
  return info;
});

// Helper function to get call site information
function getCallSite() {
  const stack = new Error().stack;
  if (stack) {
    const lines = stack.split('\n');
    // Skip the first few lines (Error constructor, this function, winston internals)
    for (let i = 3; i < lines.length; i++) {
      const line = lines[i];
      // Look for lines that contain our source files (not node_modules)
      if (line.includes('src/') && !line.includes('node_modules')) {
        // Extract file path and line number
        const match = line.match(/at\s+(?:.*\s+\()?(.+):(\d+):(\d+)/);
        if (match) {
          const [, filePath, lineNumber] = match;
          // Extract just the file name and line number
          const fileName = filePath.split('/').pop() || filePath;
          return `${fileName}:${lineNumber}`;
        }
      }
    }
  }
  return undefined;
}

// Custom timestamp format for PST/PDT timezone
const pacificTimestamp = winston.format((info) => {
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

// Create logger instance
export const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    lineNumberFormat(),
    pacificTimestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, service, file, ...meta }) => {
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
      const fileInfo = file ? ` [${file}]` : '';
      return `[${timestamp}] [${service}] [${level.toUpperCase()}]${fileInfo} ${message} ${metaStr}`;
    })
  ),
  defaultMeta: { service: '' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        lineNumberFormat(),
        pacificTimestamp(),
        winston.format.printf(({ timestamp, level, message, service, file, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          const fileInfo = file ? ` [${file}]` : '';
          const serviceInfo = service ? ` [${service}]` : '';
          return `[${timestamp}]${serviceInfo} [${level.toUpperCase()}]${fileInfo} ${message} ${metaStr}`;
        }),
        winston.format.colorize({ all: true })
      )
    }),
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: winston.format.combine(
        lineNumberFormat(),
        pacificTimestamp(),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, service, file, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          const fileInfo = file ? ` [${file}]` : '';
          const serviceInfo = service ? ` [${service}]` : '';
          return `[${timestamp}]${serviceInfo} [${level.toUpperCase()}]${fileInfo} ${message} ${metaStr}`;
        })
      )
    }),
    // Write all logs to combined.log
    new winston.transports.File({
      filename: config.logFile,
      format: winston.format.combine(
        lineNumberFormat(),
        pacificTimestamp(),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, service, file, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          const fileInfo = file ? ` [${file}]` : '';
          const serviceInfo = service ? ` [${service}]` : '';
          return `[${timestamp}]${serviceInfo} [${level.toUpperCase()}]${fileInfo} ${message} ${metaStr}`;
        })
      )
    })
  ]
});

// If we're not in production, log to console as well
if (config.nodeEnv === 'development') {
  // Console logging is already configured in the main transports above
  // No need to add another console transport
}

// Export a simple log function for convenience
export const log = {
  info: (message: string, meta?: any) => {
    const callSite = getCallSite();
    if (callSite) {
      meta = { ...meta, file: callSite };
    }
    logger.info(message, meta);
  },
  error: (message: string, meta?: any) => {
    const callSite = getCallSite();
    if (callSite) {
      meta = { ...meta, file: callSite };
    }
    logger.error(message, meta);
  },
  warn: (message: string, meta?: any) => {
    const callSite = getCallSite();
    if (callSite) {
      meta = { ...meta, file: callSite };
    }
    logger.warn(message, meta);
  },
  debug: (message: string, meta?: any) => {
    const callSite = getCallSite();
    if (callSite) {
      meta = { ...meta, file: callSite };
    }
    logger.debug(message, meta);
  }
};

// Export the logger instance with enhanced methods for better line number detection
export const enhancedLogger = {
  info: (message: string, meta?: any) => {
    const callSite = getCallSite();
    if (callSite) {
      meta = { ...meta, file: callSite };
    }
    return logger.info(message, meta);
  },
  error: (message: string, meta?: any) => {
    const callSite = getCallSite();
    if (callSite) {
      meta = { ...meta, file: callSite };
    }
    return logger.error(message, meta);
  },
  warn: (message: string, meta?: any) => {
    const callSite = getCallSite();
    if (callSite) {
      meta = { ...meta, file: callSite };
    }
    return logger.warn(message, meta);
  },
  debug: (message: string, meta?: any) => {
    const callSite = getCallSite();
    if (callSite) {
      meta = { ...meta, file: callSite };
    }
    return logger.debug(message, meta);
  }
}; 