import { employmentInformation, financialInformation, personalinformation, preQualify, prequalifyStatus, propertyInformation } from "@entities/prequalify/prequalify";

export interface IPreQualify {
  storePersonaInfo (input: personalinformation): Promise<personalinformation>
  storeEmploymentInfo (input: employmentInformation): Promise<employmentInformation>
  storeFinancialInfo(input: financialInformation): Promise<financialInformation>
  storePropertyInfo (input: propertyInformation): Promise<propertyInformation>
  storePreQualifyStatus (input: prequalifyStatus): Promise<prequalifyStatus>
  findIfApplyForLoanAlready(loaner_id: string): Promise<any>
  updatePrequalifyStatus(loaner_id: string, input: Partial<preQualify>): Promise<void>
}