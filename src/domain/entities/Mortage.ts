export class DIP {
  dip_id?: string
  property_id: string
  user_id: string
  dip_status: 'declined' | 'accept'
  created_at?: Date
  updated_at?: Date
  constructor(d: Partial<DIP>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}


export class MortagePaymentStatus {
  pay_due_deligence?: boolean;
  pay_brokage_fee: boolean;
  pay_management_fee: boolean;
  property_id: string;
  mortage_payment_status_id?: string
  user_id: string
  constructor(d: Partial<DIP>) {
    let data = {
      ...d,
      created_at: new Date(),
      updated_at: new Date(),
    }
    Object.assign(this, data)
  }
}