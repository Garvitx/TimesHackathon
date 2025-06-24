// routes/editor.routes.js

import { Router } from 'express';
import {
  listSummaries,
  getSummary,
  updateSummary,
} from '../controllers/editor.controller.js';
import { 
  runBatchSummaries,
  getAvailableModels,
  estimateProcessingCost
} from '../controllers/editor.batch.controller.js'; 

import { authMiddleware, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// All editor routes require authentication AND role = Editor or Admin
router.use(authMiddleware, requireRole(['Editor', 'Admin']));

// 1) List all summaries
router.get('/summaries', listSummaries);

// 2) Get one summary by ID
router.get('/summaries/:id', getSummary);

// 3) Update a summary
router.put('/summaries/:id', updateSummary);

// 4) Batch processing with model selection
router.post('/summaries/batch', runBatchSummaries);

// 5) Get available models and their capabilities
router.get('/models', getAvailableModels);

// 6) Estimate processing cost for content
router.post('/estimate-cost', estimateProcessingCost);

export default router;