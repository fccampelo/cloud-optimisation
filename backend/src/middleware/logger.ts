import { Request, Response, NextFunction } from 'express';

export interface LogData {
  method: string;
  url: string;
  statusCode?: number;
  responseTime?: number;
  userAgent?: string;
  ip: string;
  timestamp: string;
}

export const logger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // Log the incoming request
  const logData: LogData = {
    method: req.method,
    url: req.originalUrl || req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    timestamp,
  };

  console.log(`${timestamp} - ${logData.method} ${logData.url} - ${logData.ip}`);

  // Continue to next middleware
  next();
};

export const logError = (error: Error, context?: any): void => {
  console.error('Application Error:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
};

export const logInfo = (message: string, data?: any): void => {
  console.log(`${new Date().toISOString()} - INFO: ${message}`, data || '');
};

export const logWarn = (message: string, data?: any): void => {
  console.warn(`${new Date().toISOString()} - WARN: ${message}`, data || '');
};

export const logRequest = (req: Request, res: Response): void => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.originalUrl} - ${res.statusCode} - ${req.ip}`);
}; 