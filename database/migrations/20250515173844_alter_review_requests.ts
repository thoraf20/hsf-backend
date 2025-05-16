import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('review_request_approvals', (table) => {
    table.setNullable('approval_id')
    table.setNullable('approval_date')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('review_request_approvals', (table) => {
    table.dropNullable('approval_id')
    table.dropNullable('approval_date')
  })
}
