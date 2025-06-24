// config/models.js
import dotenv from 'dotenv';
dotenv.config();

export const MODEL_STRATEGY = {
  // Strategy for model selection
  AUTO_SELECT: process.env.MODEL_AUTO_SELECT === 'true', // Default: true
  
  // Cost limits
  MAX_COST_PER_ARTICLE: parseFloat(process.env.MAX_COST_PER_ARTICLE || '0.10'), // $0.10 default
  MAX_COST_PER_BATCH: parseFloat(process.env.MAX_COST_PER_BATCH || '5.00'),     // $5.00 default
  
  // Content size thresholds for auto-model selection
  THRESHOLDS: {
    NANO_MAX_CHARS: parseInt(process.env.NANO_MAX_CHARS || '15000'),     // ~4k tokens
    MINI_MAX_CHARS: parseInt(process.env.MINI_MAX_CHARS || '120000'),    // ~30k tokens  
    STANDARD_MAX_CHARS: parseInt(process.env.STANDARD_MAX_CHARS || '400000'), // ~100k tokens
  },
  
  // Model preferences (1 = highest priority, 4 = lowest)
  PREFERENCES: {
    COST_OPTIMIZED: ['gpt-4.1-nano', 'gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
    QUALITY_OPTIMIZED: ['gpt-4o', 'gpt-4-turbo', 'gpt-4o-mini', 'gpt-4.1-nano'],
    BALANCED: ['gpt-4o-mini', 'gpt-4.1-nano', 'gpt-4o', 'gpt-4-turbo']
  },
  
  // Current strategy
  CURRENT_STRATEGY: process.env.MODEL_STRATEGY || 'COST_OPTIMIZED', // COST_OPTIMIZED, QUALITY_OPTIMIZED, BALANCED
  
  // Fallback model when all else fails
  FALLBACK_MODEL: process.env.FALLBACK_MODEL || 'gpt-4.1-nano',
  
  // Enable/disable model switching based on content size
  DYNAMIC_SWITCHING: process.env.DYNAMIC_MODEL_SWITCHING !== 'false', // Default: true
  
  // Cache summaries with model-specific keys
  MODEL_SPECIFIC_CACHE: process.env.MODEL_SPECIFIC_CACHE === 'true', // Default: false
};

// Helper function to get model order based on strategy
export function getModelPreferenceOrder(strategy = MODEL_STRATEGY.CURRENT_STRATEGY) {
  return MODEL_STRATEGY.PREFERENCES[strategy] || MODEL_STRATEGY.PREFERENCES.COST_OPTIMIZED;
}

// Helper function to check if cost is within limits
export function isWithinCostLimits(cost, isArticle = true) {
  const limit = isArticle ? MODEL_STRATEGY.MAX_COST_PER_ARTICLE : MODEL_STRATEGY.MAX_COST_PER_BATCH;
  return cost <= limit;
}

// Helper function to suggest model based on content length
export function suggestModelByLength(textLength, strategy = MODEL_STRATEGY.CURRENT_STRATEGY) {
  const { NANO_MAX_CHARS, MINI_MAX_CHARS, STANDARD_MAX_CHARS } = MODEL_STRATEGY.THRESHOLDS;
  const preferenceOrder = getModelPreferenceOrder(strategy);
  
  if (textLength <= NANO_MAX_CHARS) {
    // Can use any model, return by preference
    return preferenceOrder[0];
  } else if (textLength <= MINI_MAX_CHARS) {
    // Need at least mini or better
    return preferenceOrder.find(model => !model.includes('nano')) || 'gpt-4o-mini';
  } else if (textLength <= STANDARD_MAX_CHARS) {
    // Need standard models
    return preferenceOrder.find(model => 
      model.includes('4o') || model.includes('turbo')
    ) || 'gpt-4o';
  } else {
    // Very large content, need most capable model
    return 'gpt-4-turbo';
  }
}

export default {
  MODEL_STRATEGY,
  getModelPreferenceOrder,
  isWithinCostLimits,
  suggestModelByLength
};