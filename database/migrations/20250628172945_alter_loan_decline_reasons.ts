import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('loan_decline_reasons', (table) => {
    table.setNullable('decline_reason_id')
    table.string('reason').nullable()
    table.text('notes')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('loan_decline_reasons', (table) => {
    table.dropNullable('decline_reason_id')
    table.dropColumn('reason')
    table.dropColumn('notes')
  })
}
