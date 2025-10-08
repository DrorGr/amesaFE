import { Injectable } from '@angular/core';

/**
 * Log levels for structured logging
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

/**
 * Interface for log entry structure
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  data?: any;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
}

/**
 * Service for structured logging with different levels and contexts.
 * Provides centralized logging with filtering and external service integration.
 * 
 * @example
 * ```typescript
 * constructor(private logger: LoggingService) {}
 * 
 * logUserAction(action: string, data: any) {
 *   this.logger.info('User action', { action, data }, 'UserService');
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  private currentLogLevel: LogLevel = LogLevel.INFO;
  private logEntries: LogEntry[] = [];
  private maxLogEntries = 1000;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  /**
   * Sets the minimum log level for filtering
   * @param level - The minimum log level to display
   */
  setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level;
  }

  /**
   * Logs a debug message
   * @param message - The log message
   * @param data - Optional data to include
   * @param context - Optional context (e.g., service name)
   */
  debug(message: string, data?: any, context?: string): void {
    this.log(LogLevel.DEBUG, message, data, context);
  }

  /**
   * Logs an info message
   * @param message - The log message
   * @param data - Optional data to include
   * @param context - Optional context (e.g., service name)
   */
  info(message: string, data?: any, context?: string): void {
    this.log(LogLevel.INFO, message, data, context);
  }

  /**
   * Logs a warning message
   * @param message - The log message
   * @param data - Optional data to include
   * @param context - Optional context (e.g., service name)
   */
  warn(message: string, data?: any, context?: string): void {
    this.log(LogLevel.WARN, message, data, context);
  }

  /**
   * Logs an error message
   * @param message - The log message
   * @param data - Optional data to include
   * @param context - Optional context (e.g., service name)
   */
  error(message: string, data?: any, context?: string): void {
    this.log(LogLevel.ERROR, message, data, context);
  }

  /**
   * Logs a critical message
   * @param message - The log message
   * @param data - Optional data to include
   * @param context - Optional context (e.g., service name)
   */
  critical(message: string, data?: any, context?: string): void {
    this.log(LogLevel.CRITICAL, message, data, context);
  }

  /**
   * Logs user actions for analytics
   * @param action - The action performed
   * @param data - Optional data about the action
   * @param userId - Optional user ID
   */
  logUserAction(action: string, data?: any, _userId?: string): void {
    this.info(`User action: ${action}`, data, 'UserAnalytics');
  }

  /**
   * Logs performance metrics
   * @param metric - The metric name
   * @param value - The metric value
   * @param unit - The unit of measurement
   */
  logPerformance(metric: string, value: number, unit: string = 'ms'): void {
    this.info(`Performance: ${metric}`, { value, unit }, 'Performance');
  }

  /**
   * Logs API calls
   * @param method - HTTP method
   * @param url - API endpoint
   * @param status - Response status
   * @param duration - Request duration
   */
  logApiCall(method: string, url: string, status: number, duration: number): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, `API Call: ${method} ${url}`, { status, duration }, 'API');
  }

  /**
   * Core logging method
   * @param level - The log level
   * @param message - The log message
   * @param data - Optional data to include
   * @param context - Optional context
   */
  private log(level: LogLevel, message: string, data?: any, context?: string): void {
    // Skip if below current log level
    if (level < this.currentLogLevel) {
      return;
    }

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      data,
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Add to internal log
    this.logEntries.unshift(logEntry);
    
    // Maintain log size limit
    if (this.logEntries.length > this.maxLogEntries) {
      this.logEntries = this.logEntries.slice(0, this.maxLogEntries);
    }

    // Console output
    this.outputToConsole(logEntry);

    // Send to external service if needed
    if (this.shouldSendToExternalService(logEntry)) {
      this.sendToExternalService(logEntry);
    }
  }

  /**
   * Outputs log entry to console with appropriate method
   * @param entry - The log entry
   */
  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const contextStr = entry.context ? `[${entry.context}]` : '';
    const message = `${timestamp} ${contextStr} ${entry.message}`;
    
    const consoleMethod = this.getConsoleMethod(entry.level);
    
    if (entry.data) {
      consoleMethod(message, entry.data);
    } else {
      consoleMethod(message);
    }
  }

  /**
   * Gets appropriate console method based on log level
   * @param level - The log level
   * @returns Console method to use
   */
  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        return console.error;
      default:
        return console.log;
    }
  }

  /**
   * Determines if log should be sent to external service
   * @param entry - The log entry
   * @returns True if should send to external service
   */
  private shouldSendToExternalService(entry: LogEntry): boolean {
    // Send errors and critical logs to external service
    return entry.level >= LogLevel.ERROR;
  }

  /**
   * Sends log entry to external logging service
   * @param entry - The log entry
   */
  private sendToExternalService(entry: LogEntry): void {
    // In a real application, you would send this to your logging service
    // like Sentry, LogRocket, or your own API
    console.log('Sending to external service:', entry);
  }

  /**
   * Generates a unique session ID
   * @returns Session ID string
   */
  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  /**
   * Gets recent log entries
   * @param limit - Maximum number of entries to return
   * @returns Array of recent log entries
   */
  getRecentLogs(limit: number = 50): LogEntry[] {
    return this.logEntries.slice(0, limit);
  }

  /**
   * Gets logs by level
   * @param level - The log level to filter by
   * @returns Array of log entries with specified level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logEntries.filter(entry => entry.level === level);
  }

  /**
   * Gets logs by context
   * @param context - The context to filter by
   * @returns Array of log entries with specified context
   */
  getLogsByContext(context: string): LogEntry[] {
    return this.logEntries.filter(entry => entry.context === context);
  }

  /**
   * Clears the log entries
   */
  clearLogs(): void {
    this.logEntries = [];
  }

  /**
   * Exports logs as JSON
   * @returns JSON string of all log entries
   */
  exportLogs(): string {
    return JSON.stringify(this.logEntries, null, 2);
  }

  /**
   * Gets log statistics
   * @returns Object with log counts by level
   */
  getLogStatistics(): { [key: string]: number } {
    const stats: { [key: string]: number } = {};
    
    Object.values(LogLevel).forEach(level => {
      if (typeof level === 'string') {
        stats[level] = this.getLogsByLevel(level as unknown as LogLevel).length;
      }
    });
    
    return stats;
  }
}
