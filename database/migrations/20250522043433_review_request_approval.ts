import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('review_request_approvals', (table) => {
    table.setNullable('organization_id')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('review_request_approvals', (table) => {
    table.dropNullable('organization_id')
  })
}
