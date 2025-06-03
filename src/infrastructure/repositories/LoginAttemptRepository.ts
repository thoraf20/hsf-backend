import { LoginAttempt } from '@domain/entities/LoginAttempt'
import { ILoginAttemptRepository } from '@domain/repositories/ILoginAttemptRepository'
import db from '@infrastructure/database/knex'
import { subMinutes } from 'date-fns'

export class LoginAttemptRepository implements ILoginAttemptRepository {
  async create(loginAttempt: LoginAttempt): Promise<LoginAttempt> {
    const [result] = await db('login_attempts')
      .insert(loginAttempt)
      .returning('*')
    return result
  }

  async findById(id: string): Promise<LoginAttempt | null> {
    const result = await db('login_attempts').where({ id }).first()
    return result || null
  }

  async countFailedAttempts(
    userId: string | null,
    withinMinutes: number,
    identifier?: string,
  ): Promise<number> {
    if (!(userId || identifier)) {
      throw new TypeError('Missing userId or identifier')
    }

    const cutoff = subMinutes(Date.now(), withinMinutes)

    let query = db('login_attempts')
      .count<{ count: number }>('id')
      .where('attempted_at', '>', cutoff)
      .andWhere({ successful: false })

    if (userId) {
      query = query.andWhere({ user_id: userId })
    } else if (identifier) {
      query = query.andWhere({ identifier: identifier })
    }

    // First get the last successful login timestamp
    let lastSuccessfulLoginQuery = db('login_attempts')
      .select('attempted_at')
      .orderBy('attempted_at', 'desc')
      .first()

    if (userId) {
      lastSuccessfulLoginQuery = lastSuccessfulLoginQuery.where({
        user_id: userId,
        successful: true,
      })
    } else if (identifier) {
      lastSuccessfulLoginQuery = lastSuccessfulLoginQuery.where({
        identifier: identifier,
        successful: true,
      })
    }

    const lastSuccessfulLogin = await lastSuccessfulLoginQuery

    // Only count failed attempts after the last successful login
    if (lastSuccessfulLogin) {
      query = query.andWhere(
        'attempted_at',
        '>',
        lastSuccessfulLogin.attempted_at,
      )
    }

    const countResult = await query.first()
    return Number(countResult?.count || 0)
  }
}
