import {
  LoanDecisionStatus,
  LoanOfferWorkflowStatus,
} from '@domain/enums/loanEnum'
import { BaseEntity } from '.'
import { LoanOfferStatus } from '@domain/enums/propertyEnum'

export class LoanOffer extends BaseEntity {
  application_id?: string
  organization_id?: string

  user_id?: string
  lender_org_id: string

  loan_amount: number
  interest_rate: number
  loan_term_months: number
  repayment_frequency: string

  // When the offer expires if not accepted
  offer_status: LoanOfferStatus
  offer_date: Date
  expiry_date: Date

  // Estimated values for display on the offer document
  total_interest_estimate?: number
  total_payable_estimate?: number
  estimated_periodic_payment?: number

  late_payment_penalty_details?: string
  financing_details?: string
  repayment_method_details?: string
  lender_comments?: Array<string>

  workflow_status?: LoanOfferWorkflowStatus

  constructor(d: Partial<LoanOffer>) {
    super()
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}

export class Loan extends BaseEntity {
  loan_offer_id: string
  application_id?: string
  organization_id?: string

  user_id?: string
  lender_org_id: string

  principal_amount: number
  interest_rate: number
  loan_terms_months: number
  repayment_frequency: string

  loan_status: string
  start_date: Date
  end_date: Date

  remaning_balance: number
  total_interest_paid: number
  total_principal_paid: number

  constructor(d: Partial<Loan>) {
    super()
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}

export class LoanRepaymentSchedule extends BaseEntity {
  loan_id: string

  payment_number: number
  due_date: Date

  principal_due: Date
  interest_due: Date
  total_due: Date

  status: string

  constructor(d: Partial<LoanRepaymentSchedule>) {
    super()
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}

export class LoanRepaymentTransaction extends BaseEntity {
  schedule_id: string
  loan_id: string
  transaction_id: string

  payment_date: Date
  amount_paid: string

  notes?: string

  constructor(d: Partial<LoanRepaymentTransaction>) {
    super()
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}

export class LoanDecision extends BaseEntity {
  application_id: string
  user_id: string
  brokerage_fee_paid_at?: Date
  brokerage_fee_payment_id?: string
  loan_offer_id?: string

  lender_org_id: string
  status: LoanDecisionStatus

  constructor(d: Partial<LoanRepaymentTransaction>) {
    super()
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}
