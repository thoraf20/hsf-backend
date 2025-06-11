import logger from '@middleware/logger'
import dipWorker from './dipWorker'
import conditionPrecedentWorker from './conditionPrecedentWorker'
import loanRepaymentWorker from './loanRepaymentWorker'

export async function startJobWorkers() {
  await Promise.all([
    dipWorker.run().catch((error) => {
      logger.error(`Dip worker failed to start: ${error}`)
    }),

    conditionPrecedentWorker.run().catch((error) => {
      logger.error(`Condition Precedent worker failed to start: ${error}`)
    }),

    loanRepaymentWorker.run().catch((error) => {
      logger.error(`Loan Repayment worker failed to start: ${error}`)
    }),
  ])
}
