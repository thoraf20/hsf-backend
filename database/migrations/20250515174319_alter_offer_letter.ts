import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('offer_letter', (table) => {
    table
      .uuid('review_request_id')
      .references('id')
      .inTable('review_requests')
      .onDelete('SET NULL')
      .nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('offer_letter', (table) => {
    table.dropColumn('review_request_id')
  })
}
