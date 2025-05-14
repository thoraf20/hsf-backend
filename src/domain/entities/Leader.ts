import { User } from "./User";

export class Lender {
    id?: string;
    lender_name: string;
    lender_type: string;
    cac: string;
    head_office_address: string;
    state: string;
    user_id: string;
    created_at?: Date;
    updated_at?: Date;
    constructor(data: Partial<Lender>) {
        Object.assign(this, {
            created_at: new Date(),
            updated_at: new Date(),
            ...data,
        });
    }
}


export type LenderProfile = Lender & User