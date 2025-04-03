import { OfferLetter } from "@entities/PropertyPurchase";
import { ApiResponse, createResponse } from "@presentation/response/responseType";
import { PropertyPurchase } from "@use-cases/Properties/propertyPurchase";
import { StatusCodes } from "http-status-codes";



export class PurchasePropertyController {
    constructor(private readonly service: PropertyPurchase) {}

    public async requestOfferLetter (input: OfferLetter, user_id: string): Promise<ApiResponse<any>> {
        const offerLetter = await this.service.requestForOfferLetter(input, user_id)
        return createResponse(
            StatusCodes.CREATED,
            'Request was sent successfully',
            offerLetter
        )
    }
}