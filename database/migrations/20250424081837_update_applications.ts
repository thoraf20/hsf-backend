import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('application', (table) => {
    table.uuid('inspection_id').references('id').inTable('inspection')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('application', (table) => {
    table.dropColumn('inspection_id')
  })
}
