import  { Router } from 'express'
import crypto from 'crypto'
import db from '@infrastructure/database/knex'
import { TransactionEnum } from '@domain/enums/transactionEnum'
import { PaymentType } from '@domain/enums/PaymentEnum'
import { asyncMiddleware } from '@routes/index.t'

const WebhookRouter: Router = Router()
console.log(process.env.PAYSTACK_SECRET)

WebhookRouter.post('/paystack', asyncMiddleware(async (req, res) => {
    const secret = process.env.PAYSTACK_SECRET_KEY
  
    const hash = crypto
      .createHmac('sha512', secret!)
      .update(req.body)
      .digest('hex')
  
    const signature = req.headers['x-paystack-signature']
  
    if (hash !== signature) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
  
    try {
      const event = JSON.parse(req.body.toString())
  
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
  
        await db('transactions')
          .where({ transaction_id })
          .update({ status: TransactionEnum.SUCCESSFULL })
  
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
              return res.status(400).json({ message: 'Missing inspection ID in metadata' })
            }
            await db('inspection')
            .where({ id: inspection_id, user_id })
            .update({ inspection_fee_paid: TransactionEnum.SUCCESSFULL })
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
  }))
  

export default WebhookRouter
