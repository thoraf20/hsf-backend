import overdueLoanQueue, {
  overdueLoanProcessingJob,
} from '@infrastructure/queue/overdueLoanQueue'
import { LoanRepaymentScheduleRepository } from '@repositories/loans/LoanRepaymentRepository'
import logger from '@middleware/logger'
import { TimeSpan } from '@shared/utils/time-unit'
import { LoanRepaymentScheduleStatusEnum } from '@domain/enums/loanEnum'

overdueLoanQueue.upsertJobScheduler(
  overdueLoanProcessingJob,
  { every: new TimeSpan(1, 'd').toMilliseconds() }, // Run every 1 day
  {
    name: overdueLoanProcessingJob,
    opts: {
      attempts: 0,
      removeOnFail: true,
    },
  },
)

const loanRepaymentScheduleRepository = new LoanRepaymentScheduleRepository()
const BATCH_SIZE = 50 // Define your batch size

const overdueLoanCron = async () => {
  logger.info('Running Overdue Loan cron job...')

  try {
    const today = new Date()
    let offset = 0

    while (true) {
      const overdueRepayments =
        await loanRepaymentScheduleRepository.findOverdueRepayments(
          today,
          BATCH_SIZE,
        )

      if (overdueRepayments.length === 0) {
        break // No more repayments
      }

      logger.info(
        `Found ${overdueRepayments.length} overdue repayments in this batch.`,
      )

      for (const repayment of overdueRepayments) {
        await loanRepaymentScheduleRepository.updateLoanRepaymentSchedule(
          repayment.id,
          { status: LoanRepaymentScheduleStatusEnum.Overdue },
        )
        logger.info(
          `LoanID: ${repayment.loan_id} with ScheduleID: ${repayment.id} is updated to Overdue`,
        )
      }

      offset += BATCH_SIZE
    }

    logger.info('Overdue Loan cron job completed.')
  } catch (error) {
    logger.error('Error running Overdue Loan cron job:', error)
  }
}

export default overdueLoanCron
