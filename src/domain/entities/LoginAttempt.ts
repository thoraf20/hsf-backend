import { BaseEntity } from '.'

export class LoginAttempt extends BaseEntity {
  user_id: string
  attempted_at: Date
  successful: boolean
  ip_address?: string
  user_agent?: string

  constructor(data: Partial<LoginAttempt>) {
    super()
    Object.assign(this, {
      created_at: new Date(),
      updated_at: new Date(),
      ...data,
    })
  }
}
