import { TransactionEnum } from "@domain/enums/transactionEnum";


export class Transaction {
    id? : string;
    status: TransactionEnum;
    property_id?: string;
    transaction_id : string;
    transaction_type: string;
    remark?: string;
    amount: string;
    user_id: string;
    created_at?: Date
    updated_at?: Date
    constructor(data: Partial<Transaction>) {
        Object.assign(this, {
            created_at: new Date(),
            updated_at: new Date(),
            ...data
        });
    }

}

export class MortagePayment {
    mortage_payment_status_id?: string;
    pay_due_deligence?: boolean;
    pay_brokage_fee?: boolean;
    pay_management_fee?: boolean;
    created_at?: Date
    updated_at?: Date
    constructor(data: Partial<MortagePayment>) {
        Object.assign(this, {
            created_at: new Date(),
            updated_at: new Date(),
            ...data
        });
    }
}