import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('user_activity_logs', (table) => {
    table.text('title').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('user_activity_logs', (table) => {
    table.dropColumn('title')
  })
}
