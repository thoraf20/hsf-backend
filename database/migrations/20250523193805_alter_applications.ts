import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('application_document_entries', (table) => {
    table.setNullable('application_id')
    // table
    //   .uuid('organization_id')
    //   .references('id')
    //   .inTable('organizations')
    //   .nullable()
    //   .onDelete('SET NULL')
    //   .onUpdate('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('application_document_entries', (table) => {
    table.dropNullable('application_id')
    table.dropColumn('organization_id')
  })
}
