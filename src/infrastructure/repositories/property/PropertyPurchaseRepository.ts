import { EscrowMeetingStatus } from '@domain/enums/propertyEnum'
import {
  EscrowInformationStatus,
  OfferLetter,
  PropertyClosing,
} from '@entities/PropertyPurchase'
import { EscrowAttendee, EscrowInformation } from '@entities/PurchasePayment'
import db from '@infrastructure/database/knex'
import { IPurchaseProperty } from '@interfaces/IPropertyPurchaseRepository'
import { SeekPaginationResult } from '@shared/types/paginate'
import { applyPagination } from '@shared/utils/paginate'
import { ApprovePrequalifyRequestInput } from '@validators/agentsValidator'

export class PropertyPurchaseRepository implements IPurchaseProperty {
  private readonly tablename: string = 'offer_letter'
  public async requestForOfferLetter(input: OfferLetter): Promise<OfferLetter> {
    const [offerLetter] = await db(this.tablename).insert(input).returning('*')
    return new OfferLetter(offerLetter) ? offerLetter : null
  }

  public async requestForPropertyClosing(
    property_id: string,
    user_id: string,
  ): Promise<PropertyClosing> {
    const [propertyClosing] = await db('property_closing')
      .insert({ property_id, user_id, closing_status: 'Pending' })
      .returning('*')
    return new PropertyClosing(propertyClosing) ? propertyClosing : null
  }
  async checkIfPropertyClosingIsRequested(
    property_id: string,
    user_id: string,
  ): Promise<PropertyClosing> {
    return await db('property_closing')
      .select('*')
      .where('property_id', property_id)
      .andWhere('user_id', user_id)
      .first()
  }

  public async checkIfRequestForOfferLetter(
    property_id: string,
    user_id: string,
  ): Promise<OfferLetter> {
    return await db(this.tablename)
      .where('property_id', property_id)
      .andWhere('user_id', user_id)
      .first()
  }
  public async checkIfRequestForOfferLetterIsApproved(
    property_id: string,
  ): Promise<OfferLetter> {
    return await db(this.tablename)
      .where('property_id', property_id)
      .andWhere('offer_letter_status', '=', 'Approved')
      .first()
  }

  public async getOfferLetterById(
    offer_letter_id: string,
  ): Promise<OfferLetter> {
    return await db(this.tablename)
      .join('users', 'offer_letter.user_id', 'users.id')
      .select(
        'offer_letter.*',
        'users.first_name',
        'users.last_name',
        'users.email',
      )
      .where('offer_letter_id', offer_letter_id)
      .first()
  }

  public async getPropertyClosingById(id: string): Promise<PropertyClosing> {
    return db('property_closing')
      .select('*')
      .where('property_closing_id', id)
      .first()
  }

  public async updateOfferLetterStatus(
    offer_letter_id: string,
    input: Partial<OfferLetter>,
  ): Promise<OfferLetter> {
    await db(this.tablename)
      .update({ ...input, offer_letter_approved: true })
      .where('offer_letter_id', offer_letter_id)
    return await this.getOfferLetterById(offer_letter_id)
  }
  public async confirmPropertyEscrowMeeting(
    escrowId: string,
    status: EscrowMeetingStatus,
  ): Promise<EscrowInformationStatus> {
    const [escrowStatus] = await db('escrow_status')
      .update({ escrow_status: status })
      .where('escrow_status_id', escrowId)
      .returning('*')

    return escrowStatus
  }

  async findAllPropertyClosings(
    filter: any,
  ): Promise<SeekPaginationResult<PropertyClosing>> {
    let baseQuery = db<PropertyClosing>('property_closing').orderBy(
      'created_at',
      'desc',
    )
    return applyPagination<PropertyClosing>(baseQuery)
  }

  public async confirmPropertyPurchase(
    input: Record<string, any>,
    user_id: string,
  ): Promise<void> {
    await db('payments')
      .update(input)
      .where(user_id)
      .andWhere('property_id', input.property_id)
  }
  public async getAllOfferLetterByUserId(
    user_id: string,
  ): Promise<Partial<OfferLetter[]>> {
    const offerLetter = await db('offer_letter')
      .join('users', 'offer_letter.user_id', 'users.id')
      .select(
        'offer_letter.*',
        'users.first_name',
        'users.last_name',
        'users.email',
      )
      .where('users.id', user_id)
    return offerLetter
  }

  public async getOfferLetter(userId: string): Promise<OfferLetter[]> {
    // Developer is suppose  to send the offer letter
    const offerLetter = await db('offer_letter')
      .join('properties', 'offer_letter.property_id', 'properties.id')
      .join('users', 'offer_letter.user_id', 'users.id') // optional, if you want user info
      .select(
        'offer_letter.*',
        'properties.property_name',
        'properties.id as property_id',
        'users.first_name',
        'users.last_name',
        'users.email',
      )
      .where('properties.user_id', userId)
      .andWhere('offer_letter.offer_letter_requested', true)

    return offerLetter ?? []
  }

  public async setEscrowAttendance(
    input: EscrowInformation,
    attendee: Array<string>,
  ): Promise<EscrowInformation> {
    return db.transaction(async (tx) => {
      const [escrow] = await tx<EscrowInformation>('escrow_information')
        .insert(input)
        .returning('*')

      console.log(
        attendee.map((id) => ({ escrow_id: escrow.escrow_id, user_id: id })),
      )
      await tx<EscrowAttendee>('escrow_attendee')
        .insert(
          attendee.map((id) => ({ escrow_id: escrow.escrow_id, user_id: id })),
        )
        .returning('*')
      return new EscrowInformation(escrow) ? escrow : null
    })
  }

  public async approvePrequalifyRequest(
    input: ApprovePrequalifyRequestInput,
  ): Promise<void> {
    await db('prequalify_status')
      .update({ is_approved: input.is_approved })
      .where('loaner_id', input.user_id)
  }

  public async createEscrowStatus(
    input: EscrowInformationStatus,
  ): Promise<EscrowInformationStatus> {
    const [escrowStatus] = await db('escrow_status')
      .insert({ ...input, escrow_status: EscrowMeetingStatus.AWAITING })
      .returning('*')
    return new EscrowInformationStatus(escrowStatus) ? escrowStatus : null
  }

  public async updateEscrowStatus(
    escrow_status_id: string,
    update: Partial<EscrowInformationStatus>,
  ) {
    const [updated] = await db('escrow_status')
      .update<EscrowInformationStatus>(update)
      .where({ escrow_status_id })
      .returning('*')

    return updated
  }

  public async getEscrowInfo(escrow_id: string) {
    return db('escrow_information')
      .select<EscrowInformation>()
      .where({ escrow_id: escrow_id })
      .first()
  }

  public async updatePropertyClosing(
    propertyClosingId: string,
    data: Partial<PropertyClosing>,
  ): Promise<PropertyClosing> {
    const [updatedPropertyClosing] = await db<PropertyClosing>(
      'property_closing',
    )
      .update(data)
      .where({ property_closing_id: propertyClosingId })
      .returning('*')

    return updatedPropertyClosing
  }
}
