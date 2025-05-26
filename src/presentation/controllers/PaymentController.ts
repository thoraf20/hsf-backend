import { ApplicationCustomError } from '@middleware/errors/customError'
import { createResponse } from '@presentation/response/responseType'
import { PaymentUseCase } from '@use-cases/Payments/payments'
import { PaymentFilters } from '@validators/paymentValidator'
import { StatusCodes } from 'http-status-codes'

export class PaymentController {
  constructor(private readonly paymentService: PaymentUseCase) {}

  async getById(id: string) {
    const payment = await this.paymentService.getById(id)

    if (!payment) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Payment not found',
      )
    }

    return createResponse(
      StatusCodes.OK,
      'Payment retrived successfully',
      payment,
    )
  }

  async getAll(filters: PaymentFilters) {
    const contents = await this.paymentService.getAll(filters)

    return createResponse(
      StatusCodes.OK,
      'Payments retrived succesfully',
      contents,
    )
  }
}
