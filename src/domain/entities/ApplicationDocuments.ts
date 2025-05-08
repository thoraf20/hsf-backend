import { DocumentApprovalEnum } from '@domain/enums/documentEnum'

export class ApplicationDocument {
  id: string
  application_id: string
  document_type: string // e.g., 'ProofOfIncome', 'ID_Card', 'TitleDeed', 'ComplianceCert' - Consider an ENUM if types are fixed
  file_url: string // URL to the stored file (S3, local, etc.)
  file_name: string // Original file name
  uploaded_by_user_id: string
  version?: number // To handle re-uploads/corrections
  constructor(d: Partial<ApplicationDocument>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}

export class ApprovalStage {
  id: string
  name: string // e.g., 'HSF Initial Review', 'Lender Document Verification', 'Third-Party Compliance'
  description: string
  sequence_order?: number
  next_approval_stage_id: string
  constructor(d: Partial<ApprovalStage>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}

export class StageRequriedDocument {
  id: string
  stage_id: string
  document_type: string
  is_required: boolean
  constructor(d: Partial<StageRequriedDocument>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}

export class StageApproverRole {
  id: string
  stage_id: string
  role_id: string // Role required for this stage (e.g., 'admin', 'lender', 'compliance officer')
  // -- required_approvals INTEGER DEFAULT 1, -- Future: If multiple people of the same role need to approve
  constructor(d: Partial<StageApproverRole>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}

export class DocumentApproval {
  id: string
  application_document_id: string
  stage_id: string
  approver_user_id: string //User who performed the action (can be NULL if just tracking stage entry)
  status: DocumentApprovalEnum //Status for this doc at this stage
  comments: string // Optional comments, especially for rejection
  action_timestamp: string

  constructor(d: Partial<DocumentApproval>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}

export class DocumentGroup {
  id: string
  name: string
  description?: string
  display_order?: number
  trigger_approval_stage_id: string

  constructor(d: Partial<DocumentGroup>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}

export class DocumentGroupType {
  id: string
  group_id: string
  document_type: string
  display_label: string
  is_user_uploadable: boolean
  uploaded_by_role_id: string
  is_required_for_group: boolean

  constructor(d: Partial<DocumentGroupType>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}
