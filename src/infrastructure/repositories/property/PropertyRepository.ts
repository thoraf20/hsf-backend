import db from '@infrastructure/database/knex'
import { IPropertyRepository } from '@domain/interfaces/IPropertyRepository'
import { Properties } from '@domain/entities/Property'
import {
  PropertyCount,
  PropertyFilters,
  propertyStatusFilter,
  SortDateBy,
} from '@shared/types/repoTypes'
import {
  SeekPaginationOption, 
  SeekPaginationResult,
} from '@shared/types/paginate'
import { Knex } from 'knex'

export class PropertyRepository implements IPropertyRepository {
  async createProperties(property: Properties): Promise<Properties> {
    const [newProperty] = await db('properties').insert(property).returning('*')
    return new Properties(newProperty)
  }

  useFilter(query: Knex.QueryBuilder<any, any[]>, filters?: PropertyFilters) {
    let q = query
    if (filters == null) return q

    if (filters.sortBy) {
      switch (filters.sortBy) {
        case SortDateBy.RecentlyAdded:
          q = q.orderBy('created_at', 'desc') // Newest first
          break
        case SortDateBy.LastUpdated:
          q = q.orderBy('updated_at', 'desc') // Recently updated first
          break
        case SortDateBy.Earliest:
          q = q.orderBy('created_at', 'asc') // Oldest first
          break
      }
    }

    if (filters.property_type) {
      q = q.where('property_type', 'ILIKE', `%${filters.property_type}%`)
    }

    if (filters.financing_type) {
      q = q.whereRaw('? ILIKE ANY(financial_types)', [filters.financing_type])
    }

    if (filters.max_price) {
      q = q.whereBetween('property_price', [
        filters?.min_price || '1',
        filters.max_price,
      ])
    }

    if (filters.property_status) {
      switch (filters.property_status) {
        case propertyStatusFilter.Available:
          q = q.where({ is_sold: false, is_live: false })
          break
        case propertyStatusFilter.Pending:
          q = q.where({ is_live: false })
          break

        case propertyStatusFilter.Sold:
          q = q.where({ is_sold: true })
          break
      }
    }

    if (filters.bedrooms) {
      q = q.where({ numbers_of_bedroom: filters.bedrooms })
    }

    if (filters.bathrooms) {
      q = q.where({ numbers_of_bathroom: filters.bathrooms })
    }

    if (filters.property_features) {
      for (var feat of filters.property_features.split('*')) {
        q = q.whereRaw('? ILIKE ANY(property_feature)', [feat])
      }
    }
    return q
  }

  async getAllProperties(
    filters?: PropertyFilters,
    userRole?: string | "guest",
    userId?: string 
  ): Promise<SeekPaginationResult<Properties>> {
    let query = db('properties')
      .select('properties.*')
      .where({ is_live: true })
      .orderBy('properties.id', 'desc');
    if (userId) {
      query = query.select(
        db.raw(
          `(SELECT EXISTS (
            SELECT 1 FROM property_watchlist 
            WHERE property_watchlist.property_id = properties.id 
            AND property_watchlist.user_id = ?
          )) AS is_whitelisted`,
          [userId]
        )
      );
    }
 
    query = query
      .join('users', 'users.id', '=', 'properties.user_id')
      .modify((qb) => {
        if (!['super_admin', 'admin', 'developer'].includes(userRole)) {
          qb.select(db.raw("NULL as documents"));
        }
      });
  
    query = this.useFilter(query, filters);
    if (filters?.result_per_page && filters?.page_number) {
      const offset = (filters.page_number - 1) * filters.result_per_page;
      query = query.limit(filters.result_per_page).offset(offset);
    }
  
    const r = await query;

    const results = r.map((item) => {
      const isWhitelisted = item.is_whitelisted
      return { ...item, is_whitelisted: isWhitelisted };
    });
  
   
    return new SeekPaginationResult<Properties>({
      result: results, 
      page: filters?.page_number || 1,
      result_per_page: filters?.result_per_page || results.length,
    });
  }
  
  

  async findPropertyById(id: string, userRole?: string): Promise<Properties | null> {
    let query = db('properties')
    .select('properties.*')
    .where({ is_live: true })
    .andWhere('properties.id', id)
    .first()
    .orderBy('properties.id', 'desc');

  query = query
    .join('users', 'users.id', '=', 'properties.user_id')
    .modify((qb) => {
      if (!['super_admin', 'admin', 'developer'].includes(userRole)) {
        qb.select(db.raw("NULL as documents")); 
      }
    });
    return  query
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
    paginate?: SeekPaginationOption,
  ): Promise<SeekPaginationResult<Properties>> {
    let query = db('properties')
      .whereBetween('property_price', [min, max])
      .select('*')

    if (paginate) {
      const offset = (paginate.page_number - 1) * paginate.result_per_page
      query = query.limit(paginate.result_per_page).offset(offset)
    }

    const results = (await query).map((property) => new Properties(property))

    return new SeekPaginationResult<Properties>({
      result: results,
      page: paginate?.page_number || 1,
      result_per_page: paginate?.result_per_page || results.length,
    })
  }

  async findPropertiesName(property_name: string): Promise<Properties> {
    const property = await db('properties')
      .where('property_name', property_name)
      .first()
    return property ? new Properties(property) : null
  }

  async getAllUserPropertyCount(user_id: string): Promise<PropertyCount> {
    let properties = (await db('properties')
      .select('properties.*')
      .where('properties.user_id', user_id)
      .orderBy('properties.id', 'desc')) as Properties[]

    const queryresp = properties.reduce(
      (acc: PropertyCount, curr: Properties) => {
        return {
          total: acc.total + 1,
          pending: acc.pending + (curr.is_live ? 0 : 1),
          totalViewed: 0,
        }
      },
      { total: 0, pending: 0, totalViewed: 0 },
    )

    return queryresp
  }

  async findPropertiesByUserId(
    user_id: string,
    filters?: PropertyFilters,
  ): Promise<SeekPaginationResult<Properties>> {
    let query = db('properties')
      .select('properties.*')
      .where('properties.user_id', user_id)
      .orderBy('properties.id', 'desc')

    query = this.useFilter(query, filters)

    if (filters) {
      if (filters?.result_per_page && filters?.page_number) {
        const offset = (filters.page_number - 1) * filters.result_per_page
        query = query.limit(filters.result_per_page).offset(offset)
      }
    }

    const results = (await query).map((item) => new Properties(item))

    return new SeekPaginationResult<Properties>({
      result: results,
      page: filters?.page_number || 1,
      result_per_page: filters?.result_per_page || results.length,
    })
  }

  async softDeleteProperty(id: string): Promise<boolean> {
    return await db('properties')
      .where({ id })
      .update({ deleted_at: new Date() })
  }

  async deleteProperty(id: string): Promise<boolean> {
    return await db('properties').where({ id }).delete()
  }

  async addWatchlistProperty(
    property_id: string,
    user_id: string,
  ): Promise<boolean> {
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

  async getIfWatchListPropertyIsAdded(
    property_id: string,
    user_id: string,
  ): Promise<Properties | null> {
    return await db('property_watchlist')
      .where('property_id', property_id)
      .andWhere('user_id', user_id)
      .first()
  }

  async removeWatchList(
    property_id: string,
    user_id: string,
  ): Promise<boolean> {
    return await db('property_watchlist')
      .where('property_id', property_id)
      .andWhere('user_id', user_id)
      .del()
  }

  async ApproveOrDisApproveProperties(
    property_id: string,
    input: Record<string, any>,
  ): Promise<void | number> {
    const properties = await db('properties')
      .update(input)
      .where('id', property_id)
    return properties
  }

  // get property to be approved By admin
  async getAllPropertiesTobeApproved(filters?: PropertyFilters): Promise<SeekPaginationResult<Properties>> {
    let query = db('properties')
      .select('properties.*')
      .orderBy('properties.id', 'desc');

    if (filters) {
      query = this.useFilter(query, filters);
  
      if (filters.result_per_page && filters.page_number) {
        const offset = (filters.page_number - 1) * filters.result_per_page;
        query = query.limit(filters.result_per_page).offset(offset);
      }
    }
    const results = await query;
    const properties = results.map((item) => new Properties(item));
    return new SeekPaginationResult<Properties>({
      result: properties,
      page: filters?.page_number || 1,
      result_per_page: filters?.result_per_page || properties.length,
    });
  }
  
}
