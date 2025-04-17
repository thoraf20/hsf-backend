import { CacheEnumKeys } from '@domain/enums/cacheEnum'
import { OtpEnum } from '@domain/enums/otpEnum'
import { PreQualifierEnum } from '@domain/enums/propertyEnum'
import { Eligibility, preQualify } from '@entities/prequalify/prequalify'
import { RedisClient } from '@infrastructure/cache/redisClient'
import { IPreQualify } from '@interfaces/IpreQualifyRepoitory'
import { ApplicationCustomError } from '@middleware/errors/customError'
import emailTemplates from '@infrastructure/email/template/constant'
import {
  generateRandomSixNumbers,
  generateReferenceNumber,
} from '@shared/utils/helpers'
import { StatusCodes } from 'http-status-codes'
import { IApplicationRespository } from '@interfaces/IApplicationRespository'

export class preQualifyService {
  private readonly prequalify: IPreQualify
  private applicationRepository: IApplicationRespository
  private readonly cache = new RedisClient()
  constructor(
    prequalify: IPreQualify,
    applicationRepository: IApplicationRespository,
  ) {
    this.prequalify = prequalify
    this.applicationRepository = applicationRepository
  }

  public async checkExistingPreQualify(loaner_id: string) {
    return await this.prequalify.findIfApplyForLoanAlready(loaner_id)
  }

  public async addEligiblity(
    input: Eligibility,
    user_id: string,
  ): Promise<Eligibility> {
    const [existingPrequalifyStatusApplied, requestedForEligiblity] =
      await Promise.all([
        this.checkExistingPreQualify(user_id),
        this.prequalify.findEligiblity(input.property_id, user_id),
      ])

    if (requestedForEligiblity) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Checking if you are eligible to purchase this property',
      )
    }

    if (existingPrequalifyStatusApplied) {
      const eligibility = await this.prequalify.addEligibility({
        prequalify_status_id: existingPrequalifyStatusApplied.status_id,
        user_id,
        property_id: input.property_id,
        financial_eligibility_type: input.type,
      })
      const application =
        await this.applicationRepository.getIfApplicationIsRecorded(
          input.property_id,
          user_id,
        )
      if (application) {
        await this.applicationRepository.updateApplication({
          property_id: input.property_id,
          eligibility_id: eligibility.eligibility_id,
          user_id,
          prequalifier_id: eligibility.prequalify_status_id,
        })
      } else {
        await this.applicationRepository.createApplication({
          application_type: input.type,
          property_id: input.property_id,
          eligibility_id: eligibility.eligibility_id,
          user_id,
          prequalifier_id: eligibility.prequalify_status_id,
        })
      }
      return eligibility
    }
  }

  public async storePreQualify(
    input: Partial<preQualify>,
    user_id: string,
  ): Promise<void | Eligibility> {
    const [duplicateEmail, checkDuplicatePhone] = await Promise.all([
      this.prequalify.checkDuplicateEmail(input.email),
      this.prequalify.checkDuplicatePhone(input.phone_number),
    ])

    if (duplicateEmail) {
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        `Email is already on our record`,
      )
    }

    if (checkDuplicatePhone) {
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        `Phone is already on our record`,
      )
    }

    const checkSucessfullPreQualifier =
      await this.prequalify.getSuccessfulPrequalifyRequestByUser(user_id)
    if (checkSucessfullPreQualifier) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'You have already applied for prequalification. Check if you are eligible to purchase a property.',
      )
    }

    const otp = generateRandomSixNumbers()
    const key = `${CacheEnumKeys.preQualify_VERIFICATION}-${otp}`
    const details = { otp, type: OtpEnum.PREQUALIFY, user_id, input }
    await this.cache.setKey(key, details, 600)
    emailTemplates.PrequalifierEmailVerification(
      input.email,
      `${input.first_name} ${input.last_name}`,
      otp.toString(),
    )
  }

  public async verification(
    input: Record<string, any>,
  ): Promise<Eligibility & preQualify> {
    const key = `${CacheEnumKeys.preQualify_VERIFICATION}-${input.otp}`
    const details = await this.cache.getKey(key)

    if (!details) {
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'Invalid or expired OTP.',
      )
    }

    const {
      user_id,
      type,
      input: cachedInput,
    } = typeof details === 'string' ? JSON.parse(details) : details

    if (type !== OtpEnum.PREQUALIFY) {
      await this.cache.deleteKey(key)
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'Invalid OTP type.',
      )
    }

    const personalInfo = await this.prequalify.storePersonaInfo({
      first_name: cachedInput.first_name,
      last_name: cachedInput.last_name,
      email: cachedInput.email,
      phone_number: cachedInput.phone_number,
      gender: cachedInput.gender,
      marital_status: cachedInput.marital_status,
      house_number: cachedInput.house_number,
      street_address: cachedInput.street_address,
      state: cachedInput.state,
      city: cachedInput.city,
      loaner_id: user_id,
    })

    let paymentCalculator: any
    if (cachedInput.type === PreQualifierEnum.INSTALLMENT) {
      paymentCalculator = await this.prequalify.storePaymentCalculator({
        house_price: cachedInput.house_price,
        interest_rate: cachedInput.interest_rate,
        terms: cachedInput.terms,
        repayment_type: cachedInput.repayment_type,
        est_money_payment: cachedInput.est_money_payment,
        personal_information_id: personalInfo.personal_information_id,
      })
    }

    const [employmentInfo, preQualifyStatus] = await Promise.all([
      this.prequalify.storeEmploymentInfo({
        employment_confirmation: cachedInput.employment_confirmation,
        employment_position: cachedInput.employment_position,
        employer_address: cachedInput.employer_address,
        employer_state: cachedInput.employer_state,
        net_income: cachedInput.net_income,
        industry_type: cachedInput.industry_type,
        employment_type: cachedInput.employment_type,
        existing_loan_obligation: cachedInput.existing_loan_obligation,
        rsa: cachedInput.industry_type,
        years_to_retirement: cachedInput.years_to_retirement,
        personal_information_id: personalInfo.personal_information_id,
        preferred_developer: cachedInput.preferred_developer,
        property_name: cachedInput.property_name,
        preferred_lender: cachedInput.preferred_lender,
      }),
      this.prequalify.storePreQualifyStatus({
        personal_information_id: personalInfo.personal_information_id,
        loaner_id: user_id,
        reference_id: generateReferenceNumber(),
        is_prequalify_requested: true,
        verification: true,
      }),
    ])
    emailTemplates.PrequalifierSuccess(
      cachedInput.email,
      `${cachedInput.first_name} ${cachedInput.last_name}`,
      preQualifyStatus.reference_id,
    )
    await this.cache.deleteKey(key)

    return {
      ...personalInfo,
      ...employmentInfo,
      ...preQualifyStatus,
      ...paymentCalculator,
    }
  }

  public async getPrequalifierByUserId(user_id: string): Promise<preQualify> {
    return await this.prequalify.getPreQualifyRequestByUser(user_id)
  }

  public async getAllPreQualifierToBeapproved(): Promise<preQualify[]> {
    return await this.prequalify.getPreQualifyRequest()
  }

  public async getAllPreQualifierById(id: string): Promise<preQualify> {
    return await this.prequalify.getPreQualifyRequestById(id)
  }
}
