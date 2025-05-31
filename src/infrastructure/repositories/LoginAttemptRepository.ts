import { LoginAttempt } from '@domain/entities/LoginAttempt'
import { ILoginAttemptRepository } from '@domain/repositories/ILoginAttemptRepository'
import db from '@infrastructure/database/knex'

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
    userId: string,
    withinMinutes: number,
  ): Promise<number> {
    const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000)

    // First get the last successful login timestamp
    const lastSuccessfulLogin = await db('login_attempts')
      .select('attempted_at')
      .where({ user_id: userId, successful: true })
      .orderBy('attempted_at', 'desc')
      .first()

    let query = db('login_attempts')
      .count<{ count: number }>('id')
      .where({ user_id: userId, successful: false })
      .andWhere('attempted_at', '>', cutoff)

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
