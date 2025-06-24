// src/api/controllers/analytics.controller.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Model pricing for cost calculations
const MODEL_PRICING = {
  'gpt-4.1-nano': { promptTokenCost: 0.10 / 1000000, responseTokenCost: 0.40 / 1000000 },
  'gpt-4.1-mini': { promptTokenCost: 0.40 / 1000000, responseTokenCost: 1.60 / 1000000 },
  'gpt-4o-mini': { promptTokenCost: 0.15 / 1000000, responseTokenCost: 0.60 / 1000000 },
  'gpt-4o': { promptTokenCost: 2.50 / 1000000, responseTokenCost: 10.00 / 1000000 },
  'gpt-4-turbo': { promptTokenCost: 10.00 / 1000000, responseTokenCost: 30.00 / 1000000 },
  'default': { promptTokenCost: 0.10 / 1000000, responseTokenCost: 0.40 / 1000000 }
};

function calculateCost(promptTokens, responseTokens, modelUsed) {
  const pricing = MODEL_PRICING[modelUsed] || MODEL_PRICING['default'];
  return (promptTokens * pricing.promptTokenCost) + (responseTokens * pricing.responseTokenCost);
}

/**
 * GET /api/admin/analytics/overview
 * Get comprehensive analytics overview with time-based data
 */
export const getAnalyticsOverview = async (req, res, next) => {
  try {
    const { timeRange = '30d' } = req.query; // '7d', '30d', '90d', '1y'
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // 1. Summary counts and basic metrics
    const totalSummaries = await prisma.summary.count({
      where: { createdAt: { gte: startDate } }
    });

    const completedSummaries = await prisma.summary.count({
      where: { 
        status: 'completed',
        createdAt: { gte: startDate }
      }
    });

    const failedSummaries = await prisma.summary.count({
      where: { 
        status: 'failed',
        createdAt: { gte: startDate }
      }
    });

    // 2. Cost analysis for the period
    const summariesWithCosts = await prisma.summary.findMany({
      where: {
        status: 'completed',
        createdAt: { gte: startDate }
      },
      select: {
        promptTokens: true,
        responseTokens: true,
        modelUsed: true,
        estimatedCost: true,
        createdAt: true
      }
    });

    let totalCost = 0;
    const costByDay = {};
    
    summariesWithCosts.forEach(summary => {
      const cost = summary.estimatedCost || calculateCost(
        summary.promptTokens || 0,
        summary.responseTokens || 0,
        summary.modelUsed
      );
      
      totalCost += cost;
      
      // Group by day for daily cost chart
      const dayKey = summary.createdAt.toISOString().split('T')[0];
      if (!costByDay[dayKey]) {
        costByDay[dayKey] = 0;
      }
      costByDay[dayKey] += cost;
    });

    // 3. Model usage analytics
    const modelUsage = await prisma.summary.aggregateRaw({
      pipeline: [
        { $match: { 
          status: 'completed',
          createdAt: { $gte: startDate }
        }},
        {
          $group: {
            _id: '$modelUsed',
            count: { $sum: 1 },
            totalPromptTokens: { $sum: '$promptTokens' },
            totalResponseTokens: { $sum: '$responseTokens' },
            avgPromptTokens: { $avg: '$promptTokens' },
            avgResponseTokens: { $avg: '$responseTokens' }
          }
        },
        { $sort: { count: -1 } }
      ]
    });

    // 4. Language distribution
    const languageStats = await prisma.summary.aggregateRaw({
      pipeline: [
        { $match: { 
          status: 'completed',
          createdAt: { $gte: startDate }
        }},
        {
          $group: {
            _id: '$language',
            count: { $sum: 1 },
            avgCost: { $avg: '$estimatedCost' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]
    });

    // 5. Daily activity trends
    const dailyActivity = await prisma.summary.aggregateRaw({
      pipeline: [
        { $match: { createdAt: { $gte: startDate } }},
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            failed: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]
    });

    // 6. Performance metrics
    const performanceMetrics = await prisma.summary.aggregateRaw({
      pipeline: [
        { $match: { 
          status: 'completed',
          createdAt: { $gte: startDate }
        }},
        {
          $group: {
            _id: null,
            avgPromptTokens: { $avg: '$promptTokens' },
            avgResponseTokens: { $avg: '$responseTokens' },
            avgCost: { $avg: '$estimatedCost' },
            maxCost: { $max: '$estimatedCost' },
            minCost: { $min: '$estimatedCost' }
          }
        }
      ]
    });

    return res.json({
      overview: {
        totalSummaries,
        completedSummaries,
        failedSummaries,
        successRate: totalSummaries > 0 ? (completedSummaries / totalSummaries * 100) : 0,
        totalCost: Number(totalCost.toFixed(6)),
        avgCostPerSummary: completedSummaries > 0 ? Number((totalCost / completedSummaries).toFixed(6)) : 0
      },
      costByDay: Object.entries(costByDay).map(([date, cost]) => ({
        date,
        cost: Number(cost.toFixed(6))
      })).sort((a, b) => a.date.localeCompare(b.date)),
      modelUsage: Array.isArray(modelUsage) ? modelUsage.map(item => ({
        model: item._id,
        count: item.count,
        totalTokens: (item.totalPromptTokens || 0) + (item.totalResponseTokens || 0),
        avgPromptTokens: Math.round(item.avgPromptTokens || 0),
        avgResponseTokens: Math.round(item.avgResponseTokens || 0),
        estimatedCost: calculateCost(
          item.totalPromptTokens || 0,
          item.totalResponseTokens || 0,
          item._id
        )
      })) : [],
      languageStats: Array.isArray(languageStats) ? languageStats.map(item => ({
        language: item._id || 'Unknown',
        count: item.count,
        avgCost: Number((item.avgCost || 0).toFixed(6))
      })) : [],
      dailyActivity: Array.isArray(dailyActivity) ? dailyActivity.map(item => ({
        date: item._id,
        total: item.total,
        completed: item.completed,
        failed: item.failed,
        successRate: item.total > 0 ? (item.completed / item.total * 100) : 0
      })) : [],
      performance: performanceMetrics.length > 0 ? {
        avgPromptTokens: Math.round(performanceMetrics[0].avgPromptTokens || 0),
        avgResponseTokens: Math.round(performanceMetrics[0].avgResponseTokens || 0),
        avgCost: Number((performanceMetrics[0].avgCost || 0).toFixed(6)),
        maxCost: Number((performanceMetrics[0].maxCost || 0).toFixed(6)),
        minCost: Number((performanceMetrics[0].minCost || 0).toFixed(6))
      } : null,
      timeRange,
      generatedAt: new Date().toISOString()
    });

  } catch (err) {
    console.error('Analytics overview error:', err);
    next(err);
  }
};

/**
 * GET /api/admin/analytics/cost-forecast
 * Generate cost forecasting based on historical data
 */
export const getCostForecast = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const forecastDays = parseInt(days);
    
    // Get historical data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const historicalData = await prisma.summary.aggregateRaw({
      pipeline: [
        { $match: { 
          status: 'completed',
          createdAt: { $gte: thirtyDaysAgo }
        }},
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            count: { $sum: 1 },
            totalCost: { $sum: '$estimatedCost' }
          }
        },
        { $sort: { _id: 1 } }
      ]
    });

    // Calculate trends
    const dailyCosts = Array.isArray(historicalData) ? historicalData : [];
    const avgDailyCost = dailyCosts.length > 0 
      ? dailyCosts.reduce((sum, day) => sum + (day.totalCost || 0), 0) / dailyCosts.length 
      : 0;
    
    const avgDailyCount = dailyCosts.length > 0 
      ? dailyCosts.reduce((sum, day) => sum + day.count, 0) / dailyCosts.length 
      : 0;

    // Simple linear regression for trend calculation
    const recentDays = dailyCosts.slice(-7); // Last 7 days
    const trend = recentDays.length > 1 ? 
      (recentDays[recentDays.length - 1].totalCost - recentDays[0].totalCost) / recentDays.length : 0;

    // Generate forecast
    const forecast = [];
    const today = new Date();
    
    for (let i = 1; i <= forecastDays; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + i);
      
      // Simple forecast: average + trend + some randomness for realism
      const forecastCost = Math.max(0, avgDailyCost + (trend * i) + (Math.random() * 0.1 - 0.05) * avgDailyCost);
      const forecastCount = Math.round(avgDailyCount + (Math.random() * 0.2 - 0.1) * avgDailyCount);
      
      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        estimatedCost: Number(forecastCost.toFixed(6)),
        estimatedCount: forecastCount,
        confidence: Math.max(0.5, 1 - (i / forecastDays) * 0.5) // Decreasing confidence over time
      });
    }

    const totalForecastCost = forecast.reduce((sum, day) => sum + day.estimatedCost, 0);

    return res.json({
      historical: dailyCosts.map(day => ({
        date: day._id,
        actualCost: Number((day.totalCost || 0).toFixed(6)),
        actualCount: day.count
      })),
      forecast,
      summary: {
        avgDailyCost: Number(avgDailyCost.toFixed(6)),
        avgDailyCount: Math.round(avgDailyCount),
        trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
        totalForecastCost: Number(totalForecastCost.toFixed(6)),
        forecastPeriod: `${forecastDays} days`
      }
    });

  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/analytics/model-comparison
 * Compare performance and costs across different models
 */
export const getModelComparison = async (req, res, next) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    const now = new Date();
    let startDate = new Date();
    startDate.setDate(now.getDate() - (timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30));

    const modelComparison = await prisma.summary.aggregateRaw({
      pipeline: [
        { $match: { 
          status: 'completed',
          createdAt: { $gte: startDate }
        }},
        {
          $group: {
            _id: '$modelUsed',
            count: { $sum: 1 },
            totalCost: { $sum: '$estimatedCost' },
            avgCost: { $avg: '$estimatedCost' },
            totalPromptTokens: { $sum: '$promptTokens' },
            totalResponseTokens: { $sum: '$responseTokens' },
            avgPromptTokens: { $avg: '$promptTokens' },
            avgResponseTokens: { $avg: '$responseTokens' },
            minCost: { $min: '$estimatedCost' },
            maxCost: { $max: '$estimatedCost' }
          }
        },
        { $sort: { count: -1 } }
      ]
    });

    const comparison = Array.isArray(modelComparison) ? modelComparison.map(model => {
      const pricing = MODEL_PRICING[model._id] || MODEL_PRICING['default'];
      
      return {
        model: model._id,
        usage: {
          count: model.count,
          percentage: 0 // Will calculate after we have total
        },
        costs: {
          total: Number((model.totalCost || 0).toFixed(6)),
          average: Number((model.avgCost || 0).toFixed(6)),
          min: Number((model.minCost || 0).toFixed(6)),
          max: Number((model.maxCost || 0).toFixed(6))
        },
        tokens: {
          totalPrompt: model.totalPromptTokens || 0,
          totalResponse: model.totalResponseTokens || 0,
          avgPrompt: Math.round(model.avgPromptTokens || 0),
          avgResponse: Math.round(model.avgResponseTokens || 0),
          total: (model.totalPromptTokens || 0) + (model.totalResponseTokens || 0)
        },
        pricing: {
          promptCostPer1M: (pricing.promptTokenCost * 1000000).toFixed(2),
          responseCostPer1M: (pricing.responseTokenCost * 1000000).toFixed(2)
        },
        efficiency: {
          costPerToken: model.totalPromptTokens + model.totalResponseTokens > 0 
            ? Number(((model.totalCost || 0) / ((model.totalPromptTokens || 0) + (model.totalResponseTokens || 0)) * 1000000).toFixed(6))
            : 0
        }
      };
    }) : [];

    // Calculate usage percentages
    const totalUsage = comparison.reduce((sum, model) => sum + model.usage.count, 0);
    comparison.forEach(model => {
      model.usage.percentage = totalUsage > 0 ? Number(((model.usage.count / totalUsage) * 100).toFixed(1)) : 0;
    });

    return res.json({
      comparison,
      summary: {
        totalModelsUsed: comparison.length,
        mostUsedModel: comparison[0]?.model || 'None',
        totalCost: comparison.reduce((sum, model) => sum + model.costs.total, 0),
        totalTokens: comparison.reduce((sum, model) => sum + model.tokens.total, 0)
      },
      timeRange
    });

  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/analytics/export
 * Export analytics data in various formats
 */
export const exportAnalytics = async (req, res, next) => {
  try {
    const { format = 'json', timeRange = '30d', type = 'overview' } = req.query;
    
    let data = {};
    
    switch (type) {
      case 'overview':
        const overviewReq = { query: { timeRange } };
        const overviewRes = { json: (data) => { return data; } };
        data = await getAnalyticsOverview(overviewReq, overviewRes, () => {});
        break;
      case 'model-comparison':
        const modelReq = { query: { timeRange } };
        const modelRes = { json: (data) => { return data; } };
        data = await getModelComparison(modelReq, modelRes, () => {});
        break;
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    if (format === 'csv') {
      // Convert to CSV (simplified implementation)
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${type}-${timeRange}.csv"`);
      return res.send(csv);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-${type}-${timeRange}.json"`);
    return res.json(data);

  } catch (err) {
    next(err);
  }
};

// Helper function to convert data to CSV
function convertToCSV(data) {
  // Simplified CSV conversion - in a real app you'd use a proper CSV library
  return JSON.stringify(data, null, 2);
}