import db, { createUnion } from '@infrastructure/database/knex'
import { IUserRepository, IUserTestRepository } from '@domain/interfaces/IUserRepository'
import { RecoveryCode, User, UserRole, UserTest } from '@domain/entities/User'
import { Hashing } from '@shared/utils/hashing'
import { userValue } from '@shared/respositoryValues'
import { Knex } from 'knex'
import { Role } from '@routes/index.t'
import { UserFilters } from '@validators/userValidator'
import { SeekPaginationResult } from '@shared/types/paginate'
import { applyPagination } from '@shared/utils/paginate'
import { SearchType } from '@shared/types/repoTypes'
import { QueryBoolean } from '@shared/utils/helpers'
import { UserStatus } from '@domain/enums/userEum'
import { OrganizationType } from '@domain/enums/organizationEnum'

export class UserRepository implements IUserRepository {
  private readonly hashData = new Hashing()
  async create(user: Partial<Omit<User, 'user_id'>>): Promise<User> {
    const [newUser] = await db('users').insert(user).returning('*')
    return new User(newUser)
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await db('users')
      .innerJoin('roles', 'roles.id', 'users.role_id')
      .select('users.*', 'roles.name as role')
      .where({ email })
      .first()
    return user ? new User(user) : null
  }

  async findByPhone(phone_number: string): Promise<User | null> {
    const user = await db('users').where({ phone_number }).first()

    return user ? new User(user) : null
  }

  async findById(id: string): Promise<User> {
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
      .innerJoin('roles', 'roles.id', 'users.role_id')
      .select('users.*', 'roles.name as role')
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
  public async getRoleById(id: string): Promise<UserRole | null> {
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

  useFilters(
    query: Knex.QueryBuilder<any, any[]>,
    filters: UserFilters & { type?: 'admin' | 'sub-admin' },
  ) {
    let q = query

    const add = createUnion(SearchType.EXCLUSIVE)

    if (filters.deleted) {
      q = add(q).whereRaw(
        filters.deleted === QueryBoolean.YES
          ? `u.status = '${UserStatus.Deleted}'`
          : `u.status != '${UserStatus.Deleted}'`,
      )
    }

    if (filters.type) {
      q = add(q).where('o.type', OrganizationType.HSF_INTERNAL)
      if (filters.type === 'admin') {
        q = add(q).whereIn('r.name', [Role.SUPER_ADMIN, Role.HSF_ADMIN])
      } else {
        q = add(q).and.whereNotIn('r.name', [Role.SUPER_ADMIN, Role.HSF_ADMIN])
      }
    }

    return q
  }

  async getAllUsers(filters: UserFilters): Promise<SeekPaginationResult<User>> {
    let baseQuery = db('users as u')
      .leftJoin('roles as r', 'r.id', 'u.role_id')
      .leftJoin('user_organization_memberships as uom', 'uom.user_id', 'u.id')
      .leftJoin('organizations as o', 'o.id', 'uom.organization_id')
      .orderBy('created_at', 'desc')

    baseQuery = this.useFilters(baseQuery, filters)
    baseQuery = baseQuery.select(
      'u.*',
      'r.name as role',
      db.raw('row_to_json(uom) as membership'),
    )

    return applyPagination<User>(baseQuery)
  }

  async getRolesByType(types: Array<Role>): Promise<UserRole[]> {
    return db.table<UserRole>('roles').select().whereIn('name', types)
  }

  async getRoles(): Promise<UserRole[]> {
    return db.table<UserRole>('roles').select()
  }
}

export class UserTestRepository implements IUserTestRepository {
  async create(input: UserTest): Promise<UserTest> {
    const [newUserTest] = await db.table<UserTest>('user_tests').insert(input).returning('*');
    return newUserTest;
  }
}