import { Router } from 'express';
import PerformanceController from '../controllers/PerformanceController';

const router = Router();

// GET /api/performance/stats - Get performance statistics
router.get('/stats', PerformanceController.getPerformanceStats);

// POST /api/performance/loadtest - Run load test
router.post('/loadtest', PerformanceController.runLoadTest);

// GET /api/performance/health - System health check
router.get('/health', PerformanceController.getSystemHealth);

// POST /api/performance/gc - Trigger garbage collection
router.post('/gc', PerformanceController.triggerGarbageCollection);

export default router; 