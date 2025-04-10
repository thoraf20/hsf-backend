import sendMailInWorker from '@workers/EmailWorker'
import templates from './template'
import { ApplicationCustomError } from '@middleware/errors/customError'
import logger from '@middleware/logger'
import { StatusCodes } from 'http-status-codes'
export default {
  emailVerificationEmail(email: string, otp: string) {
    let subject = `Email verification`
    let text = `Verify you account`
    let html = templates.VerificationEmail.replace(`{{otp}}`, otp).replace(
      `{{Date}}`,
      new Date().toUTCString(),
    )

    try {
      const emailData = { to: email, subject, text, html }
      sendMailInWorker(emailData)
      logger.info(`Email was sent successfully`)
    } catch (error) {
      // Log only the error message to avoid circular structure issues
      logger.error(`Unable to send email: ${error.message}`)
      throw new ApplicationCustomError(
        StatusCodes.GATEWAY_TIMEOUT,
        `Unable to send email`,
      )
    }
  },

  welcomeEmail(email: string, fullname: string) {
    let subject = `Welcome Email`
    let text = `Welcome to hrf`
    let html = templates.welcomeEmail.replace(`{{NAME}}`, fullname)

    try {
      const emailData = { to: email, subject, text, html }
      sendMailInWorker(emailData)
      logger.info(`Email was sent successfully`)
    } catch (error) {
      // Log only the error message to avoid circular structure issues
      logger.error(`Unable to send email: ${error.message}`)
      throw new ApplicationCustomError(
        StatusCodes.GATEWAY_TIMEOUT,
        `Unable to send email`,
      )
    }
  },

  ResetVerificationEmail(email: string, otp: string) {
    let subject = `Reset Password Email`
    let text = `Verify you account`
    let html = templates.ResetPassword.replace(`{{otp}}`, otp).replace(
      `{{Date}}`,
      new Date().toUTCString(), 
    )

    try {
      const emailData = { to: email, subject, text, html }
      sendMailInWorker(emailData)
      logger.info(`Email was sent successfully`)
    } catch (error) {
      // Log only the error message to avoid circular structure issues
      logger.error(`Unable to send email: ${error.message}`)
      throw new ApplicationCustomError(
        StatusCodes.GATEWAY_TIMEOUT,
        `Unable to send email`,
      )
    }
  },
  changeEmail(email: string, link: string) {
    let subject = `Email Change Request`
    let text = `Verification to change email`
    let html = templates.emailChange.replace(`{{verificationLink}}`, link)

    try {
      const emailData = { to: email, subject, text, html }
      sendMailInWorker(emailData)
      logger.info(`Email was sent successfully`)
    } catch (error) {
      // Log only the error message to avoid circular structure issues
      logger.error(`Unable to send email: ${error.message}`)
      throw new ApplicationCustomError(
        StatusCodes.GATEWAY_TIMEOUT,
        `Unable to send email`,
      )
    }
  },
}
