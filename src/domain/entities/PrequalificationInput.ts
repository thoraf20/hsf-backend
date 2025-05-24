import { BaseEntity } from '.'

export class PrequalificationInput extends BaseEntity {
  public first_name: string
  public last_name: string
  public email: string
  public phone_number: string
  public gender: string
  public marital_status: string
  public house_number: string
  public street_address: string
  public date_of_birth: Date | string
  public state: string
  public city: string
  public user_id: string
  public employment_confirmation: string
  public employment_position: string
  public years_to_retirement: number
  public employer_name: string
  public employer_address: string
  public employer_state: string
  public net_income: number
  public industry_type?: string | null
  public employment_type?: string | null
  public existing_loan_obligation?: string | null

  constructor(data: Partial<PrequalificationInput>) {
    super()
    Object.assign(this, { ...this, data })
  }
}
