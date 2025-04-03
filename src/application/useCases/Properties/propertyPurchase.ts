import { OfferLetter } from '@entities/PropertyPurchase'
import { IPurchaseProperty } from '@interfaces/IPropertyPurchaseRepository'
import { IPropertyRepository } from '@interfaces/IPropertyRepository'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { PropertyBaseUtils } from '@use-cases/utils'
import { StatusCodes } from 'http-status-codes'

export class PropertyPurchase {
  private propertyRepository: IPropertyRepository
  private purchaseRepository: IPurchaseProperty
  private readonly utilsProperty: PropertyBaseUtils
  constructor(
    purchaseRepository: IPurchaseProperty,
    propertyRepository: IPropertyRepository,
  ) {
    this.propertyRepository = propertyRepository
    this.purchaseRepository = purchaseRepository
    this.utilsProperty = new PropertyBaseUtils(this.propertyRepository)
  }

  public async checkoutDuplicate(property_id: string, user_id: string) {
      console.log(property_id)
      await   this.utilsProperty.findIfPropertyExist(property_id)
    const [alreadyApprovedAndSoldOut, PendingRequest] = await Promise.all([
      this.purchaseRepository.checkIfRequestForOfferLetterIsApproved(
        property_id,
      ),
      this.purchaseRepository.checkIfRequestForOfferLetter(
        property_id,
        user_id,
      ),
    ])

    if (alreadyApprovedAndSoldOut) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'This property Has already been sold',
      )
    }

    if (PendingRequest) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Your request is under review',
      )
    }
  }

  public async requestForOfferLetter(
    input: OfferLetter,
    user_id: string,
  ): Promise<OfferLetter> {
    await this.checkoutDuplicate(input.property_id, user_id)
    const requestOfferLetter =
      await this.purchaseRepository.requestForOfferLetter({
        property_id: input.property_id,
        user_id,
        offer_letter_requested: true,
      })

    return new OfferLetter(requestOfferLetter) ? requestOfferLetter : null
  }
}
