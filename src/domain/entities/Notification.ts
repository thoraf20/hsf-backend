export class NotificationType {
  notification_type_id: string
  name: string
  description?: string | null
  created_at: Date
  updated_at: Date

  constructor(d: Partial<NotificationType>) {
    const data = {
      ...d,
      created_at: d.created_at || new Date(),
      updated_at: d.updated_at || new Date(),
    }
    Object.assign(this, data)
  }
}

export class NotificationMedium {
  notification_medium_id: string
  name: string
  created_at: Date
  updated_at: Date

  constructor(d: Partial<NotificationMedium>) {
    const data = {
      ...d,
      created_at: d.created_at || new Date(),
      updated_at: d.updated_at || new Date(),
    }
    Object.assign(this, data)
  }
}

export class Frequency {
  frequency_id: string
  name: string
  created_at: Date
  updated_at: Date

  constructor(d: Partial<Frequency>) {
    const data = {
      ...d,
      created_at: d.created_at || new Date(),
      updated_at: d.updated_at || new Date(),
    }
    Object.assign(this, data)
  }
}

export class UserEnabledMedium {
  user_id: string // Assuming user_id is string in your users table
  notification_medium_id: string
  created_at: Date
  updated_at: Date

  constructor(d: Partial<UserEnabledMedium>) {
    const data = {
      ...d,
      created_at: d.created_at || new Date(),
      updated_at: d.updated_at || new Date(),
    }
    Object.assign(this, data)
  }
}

export class UserSubscribedNotificationType {
  user_id: string
  notification_type_id: string
  frequency_id?: string | null
  created_at: Date
  updated_at: Date

  constructor(d: Partial<UserSubscribedNotificationType>) {
    const data = {
      ...d,
      created_at: d.created_at || new Date(),
      updated_at: d.updated_at || new Date(),
    }
    Object.assign(this, data)
  }
}
