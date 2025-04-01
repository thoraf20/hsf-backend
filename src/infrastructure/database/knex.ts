import knex from 'knex'
import configs from '@config/config'

const db = knex({
  client: 'pg',
  connection: {
    host: configs.database.host,
    user: configs.database.user,
    password: configs.database.password,
    database: configs.database.database,
    port: configs.database.port,
  },
  pool: { min: 2, max: 10 },
  migrations: {
    directory: '@migrations',
    tableName: 'knex_migrations',
  },
})

export default db
