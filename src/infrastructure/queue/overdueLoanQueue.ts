import redis from '@infrastructure/cache/redisClient'
import { Queue } from 'bullmq'

const overdueLoanQueue = new Queue('overdue-loan-processing', {
  connection: redis,
})

export enum OverdueLoanJobType {
  PROCESS_OVERDUE_LOANS = 'processOverdueLoans',
}

export const overdueLoanProcessingJob = 'overdue_loan_processing_job'

export type AddProcessOverdueLoansJob = {
  loanId: string
}

export function addProcessOverdueLoansJob(data: AddProcessOverdueLoansJob) {
  return overdueLoanQueue.add(OverdueLoanJobType.PROCESS_OVERDUE_LOANS, data)
}

export default overdueLoanQueue
