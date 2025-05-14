import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('application', (table) => {
    // Add the new foreign key constraint referencing organizations
    table
      .uuid('developer_organization_id')
      .notNullable()
      .references('id')
      .inTable('organizations')
      .onDelete('CASCADE')

    // Add an index on the new column for performance
    table.index('developer_organization_id')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('application', (table) => {
    table.dropColumn('developer_organization_id')
  })
}
