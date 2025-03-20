import { ApiResponse, createResponse } from "../response/responseType";
import { PropertyService } from "../../application/useCases/Property";
import { PropertyAddress, PropertyDetails } from "../../domain/entities/Property";
import { StatusCodes } from "http-status-codes";



export class PropertyController { 

    constructor(private readonly propertyService: PropertyService) {}

    public async createProperty(input: PropertyAddress & PropertyDetails): Promise<ApiResponse<any>> {
        const property = await this.propertyService.createProperty(input)
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
}