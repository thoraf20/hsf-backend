import { PropertyFilters } from '@shared/types/repoTypes'
import { Properties, shareProperty } from '@domain/entities/Property'
import { IPropertyRepository } from '@domain/interfaces/IPropertyRepository'
import { PropertyBaseUtils } from '../utils'
import { SeekPaginationResult } from '@shared/types/paginate'
import emailTemplates from '@infrastructure/email/template/constant'
import { IApplicationRespository } from '@interfaces/IApplicationRespository'
import { ApplicationCustomError } from '@middleware/errors/customError'
import { StatusCodes } from 'http-status-codes'
export class PropertyService {
  private propertyRepository: IPropertyRepository
  private readonly utilsProperty: PropertyBaseUtils
  private readonly applicationRepository: IApplicationRespository
  constructor(
    propertyRepository: IPropertyRepository,
    applicationRepository: IApplicationRespository,
  ) {
    this.propertyRepository = propertyRepository
    this.applicationRepository = applicationRepository
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

  public async getAllProperties(
    filter?: PropertyFilters,
    userRole?: string,
    userId?: string,
  ): Promise<SeekPaginationResult<Properties>> {
    const fetchProperties = await this.propertyRepository.getAllProperties(
      filter,
      userRole,
      userId,
    )
    return fetchProperties
  }

  public async getPropertyById(
    id: string,
    user_id: string,
    userRole: string,
  ): Promise<Properties> {
    const fetchProperty = await this.utilsProperty.findIfPropertyExist(
      id,
      user_id,
      userRole,
    )
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
    const existingProperty = await this.utilsProperty.getIfPropertyExist(id)

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
    await this.utilsProperty.getIfPropertyExist(id)
    return this.propertyRepository.deleteProperty(id)
  }

  public async softDeleteProperty(
    id: string,
    user_id: string,
  ): Promise<boolean> {
    await this.utilsProperty.findIfPropertyBelongsToUser(id, user_id)
    await this.utilsProperty.getIfPropertyExist(id)
    return await this.propertyRepository.softDeleteProperty(id)
  }

  public async addWatchlistProperty(
    property_id: string,
    user_id: string,
  ): Promise<Record<string, any>> {
    await Promise.all([
      this.utilsProperty.getIfPropertyExist(property_id),
      this.utilsProperty.findIfWatchListIsAdded(property_id, user_id),
    ])
    return await this.propertyRepository.addWatchlistProperty(
      property_id,
      user_id,
    )
  }

  public async getWatchlistProperty(
    user_id: string,
    filters: PropertyFilters,
  ): Promise<SeekPaginationResult<Properties>> {
    return await this.propertyRepository.getWatchlistProperty(user_id, filters)
  }

  public async removePropertyWatchList(
    property_id: string,
    user_id: string,
  ): Promise<boolean> {
    await this.utilsProperty.getIfPropertyExist(property_id)
    return await this.propertyRepository.removeWatchList(property_id, user_id)
  }

  public async propertyApplication(
    user_id: string,
    filters: PropertyFilters,
  ): Promise<SeekPaginationResult<any>> {
    return await this.applicationRepository.getAllUserApplication(
      user_id,
      filters,
    )
  }

  public async shareProperty(
    input: shareProperty,
    user_id: string,
  ): Promise<void> {
    const property = await this.utilsProperty.getIfPropertyExist(
      input.property_id,
    )

    const shared = await this.propertyRepository.findSharedProperty(
      input.property_id,
      user_id,
    )

    if (shared) {
      this.sharedEmailProperty(
        input.recipient_email,
        input.sender_email,
        input.message,
        {
          property_images: property.property_images,
          property_name: property.property_name,
          street_address: property.street_address,
          city: property.city,
          state: property.state,
          property_price: property.property_price,
          property_type: property.property_type,
          postal_code: property.postal_code,
          property_size: property.property_size,
          numbers_of_bedroom: property.numbers_of_bedroom,
          numbers_of_bathroom: property.numbers_of_bathroom,
        },
      )
      return
    }

    await this.propertyRepository.shareProperty({
      message: input.message,
      property_id: input.property_id,
      sender_email: input.sender_email,
      recipient_email: input.recipient_email,
      user_id,
    })

    this.sharedEmailProperty(
      input.recipient_email,
      input.sender_email,
      input.message,
      {
        property_images: property.property_images,
        property_name: property.property_name,
        street_address: property.street_address,
        city: property.city,
        state: property.state,
        property_price: property.property_price,
        property_type: property.property_type,
        postal_code: property.postal_code,
        property_size: property.property_size,
        numbers_of_bedroom: property.numbers_of_bedroom,
        numbers_of_bathroom: property.numbers_of_bathroom,
      },
    )
  }

  public sharedEmailProperty(
    recipient_email: string,
    sender_email: string,
    message: string,
    input: Partial<Properties>,
  ) {
    return emailTemplates.sharePropertyEmail(
      recipient_email,
      sender_email,
      message || '',
      '',
      input,
    )
  }

  public async viewProperty(
    property_id: string,
    user_id: string,
  ): Promise<void | boolean> {
    await this.utilsProperty.getIfPropertyExist(property_id)
    const checkIfViewsIsRecorded =
      await this.propertyRepository.findIfUserAlreadyViewProperty(
        property_id,
        user_id,
      )
    if (checkIfViewsIsRecorded) {
      return false
    }
    await this.propertyRepository.viewProperty({ property_id, user_id })
  }

  async getApplicationById(application_id: string): Promise<Properties> {
    const application =
      await this.applicationRepository.getApplicationById(application_id)
    if (!application) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        `Unable to get application`,
      )
    }

    return await this.applicationRepository.getApplicationById(application_id)
  }
}
