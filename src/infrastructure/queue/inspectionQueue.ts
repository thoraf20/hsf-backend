import redis from '@infrastructure/cache/redisClient'
import { Queue } from 'bullmq'

const inspectionQueue = new Queue('inspection-creation', { connection: redis })

export enum InspectionJobType {
  VERIFY_PAYMENT = 'verifyPayment',
  SCHEDULE_INSPECTION = 'scheduleInspection',
}

export function createPendingInspectionCacheKey(inspectionId: string) {
  return `inspection:${inspectionId}:pending`
}

export type AddVerifyInspectionPaymentJob = {
  transactionId: string
  inspectionId: string
}

export function addVerifyInspectionPaymentJob(
  data: AddVerifyInspectionPaymentJob,
) {
  return inspectionQueue.add('confirmPaymentAndSchedule', data)
}

export default inspectionQueue
