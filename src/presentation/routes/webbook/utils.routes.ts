import { Router, Request, Response } from 'express'
import crypto from 'crypto'
import db from '@infrastructure/database/knex'
import { TransactionEnum } from '@domain/enums/transactionEnum'
import { PaymentType } from '@domain/enums/PaymentEnum'
import { asyncMiddleware } from '@routes/index.t'
import { SseService } from '@infrastructure/services/sse.service'
import { Transaction } from '@entities/Transaction'
import { createResponse } from '@presentation/response/responseType'
import { StatusCodes } from 'http-status-codes'
import { addVerifyInspectionPaymentJob } from '@infrastructure/queue/inspectionQueue'

const WebhookRouter: Router = Router()
const sse = new SseService()

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
      if (event.event === 'charge.success') {
        const metadata = event.data.metadata

        const transaction_id = metadata?.transaction_id
        if (!transaction_id) {
          return res.status(400).json({ message: 'Invalid metadata' })
        }

        const transaction = await db('transactions')
          .where({ transaction_id })
          .first()

        if (!transaction) {
          return res.status(404).json({ message: 'Transaction not found' })
        }

        const { user_id, transaction_type, property_id } = transaction

        const [updatedTransaction] = await db('transactions')
          .where({ transaction_id })
          .update({ status: TransactionEnum.SUCCESSFULL })
          .returning('*')

        sse.publishStatus(updatedTransaction)

        const updateFields: Record<string, boolean> = {}

        switch (transaction_type) {
          case PaymentType.DUE_DILIGENT:
            updateFields.pay_due_deligence = true
            break
          case PaymentType.BROKER_FEE:
            updateFields.pay_brokage_fee = true
            break
          case PaymentType.MANAGEMENT_FEE:
            updateFields.pay_management_fee = true
            break
          case PaymentType.INSPECTION:
            const inspection_id = metadata?.inspection_id
            if (!inspection_id) {
              return res
                .status(400)
                .json({ message: 'Missing inspection ID in metadata' })
            }

            await addVerifyInspectionPaymentJob({
              inspectionId: inspection_id,
              transactionId: transaction.id,
            })

            break
          default:
            break
        }

        if (Object.keys(updateFields).length > 0) {
          await db('mortage_payment_status')
            .where({ user_id, property_id })
            .update(updateFields)
        }

        return res.sendStatus(200)
      }

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

    const transaction = await db<Transaction>('transactions')
      .where({ reference: reference as string })
      .first()

    if (!transaction) {
      const response = createResponse(
        StatusCodes.NOT_FOUND,
        'Transaction not found',
      )
      res.status(response.statusCode).json(response)
      return
    }

    const subscriber = await sse.createStream(res, transaction)

    res.on('end', () => {
      sse.closeStream(subscriber, transaction.id)
    })
  }),
)

export default WebhookRouter
