import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('application', (table) => {
    table.text('status').notNullable().defaultTo('')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('application', (table) => {
    table.dropColumn('status')
  })
}
