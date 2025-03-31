import { createResponse } from "@presentation/response/responseType";
import { manageDeveloperProperty } from "@use-cases/Developer/developer";
import { StatusCodes } from "http-status-codes";



export class DeveloperController{

    constructor(
        private readonly manageDevPropertyService : manageDeveloperProperty
    ){}

    async propertySold(developer_id: string, property_id: string){
        await this.manageDevPropertyService.markAsSold(developer_id, property_id)
        const message = 'Property status changed successfully';
        return createResponse(StatusCodes.OK, message, {})
    }

    async allPropertyStats(developer_id: string){
        await this.manageDevPropertyService.PropertyStats(developer_id)
        const message = 'successful';
        return createResponse(StatusCodes.OK, message, {})
    }
}