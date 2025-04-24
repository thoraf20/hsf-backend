

import { Worker } from 'worker_threads';
import path from 'path';
import { ApplicationCustomError } from '../middleware/errors/customError';
import { StatusCodes } from 'http-status-codes';
import { Email } from '../domain/entities/Email';

const useScript = process.env.SCRIPT_TYPE || 'ts';
let workerScript: any
if (useScript === 'js') {
  workerScript = path.resolve(__dirname, 'worker.js');
} else if (useScript === 'ts') {
  workerScript = path.resolve(__dirname, 'worker.ts');
}
const sendMailInWorker = (mailOptions: Email): Promise<void> => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerScript);

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