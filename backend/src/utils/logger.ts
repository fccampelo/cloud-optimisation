import { Request } from 'express';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: any;
  error?: Error;
  requestId?: string;
  userId?: string;
  service?: string;
  environment?: string;
}

export class StructuredLogger {
  private static instance: StructuredLogger;
  private logLevel: LogLevel;
  private service: string;
  private environment: string;

  private constructor() {
    this.logLevel = this.parseLogLevel(process.env.LOG_LEVEL || 'info');
    this.service = 'cloudops-backend';
    this.environment = process.env.NODE_ENV || 'development';
  }

  static getInstance(): StructuredLogger {
    if (!StructuredLogger.instance) {
      StructuredLogger.instance = new StructuredLogger();
    }
    return StructuredLogger.instance;
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'error': return LogLevel.ERROR;
      case 'warn': return LogLevel.WARN;
      case 'info': return LogLevel.INFO;
      case 'debug': return LogLevel.DEBUG;
      case 'trace': return LogLevel.TRACE;
      default: return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatLog(entry: LogEntry): string {
    const formatted = {
      timestamp: entry.timestamp,
      level: LogLevel[entry.level],
      service: this.service,
      environment: this.environment,
      message: entry.message,
      requestId: entry.requestId,
      userId: entry.userId,
      context: entry.context,
      error: entry.error ? {
        name: entry.error.name,
        message: entry.error.message,
        stack: entry.error.stack,
      } : undefined,
    };

    return JSON.stringify(formatted, null, 2);
  }

  private log(level: LogLevel, message: string, context?: any, error?: Error, requestId?: string, userId?: string): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
      requestId,
      userId,
      service: this.service,
      environment: this.environment,
    };

    const formatted = this.formatLog(entry);

    // Output to appropriate stream
    if (level <= LogLevel.ERROR) {
      console.error(formatted);
    } else {
      console.log(formatted);
    }

    // Send to external logging service in production
    if (this.environment === 'production') {
      this.sendToExternalLogging(entry);
    }
  }

  private async sendToExternalLogging(entry: LogEntry): Promise<void> {
    // In production, this would send to services like:
    // - ELK Stack (Elasticsearch, Logstash, Kibana)
    // - CloudWatch Logs
    // - Datadog
    // - New Relic
    // For now, just a placeholder
    if (entry.level <= LogLevel.WARN) {
      // Could trigger alerts for warnings and errors
      console.log('📨 Would send alert for:', entry.message);
    }
  }

  error(message: string, error?: Error, context?: any, requestId?: string, userId?: string): void {
    this.log(LogLevel.ERROR, message, context, error, requestId, userId);
  }

  warn(message: string, context?: any, requestId?: string, userId?: string): void {
    this.log(LogLevel.WARN, message, context, undefined, requestId, userId);
  }

  info(message: string, context?: any, requestId?: string, userId?: string): void {
    this.log(LogLevel.INFO, message, context, undefined, requestId, userId);
  }

  debug(message: string, context?: any, requestId?: string, userId?: string): void {
    this.log(LogLevel.DEBUG, message, context, undefined, requestId, userId);
  }

  trace(message: string, context?: any, requestId?: string, userId?: string): void {
    this.log(LogLevel.TRACE, message, context, undefined, requestId, userId);
  }

  // Helper methods for common scenarios
  logRequest(req: Request, message: string, context?: any): void {
    this.info(message, {
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      ...context,
    }, req.headers['x-request-id'] as string);
  }

  logError(error: Error, context?: any, requestId?: string): void {
    this.error(`Unhandled error: ${error.message}`, error, context, requestId);
  }

  logSlowQuery(duration: number, query: string, context?: any): void {
    this.warn(`Slow query detected: ${duration}ms`, {
      query,
      duration,
      ...context,
    });
  }

  logSecurityEvent(event: string, context?: any, requestId?: string, userId?: string): void {
    this.warn(`Security event: ${event}`, context, requestId, userId);
  }
}

// Singleton instance
export const logger = StructuredLogger.getInstance();

// Express middleware for request logging
export const requestLoggingMiddleware = (req: Request, res: any, next: any) => {
  const startTime = Date.now();
  
  // Generate request ID if not present
  if (!req.headers['x-request-id']) {
    req.headers['x-request-id'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  logger.logRequest(req, 'Incoming request');

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 400 ? 'error' : res.statusCode >= 300 ? 'warn' : 'info';
    
    logger[level]('Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('content-length'),
    }, req.headers['x-request-id'] as string);

    // Log slow requests
    if (duration > 1000) {
      logger.logSlowQuery(duration, `${req.method} ${req.originalUrl}`, {
        statusCode: res.statusCode,
      });
    }
  });

  next();
}; 