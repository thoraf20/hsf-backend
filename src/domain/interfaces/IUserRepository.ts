import { Role } from '@routes/index.t'
import { RecoveryCode, User, UserRole } from '../entities/User'
import { UserFilters } from '@validators/userValidator'
import { SeekPaginationResult } from '@shared/types/paginate'

export interface IUserRepository {
  create(user: User): Promise<User>
  findByEmail(email: string): Promise<User | null>
  findByPhone(phone_number: string): Promise<User | null>
  setRecoveryCodes(
    userId: string,
    recoveryCodes: Array<string>,
  ): Promise<Array<RecoveryCode>>
  getRecoveryCodes(userId: string): Promise<Array<RecoveryCode>>
  updateRecoveryCodeById(
    id: string,
    data: Partial<RecoveryCode>,
  ): Promise<RecoveryCode>

  getAllUsers(filters: UserFilters): Promise<SeekPaginationResult<User>>

  clearRecoveryCodesByUserId(userId: string): Promise<void>
  findById(id: string): Promise<User | null>
  update(id: string, user: Partial<User>): Promise<User | null>
  findByIdentifier(identifier: string): Promise<User | null>
  getRoleByName(name: string): Promise<Record<string, any> | null>
  comparedPassword(input: string, hashed: string): Promise<string | boolean>
  getRoleById(id: string): Promise<UserRole | null>
  getRolesByType(types: Array<Role>): Promise<UserRole[]>
  getRoles(): Promise<UserRole[]>
  hashedPassword(input: string): Promise<string | any>
}
