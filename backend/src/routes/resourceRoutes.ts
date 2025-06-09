import { Router } from 'express';
import { ResourceController } from '../controllers';

const router = Router();

// GET /api/resources - Get all resources
router.get('/', ResourceController.getAllResources);

// GET /api/resources/cache/stats - Get cache statistics
router.get('/cache/stats', ResourceController.getCacheStats);

// GET /api/resources/filter/status - Get resources by status (query parameter)
router.get('/filter/status', ResourceController.getResourcesByStatus);

// GET /api/resources/:id - Get resource by ID
router.get('/:id', ResourceController.getResourceById);

// POST /api/resources - Create new resource
router.post('/', ResourceController.createResource);

// PUT /api/resources/:id - Update resource
router.put('/:id', ResourceController.updateResource);

// DELETE /api/resources/:id - Delete resource
router.delete('/:id', ResourceController.deleteResource);

export default router; 