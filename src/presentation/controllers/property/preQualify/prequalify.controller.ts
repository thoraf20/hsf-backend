import { preQualify } from "@entities/prequalify/prequalify";
import { ApiResponse, createResponse } from "@presentation/response/responseType";
import { preQualifyService } from "@use-cases/Properties/preQualify/prequalify";
import { StatusCodes } from "http-status-codes";



export class preQualifyController {
    constructor (private readonly service: preQualifyService) {}

    public async preQualifierController (input: preQualify, user_id: string) :Promise<ApiResponse<any>> {
        const preQualifier = await this.service.storePreQualify(input, user_id)
        return createResponse(
            StatusCodes.CREATED,
            `Success`,
            preQualifier
        )
    }

    public async verification (input: Record<string, any>) :Promise<ApiResponse<any>>
    {
         await this.service.verification(input)
        return createResponse(
            StatusCodes.OK,
            `Verification was complete`,
            {}
        )
    }
    public async getPrequalifierByUserId  (user_id:string) :Promise<ApiResponse<any>>
    {
        const preQualifier = await this.service.getPrequalifierByUserId(user_id)
        return createResponse(
            StatusCodes.OK,
            `Success`,
            preQualifier 
        )
    }
    public async getAllPreQualifierToBeapproved () :Promise<ApiResponse<any>>
    {
        const preQualifier =   await this.service.getAllPreQualifierToBeapproved()
        return createResponse(
            StatusCodes.OK,
            `Success`,
            preQualifier 
        )
    }
    public async getAllPreQualifierById (id: string) :Promise<ApiResponse<any>>
    {
        const preQualifier =    await this.service.getAllPreQualifierById(id)
        return createResponse(
            StatusCodes.OK,
            `Success`,
            preQualifier
        )
    }
}
