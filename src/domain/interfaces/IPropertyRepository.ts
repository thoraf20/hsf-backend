import { PropertyDetails, PropertyAddress } from '../../domain/entities/Property'


export interface IPropertyRepository {
  createAddress(address: PropertyAddress): Promise<PropertyAddress>
  createProperty(property: PropertyDetails): Promise<PropertyDetails>
  findPropertyById(id: string): Promise<PropertyDetails | null>
  findAddressById(id: string): Promise<PropertyAddress | null>
  updateProperty(id: string, property: Record<string, any>): Promise<PropertyDetails | null>
  updateAddress(id: string, address: Record<string, any>): Promise<PropertyAddress | null>
  findPropertiesByCity(city: string): Promise<PropertyDetails[]>
  findPropertiesByPriceRange(min: number, max: number): Promise<PropertyDetails[]>
  findPropertiesName(property_name: string): Promise<PropertyDetails[]>
  getAllProperties(filters?: Record<string, any>): Promise<PropertyDetails[]>
}
