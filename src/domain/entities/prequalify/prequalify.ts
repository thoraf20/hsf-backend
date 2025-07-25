import {
  EligibilityStatus,
  Gender,
  MARITAL_STATUS,
} from '@domain/enums/prequalifyEnum'
import { PrequalificationInput } from '@entities/PrequalificationInput'
import { QueryBoolean } from '@shared/utils/helpers'

export class personalinformation {
  personal_information_id?: string
  first_name: string
  last_name: string
  email: string
  phone_number: string
  gender: Gender
  marital_status: MARITAL_STATUS
  house_number: string
  street_address: string
  state: string
  city: string
  loaner_id: string
  created_at?: Date
  updated_at?: Date
  constructor(data: Partial<personalinformation>) {
    Object.assign(this, {
      ...data,
    })
  }
}

export class Eligibility {
  eligibility_id?: string
  eligiblity_status?: EligibilityStatus
  is_eligible?: boolean
  property_id?: string
  rsa?: string
  organization_id: string
  lender_id?: string
  prequalifier_input_id: string
  user_id?: string
  created_at?: Date
  updated_at?: Date
  constructor(data: Partial<personalinformation>) {
    Object.assign(this, {
      ...data,
    })
  }
}

export class employmentInformation {
  employment_information_id?: string
  employment_confirmation?: QueryBoolean
  employment_position: string
  years_to_retirement: number
  employer_address?: string
  employer_state?: string
  created_at?: Date
  net_income: string
  industry_type?: string
  employment_type?: string
  existing_loan_obligation?: string
  rsa: string
  property_information_id?: string
  preferred_developer: string
  property_name: string
  preferred_lender: string
  personal_information_id: string
  updated_at?: Date
  constructor(data: Partial<employmentInformation>) {
    Object.assign(this, {
      ...data,
    })
  }
}

export class payment_calculator {
  payment_calculator_id?: string
  interest_rate: number | string
  terms: number
  repayment_type: string
  application_id: string
  constructor(data: Partial<payment_calculator>) {
    Object.assign(this, {
      ...data,
    })
  }
}

export type preQualify = Eligibility & {
  prequalification_input: PrequalificationInput
}
