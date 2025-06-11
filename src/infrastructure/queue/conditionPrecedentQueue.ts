import redis from '@infrastructure/cache/redisClient'
import { Queue } from 'bullmq'

const conditionPrecedentQueue = new Queue(
  'condition-precedent-loan-generation',
  { connection: redis },
)

export const conditionPrecedentLoanGenerationJob =
  'condition_precedent_loan_generation_job'

export enum ConditionPrecedentJobType {
  GENERATE_LOAN = 'generateLoan',
}

export type AddGenerateLoanJob = {
  conditionPrecedentId: string
}

export function addGenerateLoanJob(data: AddGenerateLoanJob) {
  return conditionPrecedentQueue.add(
    ConditionPrecedentJobType.GENERATE_LOAN,
    data,
  )
}

export default conditionPrecedentQueue
