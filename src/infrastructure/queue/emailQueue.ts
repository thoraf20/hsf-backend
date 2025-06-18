import redis from '@infrastructure/cache/redisClient'
import { Queue } from 'bullmq'

export const emailQueue = new Queue('email-queue', {
  
  connection: redis,
});