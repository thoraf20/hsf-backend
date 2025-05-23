import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('developers_profile', (table) => {
    table.dropColumn('developer_role')
    table.dropColumn('documents')
  })
}

export async function down(knex: Knex): Promise<void> {}
