import loanRepaymentQueue, {
  addProcessRepaymentsJob,
  loanRepaymentProcessingJob,
} from '@infrastructure/queue/loanRepaymentQueue'
import { LoanRepaymentScheduleRepository } from '@repositories/loans/LoanRepaymentRepository'
import logger from '@middleware/logger'
import { TimeSpan } from '@shared/utils/time-unit'

loanRepaymentQueue.upsertJobScheduler(
  loanRepaymentProcessingJob,
  { every: new TimeSpan(1, 'd').toMilliseconds() },
  {
    name: loanRepaymentProcessingJob,
    opts: {
      attempts: 0,
      removeOnFail: true,
    },
  },
)

const loanRepaymentScheduleRepository = new LoanRepaymentScheduleRepository()
const BATCH_SIZE = 50

const loanRepaymentCron = async () => {
  logger.info('Running Loan Repayment cron job...')

  try {
    const today = new Date()
    let offset = 0

    while (true) {
      const dueRepayments =
        await loanRepaymentScheduleRepository.findRepaymentsDueOn(
          today,
          BATCH_SIZE,
        )

      if (dueRepayments.length === 0) {
        break // No more repayments
      }

      logger.info(`Found ${dueRepayments.length} repayments due in this batch.`)

      for (const repayment of dueRepayments) {
        await addProcessRepaymentsJob({
          loanId: repayment.loan_id,
          repaymentId: repayment.id,
        })
        logger.info(
          `Added loan ID ${repayment.loan_id} to the queue for repayment ${repayment.id} processing`,
        )
      }

      offset += BATCH_SIZE
    }

    logger.info('Loan Repayment cron job completed.')
  } catch (error) {
    logger.error('Error running Loan Repayment cron job:', error)
  }
}

export default loanRepaymentCron
