// sse.service.ts
import { TransactionEnum } from '@domain/enums/transactionEnum'
import { Transaction } from '@entities/Transaction'
import redis from '@infrastructure/cache/redisClient'

export class SseService {
  async createStream(res: any, transactionId: string) {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*') // Adjust for production

    //Create new redis subscriber client
    const redisSubscriber = redis.duplicate()
    await redisSubscriber.connect()

    // Subscribe to the Redis channel
    await redisSubscriber.subscribe(transactionId)

    redisSubscriber.on('message', (channel, message) => {
      const data: Transaction = JSON.parse(message)
      res.write(`data: ${message}\n\n`)
      if (
        data.status === TransactionEnum.SUCCESSFULL ||
        data.status === TransactionEnum.FAILED
      ) {
        res.write(`data: ${message}\n\n`)
        res.end()
        redisSubscriber.unsubscribe(transactionId)
        redisSubscriber.quit()
      }
    })

    return redisSubscriber
  }

  async closeStream(redisSubscriber: any, transactionId: string) {
    redisSubscriber.unsubscribe(transactionId)
    redisSubscriber.quit()
  }

  async publishStatus(transaction: Transaction) {
    await redis.publish(transaction.id, JSON.stringify(transaction))
  }
}
