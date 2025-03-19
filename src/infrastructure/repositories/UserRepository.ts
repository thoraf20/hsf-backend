import db from '../database/knex'
import { IUserRepository } from '../../domain/interfaces/IUserRepository'
import { User } from '../../domain/entities/User'

export class UserRepository implements IUserRepository {
  async create(user: User): Promise<User> {
    const [newUser] = await db('users').insert(user).returning('*')
    return new User(newUser)
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await db('users').where({ email }).first()
    return user ? new User(user) : null
  }

  async findByPhone(phone_number: string): Promise<User | null> {
      const user = await db('users').where({ phone_number }).first() 
      return user ? new User(user) : null
  }

  async findById(id: string): Promise<User | null> {
      const user = await db('users').where({id}).first()
      return user ? new User(user) : null
  }

  async update(id: string, input: User): Promise<User | null> {
      const user = await db('users').update(input).where({id})
      return user ? new User(input) : null
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
      const user = await db('users').where({email: identifier}).orWhere({phone_number: identifier}).first()
      return user ? new User(user) : null
  }
}
