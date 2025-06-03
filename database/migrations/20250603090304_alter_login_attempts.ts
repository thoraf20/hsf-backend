import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('login_attempts', (table) => {
    table.text('identifier').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('login_attempts', (table) => {
    table.dropColumn('identifier')
  })
}
