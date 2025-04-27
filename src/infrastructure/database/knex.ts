import knex, { Knex } from 'knex'
import configs from '@config/config'
import { SearchType } from '@shared/types/repoTypes'

const db = knex({
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

export default db

export const createUnion = (searchType: SearchType) =>
  searchType === SearchType.EXCLUSIVE
    ? (q: Knex.QueryBuilder<any, any[]>) => q.and
    : (q: Knex.QueryBuilder<any, any[]>) => q.or
