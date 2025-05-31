import { LoginAttempt } from '@domain/entities/LoginAttempt'

export interface ILoginAttemptRepository {
  create(loginAttempt: LoginAttempt): Promise<LoginAttempt>
  findById(id: string): Promise<LoginAttempt | null>
  countFailedAttempts(userId: string, withinMinutes: number): Promise<number>
}
