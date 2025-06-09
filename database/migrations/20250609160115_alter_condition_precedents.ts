import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('condition_precedents', function (table) {
    table.boolean('hsf_docs_reviewed').defaultTo(false)
    table.boolean('lender_docs_reviewed').defaultTo(false)
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('condition_precedents', function (table) {
    table.dropColumn('hsf_docs_reviewed')
    table.dropColumn('lender_docs_reviewed')
  })
}
