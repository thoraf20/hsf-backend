import db from '@infrastructure/database/knex'
import { IUserRepository } from '@domain/interfaces/IUserRepository'
import { User } from '@domain/entities/User'
import { Hashing } from '@shared/utils/hashing'

export class UserRepository implements IUserRepository {
  private readonly hashData = new Hashing()
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

  async findById(id: string): Promise<any> {
    const user = await db('users')
      .select(
        'users.id as user_id',
        'users.first_name',
        'users.last_name',
        'users.email',
        'users.phone_number',
        'users.profile',
        'users.image',
        'users.password',
        'users.user_agent',
        'users.failed_login_attempts',
        'users.is_email_verified',
        'users.is_phone_verified',
        'users.is_mfa_enabled',
        'users.created_at',
        'users.updated_at',
        'users.role_id',
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
}
