import { Worker } from 'bullmq';
import { sendMail } from '@config/email.config';
import { Email } from '@entities/Email';
import redis from '@infrastructure/cache/redisClient';

const emailEmailWorker = new Worker(
  'email-queue',
  async (job) => {
    const emailData = job.data as Email;
    await sendMail(emailData);
  },
  {
    connection: redis,
    concurrency: 5,
  },
);

export default emailEmailWorker