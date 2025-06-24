import dotenv from 'dotenv';
dotenv.config();

export default {
  port: process.env.PORT || 4000,
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  openaiApiKey: process.env.OPENAI_API_KEY,

  // JWT secrets
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_RESET_SECRET: process.env.JWT_RESET_SECRET,
  RESET_TOKEN_EXPIRY: process.env.RESET_TOKEN_EXPIRY || '1h', // default 1 hour

  // Frontend URL for password‐reset links
  FRONTEND_URL: process.env.FRONTEND_URL,

  // SMTP settings for sending emails
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,

  // CORS: allowed origins for your public frontend
  allowedOrigins: [
    process.env.FRONTEND_URL,               // e.g. https://app.yoursite.com
    'http://localhost:8080'                 // your local dev client
  ],

  // Access-token handshake (short-lived HMAC tokens)
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || 'replace-with-a-strong-random-secret',
  accessTokenTTL: parseInt(process.env.ACCESS_TOKEN_TTL_MS, 10) || 5 * 60 * 1000,  // default 5 minutes

  // Rate-limit settings for the /api/summarize endpoint
  summarizeRateLimit: {
    windowMs: parseInt(process.env.SUMMARIZE_RATE_WINDOW_MS, 10) || 60 * 60 * 1000,  // 1 hour
    max: parseInt(process.env.SUMMARIZE_RATE_MAX, 10) || 100                         // 100 calls per window
  }
};
