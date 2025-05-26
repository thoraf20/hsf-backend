import { Job, Worker } from 'bullmq'
import { PrequalifyRepository } from '@repositories/prequalify/prequalifyRepository'
import { MortageRepository } from '@repositories/property/MortageRepository'
import logger from '@middleware/logger'
import redis from '@infrastructure/cache/redisClient'
import { DIPStatus } from '@domain/enums/propertyEnum'
import { ApplicationRepository } from '@repositories/property/ApplicationRespository'
import dipCron, { dipGenerationJob } from '@infrastructure/crons/dipCron'

const prequalifyRepository = new PrequalifyRepository()
const mortgageRepository = new MortageRepository()
const applicationRepository = new ApplicationRepository()

const dipWorker = new Worker(
  'dipGenerationQueue',
  async (job) => {
    if (job.name === dipGenerationJob) {
      return dipCron()
    }

    return processDipGen(job)
  },
  { connection: redis, autorun: false },
)

export type DipGenerationJobPayload = {
  eligibilityId: string
}

async function processDipGen(job: Job<DipGenerationJobPayload>) {
  const { eligibilityId } = job.data

  try {
    const eligibility =
      await prequalifyRepository.findEligiblityById(eligibilityId)
    if (!eligibility) {
      logger.warn(`Eligibility record not found for ID: ${eligibilityId}`)
      return
    }

    // Check if a DIP already exists for this eligibility record
    const existingDip = await mortgageRepository.getDipByEligibilityID(
      eligibility.eligibility_id,
    )

    if (existingDip) {
      logger.info(`DIP already exists for eligibility ID: ${eligibilityId}`)
      return
    }

    const application = await applicationRepository.getByUniqueID({
      eligibility_id: eligibility.eligibility_id,
    })

    if (!application) {
      logger.error(
        `No active application found for the eligibility ${eligibility.eligibility_id}`,
      )
    }

    await mortgageRepository.initiate({
      application_id: application.application_id,
      eligibility_id: eligibility.eligibility_id,
      property_id: application.property_id,
      user_id: application.user_id,
      dip_status: DIPStatus.Generated,
    })

    logger.info(
      `DIP generated successfully for eligibility ID: ${eligibilityId}`,
    )
  } catch (error) {
    logger.error(
      `Error generating DIP for eligibility ID: ${eligibilityId}`,
      error,
    )
    throw error
  }
}

dipWorker.on('completed', (job) => {
  logger.info(
    `DIP generation completed for job ${job.id} at ${new Date().toISOString()}`,
  )
})

dipWorker.on('failed', (job, err) => {
  logger.error(`DIP generation failed for job ${job.id}: ${err.message}`)
})

export default dipWorker
