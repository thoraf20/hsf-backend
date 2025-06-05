import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('loan_decisions', (table) => {
    table.timestamp('management_fee_paid_at', { useTz: true }).nullable()
    table.uuid('management_fee_payment_id').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('loan_decisions', (table) => {
    table.dropColumn('management_fee_paid_at')
    table.dropColumn('management_fee_payment_id')
  })
}
