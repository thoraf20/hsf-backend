import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('dip', (table) => {
    table.text('dip_lender_status').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('dip', (table) => {
    table.dropColumn('dip_lender_status')
  })
}
