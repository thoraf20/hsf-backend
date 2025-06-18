import { Job, Worker } from 'bullmq'
import logger from '@middleware/logger'
import redis from '@infrastructure/cache/redisClient'
import { LoanRepository } from '@repositories/loans/LoanRepository'
import { LoanRepaymentScheduleRepository } from '@repositories/loans/LoanRepaymentRepository'
import {
  LoanRepaymentScheduleStatusEnum,
  LoanStatusEnum,
} from '@domain/enums/loanEnum'
import { runWithTransaction } from '@infrastructure/database/knex'
import {
  AddProcessRepaymentsJob,
  LoanRepaymentJobType,
  loanRepaymentProcessingJob,
} from '@infrastructure/queue/loanRepaymentQueue'
import { UserRepository } from '@repositories/user/UserRepository'
import emailTemplates from '@infrastructure/email/template/constant'
import { differenceInDays, format } from 'date-fns'
import loanRepaymentCron from '@infrastructure/crons/loanRepaymentCron'

const loanRepository = new LoanRepository()
const loanRepaymentScheduleRepository = new LoanRepaymentScheduleRepository()
const userRepository = new UserRepository()

const loanRepaymentWorker = new Worker(
  'loan-repayment-processing',
  async (job: Job<AddProcessRepaymentsJob>) => {
    if (job.name === loanRepaymentProcessingJob) {
      return loanRepaymentCron()
    } else if (job.name === LoanRepaymentJobType.PROCESS_REPAYMENTS) {
      return processRepaymentJob(job)
    }
  },
  { connection: redis, autorun: false },
)

async function processRepaymentJob(job: Job<AddProcessRepaymentsJob>) {
  const { loanId, repaymentId: repayment_id } = job.data

  logger.info(`Processing repayment for loan ID: ${loanId}`)

  try {
    const loan = await loanRepository.getLoanById(loanId)

    if (!loan) {
      logger.warn(`Loan with ID ${loanId} not found.`)
      return
    }

    if (loan.loan_status !== LoanStatusEnum.Active) {
      logger.warn(
        `Loan with ID ${loanId} is not active. Status: ${loan.loan_status}`,
      )
      return
    }

    const repaymentSchedule =
      await loanRepaymentScheduleRepository.getLoanRepaymentScheduleById(
        repayment_id,
      )

    if (!(repaymentSchedule && repaymentSchedule.loan_id === loanId)) {
      logger.warn(
        `No repayment schedule found for loan ID ${loanId} with repayment ID ${repayment_id}.`,
      )
      return
    }
    await runWithTransaction(async () => {
      await loanRepaymentScheduleRepository.updateLoanRepaymentSchedule(
        repaymentSchedule.id,
        { status: LoanRepaymentScheduleStatusEnum.Overdue },
      )

      if (loan.user_id) {
        const user = await userRepository.findById(loan.user_id)

        if (!user) {
          logger.warn(
            `User with ID ${loan.user_id} associated with the loan not found`,
          )
        }

        emailTemplates.sendLoanRepaymentOverdueEmail({
          borrowerName: `${user.first_name} ${user.last_name}`,
          companyName: 'HSF',
          email: user.email,
          currency: '₦',
          loanId: loan.id,
          dueDate: format(repaymentSchedule.due_date, 'MMMM dd, yyyy'),
          overdueAmount: String(repaymentSchedule.total_due),
          daysOverdue: differenceInDays(repaymentSchedule.due_date, new Date()),
        })
      }
    })

    logger.info(`Successfully processed repayment for loan ID: ${loanId}`)
  } catch (error) {
    logger.error(`Error processing repayment for loan ID: ${loanId}`, error)
    throw error
  }
}

loanRepaymentWorker.on('completed', (job) => {
  logger.info(`Loan repayment processed for job ${job.id}`)
})

loanRepaymentWorker.on('failed', (job, err) => {
  logger.error(
    `Loan repayment processing failed for job ${job.id}: ${err.message}`,
  )
})

export default loanRepaymentWorker
