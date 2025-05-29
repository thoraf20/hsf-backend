import { PaymentEnum, PaymentStatus } from '@domain/enums/PaymentEnum'
import { Application } from '@entities/Application'
import { Payment } from '@entities/Payment'
import { getUserClientView, UserClientView } from '@entities/User'
import { PaymentService } from '@infrastructure/services/paymentService.service'
import { IPaymentRepository } from '@interfaces/IPaymentRepository'
import { IUserRepository } from '@interfaces/IUserRepository'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { ServiceOfferingRepository } from '@repositories/serviceOffering/serviceOfferingRepository'
import { generateReferenceNumber } from '@shared/utils/helpers'
import { AuthInfo } from '@shared/utils/permission-policy'
import { InitiateMortgagePayment } from '@validators/applicationValidator'
import { PaymentFilters } from '@validators/paymentValidator'
import { StatusCodes } from 'http-status-codes'

export class PaymentUseCase {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly serviceOfferingRepository: ServiceOfferingRepository,
    private readonly userRepository: IUserRepository,
    private readonly paymentService: PaymentService,
  ) {}

  async getById(id: string): Promise<Payment & { payer?: UserClientView }> {
    const payment = await this.paymentRepository.getById(id)

    if (!payment) {
      return null
    }

    return {
      ...payment,
      payer: payment.payer ? getUserClientView(payment.payer) : null,
    }
  }

  async getByType(type: string): Promise<Payment & { payer?: UserClientView }> {
    const payment = await this.paymentRepository.getByType(type)

    if (!payment) {
      return null
    }

    return {
      ...payment,
      payer: payment.payer ? getUserClientView(payment.payer) : null,
    }
  }

  async getAll(filters: PaymentFilters) {
    const paymentContents = await this.paymentRepository.getAll(filters)
    //@ts-ignore
    paymentContents.result = paymentContents.result.map((payment) => {
      return {
        ...payment,
        payer: payment.payer ? getUserClientView(payment.payer) : null,
      }
    })

    return paymentContents
  }

  async inititateMortgagePaymentIntent(
    authInfo: AuthInfo,
    application: Application,
    input: InitiateMortgagePayment,
  ) {
    const serviceOffering =
      await this.serviceOfferingRepository.getByProductCode(input.product_code)

    if (!(serviceOffering && serviceOffering.is_active)) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Product Code not found',
      )
    }

    const user = await this.userRepository.findById(authInfo.userId)

    let payment = await this.paymentRepository.getByType(input.payment_for)

    if (payment.status === PaymentStatus.SUCCESS) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Payment intent already completed',
      )
    }

    if (!payment) {
      payment = await this.paymentRepository.create({
        amount: serviceOffering.base_price,
        currency: serviceOffering.currency,
        email: user.email,
        user_id: user.id,
        status: PaymentStatus.PENDING,
        reference: generateReferenceNumber(),
        payment_method: PaymentEnum.PAYPAL,
        payment_type: input.payment_for,
        metadata: {
          application,
        },
      })
    }

    return this.paymentService.makePayment(payment.payment_method, payment)
  }
}
