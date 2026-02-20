/**
 * Production Logger Utility
 * 
 * Provides structured logging for production environments.
 * Replaces console.log/warn/error with a proper logging service.
 * 
 * Features:
 * - Environment-aware logging (disabled in production for debug logs)
 * - Structured error logging with context
 * - Error reporting service integration ready
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment: boolean;
  private errorService?: (error: Error, context?: LogContext) => void;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Set error reporting service (e.g., Sentry, LogRocket)
   */
  setErrorService(service: (error: Error, context?: LogContext) => void) {
    this.errorService = service;
  }

  /**
   * Debug logging - only in development
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${message}`, context || '');
    }
  }

  /**
   * Info logging - general information
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, context || '');
    }
  }

  /**
   * Warning logging - potential issues
   */
  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, context || '');
    }
  }

  /**
   * Error logging - always logged, reports to error service
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    // Always log errors, even in production
    console.error(`[ERROR] ${message}`, errorObj, context || '');

    // Report to error service if configured
    if (this.errorService) {
      this.errorService(errorObj, context);
    }
  }

  /**
   * Log API errors with proper formatting
   */
  apiError(endpoint: string, status: number, error?: unknown): void {
    this.error(`API Error: ${endpoint}`, error, {
      endpoint,
      status,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log network errors
   */
  networkError(operation: string, error?: unknown): void {
    this.error(`Network Error: ${operation}`, error, {
      operation,
      timestamp: new Date().toISOString()
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export default for convenience
export default logger;
