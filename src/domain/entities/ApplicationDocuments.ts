export class DocumentGroup {
  id: string
  name: string
  tag: string
  description?: string

  constructor(d: Partial<DocumentGroup>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}

export class GroupDocumentType {
  id: string
  group_id: string
  document_type: string
  display_label?: string
  is_user_uploadable: boolean
  uploaded_by_role_id: string
  is_required_for_group: boolean

  constructor(d: Partial<GroupDocumentType>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}

export class ApplicationDocument {
  id: string
  application_id: string
  document_group_type_id: string
  document_url: string
  document_name: string
  document_size?: string
  review_request_id: string
  created_at: Date
  updated_at: Date

  constructor(d: Partial<ApplicationDocument>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}

export class ApplicationDocumentEntry {
  id: string
  application_id: string
  document_group_type_id: string
  document_url: string
  document_name: string
  document_type: string
  document_status: string
  created_at: Date
  updated_at: Date

  constructor(d: Partial<ApplicationDocumentEntry>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}
