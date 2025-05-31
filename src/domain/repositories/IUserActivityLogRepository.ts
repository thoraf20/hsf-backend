import { UserActivityLog } from '@domain/entities/UserActivityLog'

export interface IUserActivityLogRepository {
  create(userActivityLog: UserActivityLog): Promise<UserActivityLog>
  findById(id: string): Promise<UserActivityLog | null>
}
