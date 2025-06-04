import { DipPaymentStatus } from '@domain/enums/PaymentEnum'
import {
  DIPLenderStatus,
  DIPStatus,
  UserAction,
} from '@domain/enums/propertyEnum'

export class DIP {
  dip_id?: string
  property_id: string
  application_id: string
  eligibility_id: string
  approved_loan_amount?: number
  interest_rate?: number
  loan_term?: string
  monthly_payment?: number
  dip_lender_status?: DIPLenderStatus
  dip_status: DIPStatus
  generated_at?: Date
  user_action?: UserAction
  user_action_at?: string
  payment_status?: DipPaymentStatus
  payment_transaction_id?: string
  documents_status?: string
  documents_review_request_id?: string
  hsf_document_review_completed?: boolean
  lender_document_review_completed?: boolean
  user_id: string
  created_at?: Date
  updated_at?: Date
  constructor(d: Partial<DIP>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}

export class MortagePaymentStatus {
  pay_due_deligence?: boolean
  pay_brokage_fee: boolean
  pay_management_fee: boolean
  property_id: string
  mortage_payment_status_id?: string
  user_id: string
  constructor(d: Partial<DIP>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}
