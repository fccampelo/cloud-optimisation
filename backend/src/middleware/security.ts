import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler';
import { logger } from '../utils/logger';
import { rateLimit } from 'express-rate-limit';

export const createRateLimiter = (windowMs: number = 15 * 60 * 1000, max: number = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      return req.path === '/api/health';
    },
    onLimitReached: (req) => {
      logger.logSecurityEvent('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });
    },
  });
};

// Input validation middleware
export const validateInput = (validationRules: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    // Basic validation example
    if (validationRules.requireAuth && !req.headers.authorization) {
      errors.push('Authorization header is required');
    }

    if (validationRules.maxBodySize && req.get('content-length')) {
      const contentLength = parseInt(req.get('content-length')!);
      if (contentLength > validationRules.maxBodySize) {
        errors.push(`Request body too large. Max size: ${validationRules.maxBodySize} bytes`);
      }
    }

    if (validationRules.allowedMethods && !validationRules.allowedMethods.includes(req.method)) {
      errors.push(`Method ${req.method} not allowed`);
    }

    if (errors.length > 0) {
      logger.logSecurityEvent('Input validation failed', {
        errors,
        path: req.path,
        method: req.method,
        ip: req.ip,
      });
      throw createError(errors.join(', '), 400);
    }

    next();
  };
};

// CORS security middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove server information
  res.removeHeader('X-Powered-By');

  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // HSTS (HTTPS only)
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self'; " +
    "font-src 'self'; " +
    "object-src 'none'; " +
    "media-src 'self'; " +
    "frame-src 'none';"
  );

  next();
};

// API Key authentication middleware
export const authenticateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  const authHeader = req.headers.authorization;

  // Extract API key from Authorization header if present
  let token: string | undefined;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  const providedKey = apiKey || token;

  if (!providedKey) {
    logger.logSecurityEvent('Missing API key', {
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    throw createError('API key is required', 401);
  }

  // In production, validate against database or JWT
  const validKeys = process.env.VALID_API_KEYS?.split(',') || ['dev-key-12345'];
  
  if (!validKeys.includes(providedKey)) {
    logger.logSecurityEvent('Invalid API key', {
      providedKey: providedKey.substring(0, 8) + '...',
      path: req.path,
      ip: req.ip,
    });
    throw createError('Invalid API key', 401);
  }

  // Add user context to request
  (req as any).user = {
    apiKey: providedKey,
    permissions: ['read', 'write'], // In production, lookup from database
  };

  next();
};

// Role-based authorization middleware
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      throw createError('Authentication required', 401);
    }

    if (!user.permissions.includes(permission)) {
      logger.logSecurityEvent('Insufficient permissions', {
        required: permission,
        userPermissions: user.permissions,
        path: req.path,
        ip: req.ip,
      });
      throw createError('Insufficient permissions', 403);
    }

    next();
  };
};

// Request sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize query parameters
  for (const key in req.query) {
    if (typeof req.query[key] === 'string') {
      // Remove potential XSS attempts
      req.query[key] = (req.query[key] as string)
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
  }

  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }

  next();
};

function sanitizeObject(obj: any): void {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

// IP whitelist middleware
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress;

    if (!clientIP || !allowedIPs.includes(clientIP)) {
      logger.logSecurityEvent('IP not in whitelist', {
        clientIP,
        allowedIPs,
        path: req.path,
      });
      throw createError('Access denied from this IP address', 403);
    }

    next();
  };
};

// Request size limit middleware
export const requestSizeLimit = (maxSize: number = 10 * 1024 * 1024) => { // 10MB default
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.get('content-length');
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      logger.logSecurityEvent('Request size limit exceeded', {
        contentLength: parseInt(contentLength),
        maxSize,
        path: req.path,
        ip: req.ip,
      });
      throw createError(`Request too large. Maximum size: ${maxSize} bytes`, 413);
    }

    next();
  };
};

// Honeypot middleware to detect bots
export const honeypot = (req: Request, res: Response, next: NextFunction) => {
  // Check for common bot patterns
  const userAgent = req.get('User-Agent') || '';
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));

  if (isSuspicious && req.path !== '/api/health') {
    logger.logSecurityEvent('Suspicious bot activity detected', {
      userAgent,
      path: req.path,
      ip: req.ip,
    });
    
    // Don't block, just log for now
    // In production, might want to rate limit more aggressively
  }

  next();
}; 