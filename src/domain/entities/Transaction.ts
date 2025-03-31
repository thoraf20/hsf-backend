import { TransactionEnum } from ".../../../domain/enums/transactionEnum";


export class Transaction {
    id? : string;
    status: TransactionEnum;
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