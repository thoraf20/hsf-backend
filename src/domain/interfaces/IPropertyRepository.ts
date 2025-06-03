import { Properties, shareProperty } from '@domain/entities/Property'
import { EscrowMeetingStatus } from '@domain/enums/propertyEnum'
import { EscrowInformationStatus } from '@entities/PropertyPurchase'
import {
  SeekPaginationOption,
  SeekPaginationResult,
} from '@shared/types/paginate'
import { PropertyCount } from '@shared/types/repoTypes'
import { PropertyFilters } from '@validators/propertyValidator'

export interface IPropertyRepository {
  createProperties(address: Properties): Promise<Properties>

  findPropertyByUser(id: string, user_id?: string): Promise<Properties | null>

  findPropertiesByDeveloperOrg(
    organization_id: string,
    filters?: PropertyFilters,
  ): Promise<SeekPaginationResult<Properties>>

  findPropertiesByHSFAdmin(
    filters?: PropertyFilters,
  ): Promise<SeekPaginationResult<Properties>>

  updateProperty(
    id: string,
    property: Record<string, any>,
  ): Promise<Properties | null>

  findPropertiesByPriceRange(
    min: number,
    max: number,
    paginate?: SeekPaginationOption,
  ): Promise<SeekPaginationResult<Properties>>

  findPropertiesName(property_name: string): Promise<Properties>

  getAllProperties(
    filters?: PropertyFilters,
    userRole?: string,
    userId?: string,
  ): Promise<SeekPaginationResult<Properties> | any>

  softDeleteProperty(id: string): Promise<boolean>

  deleteProperty(id: string): Promise<boolean>

  addWatchlistProperty(
    property_id: string,
    user_id: string,
  ): Promise<Record<string, any>>

  getWatchlistProperty(
    user_id: string,
    filters?: PropertyFilters,
  ): Promise<SeekPaginationResult<Properties>>

  getIfWatchListPropertyIsAdded(
    property_id: string,
    user_id: string,
  ): Promise<Properties | null>

  removeWatchList(property_id: string, user_id: string): Promise<boolean>

  ApproveOrDisApproveProperties(
    property_id: string,
    input: Record<string, any>,
  ): Promise<Properties>

  getAllPropertiesTobeApproved(
    filters?: Record<string, any>,
  ): Promise<SeekPaginationResult<Properties>>

  getAllUserPropertyCount(
    organization_id: string,
    filters?: { listed_by?: string },
  ): Promise<PropertyCount>

  viewProperty(input: Record<string, any>): Promise<void>

  findIfUserAlreadyViewProperty(
    property_id: string,
    user_id: string,
  ): Promise<Record<string, null>>

  shareProperty(input: shareProperty): Promise<void>

  propertyApplications(
    user_id: string,
    filters: PropertyFilters,
  ): Promise<SeekPaginationResult<any>>

  findSharedProperty(
    property_id: string,
    user_id: string,
  ): Promise<shareProperty>

  getPropertyById(property_id: string): Promise<Properties>

  updateEscrowMeeting(
    property_id: string,
    user_id: string,
    status: EscrowMeetingStatus,
  ): Promise<EscrowInformationStatus>

  UpdatepropertyClosingRequest(input: Record<string, any>): Promise<void>
}
