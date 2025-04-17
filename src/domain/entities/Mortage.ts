export class DIP {
  property_id: string
  user_id: string
  dip_status: 'declined' | 'accept'
  created_at?: Date
  updated_at?: Date
  constructor(d: Partial<DIP>) {
    let data = {
      ...d,
      inspection_fee_paid: false,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}
