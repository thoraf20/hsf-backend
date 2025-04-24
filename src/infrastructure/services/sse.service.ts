// sse.service.ts
import { TransactionEnum } from '@domain/enums/transactionEnum'
import { Transaction } from '@entities/Transaction'
import redis from '@infrastructure/cache/redisClient'

export class SseService {
  async createStream(res: any, transaction: Transaction) {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    //Create new redis subscriber client
    const redisSubscriber = redis.duplicate()
    // Subscribe to the Redis channel
    await redisSubscriber.subscribe(transaction.id)

    redisSubscriber.on('message', (channel, message) => {
      const data: Transaction = JSON.parse(message)
      res.write(`data: ${message}\n\n`)
      if (
        data.status === TransactionEnum.SUCCESSFULL ||
        data.status === TransactionEnum.FAILED
      ) {
        res.write(`data: ${message}\n\n`)
        res.end()
        redisSubscriber.unsubscribe(data.id)
        redisSubscriber.quit()
      }
    })

    res.write(`data: ${JSON.stringify(transaction)}\n\n`)

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
