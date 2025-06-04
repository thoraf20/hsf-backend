import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('application', (table) => {
    table
      .uuid('loan_offer_id')
      .references('id')
      .inTable('loan_offers')
      .onDelete('SET NULL')
      .onUpdate('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('application', (table) => {
    table.dropColumn('loan_offer_id')
  })
}
