import sendMailInWorker from '@workers/EmailWorker'
import templates from './template'
import { ApplicationCustomError } from '@middleware/errors/customError'
import logger from '@middleware/logger'
import { StatusCodes } from 'http-status-codes'

// Helper function to make placeholder replacement more robust
// (Handles cases where a placeholder might not be in the string)
const safeReplace = (
  str: string,
  placeholder: string,
  value: string | undefined,
) => {
  if (value === undefined) {
    logger.warn(
      `Placeholder ${placeholder} was not provided a value for replacement.`,
    )
    return str // Or return str.replace(placeholder, '') to remove it
  }
  return str.replace(
    new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
    value,
  )
}

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

  /**
   * Sends an MFA (Multi-Factor Authentication) OTP email.
   */
  sendMfaOtpEmail(email: string, otp: string, supportLinkUrl: string) {
    const subject = `Your MFA Verification Code`
    const text = `Use this code to complete your login or action.`
    let html = templates.mfaVerification // Reusing VerificationEmail template for OTPs
    html = safeReplace(html, `{{otp}}`, otp)
    html = safeReplace(html, `{{SUPPORT_LINK}}`, supportLinkUrl)

    try {
      const emailData = { to: email, subject, text, html }
      sendMailInWorker(emailData)
      logger.info(`MFA OTP email was sent successfully to ${email}`)
    } catch (error) {
      logger.error(
        `Unable to send MFA OTP email to ${email}: ${(error as Error).message}`,
      )
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
  sendScheduleInspectionEmail(
    email: string,
    full_name: string,
    inspection_date: string,
    inspection_time: string,
    inspection_meeting_type: string,
    meeting_platform: string,
    meet_link?: string,
  ) {
    let subject = `Inspection`
    let text = `Your Inspection request has been sent successfully`
    let html = templates.InspectionForVideoCallEmail.replace(
      `{{full_name}}`,
      full_name,
    )
      .replace(`{{inspection_date}}`, inspection_date)
      .replace(`{{inspection_time}}`, inspection_time)
      .replace(`{{inspection_meeting_type}}`, inspection_meeting_type)
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

  sendScheduleInspectionInpersonEmail(
    email: string,
    full_name: string,
    inspection_date: string,
    inspection_time: string,
    inspection_meeting_type: string,
  ) {
    let subject = `Inspection`
    let text = `Your Inspection request has been sent successfully`
    let html = templates.InspectionForInpersonCallEmail.replace(
      `{{full_name}}`,
      full_name,
    )
      .replace(`{{inspection_date}}`, inspection_date)
      .replace(`{{inspection_time}}`, inspection_time)
      .replace(`{{inspection_meeting_type}}`, inspection_meeting_type)

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
    let html = templates.prequalifierVerificationCode
      .replace(`{{otp}}`, otp)
      .replace(`{{Date}}`, new Date().toUTCString())
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
    let html = templates.SuccessfulPrequalifier.replace(
      `{{reference_id}}`,
      reference_id,
    )
      .replace(`{{Date}}`, new Date().toUTCString())
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

  sharePropertyEmail(
    recipient_email: string,
    sender_email: string,
    message: string,
    shareable_link: string,
    input: Record<string, any>,
  ) {
    let subject = `Shared Property`
    let text = `Property was shared to you`
    const imageHtml = Array.isArray(input.property_images)
      ? input.property_images
          .map(
            (url: string) =>
              `<img src="${url}" alt="Property Image" class="property-image" />`,
          )
          .join('')
      : input.property_image
        ? `<img src="${input.property_image}" alt="Property Image" class="property-image" />`
        : `<p>No images provided</p>`

    let html = templates.sharePropertyTemplate
      .replace(/{{sender_email}}/g, sender_email)
      .replace(`{{property_images}}`, imageHtml)
      .replace(`{{property_name}}`, input.property_name)
      .replace(`{{street_address}}`, input.street_address)
      .replace(`{{city}}`, input.city)
      .replace(`{{state}}`, input.state)
      .replace(`{{property_price}}`, input.property_price)
      .replace(`{{property_type}}`, input.property_type)
      .replace(`{{postal_code}}`, input.postal_code)
      .replace(`{{property_size}}`, input.property_size)
      .replace(`{{numbers_of_bedroom}}`, input.numbers_of_bedroom.toString())
      .replace(`{{numbers_of_bathroom}}`, input.numbers_of_bathroom.toString())
      .replace(`{{message}}`, message)
      .replace(`{{property_link}}`, shareable_link)
    try {
      const emailData = { to: recipient_email, subject, text, html }
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

  InvitationEmail(
    email: string,
    fullname: string,
    activationLink: string,
    role: string,
    defaultPassword: string,
  ) {
    let subject = `Invitation email`
    let text = `Accept invitation`
    let html = templates.InvitationEmail.replace('{{fullname}}', fullname)
      .replace('{{role}}', role)
      .replace('{{defaultPassword}}', defaultPassword)
      .replace('{{activationLink}}', activationLink)
      .replace('{{year}}', new Date().getFullYear().toString())

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

  rescheduleInspection(
    client_email: string,
    client_name: string,
    day: string,
    start_time: string,
    end_time: string,
    company_name: string,
  ) {
    let subject = `Rescheduling Inspection`
    let text = `Inspection Reschedule`
    let html = templates.InvitationEmail.replace('{{name}}', client_name)
      .replace('{{day}}', day)
      .replace('{{start_time}}', start_time)
      .replace('{{client_name}}', client_name)
      .replace('{{end_time}}', end_time)
      .replace('{{company_name}}', company_name)

    try {
      const emailData = { to: client_email, subject, text, html }
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

  inspectionRescheduleConfirmation(
    organization_email: string,
    organization_name: string,
    client_name: string,
    date_time: string,
    address: string,
  ) {
    let subject = `Confirmation email`
    let text = `Inspection Confirmation`
    let html = templates.inspectionRescheduleConfirmation
      .replace('{{organization_name}}', organization_name)
      .replace('{{client_name}}', client_name)
      .replace('{{date_time}}', date_time)
      .replace('{{address}}', address)
      .replace('{{client_name}}', client_name)
      .replace('{{organization_name}}', organization_name)
      .replace('{{year}}', new Date().getFullYear().toString())

    try {
      const emailData = { to: organization_email, subject, text, html }
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
  inspectionRescheduleCancellation(
    organization_email: string,
    organization_name: string,
    client_name: string,
    date_time: string,
    address: string,
  ) {
    let subject = `Cancellation email`
    let text = `Inspection Cancellation`
    let html = templates.inspectionRescheduleCancellation
      .replace('{{organization_name}}', organization_name)
      .replace('{{client_name}}', client_name)
      .replace('{{date_time}}', date_time)
      .replace('{{address}}', address)
      .replace('{{organization_name}}', organization_name)
      .replace('{{organization_name}}', organization_name)
      .replace('{{year}}', new Date().getFullYear().toString())

    try {
      const emailData = { to: organization_email, subject, text, html }
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

  passwordResetForOrganization(
    email: string,
    fullname: string,
    default_password: string,
    url: string,
    organization_name: string,
  ) {
    let subject = `Password Reset`
    let text = `Reset your password`
    let html = templates.resetPasswordForOrganization
      .replace('{{full_name}}', fullname)
      .replace('{{default_password}}', default_password)
      .replace('{{url}}', url)
      .replace('{{year}}', new Date().getFullYear().toString())
      .replace('{{organization_name}}', organization_name)

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

  disableOrgMember2faEmail(
    email: string,
    fullname: string,
    organization_name: string,
  ) {
    let subject = `2FA Disabled`
    let text = `2FA has been disabled for your account`
    let html = templates.disable2faEmailByOrg
      .replace(/{{full_name}}/g, fullname)
      .replace(/{{organization_name}}/g, organization_name)
      .replace(/{{year}}/g, new Date().getFullYear().toString())

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

  recoveryCodeNotificationEmail(email: string, userName: string) {
    let subject = `Recovery Code Used`
    let text = `Notification that your recovery code was used`
    let html = templates.recoveryCodeNotification.replace(
      `{{userName}}`,
      userName,
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

  sendOrganizationSuspendedEmail(email: string, organizationName: string) {
    let subject = `Organization Suspended`
    let text = `Your organization has been suspended`
    let html = templates.organizationSuspended.replace(
      `{{organizationName}}`,
      organizationName,
    )

    try {
      const emailData = { to: email, subject, text, html }
      sendMailInWorker(emailData)
      logger.info(
        `Organization suspended email was sent successfully to ${email}`,
      )
    } catch (error) {
      logger.error(
        `Unable to send organization suspended email to ${email}: ${error.message}`,
      )
      throw new ApplicationCustomError(
        StatusCodes.GATEWAY_TIMEOUT,
        `Unable to send email`,
      )
    }
  },

  sendOrganizationDeletedEmail(email: string, organizationName: string) {
    let subject = `Organization Deleted`
    let text = `Your organization has been deleted`
    let html = templates.organizationDeleted.replace(
      `{{organizationName}}`,
      organizationName,
    )

    try {
      const emailData = { to: email, subject, text, html }
      sendMailInWorker(emailData)
      logger.info(
        `Organization deleted email was sent successfully to ${email}`,
      )
    } catch (error) {
      logger.error(
        `Unable to send organization deleted email to ${email}: ${error.message}`,
      )
      throw new ApplicationCustomError(
        StatusCodes.GATEWAY_TIMEOUT,
        `Unable to send email`,
      )
    }
  },
  sendOrganizationActivatedEmail(email: string, organizationName: string) {
    let subject = `Organization Activated`
    let text = `Your organization has been activated`
    let html = templates.organizationActivated.replace(
      `{{organizationName}}`,
      organizationName,
    )

    try {
      const emailData = { to: email, subject, text, html }
      sendMailInWorker(emailData)
      logger.info(
        `Organization activated email was sent successfully to ${email}`,
      )
    } catch (error) {
      logger.error(
        `Unable to send organization activated email to ${email}: ${error.message}`,
      )
      throw new ApplicationCustomError(
        StatusCodes.GATEWAY_TIMEOUT,
        `Unable to send email`,
      )
    }
  },
}
