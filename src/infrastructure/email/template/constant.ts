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
      logger.error(`Unable to send email: ${error.message}`)
      throw new ApplicationCustomError(
        StatusCodes.GATEWAY_TIMEOUT,
        `Unable to send email`,
      )
    }
  },
  sendScheduleInspectionEmail(email:  string, full_name: string, inspection_date: string, inspection_time: string, inspection_meeting_type: string, meeting_platform: string, meet_link?: string) {
    let subject = `Inspection`
    let text = `Your Inspection request has been sent successfully`
    let html = templates.InspectionForVideoCallEmail.replace(`{{full_name}}`, full_name)
    .replace(`{{inspection_date}}`, inspection_date)
    .replace(`{{inspection_time}}`, inspection_time)
    .replace(`{{inspection_meeting_type}}`,inspection_meeting_type)
    .replace(`{{meeting_platform}}`, meeting_platform)
    .replace(`{{meet_link}}`, meet_link)

    try {
      const emailData = { to: email, subject, text, html }
      sendMailInWorker(emailData)
      logger.info(`Email was sent successfully`)
    } catch (error) {
      logger.error(`Unable to send email: ${error.message}`)
      throw new ApplicationCustomError(
        StatusCodes.GATEWAY_TIMEOUT,
        `Unable to send email`,
      )
    }
  },

  sendScheduleInspectionInpersonEmail(email:  string, full_name: string, inspection_date: string, inspection_time: string, inspection_meeting_type: string) {
    let subject = `Inspection`
    let text = `Your Inspection request has been sent successfully`
    let html = templates.InspectionForInpersonCallEmail.replace(`{{full_name}}`, full_name)
    .replace(`{{inspection_date}}`, inspection_date)
    .replace(`{{inspection_time}}`, inspection_time)
    .replace(`{{inspection_meeting_type}}`,inspection_meeting_type)

    try {
      const emailData = { to: email, subject, text, html }
      sendMailInWorker(emailData)
      logger.info(`Email was sent successfully`)
    } catch (error) {
      logger.error(`Unable to send email: ${error.message}`)
      throw new ApplicationCustomError(
        StatusCodes.GATEWAY_TIMEOUT,
        `Unable to send email`,
      )
    }
  },

  PrequalifierEmailVerification(email: string, full_name: string, otp: string) {
    let subject = `Prequalifier Request`
    let text = `Verify your email`
    let html = templates.prequalifierVerificationCode.replace(`{{otp}}`, otp)
    .replace(
      `{{Date}}`,
      new Date().toUTCString()
    
    )
    .replace(`{{full_name}}`, full_name)
    try {
      const emailData = { to: email, subject, text, html }
      sendMailInWorker(emailData)
      logger.info(`Email was sent successfully`)
    } catch (error) {
      logger.error(`Unable to send email: ${error.message}`)
      throw new ApplicationCustomError(
        StatusCodes.GATEWAY_TIMEOUT,
        `Unable to send email`,
      )
    }
  },

  PrequalifierSuccess(email: string, name: string, reference_id: string) {
    let subject = `Prequalifier Submitted`
    let text = `Prequalifier submitted successfully`
    let html = templates.SuccessfulPrequalifier.replace(`{{reference_id}}`, reference_id).replace(
      `{{Date}}`,
      new Date().toUTCString()
    )
    .replace(`{{name}}`, name)
    try {
      const emailData = { to: email, subject, text, html }
      sendMailInWorker(emailData)
      logger.info(`Email was sent successfully`)
    } catch (error) {
      logger.error(`Unable to send email: ${error.message}`)
      throw new ApplicationCustomError(
        StatusCodes.GATEWAY_TIMEOUT,
        `Unable to send email`,
      )
    }
  },
}
