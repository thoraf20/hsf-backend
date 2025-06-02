import { BaseEntity } from '.'

export class UserActivityLog extends BaseEntity {
  user_id: string
  activity_type: string
  title: string
  description?: string
  performed_at: Date
  ip_address?: string
  user_agent?: string
  metadata?: any

  constructor(data: Partial<UserActivityLog>) {
    super()
    Object.assign(this, {
      created_at: new Date(),
      updated_at: new Date(),
      ...data,
    })
  }
}

export type DateGroupedUserActivityLog = {
  date: string
  count: number
  activities: Array<UserActivityLog>
}
