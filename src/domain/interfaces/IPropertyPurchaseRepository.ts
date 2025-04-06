import { OfferLetter } from "@entities/PropertyPurchase";

export interface IPurchaseProperty {
    requestForOfferLetter(input : OfferLetter) : Promise<OfferLetter>
    checkIfRequestForOfferLetter(property_id: string, user_id: string): Promise<OfferLetter>
    checkIfRequestForOfferLetterIsApproved(property_id: string): Promise<OfferLetter>
    getOfferLetterById(offer_letter_id: string): Promise<OfferLetter>
    updateOfferLetterStatus(offer_letter_id: string, input: Partial<OfferLetter>): Promise<void>
}