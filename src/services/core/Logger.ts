// Logger unifié - Remplace les 255 console.log dispersés
// Production-ready avec niveaux, contexte et performance

import { LogLevel, LogEntry } from '@/types/unified';

interface LoggerConfig {
  level: LogLevel;
  enabledInProduction: boolean;
  maxLogEntries: number;
  persistLogs: boolean;
}

export class Logger {
  private static config: LoggerConfig = {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    enabledInProduction: false,
    maxLogEntries: 1000,
    persistLogs: false
  };

  private static logs: LogEntry[] = [];
  private source: string;

  constructor(source: string) {
    this.source = source;
  }

  // ==================== CONFIGURATION ====================

  static configure(config: Partial<LoggerConfig>): void {
    Logger.config = { ...Logger.config, ...config };
  }

  static getConfig(): LoggerConfig {
    return { ...Logger.config };
  }

  // ==================== LOG LEVELS ====================

  debug(message: string, context?: any): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: any): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: any): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: any): void {
    this.log('error', message, context);
  }

  fatal(message: string, context?: any): void {
    this.log('fatal', message, context);
  }

  // ==================== CORE LOGGING ====================

  private log(level: LogLevel, message: string, context?: any): void {
    // Check if logging is enabled for this level
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      context: this.sanitizeContext(context),
      timestamp: new Date().toISOString(),
      source: this.source
    };

    // Add to memory store
    Logger.logs.push(entry);
    this.trimLogs();

    // Output to console (development only)
    if (process.env.NODE_ENV !== 'production' || Logger.config.enabledInProduction) {
      this.outputToConsole(entry);
    }

    // Persist if enabled
    if (Logger.config.persistLogs) {
      this.persistLog(entry);
    }

    // Send critical logs to monitoring
    if (level === 'error' || level === 'fatal') {
      this.sendToMonitoring(entry);
    }
  }

  // ==================== LEVEL CHECKING ====================

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
    const configLevel = Logger.config.level;
    
    return levels.indexOf(level) >= levels.indexOf(configLevel);
  }

  // ==================== CONTEXT SANITIZATION ====================

  private sanitizeContext(context: any): any {
    if (!context) return undefined;

    // Remove sensitive data
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'api_key', 'apiKey'];
    
    if (typeof context === 'object') {
      const sanitized = { ...context };
      
      const sanitizeObject = (obj: any): void => {
        for (const key in obj) {
          if (typeof key === 'string' && sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
            obj[key] = '[REDACTED]';
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
          }
        }
      };
      
      sanitizeObject(sanitized);
      return sanitized;
    }
    
    return context;
  }

  // ==================== OUTPUT METHODS ====================

  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.split('T')[1].split('.')[0];
    const emoji = this.getLevelEmoji(entry.level);
    const message = `${emoji} [${timestamp}] ${entry.source}: ${entry.message}`;
    
    switch (entry.level) {
      case 'debug':
        console.debug(message, entry.context);
        break;
      case 'info':
        console.info(message, entry.context);
        break;
      case 'warn':
        console.warn(message, entry.context);
        break;
      case 'error':
      case 'fatal':
        console.error(message, entry.context);
        break;
    }
  }

  private getLevelEmoji(level: LogLevel): string {
    const emojis = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      fatal: '🚨'
    };
    return emojis[level] || 'ℹ️';
  }

  // ==================== PERSISTENCE ====================

  private persistLog(entry: LogEntry): void {
    try {
      const logs = this.getStoredLogs();
      logs.push(entry);
      
      // Keep only recent logs
      const maxEntries = Math.min(Logger.config.maxLogEntries, 500);
      const trimmedLogs = logs.slice(-maxEntries);
      
      localStorage.setItem('app_logs', JSON.stringify(trimmedLogs));
    } catch (error) {
      // Silently fail - don't log about logging
    }
  }

  private getStoredLogs(): LogEntry[] {
    try {
      const stored = localStorage.getItem('app_logs');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  // ==================== MONITORING ====================

  private sendToMonitoring(entry: LogEntry): void {
    // In production, this would send to a monitoring service
    // For now, just ensure it's captured
    if (entry.level === 'fatal') {
      // Critical error - could trigger alerts
      console.error('FATAL ERROR DETECTED:', entry);
    }
  }

  // ==================== MEMORY MANAGEMENT ====================

  private trimLogs(): void {
    if (Logger.logs.length > Logger.config.maxLogEntries) {
      Logger.logs = Logger.logs.slice(-Logger.config.maxLogEntries);
    }
  }

  // ==================== STATIC UTILITIES ====================

  static getLogs(filter?: Partial<{ level: LogLevel; source: string; limit: number }>): LogEntry[] {
    let logs = [...Logger.logs];
    
    if (filter?.level) {
      logs = logs.filter(log => log.level === filter.level);
    }
    
    if (filter?.source) {
      logs = logs.filter(log => log.source.includes(filter.source!));
    }
    
    if (filter?.limit) {
      logs = logs.slice(-filter.limit);
    }
    
    return logs.reverse(); // Most recent first
  }

  static clearLogs(): void {
    Logger.logs = [];
    try {
      localStorage.removeItem('app_logs');
    } catch (error) {
      // Silently fail
    }
  }

  static exportLogs(): string {
    return JSON.stringify(Logger.logs, null, 2);
  }

  // ==================== PERFORMANCE LOGGING ====================

  static createTimer(name: string): () => void {
    const start = performance.now();
    const logger = new Logger('Timer');
    
    return () => {
      const duration = performance.now() - start;
      logger.info(`Timer completed: ${name}`, { duration: `${duration.toFixed(2)}ms` });
    };
  }

  // ==================== STRUCTURED LOGGING ====================

  logApiCall(method: string, url: string, duration: number, status: number, error?: any): void {
    const context = {
      method,
      url: url.replace(/\/[a-f0-9-]{36}/g, '/:id'), // Hide IDs
      duration: `${duration}ms`,
      status
    };

    if (error) {
      this.error(`API call failed: ${method} ${url}`, { ...context, error: error.message });
    } else if (status >= 400) {
      this.warn(`API call warning: ${method} ${url}`, context);
    } else {
      this.info(`API call: ${method} ${url}`, context);
    }
  }

  logUserAction(action: string, details?: any): void {
    this.info(`User action: ${action}`, details);
  }

  logPerformance(operation: string, duration: number, metadata?: any): void {
    const level = duration > 1000 ? 'warn' : 'info';
    this[level](`Performance: ${operation}`, { 
      duration: `${duration}ms`,
      ...metadata 
    });
  }
}
