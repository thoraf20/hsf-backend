// sse.service.ts
import { PaymentStatus } from '@domain/enums/PaymentEnum'
import { Payment } from '@entities/Payment'
import redis from '@infrastructure/cache/redisClient'

export class SseService {
  async createStream(res: any, payment: Payment) {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    //Create new redis subscriber client
    const redisSubscriber = redis.duplicate()
    // Subscribe to the Redis channel
    await redisSubscriber.subscribe(payment.payment_id)

    redisSubscriber.on('message', (_, message) => {
      const data: Payment = JSON.parse(message)
      res.write(`data: ${message}\n\n`)
      if (
        data.payment_status === PaymentStatus.SUCCESS ||
        data.payment_status === PaymentStatus.FAILED
      ) {
        res.write(`data: ${message}\n\n`)
        res.end()
        redisSubscriber.unsubscribe(data.payment_id)
        redisSubscriber.quit()
      }
    })

    res.write(`data: ${JSON.stringify(payment)}\n\n`)

    return redisSubscriber
  }

  async closeStream(redisSubscriber: any, paymentId: string) {
    redisSubscriber.unsubscribe(paymentId)
    redisSubscriber.quit()
  }

  async publishStatus(payment: Payment) {
    await redis.publish(payment.payment_id, JSON.stringify(payment))
  }
}
