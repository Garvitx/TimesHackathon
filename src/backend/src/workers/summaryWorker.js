/ src/workers/summaryWorker.js
import { Worker } from 'bullmq';
import { summaryQueue } from '../utils/queue.js';
import contentFetcher from '../services/contentFetcher.js';
import languageDetector from '../services/languageDetector.js';
import summarizer from '../services/summarizer.js';
import { setCache } from '../utils/cache.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

new Worker('summary', async job => {
  const { articleId, url } = job.data;
  const key = `summary:${articleId || url}`;
  try {
    const { title, text } = await contentFetcher.fetch(url);
    const language = languageDetector.detect(text);
    const { html: summaryHtml, modelUsed, promptTokens, responseTokens } =
      await summarizer.summarize({ title, text, language });

    const existing = await prisma.summary.findUnique({ where: { articleId } });
    if (existing) {
      await prisma.summary.update({
        where: { articleId },
        data: { title, language, summaryHtml, modelUsed, promptTokens, responseTokens, status: 'completed' }
      });
    } else {
      await prisma.summary.create({
        data: { articleId, title, language, summaryHtml, modelUsed, promptTokens, responseTokens, status: 'completed' }
      });
    }

    await setCache(key, summaryHtml, 60 * 60 * 24);
  } catch (err) {
    console.error('Worker error:', err);
    await prisma.summary.update({
      where: { articleId },
      data: { status: 'failed', errorMsg: err.message }
    });
  }
});

console.log('🛠 Summary worker started');
