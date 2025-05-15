import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('role')
    table.boolean('is_admin').defaultTo(false).notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (table) => {
    table.enum('role', ['user', 'admin']).defaultTo('user')
    table.dropColumn('is_admin')
  })
}
