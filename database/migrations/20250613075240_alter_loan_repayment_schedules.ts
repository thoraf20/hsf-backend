import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('loan_repayment_schedules', (table) => {
    table.decimal('interest_due', 12, 2).notNullable().alter()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('loan_repayment_schedules', (table) => {
    table.decimal('interest_due', 6, 2).notNullable().alter()
  })
}
