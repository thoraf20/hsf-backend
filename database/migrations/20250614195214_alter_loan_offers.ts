import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('loan_offers', (table) => {
    table.string('type').nullable()
    table.timestamp('loan_start_date', { useTz: true }).nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('loan_offers', (table) => {
    table.dropColumn('type')
    table.dropColumn('loan_start_date')
  })
}
