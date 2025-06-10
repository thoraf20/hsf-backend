import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (table) => {
    table.timestamp('deleted_at', { useTz: true }).nullable()
    table.timestamp('supended_at', { useTz: true }).nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('deleted_at')
    table.dropColumn('supended_at')
  })
}
