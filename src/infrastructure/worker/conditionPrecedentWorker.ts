import { Job, Worker } from 'bullmq'
import {
  AddGenerateLoanJob,
  ConditionPrecedentJobType,
  conditionPrecedentLoanGenerationJob,
} from '@infrastructure/queue/conditionPrecedentQueue'
import logger from '@middleware/logger'
import redis from '@infrastructure/cache/redisClient'
import { ConditionPrecedentRepository } from '@repositories/loans/ConditionPrecedentRepository'
import { LoanRepository } from '@repositories/loans/LoanRepository'
import { ApplicationRepository } from '@repositories/property/ApplicationRepository'
import { LoanRepaymentSchedule } from '@entities/Loans'
import { LoanOfferRepository } from '@repositories/loans/LoanOfferRepository'
import {
  LoanRepaymentScheduleStatusEnum,
  LoanStatusEnum,
} from '@domain/enums/loanEnum'
import { addMonths, add } from 'date-fns'
import { LoanRepaymentScheduleRepository } from '@repositories/loans/LoanRepaymentRepository'
import { runWithTransaction } from '@infrastructure/database/knex'
import conditionPrecedentCron from '@infrastructure/crons/conditionPrecedentCron'

const conditionPrecedentRepository = new ConditionPrecedentRepository()
const loanRepository = new LoanRepository()
const applicationRepository = new ApplicationRepository()
const loanOfferRepository = new LoanOfferRepository()
const loanRepaymentRepository = new LoanRepaymentScheduleRepository()

const conditionPrecedentWorker = new Worker(
  'condition-precedent-loan-generation',
  async (job: Job<AddGenerateLoanJob>) => {
    if (job.name === conditionPrecedentLoanGenerationJob) {
      return conditionPrecedentCron()
    } else if (job.name === ConditionPrecedentJobType.GENERATE_LOAN) {
      return processCPLoanGen(job)
    }
  },
  { connection: redis, autorun: false },
)

async function processCPLoanGen(job: Job<AddGenerateLoanJob>) {
  const { conditionPrecedentId } = job.data
  try {
    const conditionPrecedent =
      await conditionPrecedentRepository.findById(conditionPrecedentId)

    if (!conditionPrecedent) {
      logger.warn(
        `Condition Precedent record not found for ID: ${conditionPrecedentId}`,
      )
      return
    }

    // Check if a loan already exists for this condition precedent's application
    const application = await applicationRepository.getApplicationById(
      conditionPrecedent.application_id,
    )

    if (!application) {
      logger.error(
        `No active application found for the the condition precedent ${conditionPrecedent.id}`,
      )
      return
    }

    const loanOffer = await loanOfferRepository.getLoanOfferById(
      application.loan_offer_id,
    )

    if (!loanOffer) {
      logger.error(`There exist no loan offer for this application currently`)
      return
    }

    const existingLoan = await loanRepository.getLoans({
      application_id: application.application_id,
    })
    if (existingLoan.total_records > 0) {
      logger.info(
        `Loan already exists for condition precedent ID: ${conditionPrecedentId}`,
      )
      return
    }

    await runWithTransaction(async () => {
      const now = new Date()
      const loan = await loanRepository.createLoan({
        user_id: loanOffer.user_id,
        application_id: application.application_id,
        loan_offer_id: loanOffer.id,
        interest_rate: loanOffer.interest_rate,
        lender_org_id: loanOffer.organization_id,
        repayment_frequency: loanOffer.repayment_frequency,
        loan_status: LoanStatusEnum.Active,
        principal_amount: loanOffer.loan_amount,
        start_date: loanOffer.loan_start_date ?? loanOffer.expiry_date,
        end_date: addMonths(now, loanOffer.loan_term_months),
        remaning_balance: loanOffer.loan_amount, //initially equals loan amount
        total_interest_paid: 0,
        total_principal_paid: 0,
        loan_terms_months: loanOffer.loan_term_months,
      })

      // New: Determine the number of payments and the interval based on repayment frequency
      let numberOfPayments: number
      let paymentInterval: { months?: number; days?: number; weeks?: number } =
        {}

      switch (loanOffer.repayment_frequency) {
        case 'DAILY':
          numberOfPayments = loanOffer.loan_term_months * 30 // Approximation
          paymentInterval = { days: 1 }
          break
        case 'WEEKLY':
          numberOfPayments = loanOffer.loan_term_months * 4 // Approximation
          paymentInterval = { weeks: 1 }
          break
        case 'BI-WEEKLY':
          numberOfPayments = loanOffer.loan_term_months * 2
          paymentInterval = { weeks: 2 }
          break
        case 'MONTHLY':
          numberOfPayments = loanOffer.loan_term_months
          paymentInterval = { months: 1 }
          break
        case 'QUARTERLY':
          numberOfPayments = loanOffer.loan_term_months / 3
          paymentInterval = { months: 3 }
          break
        case 'SEMI-ANNUALLY':
          numberOfPayments = loanOffer.loan_term_months / 6
          paymentInterval = { months: 6 }
          break
        case 'ANNUALLY':
          numberOfPayments = loanOffer.loan_term_months / 12
          paymentInterval = { months: 12 }
          break
        default:
          throw new Error(
            `Unsupported repayment frequency: ${loanOffer.repayment_frequency}`,
          )
      }

      // Recalculate interestRatePerPeriod based on the total number of payments
      const annualInterestRate =
        loanOffer.interest_rate > 1
          ? loanOffer.interest_rate / 100
          : loanOffer.interest_rate

      const interestRatePerPeriod = annualInterestRate / numberOfPayments
      const principalAmount = loanOffer.loan_amount

      // Calculate  paymentAmount
      let paymentAmount: number
      if (interestRatePerPeriod === 0) {
        paymentAmount = principalAmount / numberOfPayments
      } else {
        paymentAmount =
          (principalAmount * interestRatePerPeriod) /
          (1 - Math.pow(1 + interestRatePerPeriod, -numberOfPayments))
      }

      let runningBalance = principalAmount
      let paymentDate = now

      for (let i = 1; i <= numberOfPayments; i++) {
        const interestPayment = runningBalance * interestRatePerPeriod
        const principalPayment = paymentAmount - interestPayment

        runningBalance -= principalPayment
        paymentDate = add(paymentDate, paymentInterval)

        const repaymentSchedule = new LoanRepaymentSchedule({
          loan_id: loan.id,
          payment_number: i,
          due_date: paymentDate,
          principal_due: principalPayment,
          interest_due: interestPayment,
          total_due: paymentAmount,
          status: LoanRepaymentScheduleStatusEnum.Pending,
        })

        await loanRepaymentRepository.createLoanRepaymentSchedule(
          repaymentSchedule,
        )
      }
    })

    logger.info(
      `Loan generated successfully for condition precedent ID: ${conditionPrecedentId}`,
    )
  } catch (error) {
    logger.error(
      `Error generating loan for condition precedent ID: ${conditionPrecedentId}`,
      error,
    )
    throw error
  }
}

conditionPrecedentWorker.on('completed', (job) => {
  logger.info(
    `Loan generation completed for condition precedent job ${job.id} at ${new Date().toISOString()}`,
  )
})

conditionPrecedentWorker.on('failed', (job, err) => {
  logger.error(
    `Loan generation failed for condition precedent job ${job.id}: ${err.message}`,
  )
})

export default conditionPrecedentWorker
