import db from '@infrastructure/database/knex'
import { IUserRepository } from '@domain/interfaces/IUserRepository'
import { RecoveryCode, User, UserRole } from '@domain/entities/User'
import { Hashing } from '@shared/utils/hashing'
import { userValue } from '@shared/respositoryValues'
import { Knex } from 'knex'

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
      .select(...userValue)
      .where({ id })
      .first()

    const role = await db('roles')
      .select('roles.name as role')
      .where({ id: user.role_id })
      .first()
    return { ...user, ...role }
  }

  async update(id: string, input: User): Promise<User | null> {
    const [user] = await db('users').update(input).where({ id }).returning('*')
    return user ?? null
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    const user = await db('users')
      .where({ email: identifier })
      .orWhere({ phone_number: identifier })
      .first()
    return user ?? null
  }

  public async getRoleByName(name: string): Promise<UserRole | null> {
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

  async setRecoveryCodes(
    userId: string,
    recoveryCodes: Array<string>,
  ): Promise<Array<RecoveryCode>> {
    return db.transaction(async (tx) => {
      await tx.table('recovery_codes').delete().where('user_id', userId)
      return tx
        .table('recovery_codes')
        .insert<RecoveryCode>(
          recoveryCodes.map((code) => ({ code, user_id: userId, used: false })),
        )
        .returning('*')
    })
  }

  async getRecoveryCodes(userId: string): Promise<Array<RecoveryCode>> {
    return db
      .table<RecoveryCode>('recovery_codes')
      .select()
      .where({ user_id: userId })
  }

  async updateRecoveryCodeById(
    id: string,
    data: Partial<RecoveryCode>,
  ): Promise<RecoveryCode> {
    const [updatedRecovery] = await db
      .table<RecoveryCode>('recovery_codes')
      .update(data)
      .where({ id })
      .returning('*')

    return updatedRecovery
  }

  async clearRecoveryCodesByUserId(userId: string): Promise<void> {
    return void db
      .table<RecoveryCode>('recovery_codes')
      .delete()
      .where({ user_id: userId })
  }

  useFilters(query: Knex.QueryBuilder<any, any[]>) {}

  async getAll() {}
}
