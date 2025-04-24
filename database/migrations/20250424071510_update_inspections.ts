import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('inspection', (table) => {
    table.string('inspection_status')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('inspection', (table) => {
    table.dropColumn('inspection_status')
  })
}
