import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = (message: string, statusCode: number = 400, code?: string, details?: any): AppError => {
  return new AppError(message, statusCode, code, details);
};

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    const response = {
      success: false,
      error: {
        message: err.message,
        code: err.code,
        details: err.details,
      },
    };

    logger.error('Application error', err, {
      path: req.path,
      method: req.method,
      statusCode: err.statusCode,
    });

    return res.status(err.statusCode).json(response);
  }

  logger.error('Unhandled error', err, {
    path: req.path,
    method: req.method,
  });

  const response = {
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  };

  return res.status(500).json(response);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 