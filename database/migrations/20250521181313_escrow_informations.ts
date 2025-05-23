import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('escrow_information', (table) => {
    table.dropColumn('agent_id')
    table
      .uuid('organization_id')
      .references('id')
      .inTable('organizations')
      .notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('escrow_information', (table) => {
    table.dropColumn('organization_id')
  })
}
