import { createClient } from 'redis';
import config from '../config/default.js';

export const redisClient = createClient({ url: config.redisUrl });
redisClient.on('error', err => console.error('Redis Error', err));
await redisClient.connect();

export const getCache = (key) => redisClient.get(key);
export const setCache = (key, value, ttl) => redisClient.set(key, value, { EX: ttl });
