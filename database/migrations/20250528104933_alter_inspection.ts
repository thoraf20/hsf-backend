import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('inspection', (table) => {
    table
      .uuid('organization_id')
      .references('id')
      .inTable('organizations')
      .nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('inspection', (table) => {
    table.dropColumn('organization_id')
  })
}
