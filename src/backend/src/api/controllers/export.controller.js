// src/api/controllers/export.controller.js
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { createObjectCsvStringifier } from 'csv-writer';

const prisma = new PrismaClient();

// Create exports directory if it doesn't exist
const EXPORTS_DIR = path.join(process.cwd(), 'exports');

async function ensureExportsDir() {
  try {
    await fs.access(EXPORTS_DIR);
  } catch {
    await fs.mkdir(EXPORTS_DIR, { recursive: true });
  }
}

/**
 * GET /api/admin/export/options
 * Get available export options and configurations
 */
export const getExportOptions = async (req, res, next) => {
  try {
    // Get data counts for each export type
    const userCount = await prisma.user.count();
    const summaryCount = await prisma.summary.count();
    const completedSummaryCount = await prisma.summary.count({
      where: { status: 'completed' }
    });
    const failedSummaryCount = await prisma.summary.count({
      where: { status: 'failed' }
    });

    // Get date ranges
    const oldestSummary = await prisma.summary.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true }
    });
    
    const newestSummary = await prisma.summary.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });

    // Available export types
    const exportTypes = [
      {
        id: 'users',
        name: 'Users',
        description: 'Export all user accounts with roles and metadata',
        count: userCount,
        formats: ['json', 'csv'],
        estimatedSize: `${Math.ceil(userCount * 0.5)}KB`
      },
      {
        id: 'summaries',
        name: 'All Summaries',
        description: 'Export all article summaries with complete metadata',
        count: summaryCount,
        formats: ['json', 'csv'],
        estimatedSize: `${Math.ceil(summaryCount * 2)}KB`
      },
      {
        id: 'completed-summaries',
        name: 'Completed Summaries',
        description: 'Export only successfully completed summaries',
        count: completedSummaryCount,
        formats: ['json', 'csv', 'html'],
        estimatedSize: `${Math.ceil(completedSummaryCount * 1.5)}KB`
      },
      {
        id: 'failed-summaries',
        name: 'Failed Summaries',
        description: 'Export failed summaries for analysis',
        count: failedSummaryCount,
        formats: ['json', 'csv'],
        estimatedSize: `${Math.ceil(failedSummaryCount * 1)}KB`
      },
      {
        id: 'analytics',
        name: 'Analytics Data',
        description: 'Export aggregated analytics and cost data',
        count: 1,
        formats: ['json'],
        estimatedSize: '50KB'
      }
    ];

    return res.json({
      exportTypes,
      dateRange: {
        earliest: oldestSummary?.createdAt || new Date(),
        latest: newestSummary?.createdAt || new Date()
      },
      supportedFormats: ['json', 'csv', 'html'],
      maxRecordsPerExport: 10000,
      availableFilters: [
        'dateRange',
        'status',
        'language',
        'modelUsed',
        'costThreshold'
      ]
    });

  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/export/generate
 * Generate and download export file
 */
export const generateExport = async (req, res, next) => {
  try {
    const {
      type,
      format = 'json',
      filters = {},
      includeFields = [],
      filename
    } = req.body;

    // Validate export type
    const validTypes = ['users', 'summaries', 'completed-summaries', 'failed-summaries', 'analytics'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid export type' });
    }

    // Validate format
    const validFormats = ['json', 'csv', 'html'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({ error: 'Invalid export format' });
    }

    let data = [];
    let exportFilename = filename || `${type}-${Date.now()}`;

    // Generate data based on type
    switch (type) {
      case 'users':
        data = await exportUsers(filters, includeFields);
        break;
      case 'summaries':
        data = await exportSummaries({}, filters, includeFields);
        break;
      case 'completed-summaries':
        data = await exportSummaries({ status: 'completed' }, filters, includeFields);
        break;
      case 'failed-summaries':
        data = await exportSummaries({ status: 'failed' }, filters, includeFields);
        break;
      case 'analytics':
        data = await exportAnalytics(filters);
        break;
      default:
        return res.status(400).json({ error: 'Unsupported export type' });
    }

    // Apply additional filters
    if (filters.limit) {
      data = data.slice(0, parseInt(filters.limit));
    }

    // Format and send data
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${exportFilename}.json"`);
      return res.json({
        exportInfo: {
          type,
          generatedAt: new Date().toISOString(),
          recordCount: data.length,
          filters
        },
        data
      });
    } else if (format === 'csv') {
      const csv = await convertToCSV(data, type);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${exportFilename}.csv"`);
      return res.send(csv);
    } else if (format === 'html') {
      const html = await convertToHTML(data, type);
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="${exportFilename}.html"`);
      return res.send(html);
    }

  } catch (err) {
    console.error('Export generation error:', err);
    next(err);
  }
};

/**
 * GET /api/admin/export/history
 * Get export history and status
 */
export const getExportHistory = async (req, res, next) => {
  try {
    await ensureExportsDir();
    
    // In a real implementation, you'd store export jobs in the database
    // For now, we'll return a mock history
    const mockHistory = [
      {
        id: `export-${Date.now() - 86400000}`,
        type: 'summaries',
        format: 'csv',
        status: 'completed',
        recordCount: 1250,
        fileSize: '2.5MB',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        completedAt: new Date(Date.now() - 86400000 + 30000).toISOString(),
        createdBy: 'admin@example.com'
      },
      {
        id: `export-${Date.now() - 172800000}`,
        type: 'users',
        format: 'json',
        status: 'completed',
        recordCount: 45,
        fileSize: '15KB',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        completedAt: new Date(Date.now() - 172800000 + 5000).toISOString(),
        createdBy: 'admin@example.com'
      }
    ];

    return res.json({
      history: mockHistory,
      totalExports: mockHistory.length,
      storageUsed: '2.515MB',
      lastExport: mockHistory[0]
    });

  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/export/schedule
 * Schedule recurring exports (basic implementation)
 */
export const scheduleExport = async (req, res, next) => {
  try {
    const {
      type,
      format,
      schedule, // 'daily', 'weekly', 'monthly'
      filters = {},
      enabled = true
    } = req.body;

    // In a real implementation, you'd store this in the database
    // and set up actual cron jobs
    const scheduledExport = {
      id: `scheduled-${Date.now()}`,
      type,
      format,
      schedule,
      filters,
      enabled,
      createdAt: new Date().toISOString(),
      nextRun: calculateNextRun(schedule),
      createdBy: req.user.email
    };

    console.log('Scheduled export created:', scheduledExport);

    return res.json({
      message: 'Export scheduled successfully',
      scheduledExport
    });

  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/export/templates
 * Get predefined export templates
 */
export const getExportTemplates = async (req, res, next) => {
  try {
    const templates = [
      {
        id: 'daily-summary-report',
        name: 'Daily Summary Report',
        description: 'Daily report of completed summaries with cost analysis',
        type: 'completed-summaries',
        format: 'csv',
        filters: {
          dateRange: 'last-24h'
        },
        includeFields: ['title', 'language', 'modelUsed', 'estimatedCost', 'createdAt']
      },
      {
        id: 'weekly-analytics',
        name: 'Weekly Analytics',
        description: 'Comprehensive weekly analytics export',
        type: 'analytics',
        format: 'json',
        filters: {
          dateRange: 'last-7d'
        }
      },
      {
        id: 'monthly-cost-report',
        name: 'Monthly Cost Report',
        description: 'Monthly cost breakdown by model and language',
        type: 'summaries',
        format: 'csv',
        filters: {
          dateRange: 'last-30d',
          status: 'completed'
        },
        includeFields: ['modelUsed', 'language', 'estimatedCost', 'promptTokens', 'responseTokens']
      },
      {
        id: 'user-audit',
        name: 'User Audit Export',
        description: 'Complete user list for audit purposes',
        type: 'users',
        format: 'csv',
        includeFields: ['email', 'role', 'createdAt']
      }
    ];

    return res.json({ templates });

  } catch (err) {
    next(err);
  }
};

// Helper functions
async function exportUsers(filters = {}, includeFields = []) {
  const defaultFields = {
    id: true,
    email: true,
    role: true,
    createdAt: true
  };

  const selectFields = includeFields.length > 0 
    ? includeFields.reduce((acc, field) => ({ ...acc, [field]: true }), {})
    : defaultFields;

  return await prisma.user.findMany({
    select: selectFields,
    orderBy: { createdAt: 'desc' }
  });
}

async function exportSummaries(baseFilters = {}, additionalFilters = {}, includeFields = []) {
  const defaultFields = {
    id: true,
    articleId: true,
    title: true,
    language: true,
    modelUsed: true,
    promptTokens: true,
    responseTokens: true,
    status: true,
    estimatedCost: true,
    createdAt: true,
    updatedAt: true
  };

  const selectFields = includeFields.length > 0 
    ? includeFields.reduce((acc, field) => ({ ...acc, [field]: true }), {})
    : defaultFields;

  let whereClause = { ...baseFilters };

  // Apply additional filters
  if (additionalFilters.dateRange) {
    const { start, end } = parseDateRange(additionalFilters.dateRange);
    whereClause.createdAt = { gte: start, lte: end };
  }

  if (additionalFilters.language) {
    whereClause.language = additionalFilters.language;
  }

  if (additionalFilters.modelUsed) {
    whereClause.modelUsed = additionalFilters.modelUsed;
  }

  if (additionalFilters.costThreshold) {
    whereClause.estimatedCost = { gte: parseFloat(additionalFilters.costThreshold) };
  }

  return await prisma.summary.findMany({
    where: whereClause,
    select: selectFields,
    orderBy: { createdAt: 'desc' },
    take: 10000 // Limit to prevent memory issues
  });
}

async function exportAnalytics(filters = {}) {
  // Get aggregated analytics data
  const totalSummaries = await prisma.summary.count();
  const completedSummaries = await prisma.summary.count({ where: { status: 'completed' } });
  
  const modelStats = await prisma.summary.aggregateRaw({
    pipeline: [
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$modelUsed',
          count: { $sum: 1 },
          totalCost: { $sum: '$estimatedCost' },
          avgCost: { $avg: '$estimatedCost' }
        }
      },
      { $sort: { count: -1 } }
    ]
  });

  const languageStats = await prisma.summary.aggregateRaw({
    pipeline: [
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$language',
          count: { $sum: 1 },
          avgCost: { $avg: '$estimatedCost' }
        }
      },
      { $sort: { count: -1 } }
    ]
  });

  return {
    overview: {
      totalSummaries,
      completedSummaries,
      successRate: totalSummaries > 0 ? (completedSummaries / totalSummaries * 100) : 0
    },
    modelStats: Array.isArray(modelStats) ? modelStats : [],
    languageStats: Array.isArray(languageStats) ? languageStats : [],
    generatedAt: new Date().toISOString()
  };
}

async function convertToCSV(data, type) {
  if (!data || data.length === 0) {
    return 'No data available';
  }

  // Get headers from first object
  const headers = Object.keys(data[0]).map(key => ({ id: key, title: key }));
  
  // Convert data to CSV string
  let csv = headers.map(h => h.title).join(',') + '\n';
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header.id];
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    });
    csv += values.join(',') + '\n';
  });

  return csv;
}

async function convertToHTML(data, type) {
  if (!data || data.length === 0) {
    return '<html><body><h1>No data available</h1></body></html>';
  }

  const headers = Object.keys(data[0]);
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Export: ${type}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .summary { margin-bottom: 20px; padding: 10px; background-color: #f9f9f9; }
      </style>
    </head>
    <body>
      <div class="summary">
        <h1>Export: ${type}</h1>
        <p>Generated: ${new Date().toISOString()}</p>
        <p>Records: ${data.length}</p>
      </div>
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  return html;
}

function parseDateRange(range) {
  const now = new Date();
  let start = new Date();

  switch (range) {
    case 'last-24h':
      start.setHours(now.getHours() - 24);
      break;
    case 'last-7d':
      start.setDate(now.getDate() - 7);
      break;
    case 'last-30d':
      start.setDate(now.getDate() - 30);
      break;
    default:
      start.setDate(now.getDate() - 30);
  }

  return { start, end: now };
}

function calculateNextRun(schedule) {
  const now = new Date();
  const next = new Date(now);

  switch (schedule) {
    case 'daily':
      next.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(now.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(now.getMonth() + 1);
      break;
    default:
      next.setDate(now.getDate() + 1);
  }

  return next.toISOString();
}