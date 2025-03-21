import db from '../../database/knex'
import { IPropertyRepository } from '../../../domain/interfaces/IPropertyRepository'
import {
  PropertyDetails,
  PropertyAddress,
} from '../../../domain/entities/Property'

export class PropertyRepository implements IPropertyRepository {
  async createAddress(address: PropertyAddress): Promise<PropertyAddress> {
    const [newAddress] = await db('property_address')
      .insert(address)
      .returning('*')
    return new PropertyAddress(newAddress)
  }

  async createProperty(property: PropertyDetails): Promise<PropertyDetails> {
    const [newProperty] = await db('property_details')
      .insert(property)
      .returning('*')
    return new PropertyDetails(newProperty)
  }
  async getAllProperties(
    filters?: Record<string, any>,
  ): Promise<PropertyDetails[]> {
    let query = db('property_details')
      .join(
        'property_address',
        'property_details.property_address_id',
        '=',
        'property_address.id',
      )
      .select('property_details.*', 'property_address.*')

    if (filters) {
      if (filters.city) {
        query = query.where('property_address.city', filters.city)
      }
      if (filters.minPrice && filters.maxPrice) {
        query = query.whereBetween('property_details.property_price', [
          filters.minPrice,
          filters.maxPrice,
        ])
      }
      if (filters.propertyName) {
        if (filters) {
          if (filters.city) {
            query = query.where('property_address.city', filters.city)
          }
          if (filters.minPrice && filters.maxPrice) {
            query = query.whereBetween('property_details.property_price', [
              filters.minPrice,
              filters.maxPrice,
            ])
          }
          if (filters.propertyName) {
            query = query.where(
              'property_details.property_name',
              filters.propertyName,
            )
          }
          if (filters.limit) {
            query = query.limit(filters.limit)
          }
          if (filters.offset) {
            query = query.offset(filters.offset)
          }
        }

        const properties = await query
        return properties.map((property) => new PropertyDetails(property))
      }
    }

    return query
  }

  async findPropertyById(id: string): Promise<PropertyDetails | null> {
    const property = await db('property_address')
    .leftJoin(
      'property_details',
      'property_address.id',
      '=',
      'property_details.property_address_id',
    )
    .select('property_details.*', 'property_address.*')
    .where('property_address.id', id)
    .first()
    return property ? new PropertyDetails(property) : null
  }

  async findAddressById(id: string): Promise<PropertyAddress | null> {
    const address = await db('property_address').where({ id }).first()
    return address ? new PropertyAddress(address) : null
  }

  async updateProperty(
    id: string,
    property: Record<string, any>,
  ): Promise<PropertyDetails | null> {
    const [updatedProperty] = await db('property_details')
      .where({ id })
      .update(property)
      .returning('*')
    return updatedProperty ? new PropertyDetails(updatedProperty) : null
  }

  async updateAddress(
    id: string,
    address: Record<string, any>,
  ): Promise<PropertyAddress | null> {
    const [updatedAddress] = await db('property_address')
      .where({ id })
      .update(address)
      .returning('*')
    return updatedAddress ? new PropertyAddress(updatedAddress) : null
  }

  async findPropertiesByCity(city: string): Promise<PropertyDetails[]> {
    const properties = await db('property_details')
      .join(
        'property_address',
        'property_details.property_address_id',
        '=',
        'property_address.id',
      )
      .where('property_address.city', city)
      .select('property_details.*')

    return properties.map((property) => new PropertyDetails(property))
  }

  async findPropertiesByPriceRange(
    min: number,
    max: number,
  ): Promise<PropertyDetails[]> {
    const properties = await db('property_details')
      .whereBetween('property_price', [min, max])
      .select('*')

    return properties.map((property) => new PropertyDetails(property))
  }

  async findPropertiesName(property_name: string): Promise<PropertyDetails[]> {
    const properties = await db('property_details')
      .where('property_name', property_name)
      .select('*')

    return properties.map((property) => new PropertyDetails(property))
  }

  async findPropertiesByUserId(user_id: string, filters?: Record<string, any>,): Promise<PropertyDetails[]> {
    let query = db('property_details')
    .join(
      'property_address',
      'property_details.property_address_id',
      '=',
      'property_address.id',
    )
    .select('property_details.*', 'property_address.*')
    .where('property_details.user_id', user_id)

  if (filters) {
    if (filters.city) {
      query = query.where('property_address.city', filters.city)
    }
    if (filters.minPrice && filters.maxPrice) {
      query = query.whereBetween('property_details.property_price', [
        filters.minPrice,
        filters.maxPrice,
      ])
    }
    if (filters.propertyName) {
      if (filters) {
        if (filters.city) {
          query = query.where('property_address.city', filters.city)
        }
        if (filters.minPrice && filters.maxPrice) {
          query = query.whereBetween('property_details.property_price', [
            filters.minPrice,
            filters.maxPrice,
          ])
        }
        if (filters.propertyName) {
          query = query.where(
            'property_details.property_name',
            filters.propertyName,
          )
        }
        if (filters.limit) {
          query = query.limit(filters.limit)
        }
        if (filters.offset) {
          query = query.offset(filters.offset)
        }
      }

      const properties = await query
      return properties.map((property) => new PropertyDetails(property))
    }
  }

  return query
  }
}
