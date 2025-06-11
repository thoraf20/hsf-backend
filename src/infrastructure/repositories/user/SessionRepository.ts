import { Session } from '@entities/Session'
import db, { createUnion } from '@infrastructure/database/knex'
import { ISessionRepository } from '@interfaces/ISessionRepository'
import { SeekPaginationResult } from '@shared/types/paginate'
import { SearchType } from '@shared/types/repoTypes'
import { applyPagination } from '@shared/utils/paginate'
import { SessionFilters } from '@validators/sessionValidator'
import { Knex } from 'knex'

export class SessionRepository implements ISessionRepository {
  private readonly tableName = 'sessions'

  async create(session: Session): Promise<Session> {
    const [newSession] = await db<Session>(this.tableName)
      .insert(session)
      .returning('*')

    return newSession
  }

  async validateSession(
    sessionID: string,
    version: number,
    rememberPeriod: number,
  ): Promise<{ session: Session | null; canExtend: boolean }> {
    let session = await this.getSessionByID(sessionID)

    if (!session) {
      return { session: null, canExtend: false }
    }

    if (session.version !== version) {
      return { session: null, canExtend: false }
    }

    // Check if the session is expired
    const now = Date.now()

    if (now > session.expires_at) {
      await this.invalidateSession(sessionID, session.user_id)
      return { session: null, canExtend: false }
    }

    // Check if the session can be extended (Remember Me is enabled)
    let canExtend = false
    if (session.remember_me) {
      // Calculate the midpoint of the session's lifetime
      const sessionDuration = session.expires_at - session.created_at.getTime()
      const midpoint = session.created_at.getTime() + sessionDuration / 2

      // If the current time is past the midpoint, the session can be extended
      if (now > midpoint) {
        canExtend = true
      }

      // Check if the session has exceeded the maximum renewal duration
      const maxRenewalTime =
        session.created_at.getTime() + session.max_renewal_duration * 1000

      if (session.expires_at > maxRenewalTime) {
        // The session has exceeded the maximum renewal duration; force the user to log in again
        await this.invalidateSession(sessionID, session.user_id)
        return { session: null, canExtend: false }
      }
    }

    if (canExtend) {
      const maxRenewalTime =
        session.created_at.getTime() + session.max_renewal_duration * 1000 // Convert seconds to milliseconds

      // Calculate the new expiration time (current time + remember period)
      let newExpiresAt = Date.now() + rememberPeriod * 1000 // Convert seconds to milliseconds

      // Ensure the new expiration time does not exceed the maximum renewal duration
      if (newExpiresAt > maxRenewalTime) {
        newExpiresAt = maxRenewalTime
      }

      session.version++

      // Update the session expiration time and version in the database
      ;[session] = await db(this.tableName)
        .where({ id: session.id })
        .update({ expires_at: newExpiresAt, version: session.version })
        .returning('*')
    }

    return { session, canExtend }
  }

  async invalidateSession(sessionID: string, userID: string): Promise<void> {
    await db(this.tableName).where({ id: sessionID, user_id: userID }).del()
  }

  async getSessionByID(sessionID: string): Promise<Session | null> {
    const session = await db<Session>(this.tableName + ' as s')
      .select('s.*')
      .where('s.id', sessionID)
      .first()

    return session
  }

  async updateLastUsed(sessionID: string, IP: string): Promise<void> {
    await db(this.tableName)
      .where({ id: sessionID })
      .update({ last_used: Date.now(), ip: IP })
  }

  useFilter(q: Knex.QueryBuilder<any, any[]>, filters: SessionFilters) {
    const add = createUnion(SearchType.EXCLUSIVE)

    if (filters.user_id) {
      q = add(q).where(`user_id = '${filters.user_id}'`)
    }

    if (filters.organization_id) {
      q = add(q).where(`organization_id = '${filters.organization_id}'`)
    }

    return q
  }

  async getSessions(
    filters: SessionFilters,
  ): Promise<SeekPaginationResult<Session>> {
    let baseQuery = db<Session>(this.tableName).orderBy('created_at', 'desc')
    baseQuery = this.useFilter(baseQuery, filters)

    return applyPagination<Session>(baseQuery)
  }
}
