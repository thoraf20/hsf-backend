import { PropertyFilters } from '@shared/types/repoTypes'
import { Properties } from '@domain/entities/Property'
import { IPropertyRepository } from '@domain/interfaces/IPropertyRepository'
import { PropertyBaseUtils } from '../utils'
import { SeekPaginationResult } from '@shared/types/paginate'

export class PropertyService {
  private propertyRepository: IPropertyRepository
  private readonly utilsProperty: PropertyBaseUtils
  constructor(propertyRepository: IPropertyRepository) {
    this.propertyRepository = propertyRepository
    this.utilsProperty = new PropertyBaseUtils(this.propertyRepository)
  }

  async createProperty(
    input: Properties,
    user_id: string,
  ): Promise<Properties> {
    await this.utilsProperty.findIfPropertyExistByName(input.property_name)

    const address = await this.propertyRepository.createProperties(
      new Properties({
        ...input,
        documents: JSON.stringify(input.documents),
        user_id,
      }),
    )
    return { ...address }
  }

  public async getAllProperties(filter?: PropertyFilters,  userRole?: string, userId?: string): Promise<SeekPaginationResult<Properties>> {
    const fetchProperties = await this.propertyRepository.getAllProperties(filter, userRole, userId)
    return fetchProperties
  }

  public async getPropertyById(id: string, user_id: string,  userRole: string ): Promise<Properties> {
    const fetchProperty = await this.utilsProperty.findIfPropertyExist(id, user_id, userRole)
    return fetchProperty
  }

  public async getPropertyByUserId(
    user_id: string,
    filters?: PropertyFilters,
  ): Promise<SeekPaginationResult<Properties>> {
    const fetchProperty = await this.propertyRepository.findPropertiesByUserId(
      user_id,
      filters,
    )
    return fetchProperty
  }

  public async updateProperty(
    id: string,
    user_id: string,
    input: Partial<Properties>,
  ): Promise<Properties> {
    await this.utilsProperty.findIfPropertyBelongsToUser(id, user_id)
    const existingProperty = await this.utilsProperty.findIfPropertyExist(id)

    if (input.property_name) {
      await this.utilsProperty.findIfPropertyExistByName(input.property_name)
    }

    const updateData = Object.fromEntries(
      Object.entries({
        ...input,
        financial_types: input.financial_types
          ? JSON.stringify(input.financial_types)
          : undefined,
        documents: input.documents
          ? JSON.stringify(input.documents)
          : undefined,
      }).filter(([_, v]) => v !== undefined), // Remove undefined values
    )

    if (Object.keys(updateData).length > 0) {
      await this.propertyRepository.updateProperty(id, updateData)
    }

    return { ...existingProperty, ...updateData }
  }

  public async deleteProperty(id: string, user_id: string): Promise<boolean> {
    await this.utilsProperty.findIfPropertyBelongsToUser(id, user_id)
    await this.utilsProperty.findIfPropertyExist(id)
    return this.propertyRepository.deleteProperty(id)
  }

  public async softDeleteProperty(
    id: string,
    user_id: string,
  ): Promise<boolean> {
    await this.utilsProperty.findIfPropertyBelongsToUser(id, user_id)
    await this.utilsProperty.findIfPropertyExist(id)
    return await this.propertyRepository.softDeleteProperty(id)
  }

  public async addWatchlistProperty(
    property_id: string,
    user_id: string,
  ): Promise<Record<string, any>> {
    await Promise.all([
      this.utilsProperty.findIfPropertyExist(property_id),
      this.utilsProperty.findIfWatchListIsAdded(property_id, user_id),
    ])
    return await this.propertyRepository.addWatchlistProperty(
      property_id,
      user_id,
    )
  }

  public async getWatchlistProperty(
    user_id: string,
  ): Promise<SeekPaginationResult<Properties>> {
    return await this.propertyRepository.getWatchlistProperty(user_id)
  }

  public async removePropertyWatchList(
    property_id: string,
    user_id: string,
  ): Promise<boolean> {
    await this.utilsProperty.findIfPropertyExist(property_id)
    return await this.propertyRepository.removeWatchList(property_id, user_id)
  }
}
