import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('escrow_information', (table) => {
    table
      .uuid('review_request_id')
      .references('id')
      .inTable('review_requests')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
      .notNullable()

    table
      .uuid('application_id')
      .references('application_id')
      .inTable('application')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('escrow_information', (table) => {
    table.dropColumn('review_request_id')

    table.dropColumn('application_id')
  })
}
