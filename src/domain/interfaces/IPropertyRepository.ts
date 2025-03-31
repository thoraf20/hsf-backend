import { Properties } from '@domain/entities/Property'
import { SeekPaginationOption, SeekPaginationResult } from '@shared/types/paginate'
import { PropertyCount, PropertyFilters } from '@shared/types/repoTypes'

export interface IPropertyRepository {
  createProperties(address: Properties): Promise<Properties>

  findPropertyById(id: string): Promise<Properties | null>

  findPropertiesByUserId(user_id: string, filters?: PropertyFilters): Promise<SeekPaginationResult<Properties>>
  
  updateProperty(id: string, property: Record<string, any>): Promise<Properties | null>
  
  findPropertiesByPriceRange(min: number, max: number, paginate?: SeekPaginationOption): Promise<SeekPaginationResult<Properties>>
  
  findPropertiesName(property_name: string): Promise<Properties>
  
  getAllProperties(filters?: PropertyFilters): Promise<SeekPaginationResult<Properties>>
  
  softDeleteProperty(id: string): Promise<boolean>
  
  deleteProperty(id: string): Promise<boolean>
  
  addWatchlistProperty(property_id: string, user_id: string): Promise<boolean>
  
  getWatchlistProperty(user_id: string): Promise<Properties[]>
  
  getIfWatchListPropertyIsAdded (property_id: string, user_id: string): Promise<Properties | null>
  
  removeWatchList (property_id: string, user_id: string): Promise<boolean>
  
  ApproveOrDisApproveProperties(property_id: string, input: Record<string, any>): Promise<void | number>
  
  getAllPropertiesTobeApproved(filters?: Record<string, any>): Promise<SeekPaginationResult<Properties>>
  
  getAllUserPropertyCount(user_id: string): Promise<PropertyCount>
}
