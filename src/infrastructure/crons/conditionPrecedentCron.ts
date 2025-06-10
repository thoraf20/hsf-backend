import conditionPrecedentQueue, {
  addGenerateLoanJob,
  conditionPrecedentLoanGenerationJob,
} from '@infrastructure/queue/conditionPrecedentQueue'
import { ConditionPrecedentRepository } from '@repositories/loans/ConditionPrecedentRepository'
import logger from '@middleware/logger'
import { TimeSpan } from '@shared/utils/time-unit'

conditionPrecedentQueue.upsertJobScheduler(
  conditionPrecedentLoanGenerationJob,
  { every: new TimeSpan(1, 'm').toMilliseconds() }, // Run every 1 day
  {
    name: conditionPrecedentLoanGenerationJob,
    opts: {
      attempts: 0,
      removeOnFail: true,
    },
  },
)

const conditionPrecedentRepository = new ConditionPrecedentRepository()
const BATCH_SIZE = 50

const conditionPrecedentCron = async () => {
  logger.info('Running Condition Precedent loan generation cron job...')

  try {
    // Find completed condition precedents without associated loans
    const completedConditionPrecedents =
      await conditionPrecedentRepository.findCompletedConditionPrecedentsWithoutLoan(
        BATCH_SIZE,
      )

    logger.info(
      `Found ${completedConditionPrecedents.length} completed condition precedents without loans`,
    )

    // Add each completed condition precedent to the queue for loan generation
    for (const conditionPrecedent of completedConditionPrecedents) {
      await addGenerateLoanJob({ conditionPrecedentId: conditionPrecedent.id })
      logger.info(
        `Added condition precedent ID ${conditionPrecedent.id} to the queue for loan generation`,
      )
    }

    logger.info('Condition Precedent loan generation cron job completed.')
  } catch (error) {
    logger.error(
      'Error running Condition Precedent loan generation cron job:',
      error,
    )
  }
}

export default conditionPrecedentCron
