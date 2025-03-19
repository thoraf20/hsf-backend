import { User } from '../entities/User'

export interface IUserRepository {
  create(user: User): Promise<User>
  findByEmail(email: string): Promise<User | null>
  findByPhone(phone_number: string): Promise<User | null>
  findById(id: string): Promise<User |  null>
  update(id: string, user: Record<string, any>): Promise<User | null> 
  findByIdentifier(identifier: string): Promise<User | null>
}
