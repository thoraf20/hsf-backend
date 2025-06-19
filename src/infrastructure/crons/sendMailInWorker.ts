import { Email } from "@entities/Email";
import { emailQueue } from "@infrastructure/queue/emailQueue";

export const enqueueEmailJob = async (mailOptions: Email) => {
 await emailQueue.add('send-email', mailOptions, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: true,
  removeOnFail: true,
});

};

console.log('Worker for email sender running...')