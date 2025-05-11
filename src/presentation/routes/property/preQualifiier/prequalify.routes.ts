import { preQualifyController } from '@controllers/property/preQualify/prequalify.controller'
import { PrequalifyRepository } from '@repositories/prequalify/prequalifyRepository'
import { preQualifyService } from '@use-cases/Properties/preQualify/prequalify'
import { Router } from 'express'
import {
  asyncMiddleware,
  requireRoles,
  Role,
  validateRequest,
} from '@presentation/routes/index.t'
import {
  preQualifierEligibleSchema,
  preQualifySchema,
} from '@validators/prequalifyValidation'
import { verifyOtpSchema } from '@validators/userValidator'

const preQualifierRoutes: Router = Router()

const service = new preQualifyService(new PrequalifyRepository())
const controller = new preQualifyController(service)

preQualifierRoutes.post(
  '/request',
  requireRoles(Role.HOME_BUYER),
  validateRequest(preQualifySchema),
  asyncMiddleware(async (req, res) => {
    const { user, body } = req
    const store = await controller.preQualifierController(body, user.id)
    res.status(store.statusCode).json(store)
  }),
)

preQualifierRoutes.post(
  '/verification',
  requireRoles(Role.HOME_BUYER),
  validateRequest(verifyOtpSchema),
  asyncMiddleware(async (req, res) => {
    const { body } = req
    const verified = await controller.verification(body)
    res.status(verified.statusCode).json(verified)
  }),
)

/*
public async verification(
  input: Record<string, any>, // { otp: string }
): Promise<any> { // Consider a more specific return type
  const preQualifyOtpKey = `${CacheEnumKeys.preQualify_VERIFICATION}-${input.otp}`;
  const preQualifyUpdateOtpKey = `${CacheEnumKeys.PREQUALIFY_UPDATE_VERIFICATION}-${input.otp}`; // New key for update OTPs

  let details = await this.cache.getKey(preQualifyOtpKey);
  let flowType: 'initial' | 'update' = 'initial';

  if (!details) {
    details = await this.cache.getKey(preQualifyUpdateOtpKey);
    flowType = 'update';
  }

  if (!details) {
    throw new ApplicationCustomError(
      StatusCodes.BAD_REQUEST,
      'Invalid or expired OTP.',
    );
  }

  // Clear the OTP key immediately after fetching to prevent reuse
  if (flowType === 'initial') {
    await this.cache.deleteKey(preQualifyOtpKey);
  } else {
    await this.cache.deleteKey(preQualifyUpdateOtpKey);
  }

  const {
    user_id,
    type,
    input: cachedInput, // This now contains the new/updated data
  } = typeof details === 'string' ? JSON.parse(details) : details;

  if (type !== OtpEnum.PREQUALIFY && type !== OtpEnum.PREQUALIFY_UPDATE) { // Ensure OTP type is correct
    throw new ApplicationCustomError(
      StatusCodes.BAD_REQUEST,
      'Invalid OTP type.',
    );
  }

  if (flowType === 'initial') {
    // ... (existing logic for initial prequalification submission) ...
    // Ensure is_prequalify_requested: true, verification: true
    // Send SuccessfulPrequalifier email
  } else if (flowType === 'update') {
    // Logic for updating existing prequalification
    const existingPrequalifyStatus = await this.prequalify.findIfApplyForLoanAlready(user_id);
    if (!existingPrequalifyStatus) {
      throw new ApplicationCustomError(StatusCodes.NOT_FOUND, "No existing prequalification found to update.");
    }

    // Update personal_information
    await db('prequalify_personal_information')
      .where('personal_information_id', existingPrequalifyStatus.personal_information_id)
      .update({
        first_name: cachedInput.first_name,
        last_name: cachedInput.last_name,
        email: cachedInput.email,
        // ... other personal fields ...
        updated_at: new Date(),
      });

    // Update payment_calculator (if applicable and if details provided)
    if (cachedInput.house_price) { // Check if payment calculator details are part of the update
      await db('prequalify_payment_calculator')
        .where('personal_information_id', existingPrequalifyStatus.personal_information_id)
        .update({
          house_price: cachedInput.house_price,
          // ... other calculator fields ...
          updated_at: new Date(),
        });
    }

    // Update other_info
    await db('prequalify_other_info')
      .where('personal_information_id', existingPrequalifyStatus.personal_information_id)
      .update({
        employment_confirmation: cachedInput.employment_confirmation,
        // ... other info fields ...
        updated_at: new Date(),
      });

    // Update prequalify_status
    const [updatedStatus] = await db('prequalify_status')
      .where('status_id', existingPrequalifyStatus.status_id)
      .update({
        // status: 'Pending', // If you re-introduce a general status field
        is_approved: false, // Reset approval status
        is_prequalify_requested: true, // Should already be true
        verification: true, // OTP for the update was just verified
        updated_at: new Date(),
      })
      .returning('*');

    // Notify about the update for re-review
    emailTemplates.PrequalifierSuccess( // You might want a different template for "Update Submitted"
        cachedInput.email,
        `${cachedInput.first_name} ${cachedInput.last_name}`,
        updatedStatus.reference_id,
    );
    return updatedStatus; // Or a more comprehensive object of updated details
  }
  // ... (rest of your existing logic if flowType is 'initial')
}
*/

preQualifierRoutes.get(
  '/home-buyer/single/fetch',
  requireRoles(Role.HOME_BUYER),
  asyncMiddleware(async (req, res) => {
    const { user } = req
    const prequalify = await controller.getPrequalifierByUserId(user.id)
    res.status(prequalify.statusCode).json(prequalify)
  }),
)

preQualifierRoutes.get(
  '/agents/fetch-all',
  requireRoles([Role.ADMIN, Role.SUPER_ADMIN]),
  asyncMiddleware(async (req, res) => {
    const { body } = req
    const prequalify = await controller.verification(body)
    res.status(prequalify.statusCode).json(prequalify)
  }),
)
preQualifierRoutes.get(
  '/status',
  requireRoles(Role.HOME_BUYER),
  asyncMiddleware(async (req, res) => {
    const { user } = req
    const prequalify = await controller.getPrequalifierByUserId(user.id)
    res.status(prequalify.statusCode).json(prequalify)
  }),
)

preQualifierRoutes.patch(
  '/eligible',
  requireRoles(Role.DEVELOPER),
  validateRequest(preQualifierEligibleSchema),
  asyncMiddleware(async (req, res) => {
    const { body } = req
    const eligible = await controller.updatePrequalifierEligibility(body)
    res.status(eligible.statusCode).json(eligible)
  }),
)

export default preQualifierRoutes
