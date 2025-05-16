import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('review_request_approvals', (table) => {
    table
      .uuid('organization_id')
      .references('id')
      .inTable('organizations')
      .notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('review_request_approvals', (table) => {
    table.dropColumn('organization_id')
  })
}
