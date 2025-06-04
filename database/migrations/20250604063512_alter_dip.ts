import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('dip', (table) => {
    table.boolean('hsf_document_review_completed').defaultTo(false)
    table.boolean('lender_document_review_completed').defaultTo(false)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('dip', (table) => {
    table.dropColumn('hsf_document_review_completed')
    table.dropColumn('lender_document_review_completed')
  })
}
