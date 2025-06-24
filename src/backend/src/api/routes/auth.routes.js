// routes/auth.routes.js

import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { authMiddleware, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Anyone with a valid token can GET /me
router.get('/me', authMiddleware, authController.me);

router.post('/login', authController.login);

// Only Admins can create new Users/Editors
router.post('/signup', authMiddleware, requireRole(['Admin']), authController.signup);
router.get(
  '/editors',
  authMiddleware,
  requireRole(['Admin']),
  authController.listEditors
);
router.post(
  '/editors',
  authMiddleware,
  requireRole(['Admin']),
  authController.createEditor
);
router.delete(
  '/editors/:userId',
  authMiddleware,
  requireRole(['Admin']),
  authController.deleteEditor
);

// ──────────────────────────────────────────────────────────────────────────
// Public password‐reset endpoints (NO authMiddleware)
// ──────────────────────────────────────────────────────────────────────────

// 1) Forgot Password: user submits their email
router.post('/forgot-password', authController.forgotPassword);

// 2) Reset Password: user submits { token, password }
router.post('/reset-password', authController.resetPassword);

export default router;
