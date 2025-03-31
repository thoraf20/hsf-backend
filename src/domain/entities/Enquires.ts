

export class Enquires {
    id?: string;
    property_id: string;
    customer_id: string;
    developer_id: string;
    closed: boolean;
    created_at?: Date;
    updated_at?: Date;


    constructor(data: Partial<Enquires>) {
        Object.assign(this, {
            closed: false,
            created_at: new Date(),
            updated_at: new Date(),
            ...data
        });
    }
}

export class EnquiryMsg {
    id?: string;
    enquiry_id: string;
    owner_id: string;
    message: string;
    created_at?: Date;
    updated_at?: Date;


    constructor(data: Partial<EnquiryMsg>) {
        Object.assign(this, {
            created_at: new Date(),
            updated_at: new Date(),
            ...data
        });
    }
}

export type Enquiry = Enquires & { messages: EnquiryMsg[] };