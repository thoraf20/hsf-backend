import { CacheEnumKeys } from '@domain/enums/cacheEnum'
import { OtpEnum } from '@domain/enums/otpEnum'
import { preQualify } from '@entities/prequalify/prequalify'
import { RedisClient } from '@infrastructure/cache/redisClient'
import { IPreQualify } from '@interfaces/IpreQualifyRepoitory'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { PropertyRepository } from '@repositories/property/PropertyRepository'
import { generateRandomSixNumbers } from '@shared/utils/helpers'
import { PropertyBaseUtils } from '@use-cases/utils'
import { StatusCodes } from 'http-status-codes'


export class preQualifyService {
  private readonly prequalify: IPreQualify
  private readonly cache = new RedisClient()
  private readonly utilsProperty = new  PropertyBaseUtils(new PropertyRepository())
  constructor(prequalify: IPreQualify) {
    this.prequalify = prequalify
  }

  public async checkExistingPreQualify (loaner_id: string) {
    const existingPreQualify =  await this.prequalify.findIfApplyForLoanAlready(loaner_id)
    console.log(existingPreQualify)
    if(existingPreQualify) {
     throw new ApplicationCustomError(StatusCodes.CONFLICT, `You have applied already`)
    }
}
  public async storePreQualify(
    input: preQualify,
    user_id: string,
  ): Promise<preQualify> {
    console.log(user_id)
    await this.checkExistingPreQualify(user_id)
    await this.utilsProperty.findIfPropertyExist(input.property_id)
  const personalInfo = await this.prequalify.storePersonaInfo({
      first_name: input.first_name,
      last_name: input.last_name,
      email: input.email,
      phone_number: input.phone_number,
      gender: input.gender,
      marital_status: input.marital_status,
      house_number: input.house_number,
      street_address: input.street_address,
      state: input.state,
      city: input.city,
      loaner_id: user_id
  });

 const  employmentInfo = await this.prequalify.storeEmploymentInfo({
    employment_confirmation: input.employment_confirmation,
    employment_position: input.employment_position,
    employer_address: input.employer_address,
    employer_state: input.employer_state,
    years_to_retirement: input.years_to_retirement,
    personal_information_id: personalInfo.personal_information_id
})

const financialInfo =  await this.prequalify.storeFinancialInfo({
    net_income: input. net_income,
    industry_type: input.industry_type,
    employment_type: input.employment_type,
     existing_loan_obligation: input. existing_loan_obligation,
     rsa: input.industry_type,
     employment_information_id: employmentInfo.employment_information_id

})

const propertyInfo = await this.prequalify.storePropertyInfo({
    preferred_developer: input.preferred_developer,
    personal_information_id: personalInfo.personal_information_id,
    property_name: input.property_name,
     preferred_lender: input. preferred_lender,
    
})


const  preQualifyStatus = await this.prequalify.storePreQualifyStatus({
    personal_information_id: personalInfo.personal_information_id,
    property_id: input.property_id,
    loaner_id: user_id
})
const otp = generateRandomSixNumbers()
const details = {otp, type:  OtpEnum.PREQUALIFY, user_id}
console.log(otp)
const key = `${CacheEnumKeys.preQualify_VERIFICATION}-${otp}`
await this.cache .setKey(key,details, 600)

return {
       ...employmentInfo,
       ...financialInfo,
       ...personalInfo,
       ...propertyInfo,
       ...preQualifyStatus
    }
  }


  public async verification (input: Record<string, any>) :Promise<void> {
    const key = `${CacheEnumKeys.preQualify_VERIFICATION}-${input.otp}`
    console.log(key)
    const details = await this.cache.getKey(key)

    if (!details) {
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'Invalid or expired OTP.',
      )
    }

    const { user_id, type} =
      typeof details === 'string' ? JSON.parse(details) : details

    if (type !== OtpEnum.PREQUALIFY) {
      await this.cache.deleteKey(key)
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'Invalid OTP type.',
      )
    }

    await  this.prequalify.updatePrequalifyStatus(user_id, {verification: true})
    await this.cache.deleteKey(key)
  }


  
}
 