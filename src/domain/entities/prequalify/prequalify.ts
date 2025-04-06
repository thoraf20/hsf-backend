import { Gender, MARITAL_STATUS, preQualifyStatus } from "@domain/enums/prequalifyEnum";

export class personalinformation {
    personal_information_id?: string;
    first_name : string;
    last_name: string;
    email: string;
    phone_number: string;
    gender: Gender;
    marital_status: MARITAL_STATUS;
    house_number: string;
    street_address:  string;
    state: string;
    city: string;
    loaner_id: string;
    created_at?: Date;
    updated_at?: Date;
      constructor(data: Partial<personalinformation>) {
        Object.assign(this, {
          ...data,
        })
      }
}


export class employmentInformation {
    employment_information_id?: string 
    employment_confirmation?: 'Yes' | 'No'
    employment_position: string
    years_to_retirement: number;
    employer_address?: string;
    employer_state?: string
    created_at?: Date;
    net_income: string;
    industry_type?: string;
    employment_type?:string;
    existing_loan_obligation?:  string;
    rsa: string;
    property_information_id?: string;
    preferred_developer: string;
    property_name: string;
    preferred_lender: string;
    personal_information_id: string;
    updated_at?: Date;
      constructor(data: Partial<employmentInformation>) {
        Object.assign(this, {
          ...data,
        })
      }
}


export class prequalifyStatus {
    status_id?: string;
    status?: preQualifyStatus;
    personal_information_id: string;
    loaner_id: string
    verification?: boolean
    created_at?: Date;
    updated_at?: Date;
      constructor(data: Partial<prequalifyStatus>) {
        Object.assign(this, {
          ...data,
        })
      }
}


export class payment_calculator {
  payment_calculator_id?: string;
  house_price: string;
  interest_rate: string;
  terms: string;
  type?: string;
  repayment_type: string;
  est_money_payment: string;
  personal_information_id: string
  constructor(data: Partial<payment_calculator>) {
    Object.assign(this, {
      ...data,
    })
  }
}


export type preQualify = personalinformation  & employmentInformation & prequalifyStatus & payment_calculator
