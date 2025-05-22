import { EscrowMeetingStatus } from '@domain/enums/propertyEnum'
import {
  EscrowInformationStatus,
  OfferLetter,
  PropertyClosing,
} from '@entities/PropertyPurchase'
import { EscrowInformation } from '@entities/PurchasePayment'
import { SeekPaginationResult } from '@shared/types/paginate'
import { ApprovePrequalifyRequestInput } from '@validators/agentsValidator'

export interface IPurchaseProperty {
  requestForOfferLetter(input: OfferLetter): Promise<OfferLetter | any>
  checkIfRequestForOfferLetter(
    property_id: string,
    user_id: string,
  ): Promise<OfferLetter>
  checkIfRequestForOfferLetterIsApproved(
    property_id: string,
  ): Promise<OfferLetter>
  getOfferLetterById(offer_letter_id: string): Promise<OfferLetter>
  updateOfferLetterStatus(
    offer_letter_id: string,
    input: Partial<OfferLetter>,
  ): Promise<OfferLetter>
  requestForPropertyClosing(
    property_id: string,
    user_id: string,
  ): Promise<PropertyClosing>
  getPropertyClosingById(id: string): Promise<PropertyClosing>
  getEscrowInfo(escrow_id: string): Promise<EscrowInformation>

  findAllPropertyClosings(
    filter: any,
  ): Promise<SeekPaginationResult<PropertyClosing>>

  updatePropertyClosing(
    propertyClosingId: string,
    data: Partial<PropertyClosing>,
  ): Promise<PropertyClosing>
  confirmPropertyEscrowMeeting(
    escrowId: string,
    status: EscrowMeetingStatus,
  ): Promise<EscrowInformationStatus>

  getAllOfferLetterByUserId(user_id: string): Promise<OfferLetter[]>
  getOfferLetter(userId: string): Promise<OfferLetter[]>
  setEscrowAttendance(
    input: EscrowInformation,
    attendee: Array<string>,
  ): Promise<EscrowInformation>
  confirmPropertyPurchase(
    input: Record<string, any>,
    user_id: string,
  ): Promise<void>
  approvePrequalifyRequest(input: ApprovePrequalifyRequestInput): Promise<void>
  createEscrowStatus(
    input: EscrowInformationStatus,
  ): Promise<EscrowInformationStatus>
  checkIfPropertyClosingIsRequested(
    property_id: string,
    user_id: string,
  ): Promise<PropertyClosing>
}
