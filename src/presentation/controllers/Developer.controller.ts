import { createResponse } from "@presentation/response/responseType";
import { PropertyFilters } from "@shared/types/repoTypes";
import { ManageDeveloper } from "@use-cases/Developer/developer";
import { StatusCodes } from "http-status-codes";



export class DeveloperController{

    constructor(
        private readonly developerService : ManageDeveloper
    ){}

    async propertySold(developer_id: string, property_id: string){
        await this.developerService.markAsSold(developer_id, property_id)
        const message = 'Property status changed successfully';
        return createResponse(StatusCodes.OK, message, {})
    }

    async allPropertyStats(developer_id: string){
        await this.developerService.PropertyStats(developer_id)
        const message = 'successful';
        return createResponse(StatusCodes.OK, message, {})
    }

    async getPropertyLeads(developer_id: string, filters: PropertyFilters){
        const result = await this.developerService.getAllLeads(developer_id, filters);
        const message = 'successful';
        return createResponse(StatusCodes.OK, message, result)
    }

    async getPropertyLeadInfo(developer_id: string, lead_id: string,
        lead_type: 'inspection' | 'enquiry',){
        const result = await this.developerService.getLeadInfo(developer_id, lead_id, lead_type);
        const message = 'successful';
        return createResponse(StatusCodes.OK, message, result)
    }
}