import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('loan_offers', (table) => {
    // Fix the decimal fields that are causing numeric overflow
    table.decimal('total_interest_estimate', 15, 2).nullable().alter()
    table.decimal('total_payable_estimate', 15, 2).nullable().alter()
    table.decimal('estimated_periodic_payment', 10, 2).nullable().alter()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('loan_offers', (table) => {
    // Revert back to unspecified precision (though this might cause the same issue)
    table.decimal('total_interest_estimate').nullable().alter()
    table.decimal('total_payable_estimate').nullable().alter()
    table.decimal('estimated_periodic_payment').nullable().alter()
  })
}
