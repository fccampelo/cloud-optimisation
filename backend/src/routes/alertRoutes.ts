import { Router } from 'express';
import { AlertController } from '../controllers';

const router = Router();

// GET /api/alerts - Get all alerts
router.get('/', AlertController.getAllAlerts);

// GET /api/alerts/:id - Get alert by ID
router.get('/:id', AlertController.getAlertById);

// GET /api/alerts/filter/severity - Get alerts by severity (query parameter)
router.get('/filter/severity', AlertController.getAlertsBySeverity);

// GET /api/alerts/critical - Get critical alerts
router.get('/critical', AlertController.getCriticalAlerts);

// GET /api/alerts/resource/:resourceId - Get alerts by resource ID
router.get('/resource/:resourceId', AlertController.getAlertsByResource);

export default router; 