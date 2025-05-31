import { IUserActivityLogRepository } from '@domain/repositories/IUserActivityLogRepository'
import { UserActivityLog } from '@domain/entities/UserActivityLog'
import db from '@infrastructure/database/knex'

export class UserActivityLogRepository implements IUserActivityLogRepository {
  async create(userActivityLog: UserActivityLog): Promise<UserActivityLog> {
    const [result] = await db('user_activity_logs')
      .insert(userActivityLog)
      .returning('*')
    return result
  }
  async findById(id: string): Promise<UserActivityLog | null> {
    const result = await db('user_activity_logs').where({ id }).first()
    return result || null
  }
}
