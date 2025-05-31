import { MortgagePaymentType, PaymentStatus } from '@domain/enums/PaymentEnum'
import { Application } from '@entities/Application'
import { DIP } from '@entities/Mortage'
import { Payment } from '@entities/Payment'
import { getUserClientView, UserClientView, UserRole } from '@entities/User'
import { PaymentService } from '@infrastructure/services/paymentService.service'
import { IMortageRespository } from '@interfaces/IMortageRespository'
import { PaymentIntent } from '@interfaces/IPaymentProcessor'
import { IPaymentRepository } from '@interfaces/IPaymentRepository'
import { IUserRepository } from '@interfaces/IUserRepository'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { ServiceOfferingRepository } from '@repositories/serviceOffering/serviceOfferingRepository'
import { Role } from '@routes/index.t'
import { generateReferenceNumber } from '@shared/utils/helpers'
import { AuthInfo } from '@shared/utils/permission-policy'
import { InitiateMortgagePayment } from '@validators/applicationValidator'
import { PaymentFilters } from '@validators/paymentValidator'
import { StatusCodes } from 'http-status-codes'
import { v4 as uuid } from 'uuid'
export class PaymentUseCase {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly serviceOfferingRepository: ServiceOfferingRepository,
    private readonly userRepository: IUserRepository,
    private readonly paymentService: PaymentService,
    private readonly mortgageRepository: IMortageRespository,
  ) {}

  async getById(id: string): Promise<Payment & { payer?: UserClientView }> {
    const payment = await this.paymentRepository.getById(id)

    if (!payment) {
      return null
    }

    return {
      ...payment,
      payer: payment.payer
        ? getUserClientView({
            ...payment.payer,
            role: (payment as { role?: UserRole }).role.name as Role,
          })
        : null,
    }
  }

  async getByType(type: string): Promise<Payment & { payer?: UserClientView }> {
    const payment = await this.paymentRepository.getByType(type)

    if (!payment) {
      return null
    }

    return {
      ...payment,
      payer: payment.payer
        ? getUserClientView({
            ...payment.payer,
            role: (payment as { role?: UserRole }).role.name as Role,
          })
        : null,
    }
  }

  async getAll(filters: PaymentFilters) {
    console.log({ filters })
    const paymentContents = await this.paymentRepository.getAll(filters)
    //@ts-ignore
    paymentContents.result = paymentContents.result.map((payment) => {
      return {
        ...payment,
        payer: payment.payer
          ? getUserClientView({
              ...payment.payer,
              role: (payment as { role?: UserRole }).role.name as Role,
            })
          : null,
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

    if (!serviceOffering) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Product Code not found',
      )
    }

    if (Number(serviceOffering.base_price) !== input.amount) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Service Fee amount not align with current service fee',
      )
    }

    const user = await this.userRepository.findById(authInfo.userId)

    let payment = await this.paymentRepository.getByType(input.payment_for)

    if (payment && payment.payment_status === PaymentStatus.SUCCESS) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Payment intent already completed',
      )
    }

    if (!payment) {
      const transactionId = uuid()
      const reference = generateReferenceNumber()
      payment = await this.paymentRepository.create({
        amount: serviceOffering.base_price,
        currency: serviceOffering.currency,
        email: user.email,
        user_id: user.id,
        payment_status: PaymentStatus.PENDING,
        transaction_id: transactionId,
        reference,
        payment_method: input.payment_method,
        payment_type: input.payment_for,
        metadata: {
          application_id: application.application_id,
          dip_id: application.dip?.dip_id,
          transaction_id: transactionId,
          reference,
        },
      })
    } else {
      payment = await this.paymentRepository.update({
        payment_id: payment.payment_id,
        amount: serviceOffering.base_price,
        currency: serviceOffering.currency,
        payment_status: PaymentStatus.PENDING,
        payment_method: input.payment_method,
        metadata: {
          ...payment.metadata,
          application_id: application.application_id,
          dip_id: application.dip?.dip_id,
        },
      })
    }

    if (payment.payment_type === MortgagePaymentType.DECISION_IN_PRINCIPLE) {
      await this.mortgageRepository.updateDipById({
        dip_id: (application as Application & { dip: DIP }).dip.dip_id,
        payment_transaction_id: payment.payment_id,
      })
    }

    let trials = 3
    let intent: PaymentIntent

    while (trials) {
      intent = await this.paymentService.makePayment(
        payment.payment_method,
        payment,
      )

      if (!intent) {
        const info = await this.paymentService.verify(
          payment.payment_method,
          payment,
        )

        console.log({ info })

        if (info.status === PaymentStatus.ABANDONED) {
          trials--
          const reference = generateReferenceNumber()

          payment = await this.paymentRepository.update({
            payment_id: payment.payment_id,
            reference: generateReferenceNumber(),
            metadata: {
              ...payment.metadata,
              reference,
            },
          })
          continue
        }

        if (info.status === PaymentStatus.SUCCESS) {
          payment = await this.paymentRepository.update({
            payment_id: payment.payment_id,
            payment_status: PaymentStatus.SUCCESS,
          })
        }

        break
      }

      payment = await this.paymentRepository.update({
        payment_id: payment.payment_id,
        metadata: { ...payment.metadata, intent: intent },
      })
      break
    }

    if (!intent) {
      throw new ApplicationCustomError(
        StatusCodes.SERVICE_UNAVAILABLE,
        'We are unable to process your transaction at the moment',
      )
    }

    return intent
  }
}
