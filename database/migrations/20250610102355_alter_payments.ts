import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('payments', (table) => {
    table.dropColumn('property_id')
    table.dropColumn('total_closing')
    table.dropColumn('down_payment')
    table.dropColumn('outstanding_amount')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('payments', (table) => {
    table.uuid('property_id')
    table.decimal('total_closing')
    table.decimal('down_payment')
    table.decimal('outstanding_amount')
  })
}
