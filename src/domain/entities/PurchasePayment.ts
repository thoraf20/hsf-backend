export class PaymentEntity {
    payment_id?: string;
    payment_type?: string;
    payment_status?: string;
    amount?: string;
    transaction_id?: string;
    property_id?: string;
    payment_method?: string;
    user_id?: string;
    outstanding_amount?: string;
    down_payment?: string;
    total_closing?: string;
    updated_at?: Date;
    created_at?: Date;
    constructor(data: Partial<PaymentEntity>) {
        Object.assign(this, {
            created_at: new Date(),
            updated_at: new Date(),
            ...data
        });
}
}


export class invoices {
    invoice_id?: string;
    tax?: number;
    payment_id?: string;
    created_at?: Date;
    updated_at?: Date;
    constructor(data: Partial<invoices>) {
        Object.assign(this, {
            created_at: new Date(),
            updated_at: new Date(),
            ...data
        });
    }
}

export class EscrowInformation{
   escrow_id?: string;
   date: Date;
   time: string;
   location: string;
   attendancees: string;
   property_name: string;
   property_types: string;
   confirm_attendance?: boolean;
   property_id: string;
   property_buyer_id: string;
   agent_id: string;
   created_at?: Date;
    updated_at?: Date;
    constructor(data: Partial<invoices>) {
        Object.assign(this, {
            created_at: new Date(),
            updated_at: new Date(),
            ...data
        });
    }
}

export type paymentPurchase = PaymentEntity & invoices 