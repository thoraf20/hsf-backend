import { parentPort } from 'worker_threads'
import rateLimitedSendMail from './emailLimiter'

if (parentPort) {
  parentPort.on(`message`, async (mailOptions) => {
    try {
      await rateLimitedSendMail(mailOptions)
      parentPort.postMessage({ status: 'success' })
    } catch (error) {
      parentPort.postMessage({ status: `error`, error })
    }
  })
}
