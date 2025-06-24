import { Router } from 'express';
import summarizeController from '../controllers/summarize.controller.js';

const router = Router();

router.post('/', summarizeController.summarize);

export default router;
