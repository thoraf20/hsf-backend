import db from '../../database/knex'
import { IPropertyRepository } from '../../../domain/interfaces/IPropertyRepository'
import {
  Properties,
} from '../../../domain/entities/Property'

export class PropertyRepository implements IPropertyRepository {
  async createProperties(property: Properties): Promise<Properties> {
    const [newProperty] = await db('properties')
      .insert(property)
      .returning('*')
    return new Properties(newProperty)
  }


  async getAllProperties(
    filters?: Record<string, any>,
  ): Promise<Properties[]> {
    let query = db('properties')
    
      .select('properties.*')

    if (filters) {
      if (filters.city) {
        query = query.where('properties.city', filters.city)
      }
      if (filters.minPrice && filters.maxPrice) {
        query = query.whereBetween('properties.property_price', [
          filters.minPrice,
          filters.maxPrice,
        ])
      }
      if (filters.propertyName) {
        if (filters) {
          if (filters.city) {
            query = query.where('properties.city', filters.city)
          }
          if (filters.minPrice && filters.maxPrice) {
            query = query.whereBetween('properties.property_price', [
              filters.minPrice,
              filters.maxPrice,
            ])
          }
          if (filters.propertyName) {
            query = query.where(
              'properties.property_name',
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
        return properties.map((property) => new Properties(property))
      }
    }

    return query
  }

  
  async findPropertyById(id: string): Promise<Properties | null> {
    const property = await db('properties')
      .select('properties.*')
      .where('id', id)
      .first()
      if (!property) {
        return null
      }
    return {
      ...new Properties(property), 
    }
  }


  async updateProperty(
    id: string,
    property: Record<string, any>,
  ): Promise<Properties | null> {
    const [updatedProperty] = await db('properties')
      .where({ id })
      .update(property)
      .returning('*')
    return updatedProperty ? new Properties(updatedProperty) : null
  }


  async findPropertiesByPriceRange(
    min: number,
    max: number,
  ): Promise<Properties[]> {
    const properties = await db('properties')
      .whereBetween('property_price', [min, max])
      .select('*')

    return properties.map((property) => new Properties(property))
  }

  async findPropertiesName(property_name: string): Promise<Properties> {
    const property = await db('properties')
      .where('property_name', property_name)
      .first()
    return property ? new Properties(property) : null
  }

  async findPropertiesByUserId(user_id: string, filters?: Record<string, any>,): Promise<Properties[]> {
    let query = db('properties')
    .select('properties.*')
    .where('properties.user_id', user_id)

  if (filters) {
    if (filters.city) {
      query = query.where('properties.city', filters.city)
    }
    if (filters.minPrice && filters.maxPrice) {
      query = query.whereBetween('properties.property_price', [
        filters.minPrice,
        filters.maxPrice,
      ])
    }
    if (filters.propertyName) {
      if (filters) {
        if (filters.city) {
          query = query.where('properties.city', filters.city)
        }
        if (filters.minPrice && filters.maxPrice) {
          query = query.whereBetween('properties.property_price', [
            filters.minPrice,
            filters.maxPrice,
          ])
        }
        if (filters.propertyName) {
          query = query.where(
            'properties.property_name',
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
      return properties.map((property) => new Properties(property))
    }
  }

  return query
  }

  async softDeleteProperty(id: string): Promise<boolean> {
    return await db('properties').where({ id }).update({ deleted_at: new Date() })
  }

  async deleteProperty(id: string): Promise<boolean> {
    return await db('properties').where({ id }).delete()
  }

  async addWatchlistProperty(property_id: string, user_id: string): Promise<boolean> {
        const [watchlist] = await db('property_watchlist')
          .insert({ property_id, user_id })
          .returning('*')
      return watchlist ? true : false
  }

  async getWatchlistProperty(user_id: string): Promise<Properties[]> {

    const properties = await db('property_watchlist')
      .where('property_watchlist.user_id', user_id)
      .join('properties', 'property_watchlist.property_id', 'properties.id')
      .select('properties.*')

    return properties.map((property) => new Properties(property))
  }


   async getIfWatchListPropertyIsAdded(property_id: string, user_id: string): Promise<Properties | null> {
         return await db('property_watchlist').where('property_id', property_id).andWhere('user_id', user_id).first()
  }

  async removeWatchList(property_id: string, user_id: string): Promise<boolean> {
          return await db('property_watchlist').where('property_id', property_id).andWhere('user_id', user_id).del()
  }
}
