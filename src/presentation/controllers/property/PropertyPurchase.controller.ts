import {
  ApiResponse,
  createResponse,
} from '@presentation/response/responseType'
import { PropertyPurchase } from '@use-cases/Properties/propertyPurchase'
import { PurchasePropertyInput } from '@validators/purchaseValidation'
import { StatusCodes } from 'http-status-codes'

export class PurchasePropertyController {
  constructor(private readonly service: PropertyPurchase) {}

  public async propertyPurchase(
    input: PurchasePropertyInput,
    user_id: string,
  ): Promise<ApiResponse<any>> {
    const offerLetter = await this.service.purchaseProperty(input, user_id)
    return createResponse(StatusCodes.CREATED, 'Success', offerLetter)
  }
  public async getOfferLetterByUserId(
    user_id: string,
  ): Promise<ApiResponse<any>> {
    const offerLetter = await this.service.getAllOfferLetterByUserId(user_id)
    return createResponse(StatusCodes.OK, 'Success', offerLetter)
  }
  public async getOfferLetterById(
    offer_letter_id: string,
  ): Promise<ApiResponse<any>> {
    const offerLetter = await this.service.getOfferLetterById(offer_letter_id)
    return createResponse(StatusCodes.OK, 'Success', offerLetter)
  }
  public async getOfferLetter(user_id: string): Promise<ApiResponse<any>> {
    const offerLetter = await this.service.getAllOfferLetter(user_id)
    return createResponse(StatusCodes.OK, 'Success', offerLetter)
  }
}
