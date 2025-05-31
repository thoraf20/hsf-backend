import { Router, Request, Response } from 'express'
import crypto from 'crypto'
import db from '@infrastructure/database/knex'
import { TransactionEnum } from '@domain/enums/transactionEnum'
import { PaymentStatus, PaymentType } from '@domain/enums/PaymentEnum'
import { asyncMiddleware } from '@routes/index.t'
import { SseService } from '@infrastructure/services/sse.service'
import { Transaction } from '@entities/Transaction'
import { createResponse } from '@presentation/response/responseType'
import { StatusCodes } from 'http-status-codes'
import { addVerifyInspectionPaymentJob } from '@infrastructure/queue/inspectionQueue'
import { PaymentRepostory } from '@repositories/PaymentRepository'

const WebhookRouter: Router = Router()
const sse = new SseService()

const paymentRepository = new PaymentRepostory()

WebhookRouter.post(
  '/paystack',
  asyncMiddleware(async (req: Request, res: Response) => {
    const secret = process.env.PAYSTACK_SECRET_KEY! as string

    const hash = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(req.body))
      .digest('hex')

    const signature = req.headers['x-paystack-signature']

    if (hash !== signature) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    try {
      const event = req.body
      const metadata = event.data.metadata

      const transaction_id = metadata?.reference
      if (!transaction_id) {
        return res.status(400).json({ message: 'Invalid metadata' })
      }

      let transaction =
        await paymentRepository.getByTransactionRef(transaction_id)
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' })
      }

      if (event.event === 'transfer.success') {
        transaction = await paymentRepository.update({
          payment_id: transaction.payment_id,
          payment_status: PaymentStatus.SUCCESS,
        })

        // await addVerifyInspectionPaymentJob({
        //   inspectionId: inspection_id,
        //   transactionId: transaction.id,
        // })

        return res.sendStatus(200)
      } else if (event.event === 'transfer.failed') {
        transaction = await paymentRepository.update({
          payment_id: transaction.payment_id,
          payment_status: PaymentStatus.FAILED,
        })
      } else if (event.event === 'transfer.reversed') {
        transaction = await paymentRepository.update({
          payment_id: transaction.payment_id,
          payment_status: PaymentStatus.REVERSED,
        })
      }

      sse.publishStatus(transaction)
      return res.sendStatus(200)
    } catch (err) {
      console.error('Paystack webhook error:', err)
      return res.status(500).json({ message: 'Server error' })
    }
  }),
)

WebhookRouter.get(
  '/payment/sse',
  asyncMiddleware(async (req: Request, res: Response) => {
    const { reference } = req.query

    if (!reference) {
      return res
        .status(400)
        .json({ message: 'Missing Transaction reference in query' })
    }

    const payment = await paymentRepository.getByTransactionRef(
      reference as string,
    )

    if (!payment) {
      const response = createResponse(
        StatusCodes.NOT_FOUND,
        'Transaction not found',
      )
      res.status(response.statusCode).json(response)
      return
    }

    const subscriber = await sse.createStream(res, payment)

    res.on('end', () => {
      sse.closeStream(subscriber, payment.payment_id)
    })
  }),
)

export default WebhookRouter
