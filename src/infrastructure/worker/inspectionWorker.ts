import { PaymentType, PaystackPaymentStatus } from '@domain/enums/PaymentEnum'
import { PaystackProcessor } from '@domain/paymentProcessor'
import { Inspection } from '@entities/Inspection'
import { RedisClient } from '@infrastructure/cache/redisClient'
import {
  AddVerifyInspectionPaymentJob,
  createPendingInspectionCacheKey,
} from '@infrastructure/queue/inspectionQueue'
import logger from '@middleware/logger'
import { ApplicationRepository } from '@repositories/property/ApplicationRespository'
import { InspectionRepository } from '@repositories/property/Inspection'
import { TransactionRepository } from '@repositories/transaction/TransactionRepository'
import { Job, Worker } from 'bullmq'

const inspectionRepository = new InspectionRepository()
const transactionRepository = new TransactionRepository()
const applicationRepository = new ApplicationRepository()
const paymentProcessor = new PaystackProcessor()
const cache = new RedisClient()

const inspectionWorker = new Worker(
  'inspection-creation',
  async (job: Job<AddVerifyInspectionPaymentJob>) => {
    const { transactionId, inspectionId } = job.data

    try {
      let inspection = <Inspection>(
        await inspectionRepository.getScheduleInspectionById(inspectionId)
      )

      if (inspection?.inspection_fee_paid) {
        logger.info(`Inspection with ID ${inspectionId} has already been paid.`)
        return
      }

      const inspectionData: Inspection | null = await cache.getKey(
        createPendingInspectionCacheKey(inspectionId),
      )

      if (!inspectionData) {
        logger.warn(`Inspection with ID ${inspectionId} not found.`)
        return
      }

      const transaction =
        await transactionRepository.getTransactionById(transactionId)

      if (!transaction) {
        logger.warn(`Transaction with ID ${transactionId} not found.`)
        return
      }

      if (transaction.transaction_type !== PaymentType.INSPECTION) {
        logger.warn(
          `Transaction with ID ${transactionId} is not for inspection.`,
        )
        return
      }

      const response = await paymentProcessor.verifyPayment(
        transaction.reference,
      )

      if (response.status === PaystackPaymentStatus.SUCCESS) {
        inspection = await inspectionRepository.createInpection({
          ...inspectionData,
          inspection_fee_paid: true,
        })

        const application =
          await applicationRepository.getIfApplicationIsRecorded(
            inspection.property_id,
            inspection.user_id,
          )

        if (application) {
          await applicationRepository.updateApplication({
            application_id: application.application_id,
            inspection_id: inspection.id,
          })
        }
      }

      // Send Successfull Email for the scheduled inpection
      return
    } catch (error) {
      // Handle potential errors during webhook processing
      logger.error(
        `Error processing inspection creation for inspection ${inspectionId}:`,
        error,
      )

      throw error
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
    },
  },
)

inspectionWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed!`)
})

inspectionWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with error ${err.message}`)
})

export default inspectionWorker
