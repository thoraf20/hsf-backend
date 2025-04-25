export class Account {
  user_id?: string
  type?: string
  provider?: string
  provider_account_id?: string
  refresh_token?: string
  access_token?: string
  expires_at?: number
  token_type?: string
  scope?: string
  constructor(d: Partial<Account>) {
    let data = {
      ...d,
    }
    Object.assign(this, data)
  }
}
