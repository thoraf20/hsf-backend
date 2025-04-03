export class OfferLetter {
    offer_letter_id?: string;
    offer_letter_doc?: string;
    offer_letter_requested?: boolean;
    offer_letter_approved?: boolean;
    offer_letter_downloaded?: boolean;
    closed?: string;
    offer_letter_status?: string;
    property_id: string
    user_id: string
    updated_at?: Date
    deleted_at?: Date
    constructor(data: Partial<OfferLetter>) {
        Object.assign(this, {
            created_at: new Date(),
            updated_at: new Date(),
            ...data
        });
    }
}