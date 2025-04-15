import { OfferLetter, PropertyClosing } from '@entities/PropertyPurchase'
import { EscrowInformation } from '@entities/PurchasePayment'
import db from '@infrastructure/database/knex'
import { IPurchaseProperty } from '@interfaces/IPropertyPurchaseRepository'

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
      .insert({ property_id, user_id })
      .returning('*')
    return new PropertyClosing(propertyClosing) ? propertyClosing : null
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
    escrow_id: string,
    user_id: string,
  ): Promise<void> {
    await db('escrow_information')
      .update({ confirm_attendance: true })
      .where('escrow_id', escrow_id)
      .andWhere('user_id', user_id)
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
    console.log(user_id)
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
  ): Promise<EscrowInformation> {
    const [escrow] = await db('escrow_information').insert(input).returning('*')
    return new EscrowInformation(escrow) ? escrow : null
  }

  public async approvePrequalifyRequest(
    input: Record<string, any>,
    user_id: string,
  ): Promise<void> {
    await db('prequalify_status')
      .update({ status: input.status })
      .where('loaner_id', user_id)
  }
}
