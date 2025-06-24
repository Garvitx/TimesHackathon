import { getCache, setCache }      from '../../utils/cache.js';
import contentFetcher               from '../../services/contentFetcher.js';
import languageDetector             from '../../services/languageDetector.js';
import summarizer                   from '../../services/summarizer.js';
import { PrismaClient }             from '@prisma/client';
const prisma = new PrismaClient();

const summarize = async (req, res, next) => {
  try {
    const {
      articleId,      // may be number or undefined
      url,            // may be string or undefined
      title: bodyTitle,
      text:  bodyText,
      model,          // NEW: optional preferred model
      autoSelectModel = true  // NEW: whether to auto-select optimal model
    } = req.body;

    // 1️⃣ Build a single string key from either articleId or url:
    const idStr = articleId != null 
      ? String(articleId) 
      : url;   // if url is also undefined, we'll catch it below

    if (!idStr) {
      res.status(400);
      throw new Error('Either articleId or url must be provided');
    }

    // 2️⃣ Check cache first - but only if not requesting a specific model
    const cacheKey = `summary:${idStr}${model ? `:${model}` : ''}`;
    if (!model || !autoSelectModel) {
      const cached = await getCache(cacheKey);
      if (cached) {
        return res.json({ summary_html: cached, cached: true });
      }
    }

    // 3️⃣ Fetch or reuse provided text
    let title, text;
    if (bodyTitle && bodyText) {
      title = bodyTitle;
      text  = bodyText;
    } else {
      ({ title, text } = await contentFetcher.fetch(url));
    }

    // 4️⃣ Detect language
    const language = languageDetector.detect(text);
    console.log(`🌐 Language detected: ${language} for content: "${title}"`);

    // 5️⃣ Model selection logic
    let selectedModel = model;
    let modelSelectionReason = 'manual';

    if (autoSelectModel && !model) {
      // Auto-select the most cost-effective model
      try {
        const costEstimates = Object.keys(summarizer.MODEL_CONFIGS).map(modelName => {
          try {
            return summarizer.estimateCost(title, text, language, modelName);
          } catch (err) {
            return null;
          }
        }).filter(Boolean);

        const affordableModels = costEstimates
          .filter(est => est.canHandle)
          .sort((a, b) => a.estimatedCost - b.estimatedCost);

        if (affordableModels.length > 0) {
          selectedModel = affordableModels[0].modelName;
          modelSelectionReason = 'auto_optimal';
          console.log(`🎯 Auto-selected model: ${selectedModel} (estimated cost: $${affordableModels[0].estimatedCost.toFixed(6)})`);
        } else {
          throw new Error('Content too large for any available model');
        }
      } catch (err) {
        console.error('Model auto-selection failed:', err.message);
        selectedModel = 'gpt-4.1-nano'; // Fallback
        modelSelectionReason = 'fallback';
      }
    } else if (model) {
      // Validate the requested model
      if (!summarizer.MODEL_CONFIGS[model]) {
        res.status(400);
        throw new Error(`Invalid model: ${model}. Available models: ${Object.keys(summarizer.MODEL_CONFIGS).join(', ')}`);
      }
      modelSelectionReason = 'requested';
    } else {
      selectedModel = 'gpt-4.1-nano'; // Default
      modelSelectionReason = 'default';
    }

    // 6️⃣ Summarize with selected/auto-selected model
    const summaryResult = await summarizer.summarize({
      title,
      text,
      language,
      model: selectedModel
    });

    const { 
      html, 
      modelUsed, 
      promptTokens, 
      responseTokens,
      estimatedCost,
      modelSelectionReason: actualSelectionReason,
      wasTruncated
    } = summaryResult;

    console.log(`✅ Summary generated using ${modelUsed} (cost: ${(estimatedCost || 0).toFixed(6)})`);
    if (wasTruncated) {
      console.log(`⚠️ Content was truncated due to size limitations`);
    }

    // 7️⃣ Upsert via Prisma using the single idStr
    const existing = await prisma.summary.findUnique({
      where: { articleId: idStr }
    });

    const summaryData = {
      title,
      language,
      summaryHtml: html,
      modelUsed,
      promptTokens,
      responseTokens,
      status: 'completed',
      // Store additional metadata
      estimatedCost: estimatedCost || 0,
      modelSelectionReason: actualSelectionReason || modelSelectionReason,
      wasTruncated: wasTruncated || false
    };

    if (existing) {
      await prisma.summary.update({
        where: { articleId: idStr },
        data: summaryData,
      });
    } else {
      await prisma.summary.create({
        data: {
          articleId: idStr,
          ...summaryData,
        },
      });
    }

    // 8️⃣ Cache and return (with model-specific cache key)
    await setCache(cacheKey, html, 60 * 60 * 24);
    
    res.json({ 
      summary_html: html, 
      cached: false,
      metadata: {
        modelUsed,
        language,
        estimatedCost: estimatedCost || 0,
        modelSelectionReason: actualSelectionReason || modelSelectionReason,
        wasTruncated: wasTruncated || false,
        promptTokens,
        responseTokens
      }
    });
  } catch (err) {
    next(err);
  }
};

export default { summarize };