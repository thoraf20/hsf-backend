import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('loan_offers', (table) => {
    table.text('workflow_status').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('loan_offers', (table) => {
    table.dropColumn('workflow_status')
  })
}
