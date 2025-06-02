import {
  DateGroupedUserActivityLog,
  UserActivityLog,
} from '@domain/entities/UserActivityLog'
import { SeekPaginationResult } from '@shared/types/paginate'
import { UserActivityFilters } from '@validators/userValidator'

export interface IUserActivityLogRepository {
  create(userActivityLog: UserActivityLog): Promise<UserActivityLog>
  findById(id: string): Promise<UserActivityLog | null>
  getAll(
    filters: UserActivityFilters,
  ): Promise<SeekPaginationResult<DateGroupedUserActivityLog>>
}
