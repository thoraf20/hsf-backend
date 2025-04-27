import {
  Eligibility,
  employmentInformation,
  payment_calculator,
  personalinformation,
  preQualify,
  prequalifyStatus,
} from '@entities/prequalify/prequalify'
import { User } from '@entities/User'
import { PreQualifierEligibleInput } from '@validators/prequalifyValidation'

export interface IPreQualify {
  storePersonaInfo(input: personalinformation): Promise<personalinformation>
  storeEmploymentInfo(
    input: employmentInformation,
  ): Promise<employmentInformation>
  storePreQualifyStatus(input: prequalifyStatus): Promise<prequalifyStatus>
  storePaymentCalculator(input: payment_calculator): Promise<payment_calculator>
  findIfApplyForLoanAlready(loaner_id: string): Promise<any>
  updatePrequalifyStatus(
    loaner_id: string,
    input: Partial<preQualify>,
  ): Promise<void>
  getPreQualifyRequestByUser(user_id: string): Promise<preQualify>
  getPreQualifyRequest(): Promise<preQualify[]>
  getPreQualifyRequestById(id: string): Promise<preQualify>
  getSuccessfulPrequalifyRequestByUser(user_id: string): Promise<preQualify>
  addEligibility(input: Eligibility): Promise<Eligibility>
  findEligiblity(property_id: string, user_id: string): Promise<Eligibility>
  updateEligibility(input: PreQualifierEligibleInput): Promise<Eligibility>
  IsHomeBuyerEligible(
    property_id: string,
    user_id: string,
  ): Promise<Eligibility>
  checkDuplicateEmail(identifier: string): Promise<User>
  checkDuplicatePhone(identifier: string): Promise<User>
}
