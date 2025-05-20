import { createResponse } from "@presentation/response/responseType";
import { SeekPaginationOption } from "@shared/types/paginate";
import { ManageDeveloper } from "@use-cases/Developer/developer";
import { PropertyFilters } from "@validators/propertyValidator";
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

    async getAllClients(developer_id: string, paginate: SeekPaginationOption){
        let clients = await this.developerService.getAllClient(developer_id, paginate)
        return createResponse(StatusCodes.OK, 'successful', clients);
    }

    async getAllPayments(developer_id: string, paginate: SeekPaginationOption){
        let payments = await this.developerService.getAllPayments(developer_id, paginate)
        return createResponse(StatusCodes.OK, 'successful', payments);
    }

    async getPaymentsInfo(developer_id: string, payment_id: string){
        let payment = await this.developerService.getPaymentsInfo(developer_id, payment_id)
        return createResponse(StatusCodes.OK, 'successful', payment);
    }
}