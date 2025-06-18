import redis from '@infrastructure/cache/redisClient'
import { Queue } from 'bullmq'

const loanRepaymentQueue = new Queue('loan-repayment-processing', {
  connection: redis,
})

export enum LoanRepaymentJobType {
  PROCESS_REPAYMENTS = 'processRepayments',
}

export const loanRepaymentProcessingJob = 'loan_repayment_processing_job'

export type AddProcessRepaymentsJob = {
  loanId: string
  repaymentId: string
}

export function addProcessRepaymentsJob(data: AddProcessRepaymentsJob) {
  return loanRepaymentQueue.add(LoanRepaymentJobType.PROCESS_REPAYMENTS, data)
}

export default loanRepaymentQueue
