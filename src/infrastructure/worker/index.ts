import logger from '@middleware/logger'
import dipWorker from './dipWorker'
import conditionPrecedentWorker from './conditionPrecedentWorker'

export async function startJobWorkers() {
  await Promise.all([
    dipWorker.run().catch((error) => {
      logger.error(`Dip worker failed to start: ${error}`)
    }),

    conditionPrecedentWorker.run().catch((error) => {
      logger.error(`Condition Precedent worker failed to start: ${error}`)
    }),
  ])
}
