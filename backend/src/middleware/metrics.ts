import { Request, Response, NextFunction } from 'express';
import {
  httpRequestDurationMicroseconds,
  httpRequestsTotal,
  activeConnections,
} from '../monitoring/prometheus';

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();

  activeConnections.inc();

  res.on('finish', () => {
    const end = process.hrtime(start);
    const duration = end[0] + end[1] / 1e9;

    httpRequestDurationMicroseconds
      .labels({
        method: req.method,
        route: req.route?.path || req.path,
        code: res.statusCode.toString(),
      })
      .observe(duration);

    httpRequestsTotal
      .labels({
        method: req.method,
        route: req.route?.path || req.path,
        code: res.statusCode.toString(),
      })
      .inc();

    activeConnections.dec();
  });

  next();
};

export const getMetricsEndpoint = (req: Request, res: Response): void => {
  res.set('Content-Type', 'text/plain');
  
  // Simple metrics response
  const metrics = {
    activeConnections: activeConnections.get(),
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  };
  
  res.json(metrics);
}; 