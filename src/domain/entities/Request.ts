export enum ReviewRequestTypeKind {
  LoanOffer = 'Offer Letter',
}

export enum ReviewRequestStageKind {
  HsfOfferLetterReview = 'Hsf Offer Letter Review',
  LenderBankOfferLetterReview = 'Lender Bank Offer Letter Review',
}

enum ReviewRequestStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

enum ReviewRequestApprovalStatus {}

export class ReviewRequestType {
  id: string
  type: ReviewRequestTypeKind

  constructor(d: Partial<ReviewRequestType>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}

export class ReviewRequest {
  id: string
  request_type_id: string
  initiator_id: string
  candidate_name: string
  submission_date: Date
  status: ReviewRequestStatus

  constructor(d: Partial<ReviewRequest>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}

export class ReviewRequestStage {
  id: string
  name: ReviewRequestStageKind
  description?: string

  constructor(d: Partial<ReviewRequestStage>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}

export class ReviewRequestTypeStage {
  id: string
  stage_id: string
  request_type_id: string
  stage_order: number
  description?: string

  constructor(d: Partial<ReviewRequestStage>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}

export class ReviewRequestStageApprover {
  id: string
  stage_id: string
  role_id: string
  request_stage_id: string

  constructor(d: Partial<ReviewRequestStageApprover>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}

export class ReviewRequestApproval {
  id: string
  request_id: string
  stage_id: string
  approval_id: string
  approval_date: Date
  approval_status: ReviewRequestApprovalStatus
  comments?: string

  constructor(d: Partial<ReviewRequestApproval>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}
