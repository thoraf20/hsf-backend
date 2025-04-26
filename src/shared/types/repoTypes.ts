import { QueryBoolean } from '@shared/utils/helpers'
import { SeekPaginationOption } from './paginate'

export enum SortDateBy {
  RecentlyAdded = 'recently_added',
  LastUpdated = 'last_updated',
  Earliest = 'earliest',
}

export enum propertyStatusFilter {
  Sold = 'sold',
  Pending = 'pending',
  Available = 'available',
}

export enum SearchType {
  INCLUSIVE = 'inclusive',
  EXCLUSIVE = 'exclusive',
}

export type PropertyFilters = Partial<
  {
    search_type: SearchType
    sort_by: SortDateBy
    search: string
    location: string
    property_type: string
    bedrooms: string // convert to numerical
    bathrooms: string // convert to numerical

    min_price: string
    max_price: string
    financing_type: string // "Outright,mortgage,installment" or "select_all"

    property_status: propertyStatusFilter
    property_features: string // "ac,cctv"
  } & SeekPaginationOption
>

export type ServiceOfferingFilters = Partial<{
  search_type: SearchType
  deleted?: QueryBoolean
}> &
  SeekPaginationOption

export type PropertyCount = {
  total: number
  pending: number
  totalViewed: number
}
