import { LoanOfferStatus } from '@domain/enums/propertyEnum'
import { BaseEntity } from '.'

export class PaymentEntity {
  payment_id?: string
  payment_type?: string
  payment_status?: string
  amount?: string
  transaction_id?: string
  property_id?: string
  payment_method?: string
  user_id?: string
  outstanding_amount?: string
  down_payment?: string
  total_closing?: string
  updated_at?: Date
  created_at?: Date
  constructor(data: Partial<PaymentEntity>) {
    Object.assign(this, {
      created_at: new Date(),
      updated_at: new Date(),
      ...data,
    })
  }
}

export class invoices {
  invoice_id?: string
  tax?: number
  payment_id?: string
  created_at?: Date
  updated_at?: Date
  constructor(data: Partial<invoices>) {
    Object.assign(this, {
      created_at: new Date(),
      updated_at: new Date(),
      ...data,
    })
  }
}

export class EscrowInformation {
  escrow_id?: string
  date: Date
  time: string
  location: string
  property_name: string
  property_types: string
  confirm_attendance?: boolean
  property_id: string
  property_buyer_id: string
  review_request_id: string
  application_id?: string
  organization_id: string
  created_at?: Date
  updated_at?: Date
  constructor(data: Partial<invoices>) {
    Object.assign(this, {
      created_at: new Date(),
      updated_at: new Date(),
      ...data,
    })
  }
}

export class EscrowAttendee extends BaseEntity {
  escrow_id: string
  user_id: string
}

export class uploadDocument {
  document_upload_id?: string
  documents: any
  document_type?: string | 'mortage document upload'
  property_id: string
  user_id: string
  document_status?: string
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date

  constructor(data: Partial<uploadDocument>) {
    let complete_data = {
      documents:
        typeof data.documents === 'string'
          ? JSON.stringify(data.documents)
          : Array.isArray(data.documents)
            ? data.documents
            : [],
      ...data,
    }
    if (data) {
      Object.assign(this, complete_data)
    }
  }
}

export class uploadPrecedentDocument {
  precedent_document_upload_id?: string
  precedent_documents?: any
  precedent_document_type?: string | 'precedent document'
  precedent_document_status?: string
  user_id: string
  property_id: string
  constructor(data: Partial<uploadPrecedentDocument>) {
    let complete_data = {
      documents:
        typeof data.precedent_documents === 'string'
          ? JSON.stringify(data.precedent_documents)
          : Array.isArray(data.precedent_documents)
            ? data.precedent_documents
            : [],
      ...data,
    }
    if (data) {
      Object.assign(this, complete_data)
    }
  }
}

export class LoanOffer {
  loan_offer_id?: string
  property_name?: string
  property_location?: string
  loan_amount?: string
  interest_rate?: string
  payment_duration?: string
  total_interest_over_loan_period?: string
  late_payment_penalty?: string
  financing?: string
  repayment_menthod?: string
  total_payable_amount?: string
  accepted?: boolean
  loan_acceptance_status?: LoanOfferStatus
  user_id: string
  property_id: string
  created_at?: Date
  updated_at?: Date
  constructor(data: Partial<LoanOffer>) {
    Object.assign(this, {
      created_at: new Date(),
      updated_at: new Date(),
      ...data,
    })
  }
}
export type paymentPurchase = PaymentEntity & invoices
