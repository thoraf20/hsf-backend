import logger from '@middleware/logger'
import dipWorker from './dipWorker'

export async function startJobWorkers() {
  await Promise.all([
    dipWorker.run().catch((error) => {
      logger.error(`Dip worker failed to start: ${error}`)
    }),
  ])
}
