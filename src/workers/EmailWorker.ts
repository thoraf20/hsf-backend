

import { Worker } from 'worker_threads';
import path from 'path';
import { ApplicationCustomError } from '../middleware/errors/customError';
import { StatusCodes } from 'http-status-codes';
import { Email } from '../domain/entities/Email';

const sendMailInWorker = (mailOptions: Email): Promise<void> => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.resolve(__dirname, 'worker.js'));

    worker.postMessage(mailOptions);

    worker.on('message', (message) => {
      if (message.status === 'success') {
        resolve();
      } else {
        reject(new Error(message.message));
        console.log(message);
      }
    });

    worker.on('error', reject);

    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(
          new ApplicationCustomError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Worker stopped with exit code ${code}`,
          ),
        );
      }
    });
  });
};

export default sendMailInWorker;