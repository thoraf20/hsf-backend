import pLimit from 'p-limit';
import {sendMail} from '../config/email.config';
import { Email } from '../domain/entities/Email';

const limit = pLimit(5);

const rateLimitedSendMail = async (options: Email) => {
  return limit(() => sendMail(options));
};
export default rateLimitedSendMail;
