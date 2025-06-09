import { CacheEnumKeys } from '@domain/enums/cacheEnum'
import { OtpEnum } from '@domain/enums/otpEnum'
import { Eligibility, preQualify } from '@entities/prequalify/prequalify'
import { RedisClient } from '@infrastructure/cache/redisClient'
import { IPreQualify } from '@interfaces/IpreQualifyRepoitory'
import { ApplicationCustomError } from '@middleware/errors/customError'
import emailTemplates from '@infrastructure/email/template/constant'
import { generateRandomSixNumbers } from '@shared/utils/helpers'
import { StatusCodes } from 'http-status-codes'
import {
  PreQualifierEligibleInput,
  PreQualifierStatusQuery,
  PreQualifyFilters,
  PreQualifyRequestInput,
} from '@validators/prequalifyValidation'
import { PrequalificationInput } from '@entities/PrequalificationInput'
import { IPropertyRepository } from '@interfaces/IPropertyRepository'
import { EligibilityStatus } from '@domain/enums/prequalifyEnum'
import { ILenderRepository } from '@interfaces/ILenderRepository'
import { IUserRepository } from '@interfaces/IUserRepository'
import { IOrganizationRepository } from '@interfaces/IOrganizationRepository'
import { IDeveloperRepository } from '@interfaces/IDeveloperRespository'
import { getDeveloperClientView } from '@entities/Developer'
import { getUserClientView } from '@entities/User'
import { IMortageRespository } from '@interfaces/IMortageRespository'
import { IApplicationRespository } from '@interfaces/IApplicationRespository'
import {
  ApplicationPurchaseType,
  DipDocumentReviewStatus,
  DIPStatus,
} from '@domain/enums/propertyEnum'
import { runWithTransaction } from '@infrastructure/database/knex'
import {
  InstallmentApplicationStage,
  MortgageApplicationStage,
} from '@entities/Application'

export class preQualifyService {
  private readonly prequalify: IPreQualify
  private readonly cache = new RedisClient()
  constructor(
    prequalify: IPreQualify,
    private readonly propertyRepository: IPropertyRepository,
    private readonly lenderRepository: ILenderRepository,
    private readonly userRepository: IUserRepository,
    private readonly organizationRepository: IOrganizationRepository,
    private readonly developerRepository: IDeveloperRepository,
    private readonly mortgageRepository: IMortageRespository,
    private readonly applicationRepository: IApplicationRespository,
  ) {
    this.prequalify = prequalify
  }

  public async checkExistingPreQualify(loaner_id: string) {
    return await this.prequalify.findIfApplyForLoanAlready(loaner_id)
  }

  public async storePreQualify(input: PreQualifyRequestInput, user_id: string) {
    if (input.eligibility?.property_id) {
      const checkSucessfullPreQualifier = await this.prequalify.findEligiblity(
        input.eligibility?.property_id,
        user_id,
      )
      if (
        checkSucessfullPreQualifier?.eligiblity_status ===
        EligibilityStatus.APPROVED
      ) {
        throw new ApplicationCustomError(
          StatusCodes.CONFLICT,
          'You have already applied for prequalification. Check if you are eligible to purchase a property.',
        )
      }
    }

    const otp = generateRandomSixNumbers()
    const key = `${CacheEnumKeys.preQualify_VERIFICATION}-${user_id}`
    const identifierKey = `${CacheEnumKeys.preQualify_VERIFICATION}-${otp}`
    await this.cache.setKey(identifierKey, user_id, 600)

    const details = { otp, type: OtpEnum.PREQUALIFY, user_id, input }
    await this.cache.setKey(key, details, 600)
    emailTemplates.PrequalifierEmailVerification(
      input.email,
      `${input.first_name} ${input.last_name}`,
      otp.toString(),
    )
  }

  public async verification(input: Record<string, any>) {
    const key = `${CacheEnumKeys.preQualify_VERIFICATION}-${input.otp}`

    const identifierKey = await this.cache.getKey(key)

    if (!identifierKey) {
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'Invalid or expired OTP.',
      )
    }

    const dataKey = `${CacheEnumKeys.preQualify_VERIFICATION}-${identifierKey}`
    const details: {
      otp: string
      type: OtpEnum.PREQUALIFY
      user_id: string
      input: PreQualifyRequestInput
    } | null = await this.cache.getKey(dataKey)
    if (!details) {
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'Invalid or expired session',
      )
    }

    const { user_id, otp } = details

    if (!(String(otp) === String(input.otp) && user_id === identifierKey)) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Invalid or expired OTP',
      )
    }

    const { eligibility, ...preQualifierInput } = details.input

    const prequalifyInput = await this.prequalify.storePreQualificationInput({
      ...preQualifierInput,
      user_id,
    } as PrequalificationInput)

    console.log({ prequalifyInput })
    if (eligibility && prequalifyInput) {
      const property = await this.propertyRepository.getPropertyById(
        eligibility.property_id,
      )

      if (!property) {
        throw new ApplicationCustomError(
          StatusCodes.NOT_FOUND,
          'Property not found',
        )
      }

      if (property.is_sold) {
        throw new ApplicationCustomError(
          StatusCodes.NOT_FOUND,
          'Prequalification eligible not allowed on this property',
        )
      }

      const preQualifyEligibility = await this.prequalify.findEligiblity(
        eligibility.property_id,
        user_id,
      )

      if (
        !(
          preQualifyEligibility &&
          preQualifyEligibility.prequalifier_input_id === prequalifyInput.id
        )
      ) {
        const lender = await this.lenderRepository.getLenderByOrgId(
          eligibility.lender_id,
        )
        await this.prequalify.addEligibility({
          organization_id: property.organization_id,
          eligiblity_status: EligibilityStatus.PENDING,
          lender_id: lender.id,
          property_id: property.id,
          rsa: '',
          user_id,
          prequalifier_input_id: prequalifyInput.id,
        })
      }
    }

    return prequalifyInput
  }

  public async getAllPrequalifiers(filters: PreQualifyFilters) {
    const preQualifierContents =
      await this.prequalify.getAllPreQualifiers(filters)

    preQualifierContents.result = await Promise.all(
      preQualifierContents.result.map(async (preQualifier) => {
        const property = await this.propertyRepository.getPropertyById(
          preQualifier.property_id,
        )

        const organization =
          await this.organizationRepository.getOrganizationById(
            property.organization_id,
          )

        const developer = await this.developerRepository.getDeveloperByOrgId(
          property.organization_id,
        )

        const requestedBy = await this.userRepository.findById(
          preQualifier.user_id,
        )

        return {
          ...preQualifier,
          requested_by: getUserClientView(requestedBy),
          property: {
            ...property,
            organization,
            developer: getDeveloperClientView(developer),
          },
        }
      }),
    )

    return preQualifierContents
  }

  public async getPrequalifierByUserId(
    user_id: string,
    query: PreQualifierStatusQuery,
  ): Promise<PrequalificationInput> {
    return await this.prequalify.getPreQualifyRequestByUser(user_id, query)
  }

  public async getAllPreQualifierToBeapproved(): Promise<preQualify[]> {
    return await this.prequalify.getPreQualifyRequest()
  }

  public async getPreQualifyRequestById(id: string) {
    const preQualifier = await this.prequalify.getPreQualifyRequestById(id)

    if (!preQualifier) {
      return null
    }

    const property = await this.propertyRepository.getPropertyById(
      preQualifier.property_id,
    )

    const organization = await this.organizationRepository.getOrganizationById(
      property.organization_id,
    )

    const developer = await this.developerRepository.getDeveloperByOrgId(
      property.organization_id,
    )

    const requestedBy = await this.userRepository.findById(preQualifier.user_id)

    return {
      ...preQualifier,
      requested_by: getUserClientView(requestedBy),
      property: {
        ...property,
        organization,
        developer: getDeveloperClientView(developer),
      },
    }
  }

  public async updatePrequalifierEligibility(
    input: PreQualifierEligibleInput,
  ): Promise<Eligibility> {
    let eligibility = await this.prequalify.findEligiblityById(
      input.eligibility_id,
    )

    if (!eligibility) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'PreQualification not found',
      )
    }

    if (
      eligibility.eligiblity_status === EligibilityStatus.APPROVED &&
      input.is_eligible
    ) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'PreQualification eligible approved already',
      )
    }

    return runWithTransaction(async () => {
      eligibility = await this.prequalify.updateEligibility(input)
      const application = await this.applicationRepository.getByUniqueID({
        eligibility_id: eligibility.eligibility_id,
      })

      if (
        application &&
        eligibility.eligiblity_status === EligibilityStatus.APPROVED
      ) {
        await this.mortgageRepository.initiate({
          application_id: application.application_id,
          eligibility_id: eligibility.eligibility_id,
          property_id: application.property_id,
          user_id: application.user_id,
          dip_status: DIPStatus.AwaitingLenderAction,
          documents_status: DipDocumentReviewStatus.NotUploaded,
        })

        const preQualifierStage = application.stages.find(
          (stage) =>
            stage.stage === InstallmentApplicationStage.PreQualification ||
            stage.stage === MortgageApplicationStage.PreQualification,
        )

        if (preQualifierStage) {
          await this.applicationRepository.updateApplicationStage(
            preQualifierStage.id,
            { exit_time: new Date() },
          )
        }

        await this.applicationRepository.addApplicationStage(
          application.application_id,
          {
            application_id: application.application_id,
            entry_time: new Date(),
            user_id: application.user_id,
            stage:
              application.application_type ===
              ApplicationPurchaseType.INSTALLMENT
                ? InstallmentApplicationStage.OfferLetter
                : MortgageApplicationStage.DecisionInPrinciple,
          },
        )
      }

      return eligibility
    })
  }
}
