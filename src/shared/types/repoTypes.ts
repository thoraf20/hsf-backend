import { QueryBoolean } from '@shared/utils/helpers'
import { SeekPaginationOption } from './paginate'
import { Role } from '@routes/index.t'

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

export type AgentsFilters = Partial<
  {
    role: Role
    sort_by: SortDateBy
    search: string
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
