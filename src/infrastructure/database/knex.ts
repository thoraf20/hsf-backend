import knex, { Knex } from 'knex'
import configs from '@config/config'
import { SearchType } from '@shared/types/repoTypes'
import { AsyncLocalStorage } from 'async_hooks'
import logger from '@middleware/logger'

const als = new AsyncLocalStorage<Knex.Transaction>()

let db: knex.Knex<any, unknown[]> = knex({
  client: 'pg',
  connection: {
    host: configs.database.host as string,
    user: configs.database.user as string,
    password: configs.database.password as string,
    database: configs.database.database as string,
    port: Number(configs.database.port),
  },
  pool: { min: 2, max: 10 },
  migrations: {
    directory: '@migrations',
    tableName: 'knex_migrations',
  },
})

db = new Proxy(db, {
  get: (target, propKey, receiver) => {
    const trx = als.getStore()
    if (trx && trx.isTransaction) {
      return trx[propKey].bind(trx)
    }

    return Reflect.get(target, propKey, receiver)
  },
  // Also handle function calls
  apply: (target, thisArg, argumentsList) => {
    const trx = als.getStore()
    if (trx && trx.isTransaction) {
      logger.info('Using transaction for function call')
      return trx.apply(thisArg, argumentsList)
    }
    return target.apply(thisArg, argumentsList)
  },
})

export default db

export const createUnion = (searchType: SearchType) =>
  searchType === SearchType.EXCLUSIVE
    ? (q: Knex.QueryBuilder<any, any[]>) => q.and
    : (q: Knex.QueryBuilder<any, any[]>) => q.or

export const runWithTransaction = async <T>(
  callback: (db: Knex) => Promise<T>,
): Promise<T> => {
  logger.info('Creating transaction...')
  const trx = await db.transaction()
  logger.info('Transaction created:', {
    hasTransaction: !!trx,
    isTransaction: trx?.isTransaction || false,
  })

  return als.run(trx, async () => {
    try {
      // Pass the proxied db - it will use the transaction automatically
      const result = await callback(db)
      await trx.commit()
      return result
    } catch (error) {
      await trx.rollback()
      throw error
    }
  })
}
