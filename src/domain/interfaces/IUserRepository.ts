import { User } from '../entities/User'

export interface IUserRepository {
  create(user: User): Promise<User>
  findByEmail(email: string): Promise<User | null>
  findByPhone(phone_number: string): Promise<User | null>
  findById(id: string): Promise<User | null>
  update(id: string, user: Partial<User>): Promise<User | null>
  findByIdentifier(identifier: string): Promise<User | null>
  getRoleByName(name: string): Promise<Record<string, any> | null>
  comparedPassword(input: string, hashed: string): Promise<string | boolean>
  getRoleById(id: string): Promise<Record<string, any> | null>
  hashedPassword(input: string): Promise<string | any>
}
