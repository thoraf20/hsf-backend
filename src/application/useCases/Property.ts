import { ApplicationCustomError } from '../../middleware/errors/customError'
import {
  PropertyAddress,
  PropertyDetails,
} from '../../domain/entities/Property'
import { IPropertyRepository } from '../../domain/interfaces/IPropertyRepository'
import { StatusCodes } from 'http-status-codes'

export class PropertyService {
  private propertyRepository: IPropertyRepository
  constructor(propertyRepository: IPropertyRepository) {
    this.propertyRepository = propertyRepository
  }

  async createProperty(
    input: PropertyAddress & PropertyDetails, user_id : string
  ): Promise<PropertyAddress | PropertyDetails> {
    const findIfPropartyExist =
      await this.propertyRepository.findPropertiesName(input.property_name)
    if (findIfPropartyExist.length > 0) {
      throw new ApplicationCustomError(
        StatusCodes.CONFLICT,
        'Property already exist',
      )
    }
    const address = await this.propertyRepository.createAddress({
      street_address: input.street_address,
      city: input.city,
      unit_number: input.unit_number,
      postal_code: input.postal_code,
      landmark: input.landmark,
      state: input.state,
    })

    const properties_details = await this.propertyRepository.createProperty({
      property_name: input.property_name,
      property_address_id: address.id,
      property_type: input.property_type,
      property_size: input.property_size,
      property_price: input.property_price,
      property_description: input.property_description,
      numbers_of_bedroom: input.numbers_of_bedroom,
      numbers_of_bathroom: input.numbers_of_bathroom,
      property_condition: input.property_condition,
      financial_types: JSON.stringify(input.financial_types),
      property_feature: input.property_feature,
      property_images: input.property_images,
      documents: JSON.stringify(input.documents),
      user_id,
    })

    return { ...address, ...properties_details }
  }

  public async getAllProperties(): Promise<Array<PropertyAddress | PropertyDetails>> {
    const fetchProperties = await this.propertyRepository.getAllProperties()
    return fetchProperties
  }

  public async getPropertyById(id: string): Promise<PropertyAddress | PropertyDetails> {
    const fetchProperty = await this.propertyRepository.findPropertyById(id)
    if (!fetchProperty) {
      throw new ApplicationCustomError(
        StatusCodes.NOT_FOUND,
        'Property not found',
      )
    }
    return fetchProperty
  }

  public async getPropertyByUserId(user_id: string): Promise<Array<PropertyAddress | PropertyDetails>> {
    const fetchProperty = await this.propertyRepository.findPropertiesByUserId(user_id)
    return fetchProperty
  }



}


