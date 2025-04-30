import db from '@infrastructure/database/knex'
import { IUserRepository } from '@domain/interfaces/IUserRepository'
import { User } from '@domain/entities/User'
import { Hashing } from '@shared/utils/hashing'
import { userValue } from '@shared/respositoryValues'

export class UserRepository implements IUserRepository {
  private readonly hashData = new Hashing()
  async create(user: Partial<Omit<User, 'user_id'>>): Promise<User> {
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

  async findById(id: string): Promise<any> {
    const user = await db('users as u')
      .select(
       ...userValue
      )
      .where({ id })
      .first()
    const role = await db('roles')
      .select('roles.name as role')
      .where({ id: user.role_id })
      .first()
    return { ...user, ...role }
  }
  

  async update(id: string, input: User): Promise<User | null> {
    const user = await db('users').update(input).where({ id })
    return user ? new User(input) : null
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    const user = await db('users')
      .where({ email: identifier })
      .orWhere({ phone_number: identifier })
      .first()
    return user ? new User(user) : null
  }

  public async getRoleByName(
    name: string,
  ): Promise<Record<string, any> | null> {
    return db('roles').where('name', name).first()
  }

  public async comparedPassword(
    input: string,
    hashed: string,
  ): Promise<string | boolean> {
    return await this.hashData.verifyHash(input, hashed)
  }

  public async hashedPassword(input: string): Promise<string | void> {
    return await this.hashData.hashing(input)
  }
  public async getRoleById(id: string): Promise<Record<string, any> | null> {
    return db('roles').where('id', id).first()
  }
}
