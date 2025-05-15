import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('review_request_approvals', (table) => {
    table
      .uuid('review_request_stage_type_id')
      .references('id')
      .inTable('review_request_type_stages')
      .notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('review_request_approvals', (table) => {
    table.dropColumn('review_request_stage_type_id')
  })
}
