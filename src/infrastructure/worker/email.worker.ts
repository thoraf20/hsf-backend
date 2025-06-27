import { Worker } from 'bullmq'
import { sendEmail } from '@config/email.config'
import { Email } from '@entities/Email'
import redis from '@infrastructure/cache/redisClient'
import logger from '@middleware/logger'

const emailEmailWorker = new Worker(
  'email-queue',
  async (job) => {
    try {
      const emailData = job.data as Email
      await sendEmail(emailData)
      logger.info(`Email sent to ${emailData.to[0].email}`)
    } catch (err) {
      logger.error(`Failed to send email to ${job.data.to}:`, err)
      throw err // Let BullMQ retry or log the failure
    }
  },
  {
    connection: redis,
    concurrency: 5, // Adjust based on your needs
    autorun: true, // Automatically start the worker
  },
)

export default emailEmailWorker
