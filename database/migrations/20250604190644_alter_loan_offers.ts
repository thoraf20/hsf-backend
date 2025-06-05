import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('loan_offers', (table) => {
    table.text('workflow_status').nullable()
    table.text('loan_offer_letter_url').nullable()
    table.text('signed_loan_offer_letter_url').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('loan_offers', (table) => {
    table.dropColumn('workflow_status')
    table.dropColumn('loan_offer_letter_url')
    table.dropColumn('signed_loan_offer_letter_url')
  })
}
