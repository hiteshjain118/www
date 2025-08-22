// Simple frontend logger
interface Logger {
  info: (message: string, meta?: any) => void;
  warn: (message: string, meta?: any) => void;
  error: (message: string, meta?: any) => void;
  debug: (message: string, meta?: any) => void;
}

class FrontendLogger implements Logger {
  private isDevelopment = (import.meta as any).env?.MODE === 'development';

  private formatMessage(level: string, message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    const logPrefix = `[${timestamp}] ${level.toUpperCase()}:`;
    
    if (meta) {
      console.log(logPrefix, message, meta);
    } else {
      console.log(logPrefix, message);
    }
  }

  info(message: string, meta?: any): void {
    if (this.isDevelopment) {
      this.formatMessage('info', message, meta);
    }
  }

  warn(message: string, meta?: any): void {
    this.formatMessage('warn', message, meta);
  }

  error(message: string, meta?: any): void {
    this.formatMessage('error', message, meta);
  }

  debug(message: string, meta?: any): void {
    if (this.isDevelopment) {
      this.formatMessage('debug', message, meta);
    }
  }
}

export const log = new FrontendLogger();
export default log; 