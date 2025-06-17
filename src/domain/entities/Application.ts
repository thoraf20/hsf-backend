import {
  ApplicationPurchaseType,
  ApplicationStatus,
} from '@domain/enums/propertyEnum'
import { DIP } from './Mortage'
import { BaseEntity } from '.'
import { ConditionPrecedent } from './ConditionPrecedent'
import { Eligibility } from './prequalify/prequalify'
import { PreQualifyRequestInput } from '@validators/prequalifyValidation'

export enum OutrightApplicationStage {
  OfferLetter = 'Offer Letter',
  PropertyClosing = 'Property Closing',
  EscrowMeeting = 'Escrow Info',
  PaymentTracker = 'Payment Tracker',
  Purchased = 'Purchased',
}

export enum MortgageApplicationStage {
  PreQualification = 'Pre-Qualification',
  DecisionInPrinciple = 'Decision In Principle',
  UploadDocument = 'Upload Document',
  LoanDecision = 'Loan Decision',
  LoanOffer = 'Loan Offer',
  ConditionPrecedent = 'Condition Precedent',
  Repayment = 'Repayment',
  Purchased = 'Purchased',
}

export enum InstallmentApplicationStage {
  PaymentCalculator = 'Payment Calculator',
  PreQualification = 'Pre-Qualification',
  OfferLetter = 'Offer Letter',
  PropertyClosing = 'Property Closing',
  Repayment = 'Repayment',
  Purchased = 'Purchased',
}

export class ApplicationStage extends BaseEntity {
  stage:
    | OutrightApplicationStage
    | MortgageApplicationStage
    | InstallmentApplicationStage
  entry_time: Date
  exit_time?: Date
  additional_info?: any

  application_id: string
  user_id: string

  constructor(
    stage:
      | OutrightApplicationStage
      | MortgageApplicationStage
      | InstallmentApplicationStage,
    additional_info?: any,
  ) {
    super()
    this.stage = stage
    this.entry_time = new Date()
    this.additional_info = additional_info
  }
}

export class Application {
  application_id?: string
  application_type?: ApplicationPurchaseType
  mortage_payment_status_id?: string
  offer_letter_id?: string
  escrow_information_id?: string
  inspection_id?: string
  escrow_status_id?: string
  prequalifier_id?: string
  payment_date_id?: string
  property_id?: string
  precedent_document_upload_id?: string
  status: ApplicationStatus
  user_id?: string
  dip?: DIP
  document_upload_id?: string
  property_closing_id?: string
  condition_precedent_id?: string
  condition_precedent?: ConditionPrecedent
  loan_offer_id?: string
  developer_organization_id: string
  dip_id?: string
  created_at?: Date
  updated_at?: Date
  eligibility_id?: string
  prequalify_personal_information?: {
    eligibility: Eligibility
    prequalification_input: PreQualifyRequestInput
  }
  stages?: ApplicationStage[]
  constructor(d: Partial<Application>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}
