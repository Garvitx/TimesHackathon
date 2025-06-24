import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import config from '../config/default.js';

const connection = new IORedis(config.redisUrl);
export const summaryQueue = new Queue('summary', { connection });
