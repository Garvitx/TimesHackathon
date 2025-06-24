// src/api/controllers/editor.batch.controller.js - SIMPLIFIED VERSION

import { PrismaClient } from '@prisma/client';
import contentFetcher from '../../services/contentFetcher.js';
import languageDetector from '../../services/languageDetector.js';
import summarizer from '../../services/summarizer.js';

const prisma = new PrismaClient();

/**
 * POST /api/editor/summaries/batch
 * SIMPLIFIED: Editor selects model, no auto-selection complexity
 */
export const runBatchSummaries = async (req, res, next) => {
  try {
    const { 
      items, 
      model = 'gpt-4.1-nano',  // Default to nano, editor can change
      promptTemplate
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: '`items` must be a non-empty array of { url }.' });
    }

    // Validate model
    if (!summarizer.MODEL_CONFIGS[model]) {
      return res.status(400).json({ 
        error: `Invalid model: ${model}. Available models: ${Object.keys(summarizer.MODEL_CONFIGS).join(', ')}` 
      });
    }

    const results = [];
    let totalCost = 0;
    const modelUsageStats = {};

    console.log(`🚀 Starting batch processing of ${items.length} articles`);
    console.log(`🤖 Using model: ${model}`);

    // Process each URL sequentially
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const url = item.url?.trim();
      
      console.log(`\n📄 Processing article ${i + 1}/${items.length}: ${url}`);
      
      if (!url) {
        results.push({
          articleId: item.url || 'undefined',
          status: 'error',
          errorMsg: 'Invalid URL',
        });
        continue;
      }

      try {
        // 1) Fetch title & text
        const { title, text } = await contentFetcher.fetch(url);
        console.log(`📖 Fetched: "${title}" (${text.length} chars)`);

        // 2) Detect language
        const language = languageDetector.detect(text);
        console.log(`🌐 Detected language: ${language}`);

        // 3) Estimate cost and warn if high
        const estimate = summarizer.estimateCost(title, text, language, model);
        if (estimate.warning) {
          console.log(`⚠️ ${estimate.warning}`);
        }

        // 4) Summarize with selected model (let OpenAI handle any size issues)
        const summaryResult = await summarizer.summarize({
          title,
          text,
          language,
          model
        });

        const { 
          html, 
          modelUsed, 
          promptTokens, 
          responseTokens, 
          estimatedCost
        } = summaryResult;

        // Track model usage statistics
        if (!modelUsageStats[modelUsed]) {
          modelUsageStats[modelUsed] = { count: 0, totalCost: 0 };
        }
        modelUsageStats[modelUsed].count++;
        modelUsageStats[modelUsed].totalCost += estimatedCost || 0;
        totalCost += estimatedCost || 0;

        console.log(`✅ Summary generated successfully (cost: $${(estimatedCost || 0).toFixed(6)})`);

        // 5) Save to database
        const existing = await prisma.summary.findUnique({
          where: { articleId: url },
        });

        const summaryData = {
          title,
          language,
          summaryHtml: html,
          modelUsed,
          promptTokens,
          responseTokens,
          status: 'completed',
          estimatedCost: estimatedCost || 0,
          modelSelectionReason: 'manual',
          wasTruncated: false
        };

        if (existing) {
          await prisma.summary.update({
            where: { articleId: url },
            data: summaryData,
          });
        } else {
          await prisma.summary.create({
            data: {
              articleId: url,
              ...summaryData,
            },
          });
        }

        results.push({ 
          articleId: url, 
          status: 'completed',
          modelUsed,
          estimatedCost: estimatedCost || 0,
          language,
          wasTruncated: false
        });

      } catch (err) {
        console.error(`❌ Error processing URL ${url}:`, err.message);
        
        // Save error record
        try {
          await prisma.summary.upsert({
            where: { articleId: url },
            update: { 
              status: 'failed', 
              errorMsg: err.message || 'Unknown error',
              modelUsed: model
            },
            create: {
              articleId: url,
              title: '',
              language: '',
              summaryHtml: '',
              modelUsed: model,
              promptTokens: 0,
              responseTokens: 0,
              status: 'failed',
              errorMsg: err.message || 'Unknown error',
              estimatedCost: 0
            },
          });
        } catch (dbErr) {
          console.error('Failed to save error record:', dbErr.message);
        }

        results.push({
          articleId: url,
          status: 'error',
          errorMsg: err.message || 'Failed to summarize',
        });
      }
    }

    console.log(`\n🏁 Batch processing completed!`);
    console.log(`💰 Total estimated cost: $${totalCost.toFixed(6)}`);
    console.log(`📊 Model usage:`, modelUsageStats);

    return res.json({ 
      results,
      summary: {
        totalProcessed: items.length,
        successful: results.filter(r => r.status === 'completed').length,
        failed: results.filter(r => r.status === 'error').length,
        totalEstimatedCost: totalCost,
        modelUsageStats,
        averageCostPerArticle: items.length > 0 ? totalCost / items.length : 0
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/editor/models
 * Get available models and their capabilities
 */
export const getAvailableModels = async (req, res, next) => {
  try {
    const models = summarizer.getAvailableModels();
    return res.json({ models });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/editor/estimate-cost
 * Estimate cost for processing specific content
 */
export const estimateProcessingCost = async (req, res, next) => {
  try {
    const { url, title: bodyTitle, text: bodyText, model = 'gpt-4.1-nano' } = req.body;

    let title, text;
    
    if (bodyTitle && bodyText) {
      title = bodyTitle;
      text = bodyText;
    } else if (url) {
      ({ title, text } = await contentFetcher.fetch(url));
    } else {
      return res.status(400).json({ 
        error: 'Either url or both title and text must be provided' 
      });
    }

    const language = languageDetector.detect(text);
    
    // Get estimates for all models or specific model
    const models = model === 'all' 
      ? Object.keys(summarizer.MODEL_CONFIGS)
      : [model];

    const estimates = models.map(modelName => {
      try {
        return summarizer.estimateCost(title, text, language, modelName);
      } catch (err) {
        return {
          modelName,
          error: err.message
        };
      }
    });

    return res.json({
      title,
      language,
      textLength: text.length,
      estimates
    });
  } catch (err) {
    next(err);
  }
};