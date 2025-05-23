import { BaseEntity } from '.'

export class DocumentGroup extends BaseEntity {
  name: string
  tag: string
  description?: string
}

export class GroupDocumentType extends BaseEntity {
  group_id: string
  document_type: string
  description?: string
  display_label?: string
  is_user_uploadable: boolean
  uploaded_by_role_id: string
  is_required_for_group: boolean
}

export class ApplicationDocumentEntry extends BaseEntity {
  application_id?: string
  document_group_type_id: string
  document_url: string
  document_name: string
  document_size?: string
  review_request_id?: string
  organization_id?: string
}
