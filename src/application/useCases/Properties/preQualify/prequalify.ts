import { CacheEnumKeys } from '@domain/enums/cacheEnum'
import { OtpEnum } from '@domain/enums/otpEnum'
import { PreQualifierEnum } from '@domain/enums/propertyEnum'
import { Eligibility, preQualify } from '@entities/prequalify/prequalify'
import { RedisClient } from '@infrastructure/cache/redisClient'
import { IPreQualify } from '@interfaces/IpreQualifyRepoitory'
import { ApplicationCustomError } from '@middleware/errors/customError'
import {
  generateRandomSixNumbers,
  generateReferenceNumber,
} from '@shared/utils/helpers'
import { StatusCodes } from 'http-status-codes'

export class preQualifyService {
  private readonly prequalify: IPreQualify
  private readonly cache = new RedisClient()
  constructor(prequalify: IPreQualify) {
    this.prequalify = prequalify
  }

  public async checkExistingPreQualify(loaner_id: string) {
    return await this.prequalify.findIfApplyForLoanAlready(loaner_id);
  }
  
  public async addEligiblity(input: Eligibility, user_id: string): Promise<Eligibility> {
    const [existingPrequalifyStatusApplied, requestedForEligiblity] = await Promise.all([
      this.checkExistingPreQualify(user_id),
      this.prequalify.findEligiblity(input.property_id, user_id),
    ]);
  
    if (requestedForEligiblity) {
      throw new ApplicationCustomError(StatusCodes.CONFLICT, 'Checking if you are eligible to purchase this property');
    }
  
    if (existingPrequalifyStatusApplied) {
      return await this.prequalify.addEligibility({
        prequalify_status_id: existingPrequalifyStatusApplied.status_id,
        user_id,
        property_id: input.property_id,
        financial_eligibility_type: input.type
      });
    }
  
  }
  
  public async storePreQualify(input: Partial<preQualify>, user_id: string): Promise<preQualify | Eligibility> {

    if (input.property_id) {
      return await this.addEligiblity(input, user_id);
    }
  

    const [duplicateEmail, checkDuplicatePhone] = await Promise.all([
      this.prequalify.checkDuplicateEmail(input.email),
      this.prequalify.checkDuplicatePhone(input.phone_number),
    ]);
  
 
    if (duplicateEmail) {
      throw new ApplicationCustomError(StatusCodes.BAD_REQUEST, `Email is already on our record`);
    }
    if (checkDuplicatePhone) {
      throw new ApplicationCustomError(StatusCodes.BAD_REQUEST, `Phone is already on our record`);
    }
  

    const checkSucessfullPreQualifier = await this.prequalify.getSuccessfulPrequalifyRequestByUser(user_id);
    if (checkSucessfullPreQualifier) {
      throw new ApplicationCustomError(StatusCodes.CONFLICT, 'You have already applied for prequalification. Check if you are eligible to purchase a property.');
    }
  
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
      loaner_id: user_id,
    });
 
    let paymentCalculator: any;
    if (input.type === PreQualifierEnum.INSTALLMENT) {
      paymentCalculator = await this.prequalify.storePaymentCalculator({
        house_price: input.house_price,
        interest_rate: input.interest_rate,
        terms: input.terms,
        repayment_type: input.repayment_type,
        est_money_payment: input.est_money_payment,
        personal_information_id: personalInfo.personal_information_id,
      });
    }
  
  
    const [employmentInfo, preQualifyStatus] = await Promise.all([
      this.prequalify.storeEmploymentInfo({
        employment_confirmation: input.employment_confirmation,
        employment_position: input.employment_position,
        employer_address: input.employer_address,
        employer_state: input.employer_state,
        net_income: input.net_income,
        industry_type: input.industry_type,
        employment_type: input.employment_type,
        existing_loan_obligation: input.existing_loan_obligation,
        rsa: input.industry_type,
        years_to_retirement: input.years_to_retirement,
        personal_information_id: personalInfo.personal_information_id,
        preferred_developer: input.preferred_developer,
        property_name: input.property_name,
        preferred_lender: input.preferred_lender,
      }),
      this.prequalify.storePreQualifyStatus({
        personal_information_id: personalInfo.personal_information_id,
        loaner_id: user_id,
        reference_id: generateReferenceNumber(),
        is_prequalify_requested: true
      }),
    ]);
  

    const otp = generateRandomSixNumbers();
    const details = { otp, type: OtpEnum.PREQUALIFY, user_id };
    const key = `${CacheEnumKeys.preQualify_VERIFICATION}-${otp}`;
    await this.cache.setKey(key, details, 600); 

    return {
      ...personalInfo,
      ...employmentInfo,
      ...preQualifyStatus,
      ...paymentCalculator,
    };
  }
  

  public async verification(input: Record<string, any>): Promise<void> {
    const key = `${CacheEnumKeys.preQualify_VERIFICATION}-${input.otp}`
    console.log(key)
    const details = await this.cache.getKey(key)

    if (!details) {
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'Invalid or expired OTP.',
      )
    }

    const { user_id, type } =
      typeof details === 'string' ? JSON.parse(details) : details

    if (type !== OtpEnum.PREQUALIFY) {
      await this.cache.deleteKey(key)
      throw new ApplicationCustomError(
        StatusCodes.BAD_REQUEST,
        'Invalid OTP type.',
      )
    }

    await this.prequalify.updatePrequalifyStatus(user_id, {
      verification: true,
    })
    await this.cache.deleteKey(key)
  }

  public async getPrequalifierByUserId(user_id: string): Promise<preQualify[]> {
    return await this.prequalify.getPreQualifyRequestByUser(user_id)
  }

  public async getAllPreQualifierToBeapproved(): Promise<preQualify[]> {
    return await this.prequalify.getPreQualifyRequest()
  }

  public async getAllPreQualifierById(id: string): Promise<preQualify> {
    return await this.prequalify.getPreQualifyRequestById(id)
  }
}
