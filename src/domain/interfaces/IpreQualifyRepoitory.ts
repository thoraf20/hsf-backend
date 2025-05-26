import { PrequalificationInput } from '@entities/PrequalificationInput'
import {
  Eligibility,
  employmentInformation,
  payment_calculator,
  personalinformation,
  preQualify,
} from '@entities/prequalify/prequalify'
import { User } from '@entities/User'
import { SeekPaginationResult } from '@shared/types/paginate'
import {
  PreQualifierEligibleInput,
  PreQualifierStatusQuery,
  PreQualifyFilters,
} from '@validators/prequalifyValidation'

export interface IPreQualify {
  storePersonaInfo(input: personalinformation): Promise<personalinformation>

  storePreQualificationInput(
    input: PrequalificationInput,
  ): Promise<PrequalificationInput>

  storeEmploymentInfo(
    input: employmentInformation,
  ): Promise<employmentInformation>
  storePaymentCalculator(input: payment_calculator): Promise<payment_calculator>
  findIfApplyForLoanAlready(loaner_id: string): Promise<any>

  findApprovedMortgageEligibilitiesWithoutDip(): Promise<Eligibility[]>
  updatePrequalifyStatus(
    loaner_id: string,
    input: Partial<preQualify>,
  ): Promise<void>
  getPreQualifyRequestByUser(
    user_id: string,
    query: PreQualifierStatusQuery,
  ): Promise<PrequalificationInput>
  getPreQualifyRequest(): Promise<preQualify[]>
  getAllPreQualifiers(
    filters: PreQualifyFilters,
  ): Promise<SeekPaginationResult<preQualify>>
  getPreQualifyRequestById(id: string): Promise<preQualify>
  addEligibility(input: Eligibility): Promise<Eligibility>
  findEligiblity(property_id: string, user_id: string): Promise<Eligibility>
  findEligiblityById(id: string): Promise<Eligibility>
  updateEligibility(input: PreQualifierEligibleInput): Promise<Eligibility>
  IsHomeBuyerEligible(
    property_id: string,
    user_id: string,
  ): Promise<Eligibility>
  checkDuplicateEmail(identifier: string): Promise<User>
  checkDuplicatePhone(identifier: string): Promise<User>
}
