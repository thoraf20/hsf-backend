import Redis from 'ioredis'
import logger from '../../middleware/logger'

if (!process.env.REDIS_URL) {
  logger.error('Redis Error: REDIS_URL environment variable is not set.')
  throw new Error('REDIS_URL environment variable is required.')
}

console.log(process.env.REDIS_URL)
const redis = new Redis({ maxRetriesPerRequest: null })
redis.on('error', (err) => logger.error('Redis Error:', err))

redis.on('connect', async () => {
  try {
    const pingPong = await redis.ping()
    logger.info(`Connected to Redis. Ping response: ${pingPong}`)
  } catch (error) {
    logger.error('Error connecting to Redis:', error)
  }
})

export class RedisClient {
  /**
   * Set a key-value pair in Redis with an optional expiration time.
   */
  public async setKey(
    key: string,
    value: any,
    expiration: number = 1728000,
  ): Promise<string | null> {
    try {
      const result = await redis.set(
        key,
        JSON.stringify(value),
        'EX',
        expiration,
      )
      logger.info(`Redis: Key "${key}" set successfully.`)
      return result
    } catch (error) {
      logger.error(`Redis: Error setting key "${key}":`, error)
      return null
    }
  }

  /**
   * Get a value from Redis by key.
   */
  public async getKey(key: string): Promise<any | null> {
    try {
      const result = await redis.get(key)
      if (result) {
        logger.info(`Redis: Key "${key}" retrieved successfully.`)
        return JSON.parse(result)
      }
      logger.info(`Redis: Key "${key}" not found.`)
      return null
    } catch (error) {
      logger.error(`Redis: Error retrieving key "${key}":`, error)
      return null
    }
  }

  /**
   * Delete a key from Redis if it exists.
   */
  public async deleteKey(key: string): Promise<number> {
    try {
      const result = await redis.del(key)
      if (result > 0) {
        logger.info(`Redis: Key "${key}" deleted successfully.`)
      } else {
        logger.info(`Redis: Key "${key}" not found.`)
      }
      return result
    } catch (error) {
      logger.error(`Redis: Error deleting key "${key}":`, error)
      return 0
    }
  }

  /**
   * Check if a key exists and handle cache clearing logic.
   */
  public async getKeyTTL(key: string): Promise<number> {
    try {
      const ttl = await redis.ttl(key)
      if (ttl === -2) {
        logger.info(`Redis: Key "${key}" does not exist or has expired.`)
      } else if (ttl === -1) {
        logger.warn(`Redis: Key "${key}" exists but has no expiration.`)
      } else {
        logger.info(`Redis: Key "${key}" will expire in ${ttl} seconds.`)
      }

      return Math.max(ttl, 0)
    } catch (error) {
      logger.error(`Redis: Error checking TTL for key "${key}":`, error)
    }
  }
}

export default redis
