import express from 'express';
import cors from 'cors';
import config from './config/default.js';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, requireRole } from './api/middleware/auth.middleware.js';
import summarizeRouter from './api/routes/summarize.routes.js';
import adminRouter from './api/routes/admin.routes.js';
import authRouter from './api/routes/auth.routes.js';
import editorRouter from './api/routes/editor.routes.js';
import errorHandler from './api/middleware/errorHandler.js';
import { redisClient } from './utils/cache.js';
import { lookup } from 'dns';
import { promisify } from 'util';
import net from 'net';

// Ensure critical secrets are set
if (!config.accessTokenSecret) {
  console.error('✖ ACCESS_TOKEN_SECRET must be set');
  process.exit(1);
}
if (!config.summarizeRateLimit?.windowMs || !config.summarizeRateLimit?.max) {
  console.error('✖ Summarize rate-limit config missing');
  process.exit(1);
}

// Initialize ORM
const prisma = new PrismaClient();

// Create Express app
const app = express();

// CORS: restrict to allowed frontend origins
app.use(cors({ origin: config.allowedOrigins }));
app.use(express.json());

// === Rate-limit the token handshake to prevent token-spamming ===
const keyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,             // max 10 token requests per minute
  handler: (_, res) =>
    res.status(429).json({ error: 'Too many token requests, please try again later' }),
});

// === Handshake endpoint: issue short-lived signed token ===
app.get('/api/key', keyLimiter, (req, res) => {
  const payload = JSON.stringify({ ts: Date.now() });
  const signature = crypto
    .createHmac('sha256', config.accessTokenSecret)
    .update(payload)
    .digest('hex');

  const token = Buffer.from(payload).toString('base64') + '.' + signature;
  res.json({ token });
});

// === URL-validation middleware to prevent SSRF ===
const validateUrl = async (req, res, next) => {
  const { url } = req.body;
  if (!url) return next();

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return res.status(400).json({ error: 'URL must use http or https' });
  }

  // Resolve hostname to check for private IPs
  try {
    const addresses = await promisify(lookup)(parsed.hostname, { all: true });
    for (const { address } of addresses) {
      if (net.isIP(address) && (
        address.startsWith('10.') ||
        address.startsWith('172.16.') ||
        address.startsWith('192.168.') ||
        net.isIPv6(address) && address.startsWith('fc00:')
      )) {
        return res.status(400).json({ error: 'URL resolves to a private IP' });
      }
    }
  } catch {
    // DNS errors treated as invalid URL
    return res.status(400).json({ error: 'Unable to resolve URL hostname' });
  }

  next();
};

// === Summarize endpoint: verify token, rate-limit, validate URL, then route ===
const summarizeLimiter = rateLimit({
  windowMs: config.summarizeRateLimit.windowMs,
  max: config.summarizeRateLimit.max,
  keyGenerator: (req) => req.headers['x-access-token'] || req.ip,
  handler: (_, res) => res.status(429).json({ error: 'Too many summarization requests' }),
});

// Token verification middleware
const verifyAccessToken = (req, res, next) => {
  const token = req.headers['x-access-token'];
  if (!token) return res.status(401).json({ error: 'Missing access token' });

  const [b64, sig] = token.split('.');
  let payload;
  try {
    payload = Buffer.from(b64, 'base64').toString();
  } catch {
    return res.status(400).json({ error: 'Invalid token format' });
  }

  const expectedSig = crypto
    .createHmac('sha256', config.accessTokenSecret)
    .update(payload)
    .digest('hex');

  // Prevent timing attacks
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (
    sigBuf.length !== expBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expBuf)
  ) {
    return res.status(401).json({ error: 'Invalid token signature' });
  }

  let data;
  try {
    data = JSON.parse(payload);
  } catch {
    return res.status(400).json({ error: 'Invalid token payload' });
  }

  if (Date.now() - data.ts > config.accessTokenTTL) {
    return res.status(401).json({ error: 'Token expired' });
  }

  next();
};

// Mount summarization with all middleware
app.use(
  '/api/summarize',
  verifyAccessToken,
  summarizeLimiter,
  validateUrl,
  summarizeRouter
);

// Mount auth routes (public for login, signup, reset)
app.use('/api/auth', authRouter);

// Mount editor routes (protected: Editor OR Admin)
app.use(
  '/api/editor',
  authMiddleware,
  requireRole(['Editor', 'Admin']),
  editorRouter
);

// Mount admin routes (protected: Admin ONLY)
app.use(
  '/api/admin',
  authMiddleware,
  requireRole(['Admin']),
  adminRouter
);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redisClient.ping();
    res.status(200).json({ status: 'OK' });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(500).json({ status: 'ERROR' });
  }
});

// Central error handler
app.use(errorHandler);

// Start server
const port = config.port;
app.listen(port, () => console.log(`🟢 Server running at http://localhost:${port}`));
