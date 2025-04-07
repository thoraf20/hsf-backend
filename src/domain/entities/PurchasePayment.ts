export class PaymentEntity {
    payment_id?: string;
    payment_type?: string;
    payment_status?: string;
    amount?: number;
    transaction_id?: string;
    property_id?: string;
    user_id?: string;
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



export type paymentPurchase = PaymentEntity & invoices 