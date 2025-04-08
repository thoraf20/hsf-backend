import { OfferLetter, PropertyClosing } from "@entities/PropertyPurchase";
import { EscrowInformation } from "@entities/PurchasePayment";

export interface IPurchaseProperty {
    requestForOfferLetter(input : OfferLetter) : Promise<OfferLetter>
    checkIfRequestForOfferLetter(property_id: string, user_id: string): Promise<OfferLetter>
    checkIfRequestForOfferLetterIsApproved(property_id: string): Promise<OfferLetter>
    getOfferLetterById(offer_letter_id: string): Promise<OfferLetter>
    updateOfferLetterStatus(offer_letter_id: string, input: Partial<OfferLetter>): Promise<void>
    requestForPropertyClosing(property_id: string, user_id: string): Promise<PropertyClosing>
    confirmPropertyEscrowMeeting(id: string, user_id: string): Promise<void>
    getAllOfferLetterByUserId(user_id: string): Promise<OfferLetter[]>
    getOfferLetter() : Promise<OfferLetter[]>
    setEscrowAttendance(input: EscrowInformation): Promise<EscrowInformation>
    confirmPropertyPurchase(input: Record<string, any>, user_id: string): Promise<void>
    approvePrequalifyRequest(input: Record<string, any>, user_id: string): Promise<void> 
}
