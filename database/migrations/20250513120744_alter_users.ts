import type { Knex } from 'knex'

import { UserStatus } from '../../src/domain/enums/userEum'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (table) => {
    table.text('status').notNullable().defaultTo(UserStatus.Pending)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('status')
  })
}
