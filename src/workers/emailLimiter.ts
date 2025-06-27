import pLimit from 'p-limit'
import { Email } from '../domain/entities/Email'
import { sendEmail } from '@config/email.config'

const limit = pLimit(5)

const rateLimitedSendMail = async (options: Email) => {
  return limit(() => sendEmail(options))
}
export default rateLimitedSendMail
