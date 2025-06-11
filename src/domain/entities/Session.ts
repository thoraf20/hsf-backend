import { BaseEntity } from '.'

export class Session extends BaseEntity {
  user_id: string
  user_agent: string
  ip: string
  version: number
  expires_at: number
  organization_id?: string

  remember_me: boolean
  max_renewal_duration: number

  constructor() {
    super()
  }
}
