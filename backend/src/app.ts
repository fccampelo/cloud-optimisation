import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import routes from './routes';
import { errorHandler } from './middleware';
import { logger } from './utils/logger';
import { 
  securityHeaders, 
  sanitizeInput, 
  requestSizeLimit,
  createRateLimiter 
} from './middleware/security';

// Create Express application
const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// CORS configuration
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.logRequest(req, 'Incoming request');
  next();
});

// Security headers middleware
app.use(securityHeaders);
app.use(sanitizeInput);
app.use(requestSizeLimit(10 * 1024 * 1024));
app.use('/api', createRateLimiter());

// API routes
app.use('/api', routes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
    message: 'The requested endpoint does not exist',
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app; 