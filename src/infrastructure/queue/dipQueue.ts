import { Queue } from 'bullmq'
import redis from '@infrastructure/cache/redisClient'

const dipQueue = new Queue('dipGenerationQueue', {
  connection: redis,
})

export default dipQueue
