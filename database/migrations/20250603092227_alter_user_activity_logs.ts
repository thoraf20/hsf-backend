import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('user_activity_logs', (table) => {
    table.setNullable('user_id')
    table.text('identifier').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('user_activity_logs', (table) => {
    table.dropNullable('user_id')
    table.dropColumn('identifier')
  })
}
