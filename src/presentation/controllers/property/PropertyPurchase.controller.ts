import { ApiResponse, createResponse } from "@presentation/response/responseType";
import { PropertyPurchase } from "@use-cases/Properties/propertyPurchase";
import { StatusCodes } from "http-status-codes";



export class PurchasePropertyController {
    constructor(private readonly service: PropertyPurchase) {}

    public async propertyPurchase (input: any, user_id: string): Promise<ApiResponse<any>> {
        const offerLetter = await this.service.purchaseProperty(input, user_id)
        return createResponse(
            StatusCodes.CREATED,
            'Success',
            offerLetter
        )
    }
}