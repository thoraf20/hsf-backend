import { Session } from '@entities/Session'
import { SeekPaginationResult } from '@shared/types/paginate'
import { SessionFilters } from '@validators/sessionValidator'

export interface ISessionRepository {
  create(session: Session): Promise<Session>
  validateSession(
    sessionID: string,
    version: number,
    rememberPeriod: number,
  ): Promise<{ session: Session | null; canExtend: boolean }>
  invalidateSession(sessionID: string, userID: string): Promise<void>
  getSessionByID(sessionID: string): Promise<Session | null>
  updateLastUsed(sessionID: string, IP: string): Promise<void>

  getSessions(filters: SessionFilters): Promise<SeekPaginationResult<Session>>
}
