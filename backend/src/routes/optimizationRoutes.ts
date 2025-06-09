import { Router } from 'express';
import { OptimizationController } from '../controllers';

const router = Router();

// POST /api/optimise - Generate optimization recommendations
router.post('/', OptimizationController.generateRecommendations);

// GET /api/optimise/savings - Get potential savings
router.get('/savings', OptimizationController.getPotentialSavings);

export default router; 