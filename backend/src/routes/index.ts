import { Router } from 'express';
import resourceRoutes from './resourceRoutes';
import alertRoutes from './alertRoutes';
import costRoutes from './costRoutes';
import optimizationRoutes from './optimizationRoutes';
import performanceRoutes from './performanceRoutes';

const router = Router();

// Mount all route modules
router.use('/resources', resourceRoutes);
router.use('/alerts', alertRoutes);
router.use('/costs', costRoutes);
router.use('/optimise', optimizationRoutes);
router.use('/performance', performanceRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CloudOps API is running',
    timestamp: new Date().toISOString(),
  });
});

// API info endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CloudOps Control Dashboard API',
    version: '1.0.0',
    endpoints: {
      resources: '/api/resources',
      alerts: '/api/alerts',
      costs: '/api/costs',
      optimization: '/api/optimise',
      performance: '/api/performance',
      health: '/api/health',
    },
  });
});

export default router; 