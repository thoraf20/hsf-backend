import { PaymentController } from '@controllers/PaymentController'
import { PaymentProcessorFactory } from '@infrastructure/services/factoryProducer'
import { PaymentService } from '@infrastructure/services/paymentService.service'
import { PaymentRepostory } from '@repositories/PaymentRepository'
import { MortageRepository } from '@repositories/property/MortageRepository'
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
  new MortageRepository(),
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

export default managePaymentRoutes
