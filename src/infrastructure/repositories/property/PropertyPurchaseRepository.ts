import { OfferLetter, PropertyClosing } from '@entities/PropertyPurchase'
import db from '@infrastructure/database/knex'
import { IPurchaseProperty } from '@interfaces/IPropertyPurchaseRepository'

export class PropertyPurchaseRepository implements IPurchaseProperty {
  private readonly tablename: string = 'offer_letter'
  public async requestForOfferLetter(input: OfferLetter): Promise<OfferLetter> {
    const [offerLetter] = await db(this.tablename).insert(input).returning('*')
    return new OfferLetter(offerLetter) ? offerLetter : null
  }

  public async requestForPropertyClosing(property_id: string, user_id: string): Promise<PropertyClosing> {
    const [propertyClosing] = await db('property_closing').insert({property_id, user_id}).returning('*')
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

  public async getOfferLetterById(offer_letter_id: string): Promise<OfferLetter> {
    return await db(this.tablename).where('offer_letter_id', offer_letter_id).first()
  }

  public async updateOfferLetterStatus(
    offer_letter_id: string,
    input: Partial<OfferLetter>,
  ): Promise<void> {
    await db(this.tablename)
      .update(input)
      .where('offer_letter_id', offer_letter_id)
  }
  public async confirmPropertyEscrowMeeting(escrow_id: string, user_id: string): Promise<void> {
    await db('escrow_information').update({confirm_attendance:  true}).where('escrow_id', escrow_id).andWhere('user_id', user_id)
  }
}
