import { ApiResponse, createResponse } from "../response/responseType";
import { PropertyService } from "../../application/useCases/Property";
import { PropertyAddress, PropertyDetails } from "../../domain/entities/Property";
import { StatusCodes } from "http-status-codes";



export class PropertyController { 

    constructor(private readonly propertyService: PropertyService) {}

    public async createProperty(input: PropertyAddress & PropertyDetails, user_id: string): Promise<ApiResponse<any>> {
        const property = await this.propertyService.createProperty(input, user_id)
        return createResponse(
            StatusCodes.CREATED,
            'Property created successfully',
            property
        )
    }
    public async getAllProperties(): Promise<ApiResponse<any>> {
        const properties = await this.propertyService.getAllProperties()
        return createResponse(
            StatusCodes.OK,
            'Properties fetched successfully',
            properties
        )
    }

    public async getPropertyByUserId(user_id: string): Promise<ApiResponse<any>> {
        const properties = await this.propertyService.getPropertyByUserId(user_id)
        return createResponse(
            StatusCodes.OK,
            'Properties fetched successfully',
            properties
        )
    }

    async getPropertyById(id: string): Promise<ApiResponse<any>> {
        const property = await this.propertyService.getPropertyById(id)
        return createResponse(
            StatusCodes.OK,
            'Property fetched successfully',
            property
        )
    }
}