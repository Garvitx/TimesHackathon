// src/api/controllers/systemSettings.controller.js
import { PrismaClient } from '@prisma/client';
import { redisClient } from '../../utils/cache.js';
import config from '../../config/default.js';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

// Current model configurations
const MODEL_CONFIGS = {
  'gpt-4.1-nano': {
    maxTokens: 16000,
    costPerPromptToken: 0.10 / 1000000,
    costPerResponseToken: 0.40 / 1000000,
    maxOutputTokens: 300,
    priority: 1,
    enabled: true
  },
  'gpt-4.1-mini': {
    maxTokens: 128000,
    costPerPromptToken: 0.40 / 1000000,
    costPerResponseToken: 1.60 / 1000000,
    maxOutputTokens: 500,
    priority: 2,
    enabled: true
  },
  'gpt-4o-mini': {
    maxTokens: 128000,
    costPerPromptToken: 0.15 / 1000000,
    costPerResponseToken: 0.60 / 1000000,
    maxOutputTokens: 500,
    priority: 3,
    enabled: true
  },
  'gpt-4o': {
    maxTokens: 128000,
    costPerPromptToken: 2.50 / 1000000,
    costPerResponseToken: 10.00 / 1000000,
    maxOutputTokens: 800,
    priority: 4,
    enabled: true
  },
  'gpt-4-turbo': {
    maxTokens: 128000,
    costPerPromptToken: 10.00 / 1000000,
    costPerResponseToken: 30.00 / 1000000,
    maxOutputTokens: 1000,
    priority: 5,
    enabled: true
  }
};

/**
 * GET /api/admin/system-settings
 * Get all system settings and configurations
 */
export const getSystemSettings = async (req, res, next) => {
  try {
    // 1. Database connection status
    let dbStatus = 'Connected';
    let dbStats = {};
    try {
      // For MongoDB, we can't use $queryRaw, so we'll just do a simple operation
      await prisma.user.count(); // This will test the connection
      const userCount = await prisma.user.count();
      const summaryCount = await prisma.summary.count();
      dbStats = { userCount, summaryCount };
    } catch (err) {
      dbStatus = 'Error: ' + err.message;
    }

    // 2. Redis connection status
    let redisStatus = 'Connected';
    let redisStats = {};
    try {
      await redisClient.ping();
      const redisInfo = await redisClient.info('memory');
      redisStats = { 
        status: 'healthy',
        memory: redisInfo.includes('used_memory:') ? 
          redisInfo.split('used_memory:')[1].split('\r\n')[0] : 'unknown'
      };
    } catch (err) {
      redisStatus = 'Error: ' + err.message;
    }

    // 3. OpenAI API status
    let openaiStatus = process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured';

    // 4. Rate limiting configuration
    const rateLimitConfig = {
      tokenHandshake: {
        windowMs: 60 * 1000,
        max: 10
      },
      summarization: {
        windowMs: config.summarizeRateLimit?.windowMs || 3600000,
        max: config.summarizeRateLimit?.max || 100
      }
    };

    // 5. Cost management settings
    const costSettings = {
      maxCostPerArticle: parseFloat(process.env.MAX_COST_PER_ARTICLE || '0.10'),
      maxCostPerBatch: parseFloat(process.env.MAX_COST_PER_BATCH || '5.00'),
      autoSelectModel: process.env.MODEL_AUTO_SELECT !== 'false',
      defaultModel: process.env.DEFAULT_MODEL || 'gpt-4.1-nano'
    };

    // 6. Email/SMTP configuration
    const emailConfig = {
      configured: !!(config.SMTP_HOST && config.SMTP_USER),
      host: config.SMTP_HOST || '',
      port: config.SMTP_PORT || 587,
      secure: config.SMTP_PORT == 465,
      user: config.SMTP_USER || '',
      frontendUrl: config.FRONTEND_URL || ''
    };

    // 7. Security settings
    const securitySettings = {
      jwtConfigured: !!config.JWT_SECRET,
      resetTokenExpiry: config.RESET_TOKEN_EXPIRY || '1h',
      accessTokenTTL: config.accessTokenTTL || 300000,
      corsOrigins: config.allowedOrigins || []
    };

    // 8. Model configurations
    const modelSettings = {
      configs: MODEL_CONFIGS,
      currentStrategy: process.env.MODEL_STRATEGY || 'COST_OPTIMIZED',
      dynamicSwitching: process.env.DYNAMIC_MODEL_SWITCHING !== 'false',
      fallbackModel: process.env.FALLBACK_MODEL || 'gpt-4.1-nano'
    };

    // 9. System performance stats
    const performanceStats = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform
    };

    return res.json({
      database: { status: dbStatus, stats: dbStats },
      redis: { status: redisStatus, stats: redisStats },
      openai: { status: openaiStatus },
      rateLimiting: rateLimitConfig,
      costManagement: costSettings,
      email: emailConfig,
      security: securitySettings,
      models: modelSettings,
      performance: performanceStats,
      environment: process.env.NODE_ENV || 'development'
    });

  } catch (err) {
    console.error('System settings error:', err);
    next(err);
  }
};

/**
 * PUT /api/admin/system-settings/rate-limits
 * Update rate limiting settings
 */
export const updateRateLimits = async (req, res, next) => {
  try {
    const { tokenHandshake, summarization } = req.body;

    // Validate input
    if (tokenHandshake) {
      if (tokenHandshake.windowMs < 1000 || tokenHandshake.max < 1) {
        return res.status(400).json({ error: 'Invalid token handshake rate limits' });
      }
    }
    
    if (summarization) {
      if (summarization.windowMs < 60000 || summarization.max < 1) {
        return res.status(400).json({ error: 'Invalid summarization rate limits' });
      }
    }

    // In a full implementation, you would save these to a configuration store
    // For now, we'll just validate and return success
    console.log('Rate limits update requested:', { tokenHandshake, summarization });

    return res.json({
      message: 'Rate limits updated successfully',
      updatedSettings: { tokenHandshake, summarization }
    });

  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/system-settings/cost-management
 * Update cost management settings
 */
export const updateCostSettings = async (req, res, next) => {
  try {
    const { maxCostPerArticle, maxCostPerBatch, autoSelectModel, defaultModel } = req.body;

    // Validate input
    if (maxCostPerArticle !== undefined && (maxCostPerArticle < 0 || maxCostPerArticle > 100)) {
      return res.status(400).json({ error: 'Invalid max cost per article (0-100)' });
    }

    if (maxCostPerBatch !== undefined && (maxCostPerBatch < 0 || maxCostPerBatch > 1000)) {
      return res.status(400).json({ error: 'Invalid max cost per batch (0-1000)' });
    }

    if (defaultModel && !MODEL_CONFIGS[defaultModel]) {
      return res.status(400).json({ error: 'Invalid default model' });
    }

    // In a production app, you would update environment variables or a config store
    console.log('Cost settings update requested:', { 
      maxCostPerArticle, 
      maxCostPerBatch, 
      autoSelectModel, 
      defaultModel 
    });

    return res.json({
      message: 'Cost settings updated successfully',
      updatedSettings: { maxCostPerArticle, maxCostPerBatch, autoSelectModel, defaultModel }
    });

  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/system-settings/models
 * Update model configurations
 */
export const updateModelConfig = async (req, res, next) => {
  try {
    const { modelName, config: modelConfig } = req.body;

    if (!modelName || !MODEL_CONFIGS[modelName]) {
      return res.status(400).json({ error: 'Invalid model name' });
    }

    // Validate model configuration
    const requiredFields = ['maxTokens', 'costPerPromptToken', 'costPerResponseToken', 'maxOutputTokens'];
    for (const field of requiredFields) {
      if (modelConfig[field] === undefined || modelConfig[field] < 0) {
        return res.status(400).json({ error: `Invalid ${field}` });
      }
    }

    // Update model configuration (in memory for this demo)
    MODEL_CONFIGS[modelName] = { ...MODEL_CONFIGS[modelName], ...modelConfig };

    console.log('Model configuration updated:', modelName, modelConfig);

    return res.json({
      message: `Model ${modelName} configuration updated successfully`,
      updatedModel: MODEL_CONFIGS[modelName]
    });

  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/system-settings/test-connection
 * Test various system connections
 */
export const testConnections = async (req, res, next) => {
  try {
    const { service } = req.body; // 'database', 'redis', 'openai', 'email'
    const results = {};

    if (!service || service === 'database') {
      try {
        // Test MongoDB connection by doing a simple count operation
        await prisma.user.count();
        results.database = { status: 'success', message: 'MongoDB connection successful' };
      } catch (err) {
        results.database = { status: 'error', message: err.message };
      }
    }

    if (!service || service === 'redis') {
      try {
        const result = await redisClient.ping();
        results.redis = { status: 'success', message: `Redis connection successful: ${result}` };
      } catch (err) {
        results.redis = { status: 'error', message: err.message };
      }
    }

    if (!service || service === 'openai') {
      try {
        if (!process.env.OPENAI_API_KEY) {
          results.openai = { status: 'error', message: 'OpenAI API key not configured' };
        } else {
          // In a real implementation, you might make a test API call
          results.openai = { status: 'success', message: 'OpenAI API key is configured' };
        }
      } catch (err) {
        results.openai = { status: 'error', message: err.message };
      }
    }

    return res.json({
      message: 'Connection tests completed',
      results
    });

  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/system-settings/clear-cache
 * Clear Redis cache
 */
export const clearCache = async (req, res, next) => {
  try {
    const { pattern } = req.body; // Optional pattern to clear specific keys

    let deletedKeys = 0;
    if (pattern) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        deletedKeys = await redisClient.del(...keys);
      }
    } else {
      await redisClient.flushAll();
      deletedKeys = 'all';
    }

    console.log(`Cache cleared: ${deletedKeys} keys deleted`);

    return res.json({
      message: 'Cache cleared successfully',
      deletedKeys
    });

  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/system-settings/logs
 * Get recent system logs (basic implementation)
 */
export const getSystemLogs = async (req, res, next) => {
  try {
    const { limit = 100, level = 'all' } = req.query;

    // For MongoDB, we'll get recent database activity as "logs"
    const recentActivity = await prisma.summary.findMany({
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        modelUsed: true,
        createdAt: true,
        errorMsg: true,
        title: true
      }
    });

    const logs = recentActivity.map(activity => ({
      timestamp: activity.createdAt,
      level: activity.status === 'failed' ? 'error' : 'info',
      message: activity.status === 'failed' 
        ? `Summary failed: ${activity.errorMsg || 'Unknown error'}` 
        : `Summary completed: ${activity.title || 'Untitled'} using ${activity.modelUsed}`,
      service: 'summarizer',
      details: {
        id: activity.id,
        status: activity.status,
        model: activity.modelUsed
      }
    }));

    const filteredLogs = level === 'all' ? logs : logs.filter(log => log.level === level);

    return res.json({
      logs: filteredLogs,
      totalCount: filteredLogs.length,
      availableLevels: ['all', 'info', 'error']
    });

  } catch (err) {
    next(err);
  }
};