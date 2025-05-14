import {
  ApiResponse,
  createResponse,
} from '@presentation/response/responseType'
import { PropertyService } from '@application/useCases/Properties/Property'
import { Properties, shareProperty } from '@domain/entities/Property'
import { StatusCodes } from 'http-status-codes'
import { PropertyFilters } from '@validators/propertyValidator'

export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  public async createProperty(
    input: Properties,
    organization_id: string,
  ): Promise<ApiResponse<any>> {
    const property = await this.propertyService.createProperty(
      input,
      organization_id,
    )
    return createResponse(
      StatusCodes.CREATED,
      'Property created successfully',
      property,
    )
  }
  public async getAllProperties(
    PropertyFilters: PropertyFilters,
    userRole: string,
    userId?: string,
  ): Promise<ApiResponse<any>> {
    const properties = await this.propertyService.getAllProperties(
      PropertyFilters,
      userRole,
      userId,
    )
    return createResponse(
      StatusCodes.OK,
      'Properties fetched successfully',
      properties,
    )
  }

  public async getPropertyByDeveloperOrgId(
    orgId: string,
    filters?: PropertyFilters,
  ): Promise<ApiResponse<any>> {
    const properties = await this.propertyService.getPropertyByDeveloperOrg(
      orgId,
      filters,
    )
    return createResponse(
      StatusCodes.OK,
      'Properties fetched successfully',
      properties,
    )
  }

  public async getPropertyByHSFAdmin(
    filters?: PropertyFilters,
  ): Promise<ApiResponse<any>> {
    const properties = await this.propertyService.getPropertyByHSFAdmin(filters)
    return createResponse(
      StatusCodes.OK,
      'Properties fetched successfully',
      properties,
    )
  }

  async getPropertyById(
    id: string,
    user_id: string,
    userRole: string,
  ): Promise<ApiResponse<any>> {
    const property = await this.propertyService.getPropertyById(
      id,
      user_id,
      userRole,
    )
    return createResponse(
      StatusCodes.OK,
      'Property fetched successfully',
      property,
    )
  }
  async updateProperty(
    input: Properties,
    id: string,
    user_id: string,
  ): Promise<ApiResponse<any>> {
    await this.propertyService.updateProperty(id, user_id, input)
    return createResponse(StatusCodes.OK, 'Property updated successfully', {})
  }
  async deleteProperty(id: string, user_id: string): Promise<ApiResponse<any>> {
    await this.propertyService.deleteProperty(id, user_id)
    return createResponse(StatusCodes.OK, 'Property deleted successfully', {})
  }
  async softDeleteProperty(
    id: string,
    user_id: string,
  ): Promise<ApiResponse<any>> {
    await this.propertyService.softDeleteProperty(id, user_id)
    return createResponse(StatusCodes.OK, 'Property deleted successfully', {})
  }

  async addWatchlistProperty(
    property_id: string,
    user_id: string,
  ): Promise<ApiResponse<any>> {
    const watchList = await this.propertyService.addWatchlistProperty(
      property_id,
      user_id,
    )
    return createResponse(
      StatusCodes.OK,
      'Property added to watchlist successfully',
      watchList,
    )
  }

  async getWatchlistProperty(
    user_id: string,
    filters: PropertyFilters,
  ): Promise<ApiResponse<any>> {
    const properties = await this.propertyService.getWatchlistProperty(
      user_id,
      filters,
    )
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

  async propertyApplication(
    user_id: string,
    filter: PropertyFilters,
  ): Promise<ApiResponse<any>> {
    const application = await this.propertyService.propertyApplication({
      ...filter,
      user_id,
    })
    return createResponse(StatusCodes.OK, 'Success', application)
  }

  async propertyShare(
    input: shareProperty,
    user_id: string,
  ): Promise<ApiResponse<any>> {
    await this.propertyService.shareProperty(input, user_id)
    return createResponse(StatusCodes.OK, 'Share property was successful', {})
  }

  async viewProperty(
    property_id: string,
    user_id: string,
  ): Promise<ApiResponse<any>> {
    await this.propertyService.viewProperty(property_id, user_id)
    return createResponse(StatusCodes.OK, 'Success', {})
  }
  async getApplicationById(application_id: string) {
    const application =
      await this.propertyService.getApplicationById(application_id)
    return createResponse(StatusCodes.OK, 'Success', application)
  }
}
