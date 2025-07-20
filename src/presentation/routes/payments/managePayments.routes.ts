import { PaymentController } from '@controllers/PaymentController'
import { PaymentProcessorFactory } from '@infrastructure/services/factoryProducer'
import { PaymentService } from '@infrastructure/services/paymentService.service'
import { LoanDecisionRepository } from '@repositories/loans/LoanDecisionRepository'
import { PaymentRepostory } from '@repositories/PaymentRepository'
import { MortgageRepository } from '@repositories/property/MortgageRepository'
import { ServiceOfferingRepository } from '@repositories/serviceOffering/serviceOfferingRepository'
import { UserRepository } from '@repositories/user/UserRepository'
import { asyncMiddleware } from '@routes/index.t'
import { validateRequestQuery } from '@shared/utils/paginate'
import { PaymentUseCase } from '@use-cases/Payments/payments'
import { paymentFiltersSchema } from '@validators/paymentValidator'
import { Router } from 'express'

const paymentService = new PaymentUseCase(
  new PaymentRepostory(),
  new ServiceOfferingRepository(),
  new UserRepository(),
  new PaymentService(new PaymentProcessorFactory()),
  new MortgageRepository(),
  new LoanDecisionRepository(),
)
const controller = new PaymentController(paymentService)
const managePaymentRoutes = Router()

managePaymentRoutes.get(
  '/payments',
  validateRequestQuery(paymentFiltersSchema),
  asyncMiddleware(async (req, res) => {
    const { query } = req
    const response = await controller.getAll(query)

    res.status(response.statusCode).json(response)
  }),
)

managePaymentRoutes.get(
  '/payments/:paymentId',
  asyncMiddleware(async (req, res) => {
    const {
      params: { paymentId },
    } = req

    console.log({ paymentId })

    const response = await controller.getById(paymentId)
    res.status(response.statusCode).json(response)
  }),
)

export default managePaymentRoutes
