import { Router } from 'express';
import { CostController } from '../controllers';

const router = Router();

// GET /api/costs - Get cost summary
router.get('/', CostController.getCostSummary);

// GET /api/costs/by-type - Get cost breakdown by resource type
router.get('/by-type', CostController.getCostByResourceType);

// GET /api/costs/savings - Get projected savings
router.get('/savings', CostController.getProjectedSavings);

// GET /api/costs/trend - Get cost trend data
router.get('/trend', CostController.getCostTrend);

export default router; 