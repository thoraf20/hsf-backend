import dipQueue from '../queue/dipQueue'
import { PrequalifyRepository } from '@repositories/prequalify/prequalifyRepository'
import logger from '@middleware/logger'
import { TimeSpan } from '@shared/utils/time-unit'
import { DipGenerationJobPayload } from '@infrastructure/worker/dipWorker'

export const dipGenerationJob = 'dip_generation_job'

dipQueue.upsertJobScheduler(
  dipGenerationJob,
  { every: new TimeSpan(2, 'm').toMilliseconds() },
  {
    name: dipGenerationJob,
    opts: {
      attempts: 0,
      removeOnFail: true,
    },
  },
)

const prequalifyRepository = new PrequalifyRepository()

const dipCron = async () => {
  logger.warn('Running DIP generation cron job...')

  try {
    // Find all approved eligibility records *without* associated DIPs
    const eligibleRecords =
      await prequalifyRepository.findApprovedMortgageEligibilitiesWithoutDip()

    logger.info(`Found ${eligibleRecords.length} eligible records without DIPs`)

    // Add each eligible record to the queuecron
    for (const record of eligibleRecords) {
      await dipQueue.add('generateDip', {
        eligibilityId: record.eligibility_id,
      } as DipGenerationJobPayload)
      logger.info(
        `Added eligibility ID ${record.eligibility_id} to the queue for DIP generation`,
      )
    }

    logger.info('DIP generation cron job completed.')
  } catch (error) {
    logger.error('Error running DIP generation cron job:', error)
  }
}

export default dipCron
