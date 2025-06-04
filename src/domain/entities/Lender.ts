import { Organization } from './Organization'
import { User, UserClientView } from './User'

export class Lender {
  id?: string
  lender_name: string
  lender_type: string
  cac: string
  head_office_address: string
  state: string
  organization_id: string
  organization?: Organization
  owner?: UserClientView
  created_at?: Date
  updated_at?: Date
  constructor(data: Partial<Lender>) {
    Object.assign(this, {
      created_at: new Date(),
      updated_at: new Date(),
      ...data,
    })
  }
}

export type LenderProfile = Lender & User

export const getLenderClientView = (lender: Lender) => ({
  id: lender.id,
  lender_name: lender.lender_name,
  lender_type: lender.lender_type,
  head_office_address: lender.head_office_address,
  state: lender.state,
  organization_id: lender.organization_id,
  created_at: lender.created_at,
  updated_at: lender.updated_at,
})
