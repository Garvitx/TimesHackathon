// src/api/controllers/admin.controller.js (MongoDB Compatible)
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Updated pricing based on the latest OpenAI pricing (per 1M tokens)
const MODEL_PRICING = {
  'gpt-4.1-nano': {
    promptTokenCost: 0.10 / 1000000,   // $0.10 per 1M tokens
    responseTokenCost: 0.40 / 1000000  // $0.40 per 1M tokens
  },
  'gpt-4.1-mini': {
    promptTokenCost: 0.40 / 1000000,   
    responseTokenCost: 1.60 / 1000000  
  },
  'gpt-4.1': {
    promptTokenCost: 2.00 / 1000000,   
    responseTokenCost: 8.00 / 1000000  
  },
  'gpt-4o-mini': {
    promptTokenCost: 0.15 / 1000000,   
    responseTokenCost: 0.60 / 1000000  
  },
  'gpt-4o': {
    promptTokenCost: 2.50 / 1000000,   
    responseTokenCost: 10.00 / 1000000 
  },
  'gpt-4-turbo': {
    promptTokenCost: 10.00 / 1000000,  
    responseTokenCost: 30.00 / 1000000 
  },
  // Fallback for unknown models
  'default': {
    promptTokenCost: 0.10 / 1000000,
    responseTokenCost: 0.40 / 1000000
  }
};

/**
 * Calculate cost for a summary based on the model used
 */
function calculateSummaryCost(promptTokens, responseTokens, modelUsed) {
  const pricing = MODEL_PRICING[modelUsed] || MODEL_PRICING['default'];
  return (promptTokens * pricing.promptTokenCost) + (responseTokens * pricing.responseTokenCost);
}

export async function getDashboardStats(req, res, next) {
  try {
    // 1) Total number of articles successfully summarized
    const totalArticles = await prisma.summary.count({
      where: { status: 'completed' },
    });

    // 2) Total number of API calls made
    const totalApiCalls = await prisma.summary.count();

    // 3) Get all completed summaries with token data
    const completedSummaries = await prisma.summary.findMany({
      where: { status: 'completed' },
      select: {
        promptTokens: true,
        responseTokens: true,
        modelUsed: true,
        estimatedCost: true,
      },
    });

    // 4) Calculate total cost using correct pricing
    let totalCost = 0;
    const modelUsageStats = {};

    completedSummaries.forEach((summary) => {
      const { promptTokens, responseTokens, modelUsed, estimatedCost } = summary;
      
      // Use stored estimatedCost if available, otherwise calculate
      let cost = 0;
      if (estimatedCost && estimatedCost > 0) {
        cost = estimatedCost;
      } else {
        cost = calculateSummaryCost(promptTokens || 0, responseTokens || 0, modelUsed);
      }
      
      totalCost += cost;
      
      // Track model usage
      if (!modelUsageStats[modelUsed]) {
        modelUsageStats[modelUsed] = { count: 0, totalCost: 0, totalTokens: 0 };
      }
      modelUsageStats[modelUsed].count++;
      modelUsageStats[modelUsed].totalCost += cost;
      modelUsageStats[modelUsed].totalTokens += (promptTokens || 0) + (responseTokens || 0);
    });

    // 5) Aggregate token sums for average calculation
    const totals = await prisma.summary.aggregate({
      where: { status: 'completed' },
      _sum: {
        promptTokens: true,
        responseTokens: true,
      },
    });

    const sumPrompt = totals._sum.promptTokens ?? 0;
    const sumResponse = totals._sum.responseTokens ?? 0;

    // 6) Daily counts of completed articles (MongoDB aggregation)
    const dailyResults = await prisma.summary.aggregateRaw({
      pipeline: [
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            date: '$_id',
            count: 1,
            _id: 0
          }
        }
      ]
    });

    const dailySummaries = Array.isArray(dailyResults) 
      ? dailyResults.map(item => ({
          date: item.date,
          count: item.count
        }))
      : [];

    // 7) Average tokens per API call
    const totalTokensSoFar = sumPrompt + sumResponse;
    const avgTokens = totalApiCalls > 0 ? totalTokensSoFar / totalApiCalls : 0;

    // 8) Success rate (%) = (completed / total) * 100
    const successRate = totalApiCalls > 0 ? (totalArticles / totalApiCalls) * 100 : 0;

    // 9) Top 5 languages by usage (MongoDB aggregation)
    const topLangResults = await prisma.summary.aggregateRaw({
      pipeline: [
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: '$language',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $project: {
            language: '$_id',
            count: 1,
            _id: 0
          }
        }
      ]
    });

    const topLanguages = Array.isArray(topLangResults)
      ? topLangResults.map((item) => ({
          language: item.language || 'Unknown',
          count: item.count,
        }))
      : [];

    // 10) Recent summaries (last 5 entries)
    const recentRecords = await prisma.summary.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        articleId: true,
        title: true,
        status: true,
        createdAt: true,
        modelUsed: true,
        estimatedCost: true,
        promptTokens: true,
        responseTokens: true,
      },
    });

    const recentSummaries = recentRecords.map((rec) => {
      const cost = rec.estimatedCost || calculateSummaryCost(rec.promptTokens || 0, rec.responseTokens || 0, rec.modelUsed);
      return {
        articleId: rec.articleId ?? rec.id,
        title: rec.title || 'Untitled',
        status: rec.status,
        createdAt: rec.createdAt ? rec.createdAt.toISOString() : new Date(0).toISOString(),
        modelUsed: rec.modelUsed || 'unknown',
        cost: Number(cost.toFixed(6)),
      };
    });

    // 11) Cost breakdown by model
    const costBreakdown = Object.entries(modelUsageStats).map(([model, stats]) => ({
      model,
      count: stats.count,
      totalCost: Number(stats.totalCost.toFixed(6)),
      avgCost: Number((stats.totalCost / stats.count).toFixed(6)),
      totalTokens: stats.totalTokens,
    }));

    // 12) Return enhanced stats
    return res.json({
      totalArticles,
      totalApiCalls,
      totalCost: Number(totalCost.toFixed(6)),
      dailySummaries,
      avgTokens: Number(avgTokens.toFixed(0)),
      successRate: Number(successRate.toFixed(2)),
      topLanguages,
      recentSummaries,
      
      // Enhanced data
      modelUsageStats: costBreakdown,
      avgCostPerArticle: totalArticles > 0 ? Number((totalCost / totalArticles).toFixed(6)) : 0,
      totalPromptTokens: sumPrompt,
      totalResponseTokens: sumResponse,
      totalTokens: sumPrompt + sumResponse,
      
      // Pricing info for reference
      currentPricing: MODEL_PRICING,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    next(err);
  }
}

/**
 * Get detailed cost analysis
 */
export async function getCostAnalysis(req, res, next) {
  try {
    const { startDate, endDate, model } = req.query;
    
    let whereClause = { status: 'completed' };
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }
    
    if (model && model !== 'all') {
      whereClause.modelUsed = model;
    }

    const summaries = await prisma.summary.findMany({
      where: whereClause,
      select: {
        id: true,
        articleId: true,
        title: true,
        modelUsed: true,
        promptTokens: true,
        responseTokens: true,
        estimatedCost: true,
        createdAt: true,
        language: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate costs with correct pricing
    const detailedAnalysis = summaries.map(summary => {
      const cost = summary.estimatedCost && summary.estimatedCost > 0 
        ? summary.estimatedCost
        : calculateSummaryCost(summary.promptTokens || 0, summary.responseTokens || 0, summary.modelUsed);
      
      return {
        ...summary,
        actualCost: Number(cost.toFixed(6)),
        totalTokens: (summary.promptTokens || 0) + (summary.responseTokens || 0),
      };
    });

    const totalCost = detailedAnalysis.reduce((sum, item) => sum + item.actualCost, 0);

    return res.json({
      summaries: detailedAnalysis,
      totalCost: Number(totalCost.toFixed(6)),
      totalItems: detailedAnalysis.length,
      avgCost: detailedAnalysis.length > 0 ? Number((totalCost / detailedAnalysis.length).toFixed(6)) : 0,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get system settings and configuration
 */
export async function getSystemSettings(req, res, next) {
  try {
    // MongoDB aggregation for model statistics
    const modelStats = await prisma.summary.aggregateRaw({
      pipeline: [
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: '$modelUsed',
            usage_count: { $sum: 1 },
            avg_prompt_tokens: { $avg: '$promptTokens' },
            avg_response_tokens: { $avg: '$responseTokens' }
          }
        },
        { $sort: { usage_count: -1 } },
        {
          $project: {
            modelUsed: '$_id',
            usage_count: 1,
            avg_prompt_tokens: 1,
            avg_response_tokens: 1,
            _id: 0
          }
        }
      ]
    });

    return res.json({
      currentPricing: MODEL_PRICING,
      modelStats: Array.isArray(modelStats) ? modelStats.map(stat => ({
        model: stat.modelUsed,
        usageCount: Number(stat.usage_count),
        avgPromptTokens: Number(stat.avg_prompt_tokens || 0),
        avgResponseTokens: Number(stat.avg_response_tokens || 0),
      })) : [],
      systemInfo: {
        database: process.env.DATABASE_URL ? 'Connected (MongoDB)' : 'Not configured',
        redis: process.env.REDIS_URL ? 'Connected' : 'Not configured',
        openai: process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured',
      }
    });
  } catch (err) {
    next(err);
  }
}