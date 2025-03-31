import { PartialEntity } from '@shared/types/partials'


export class Enquires extends PartialEntity<Enquires>{
    id?: string;
    property_id: string;
    customer_id: string;
    developer_id: string;
    closed: boolean;
    created_at?: Date;
    updated_at?: Date;


    constructor(data: Partial<Enquires>) {
        super({...data, closed: false});
    }
}

export class EnquiryMsg extends PartialEntity<EnquiryMsg> {
    id?: string;
    enquiry_id: string;
    owner_id: string;
    message: string;
    created_at?: Date;
    updated_at?: Date;
}

export type Enquiry = Enquires & { messages: EnquiryMsg[] };