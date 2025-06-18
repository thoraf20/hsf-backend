import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('organizations', (table) => {
    table.string('status').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('organizations', (table) => {
    table.dropColumn('status')
  })
}
