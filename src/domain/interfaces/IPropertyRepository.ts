import { Properties } from '../../domain/entities/Property'


export interface IPropertyRepository {
  createProperties(address: Properties): Promise<Properties>
  findPropertyById(id: string): Promise<Properties | null>
  findPropertiesByUserId(user_id: string): Promise<Properties[]>
  updateProperty(id: string, property: Record<string, any>): Promise<Properties | null>
  findPropertiesByPriceRange(min: number, max: number): Promise<Properties[]>
  findPropertiesName(property_name: string): Promise<Properties>
  getAllProperties(filters?: Record<string, any>): Promise<Properties[]>
  softDeleteProperty(id: string): Promise<boolean>
  deleteProperty(id: string): Promise<boolean>
  addWatchlistProperty(property_id: string, user_id: string): Promise<boolean>
  getWatchlistProperty(user_id: string): Promise<Properties[]>
  getIfWatchListPropertyIsAdded (property_id: string, user_id: string): Promise<Properties | null>
  removeWatchList (property_id: string, user_id: string): Promise<boolean>
  ApproveOrDisApproveProperties(property_id: string, input: Record<string, any>): Promise<void | number>
  getAllPropertiesTobeApproved(filters?: Record<string, any>): Promise<Properties[]>
}
