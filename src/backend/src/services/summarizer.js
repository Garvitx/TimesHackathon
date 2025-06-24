import OpenAI from 'openai';
import config from '../config/default.js';

// Simple model configurations - just pricing, no token limits
const MODEL_CONFIGS = {
  'gpt-4.1-nano': {
    costPerPromptToken: 0.10 / 1000000,    // $0.10 per 1M tokens
    costPerResponseToken: 0.40 / 1000000,  // $0.40 per 1M tokens
    maxOutputTokens: 300
  },
  'gpt-4.1-mini': {
    costPerPromptToken: 0.40 / 1000000,    // $0.40 per 1M tokens
    costPerResponseToken: 1.60 / 1000000,  // $1.60 per 1M tokens
    maxOutputTokens: 500
  },
  'gpt-4o-mini': {
    costPerPromptToken: 0.15 / 1000000,    // $0.15 per 1M tokens
    costPerResponseToken: 0.60 / 1000000,  // $0.60 per 1M tokens
    maxOutputTokens: 500
  },
  'gpt-4o': {
    costPerPromptToken: 2.50 / 1000000,    // $2.50 per 1M tokens
    costPerResponseToken: 10.00 / 1000000, // $10.00 per 1M tokens
    maxOutputTokens: 800
  },
  'gpt-4-turbo': {
    costPerPromptToken: 10.00 / 1000000,   // $10.00 per 1M tokens
    costPerResponseToken: 30.00 / 1000000, // $30.00 per 1M tokens
    maxOutputTokens: 1000
  }
};

// Map ISO codes to human-readable names
const languageNames = {
  en: 'English',
  hi: 'Hindi',
  bn: 'Bengali',
  ta: 'Tamil',
  te: 'Telugu',
  gu: 'Gujarati',
  kn: 'Kannada',
  ml: 'Malayalam',
  pa: 'Punjabi',
  or: 'Odia',
  ur: 'Urdu',
  ar: 'Arabic',
  mr: 'Marathi',
  ne: 'Nepali'
};

const openai = new OpenAI({ apiKey: config.openaiApiKey });

/**
 * Simple token estimation (for cost calculation only)
 */
function estimateTokens(text, language = 'en') {
  const tokenMultipliers = {
    en: 0.25,    // ~4 chars per token
    hi: 0.35,    // Hindi
    bn: 0.35,    // Bengali
    ta: 0.35,    // Tamil
    te: 0.35,    // Telugu
    ar: 0.3,     // Arabic
    ur: 0.3,     // Urdu
    zh: 0.5,     // Chinese characters
    default: 0.3
  };
  
  const multiplier = tokenMultipliers[language] || tokenMultipliers.default;
  return Math.ceil(text.length * multiplier);
}

function generateSystemPrompt(language) {
  const langCode = language.toLowerCase();
  const languageName = languageNames[langCode] || language;
  
  return `You are a professional summarization assistant.
The article is in ${languageName}. Respond in ${languageName}.

You will receive an Article Title and full Article Text.
Your task is to return exactly one HTML <ul> block—no extra text or tags.

<ul>
  <li><b>One-sentence overview with the article's main event or claim, including a date or timestamp if given.</b></li>
  <li>Key point 1: concise fact or argument (include figures, names, or dates).</li>
  <li>Key point 2: concise fact or argument (include figures, names, or dates).</li>
  <li>Key point 3: concise fact or argument (include figures, names, or dates).</li>
  <li>Key point 4: concise fact or argument (include figures, names, or dates).</li>
  <li>Key point 5: concise fact or argument (include figures, names, or dates).</li>
</ul>

Rules:
1. Output only the <ul>…</ul> element.
2. The first <li> must be bold (<b>…</b>) and encapsulate the article's core in one sentence with date/time.
3. Provide exactly 6 <li> items total (1 overview + 5 facts).
4. Each subsequent <li> must be a standalone, factual point drawn verbatim or tightly paraphrased.
5. If the text contains any dates, figures, proper names, or concrete details, include at least one of those in every bullet.
6. Do not add headings, commentary, qualifiers (e.g. "This shows"), or styling attributes.
7. Preserve the article's original language and formatting of numerals/dates.
8. Ensure no bullet is redundant—each must contribute new information.`.trim();
}

/**
 * SIMPLIFIED summarize function - editor picks model, no token limits
 */
const summarize = async ({ title, text, language, model = 'gpt-4.1-nano' }) => {
  const config = MODEL_CONFIGS[model];
  if (!config) {
    throw new Error(`Invalid model: ${model}. Available models: ${Object.keys(MODEL_CONFIGS).join(', ')}`);
  }

  const systemPrompt = generateSystemPrompt(language);
  const messages = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Article Title: ${title}

Article Text:
${text}

Please output the summary as described above.`
    },
  ];

  console.log(`🤖 Using model: ${model} for ${language} content (${text.length} chars)`);

  try {
    const resp = await openai.chat.completions.create({
      model: model,
      messages,
      temperature: 0,
      max_tokens: config.maxOutputTokens,
    });

    const html = resp.choices[0].message.content.trim();
    const modelUsed = resp.model || model;
    const promptTokens = resp.usage.prompt_tokens;
    const responseTokens = resp.usage.completion_tokens;
    
    // Calculate actual cost using correct pricing
    const actualCost = (promptTokens * config.costPerPromptToken) + 
                      (responseTokens * config.costPerResponseToken);
    
    console.log(`💰 Cost: $${actualCost.toFixed(6)} (${modelUsed})`);
    console.log(`📊 Tokens: ${promptTokens} prompt + ${responseTokens} response`);
    
    return { 
      html, 
      modelUsed, 
      promptTokens, 
      responseTokens,
      estimatedCost: actualCost,
      modelSelectionReason: 'manual',
      wasTruncated: false
    };
  } catch (error) {
    console.error(`❌ Summarization failed with ${model}:`, error.message);
    throw error;
  }
};

/**
 * Get available models and their capabilities
 */
const getAvailableModels = () => {
  return Object.entries(MODEL_CONFIGS).map(([name, config]) => ({
    name,
    costPerPromptToken: config.costPerPromptToken,
    costPerResponseToken: config.costPerResponseToken,
    maxOutputTokens: config.maxOutputTokens,
    costPer1MPromptTokens: config.costPerPromptToken * 1000000,
    costPer1MResponseTokens: config.costPerResponseToken * 1000000,
  }));
};

/**
 * Estimate cost for a given text (for warnings)
 */
const estimateCost = (title, text, language, modelName = 'gpt-4.1-nano') => {
  const config = MODEL_CONFIGS[modelName];
  if (!config) throw new Error(`Unknown model: ${modelName}`);
  
  const systemPrompt = generateSystemPrompt(language);
  const userPrompt = `Article Title: ${title}\n\nArticle Text:\n${text}`;
  const estimatedPromptTokens = estimateTokens(systemPrompt + userPrompt, language);
  const estimatedResponseTokens = config.maxOutputTokens * 0.7; // Assume 70% of max
  
  const estimatedCost = (estimatedPromptTokens * config.costPerPromptToken) + 
                       (estimatedResponseTokens * config.costPerResponseToken);
  
  return {
    modelName,
    estimatedPromptTokens,
    estimatedResponseTokens,
    estimatedCost,
    warning: estimatedCost > 0.01 ? `High cost: $${estimatedCost.toFixed(4)}` : null
  };
};

export default { 
  summarize, 
  getAvailableModels, 
  estimateCost,
  MODEL_CONFIGS 
};