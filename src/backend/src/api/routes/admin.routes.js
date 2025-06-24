// src/api/routes/admin.routes.js
import { Router } from 'express';
import { 
  getDashboardStats, 
  getCostAnalysis,
  getSystemSettings as getAdminSystemSettings
} from '../controllers/admin.controller.js';
import {
  getAllUsersWithRoles,
  updateUserRole,
  getPermissions,
  getUserActivity,
  bulkUpdateRoles
} from '../controllers/role.controller.js';
import {
  getSystemSettings,
  updateRateLimits,
  updateCostSettings,
  updateModelConfig,
  testConnections,
  clearCache,
  getSystemLogs
} from '../controllers/systemSettings.controller.js';
import {
  getAnalyticsOverview,
  getCostForecast,
  getModelComparison,
  exportAnalytics
} from '../controllers/analytics.controller.js';
import {
  getExportOptions,
  generateExport,
  getExportHistory,
  scheduleExport,
  getExportTemplates
} from '../controllers/export.controller.js';

const router = Router();

// Dashboard and analytics routes
router.get('/dashboard', getDashboardStats);
router.get('/cost-analysis', getCostAnalysis);

// Role and permission management routes
router.get('/roles/users', getAllUsersWithRoles);
router.put('/roles/users/:userId', updateUserRole);
router.get('/roles/permissions', getPermissions);
router.get('/roles/activity', getUserActivity);
router.post('/roles/bulk-update', bulkUpdateRoles);

// System settings routes
router.get('/system-settings', getSystemSettings);
router.put('/system-settings/rate-limits', updateRateLimits);
router.put('/system-settings/cost-management', updateCostSettings);
router.put('/system-settings/models', updateModelConfig);
router.post('/system-settings/test-connection', testConnections);
router.post('/system-settings/clear-cache', clearCache);
router.get('/system-settings/logs', getSystemLogs);

// Advanced analytics routes
router.get('/analytics/overview', getAnalyticsOverview);
router.get('/analytics/cost-forecast', getCostForecast);
router.get('/analytics/model-comparison', getModelComparison);
router.get('/analytics/export', exportAnalytics);

// Export data routes
router.get('/export/options', getExportOptions);
router.post('/export/generate', generateExport);
router.get('/export/history', getExportHistory);
router.post('/export/schedule', scheduleExport);
router.get('/export/templates', getExportTemplates);

export default router;