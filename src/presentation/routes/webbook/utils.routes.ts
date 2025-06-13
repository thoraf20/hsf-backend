import { Router, Request, Response } from 'express'
import crypto from 'crypto'
import {
  DipPaymentStatus,
  MortgagePaymentType,
  PaymentStatus,
} from '@domain/enums/PaymentEnum'
import { asyncMiddleware } from '@routes/index.t'
import { SseService } from '@infrastructure/services/sse.service'
import { createResponse } from '@presentation/response/responseType'
import { StatusCodes } from 'http-status-codes'
import { PaymentRepostory } from '@repositories/PaymentRepository'
import { ApplicationRepository } from '@repositories/property/ApplicationRespository'
import { LoanDecisionRepository } from '@repositories/loans/LoanDecisionRepository'
import { MortageRepository } from '@repositories/property/MortageRepository'
import {
  ConditionPrecedentDocumentStatus,
  ConditionPrecedentStatus,
  DipDocumentReviewStatus,
  DIPStatus,
} from '@domain/enums/propertyEnum'
import { LoanDecisionStatus } from '@domain/enums/loanEnum'
import { MortgageApplicationStage } from '@entities/Application'
import { ConditionPrecedentRepository } from '@repositories/loans/ConditionPrecedentRepository'

const WebhookRouter: Router = Router()
const applicationRepository = new ApplicationRepository()
const loanDecisionRepository = new LoanDecisionRepository()
const mortgageRepository = new MortageRepository()
const conditionPrecedentRepository = new ConditionPrecedentRepository()
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
      console.log({ data: event.data, event: event.event })

      const transaction_id = metadata?.reference
      if (!transaction_id) {
        return res.status(400).json({ message: 'Invalid metadata' })
      }

      let transaction =
        await paymentRepository.getByTransactionRef(transaction_id)
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' })
      }

      if (
        event.event === 'transfer.success' ||
        event.event === 'charge.success'
      ) {
        transaction = await paymentRepository.update({
          payment_id: transaction.payment_id,
          payment_status: PaymentStatus.SUCCESS,
        })

        if (
          transaction.payment_type === MortgagePaymentType.BROKER_FEE ||
          transaction.payment_type === MortgagePaymentType.MANAGEMENT_FEE
        ) {
          const application = await applicationRepository.getApplicationById(
            transaction.metadata.application_id,
          )

          const loanDecision = await loanDecisionRepository.getByApplicationId(
            application.application_id,
          )

          if (transaction.payment_type === MortgagePaymentType.BROKER_FEE) {
            await loanDecisionRepository.update(loanDecision.id, {
              brokerage_fee_paid_at: new Date(),
              status: LoanDecisionStatus.APPROVED,
            })
          } else if (
            transaction.payment_type === MortgagePaymentType.MANAGEMENT_FEE
          ) {
            await loanDecisionRepository.update(loanDecision.id, {
              management_fee_paid_at: new Date(),
            })

            const conditionPrecedent =
              await conditionPrecedentRepository.create({
                application_id: application.application_id,
                status: ConditionPrecedentStatus.Pending,
                documents_status: ConditionPrecedentDocumentStatus.NotUploaded,
                documents_uploaded: false,
              })

            await applicationRepository.updateApplication({
              application_id: application.application_id,
              condition_precedent_id: conditionPrecedent.id,
            })

            await Promise.all(
              application.stages?.map(async (stage) => {
                if (stage.exit_time) {
                  return
                }
                await applicationRepository.updateApplicationStage(stage.id, {
                  exit_time: new Date(),
                })
              }),
            )

            await applicationRepository.addApplicationStage(
              application.application_id,
              {
                entry_time: new Date(),
                application_id: application.application_id,
                user_id: application.user_id,
                stage: MortgageApplicationStage.ConditionPrecedent,
              },
            )
          }
        } else if (
          transaction.payment_type === MortgagePaymentType.DUE_DILIGENT
        ) {
          const application = await applicationRepository.getApplicationById(
            transaction.metadata.application_id,
          )

          const dip = await mortgageRepository.getDipByEligibilityID(
            application.eligibility_id,
          )

          console.log({ application, dip })

          await mortgageRepository.updateDipById({
            dip_id: dip.dip_id,
            dip_status: DIPStatus.DocumentsPending,
            payment_status: DipPaymentStatus.Completed,
            documents_status: DipDocumentReviewStatus.NotUploaded,
          })
        }

        // await addVerifyInspectionPaymentJob({
        //   inspectionId: inspection_id,
        //   transactionId: transaction.id,
        // })
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
