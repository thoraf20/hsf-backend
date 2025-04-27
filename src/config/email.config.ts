import sgMail from '@sendgrid/mail'
import { Email } from '../domain/entities/Email'

const sendGridApiKey = process.env.SENDGRID_API_KEY as string
console.log(sendGridApiKey)
sgMail.setApiKey(sendGridApiKey)
console.log
export const sendMail = (options: Email) => {
  const msg = {
    to: options.to, // recipient email
    from: process.env.SENDGRID_SENDER_EMAIL as string, // verified sender email
    subject: options.subject,
    html: options.html, // HTML content
  }
  sgMail.send(msg)
}
