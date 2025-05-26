import { PaymentController } from '@controllers/PaymentController'
import { PaymentRepostory } from '@repositories/PaymentRepository'
import { asyncMiddleware } from '@routes/index.t'
import { validateRequestQuery } from '@shared/utils/paginate'
import { PaymentUseCase } from '@use-cases/Payments/payments'
import { paymentFiltersSchema } from '@validators/paymentValidator'
import { Router } from 'express'

const paymentService = new PaymentUseCase(new PaymentRepostory())
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
