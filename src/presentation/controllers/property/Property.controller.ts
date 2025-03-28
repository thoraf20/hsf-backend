import { ApiResponse, createResponse } from '../../response/responseType'
import { PropertyService } from '../../../application/useCases/Properties/Property'
import { Properties } from '../../../domain/entities/Property'
import { StatusCodes } from 'http-status-codes'


export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  public async createProperty(
    input: Properties,
    user_id: string,
  ): Promise<ApiResponse<any>> {
    const property = await this.propertyService.createProperty(input, user_id)
    return createResponse(
      StatusCodes.CREATED,
      'Property created successfully',
      property,
    )
  }
  public async getAllProperties(): Promise<ApiResponse<any>> {
    const properties = await this.propertyService.getAllProperties()
    return createResponse(
      StatusCodes.OK,
      'Properties fetched successfully',
      properties,
    )
  }

  public async getPropertyByUserId(user_id: string): Promise<ApiResponse<any>> {
    const properties = await this.propertyService.getPropertyByUserId(user_id)
    return createResponse(
      StatusCodes.OK,
      'Properties fetched successfully',
      properties,
    )
  }

  async getPropertyById(id: string): Promise<ApiResponse<any>> {
    const property = await this.propertyService.getPropertyById(id)
    return createResponse(
      StatusCodes.OK,
      'Property fetched successfully',
      property,
    )
  }
  async updateProperty(
    input: Properties,
    id: string,
  ): Promise<ApiResponse<any>> {
    await this.propertyService.updateProperty(id, input)
    return createResponse(StatusCodes.OK, 'Property updated successfully', {})
  }
  async deleteProperty(id: string): Promise<ApiResponse<any>> {
    await this.propertyService.deleteProperty(id)
    return createResponse(StatusCodes.OK, 'Property deleted successfully', {})
  }
  async softDeleteProperty(id: string): Promise<ApiResponse<any>> {
    await this.propertyService.softDeleteProperty(id)
    return createResponse(StatusCodes.OK, 'Property deleted successfully', {})
  }

  async addWatchlistProperty(
    property_id: string,
    user_id: string,
  ): Promise<ApiResponse<any>> {
    await this.propertyService.addWatchlistProperty(property_id, user_id)
    return createResponse(
      StatusCodes.OK,
      'Property added to watchlist successfully',
      {},
    )
  }

  async getWatchlistProperty(user_id: string): Promise<ApiResponse<any>> {
    const properties = await this.propertyService.getWatchlistProperty(user_id)
    return createResponse(
      StatusCodes.OK,
      'Watchlist fetched successfully',
      properties,
    )
  }

  async removeFromWatchList(
    property_id: string,
    user_id: string,
  ): Promise<ApiResponse<any>> {
    await this.propertyService.removePropertyWatchList(property_id, user_id)
    return createResponse(
      StatusCodes.OK,
      'Watchlist was removed successfully',
      {},
    )
  }

 
}
