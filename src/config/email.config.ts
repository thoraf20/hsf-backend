import { Email } from '@entities/Email'
import {
  TransactionalEmailsApi,
  SendSmtpEmail,
  TransactionalEmailsApiApiKeys,
} from '@getbrevo/brevo'
import { getEnv } from '@infrastructure/config/env/env.config'

const BREVO_API_KEY = getEnv('BREVO_API_KEY')
const DEFAULT_SENDER_NAME = getEnv('COMPANY_NAME') || 'Your Company'
const DEFAULT_SENDER_EMAIL = getEnv('HSF_SUPPORT_EMAIL')

console.log({ BREVO_API_KEY, DEFAULT_SENDER_EMAIL, DEFAULT_SENDER_NAME })
const emailApiInstance = new TransactionalEmailsApi()
emailApiInstance.setApiKey(TransactionalEmailsApiApiKeys.apiKey, BREVO_API_KEY)

export const sendEmail = async (payload: Email): Promise<unknown> => {
  const sendSmtpEmail = new SendSmtpEmail()

  sendSmtpEmail.subject = payload.subject
  sendSmtpEmail.htmlContent = payload.content

  sendSmtpEmail.to = payload.to
  sendSmtpEmail.sender = payload.sender ?? {
    name: DEFAULT_SENDER_NAME,
    email: DEFAULT_SENDER_EMAIL,
  }

  sendSmtpEmail.replyTo = payload.replyTo
  sendSmtpEmail.cc = payload.cc
  sendSmtpEmail.bcc = payload.bcc
  sendSmtpEmail.tags = payload.tags

  return emailApiInstance.sendTransacEmail(sendSmtpEmail)
}
