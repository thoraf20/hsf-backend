import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('user_organization_memberships', (table) => {
    table.unique('user_id')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('user_organization_memberships', (table) => {
    table.dropUnique(['user_id'])
  })
}
